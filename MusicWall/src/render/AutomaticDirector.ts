import type { AudioFeatures, Settings, SceneId } from "../types";
import { sceneIds } from "../storage";

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export type Atmosphere =
  | "Finding the rhythm"
  | "Waiting for music"
  | "Gentle flow"
  | "Melodic flow"
  | "Building"
  | "Beat driven";
export interface Direction {
  settings: Settings;
  atmosphere: Atmosphere;
  next?: { scene: SceneId; palette: number };
}

/** Session-only direction. Never writes over the user's saved slider preferences. */
export class AutomaticDirector {
  private energy = 0;
  private longEnergy = 0;
  private melody = 0;
  private rhythm = 0;
  private beatAge = 10;
  private lastPulse = 0;
  private intervals: number[] = [];
  private sceneAge = 0;
  private quietAge = 0;
  private lastScene = "";
  private lastPalette = -1;
  private lastEnabled = false;
  private lastInterval = 0;
  private atmosphere: Atmosphere = "Waiting for music";
  private labelAge = 0;

  update(
    dt: number,
    f: AudioFeatures,
    s: Settings,
    paused = false,
    touringPaused = false,
  ): Direction {
    const result = { settings: s, atmosphere: this.atmosphere };
    if (paused) return result;
    const elapsed = Math.max(0, dt);
    dt = clamp(dt, 0, 0.1);
    if (
      this.lastScene !== s.scene ||
      this.lastPalette !== s.palette ||
      this.lastEnabled !== s.automatic ||
      this.lastInterval !== s.interval
    ) {
      this.sceneAge = 0;
      this.lastScene = s.scene;
      this.lastPalette = s.palette;
      this.lastEnabled = s.automatic;
      this.lastInterval = s.interval;
    }
    this.beatAge += elapsed;
    this.labelAge += elapsed;
    const beat =
      !f.silent &&
      f.transient > 0.22 &&
      this.lastPulse <= 0.22 &&
      this.beatAge > 0.2;
    if (beat) {
      if (this.beatAge < 1.5) {
        this.intervals.push(this.beatAge);
        this.intervals = this.intervals.slice(-6);
      } else this.intervals = [];
      this.beatAge = 0;
    }
    this.lastPulse = f.transient;
    if (!f.silent && this.atmosphere === "Waiting for music")
      this.atmosphere = "Finding the rhythm";
    const mean =
      this.intervals.reduce((a, b) => a + b, 0) /
      Math.max(1, this.intervals.length);
    const deviation =
      this.intervals.reduce((a, b) => a + Math.abs(b - mean), 0) /
      Math.max(1, this.intervals.length);
    const consistent =
      this.intervals.length >= 3 &&
      deviation / mean < 0.22 &&
      this.beatAge < 1.5;
    const ease = (v: number, target: number, seconds: number) =>
      v + (target - v) * (1 - Math.exp(-dt / seconds));
    this.energy = ease(this.energy, f.silent ? 0 : f.energy, 2.8);
    this.longEnergy = ease(this.longEnergy, f.silent ? 0 : f.energy, 12);
    this.melody = ease(
      this.melody,
      f.silent ? 0 : clamp(f.mids * 1.3 + f.treble * 0.3),
      4,
    );
    this.rhythm = ease(this.rhythm, consistent ? 1 : 0, 3);
    this.quietAge = f.silent ? this.quietAge + elapsed : 0;
    // Quiet time never advances a show. A pause in the music cannot consume a scene.
    if (!s.autoCycle) this.sceneAge = 0;
    else if (!f.silent && !touringPaused) this.sceneAge += elapsed;
    const target: Atmosphere =
      this.quietAge > 2
        ? "Waiting for music"
        : this.energy - this.longEnergy > 0.1
          ? "Building"
          : this.rhythm > 0.45 && this.energy > 0.2
            ? "Beat driven"
            : this.melody > 0.25
              ? "Melodic flow"
              : "Gentle flow";
    if (this.labelAge > 3 || this.quietAge > 2) {
      this.atmosphere = target;
      this.labelAge = 0;
    }
    if (!s.automatic) return { settings: s, atmosphere: this.atmosphere };
    const drive = clamp(this.energy * 1.35 + this.rhythm * 0.2);
    const quiet = this.quietAge > 2;
    const settings: Settings = {
      ...s,
      mood: "Flow",
      motion: Math.min(1.6, s.motion * (quiet ? 0.18 : 0.42 + drive * 0.8)),
      flowSpeed: Math.min(1.8, s.flowSpeed * (0.6 + drive * 0.55)),
      beatImpact: Math.min(2, s.beatImpact * (0.7 + this.rhythm * 0.7)),
      melodyDetail: Math.min(2, s.melodyDetail * (0.8 + this.melody * 0.4)),
      // User particle amount is a ceiling, not a value the director can override.
      particles: s.particles * (quiet ? 0 : 0.3 + drive * 0.7),
      colourIntensity: Math.min(2, s.colourIntensity * (0.85 + drive * 0.25)),
    };
    let next: Direction["next"];
    const ready = this.sceneAge >= s.interval;
    if (
      s.autoCycle &&
      !touringPaused &&
      !f.silent &&
      ((ready && beat && consistent) || this.sceneAge >= s.interval + 2)
    ) {
      const scene = sceneIds[(sceneIds.indexOf(s.scene) + 1) % sceneIds.length];
      next = {
        scene,
        palette: ((s.palettes[scene] ?? 0) + 1) % 3,
      };
      this.sceneAge = 0;
    }
    return { settings, atmosphere: this.atmosphere, next };
  }
}
