import { emptyFeatures, type AudioFeatures } from "../types";
export function bandEnergy(
  data: Uint8Array,
  sampleRate: number,
  fftSize: number,
  lo: number,
  hi: number,
): number {
  const start = Math.max(1, Math.ceil((lo * fftSize) / sampleRate)),
    end = Math.min(data.length, Math.floor((hi * fftSize) / sampleRate) + 1);
  if (start >= end) return 0;
  let sum = 0;
  for (let i = start; i < end; i++) sum += (data[i] / 255) ** 2;
  return Math.sqrt(sum / (end - start));
}
export class FeatureAnalyser {
  private value = { ...emptyFeatures };
  private lastEnergy = 0;
  private lastBass = 0;
  private bassAverage = 0;
  private sinceBeat = 1;
  private beatEnvelope = 0;
  private spectrum = new Float32Array(32);
  private waveform = new Float32Array(128);
  noiseFloor = 0.015;
  reset() {
    this.value = { ...emptyFeatures };
    this.lastEnergy = 0;
    this.lastBass = 0;
    this.bassAverage = 0;
    this.sinceBeat = 1;
    this.beatEnvelope = 0;
    this.spectrum.fill(0);
    this.waveform.fill(0);
  }
  process(
    freq: Uint8Array,
    wave: Uint8Array,
    sampleRate: number,
    fftSize: number,
    sensitivity: number,
    dt: number,
  ): AudioFeatures {
    let squares = 0;
    for (const v of wave) squares += ((v - 128) / 128) ** 2;
    const rms = Math.sqrt(squares / wave.length);
    const gate = Math.max(0, Math.min(1, (rms - this.noiseFloor) / 0.025));
    const scale = (v: number) =>
      Math.min(1, Math.max(0, v * sensitivity * gate));
    const energy = scale(rms * 3);
    const bass = scale(bandEnergy(freq, sampleRate, fftSize, 30, 250));
    const elapsed = Math.max(0.001, Math.min(dt, 0.1));
    // Bass onsets remain visible when a compressed track's overall volume barely changes.
    // A short refractory period prevents sustained notes from becoming artificial beats.
    const bassRise = bass - this.lastBass;
    const contrast = Math.max(0, bass - this.bassAverage - 0.035);
    this.sinceBeat += elapsed;
    this.beatEnvelope *= Math.exp(-elapsed * 8);
    if (gate > 0 && this.sinceBeat >= 0.18 && bassRise > 0.018) {
      const onset = Math.min(1, bassRise * 5 + contrast * 2.4);
      if (onset > 0.15) {
        this.beatEnvelope = Math.max(this.beatEnvelope, onset);
        this.sinceBeat = 0;
      }
    }
    const transient = Math.max(
      this.beatEnvelope,
      Math.min(0.65, Math.max(0, energy - this.lastEnergy) * 4),
    );
    this.lastBass = bass;
    this.bassAverage +=
      (bass - this.bassAverage) * (1 - Math.exp(-elapsed * 5));
    this.lastEnergy = energy;
    const target = {
      bass,
      mids: scale(bandEnergy(freq, sampleRate, fftSize, 250, 2000)),
      treble: scale(bandEnergy(freq, sampleRate, fftSize, 2000, 12000)),
      energy,
      transient,
      silent: rms <= this.noiseFloor,
    };
    for (const k of [
      "bass",
      "mids",
      "treble",
      "energy",
      "transient",
    ] as const) {
      if (k === "transient") {
        this.value[k] = transient;
        continue;
      }
      const rate =
        k === "bass"
          ? target[k] > this.value[k]
            ? 32
            : 8
          : k === "treble"
            ? target[k] > this.value[k]
              ? 26
              : 7
            : target[k] > this.value[k]
              ? 18
              : 3.5;
      this.value[k] +=
        (target[k] - this.value[k]) * (1 - Math.exp(-rate * Math.min(dt, 0.1)));
    }
    this.value.silent = target.silent;
    // Logarithmic frequency bins keep each bar tied to its own part of the sound.
    const ceiling = Math.min(16000, sampleRate / 2);
    for (let i = 0; i < 32; i++) {
      const lo = 30 * (ceiling / 30) ** (i / 32);
      const hi = 30 * (ceiling / 30) ** ((i + 1) / 32);
      const value = scale(bandEnergy(freq, sampleRate, fftSize, lo, hi));
      this.spectrum[i] +=
        (value - this.spectrum[i]) *
        (1 - Math.exp(-elapsed * (value > this.spectrum[i] ? 32 : 8)));
    }
    // Trigger on a rising zero crossing: a real oscilloscope trace, without random horizontal jitter.
    let start = 0;
    for (let i = 1; i < Math.min(256, wave.length / 4); i++) {
      if (wave[i - 1] <= 128 && wave[i] > 128) {
        start = i;
        break;
      }
    }
    const span = Math.min(
      wave.length - start - 1,
      Math.floor(sampleRate * 0.012),
    );
    for (let i = 0; i < 128; i++) {
      const at = start + (i * span) / 127,
        index = Math.floor(at),
        frac = at - index;
      const value =
        wave[index] * (1 - frac) +
        wave[Math.min(wave.length - 1, index + 1)] * frac;
      this.waveform[i] = Math.max(
        -1,
        Math.min(1, ((value - 128) / 128) * sensitivity * gate),
      );
    }
    return { ...this.value, spectrum: this.spectrum, waveform: this.waveform };
  }
}
export function demoFeatures(t: number): AudioFeatures {
  // A clearly labelled, silent 128 BPM dance pattern for exploring the artwork.
  const phase = ((t * 128) / 60) % 1;
  const beat = Math.exp(-phase * 9);
  const spectrum = new Float32Array(32),
    waveform = new Float32Array(128);
  for (let i = 0; i < 32; i++)
    spectrum[i] = Math.min(
      1,
      0.07 +
        beat * Math.exp(-i / 8) * 0.8 +
        (0.25 + 0.18 * Math.sin(t * 0.7 + i * 0.8)) * Math.exp(-i / 40),
    );
  for (let i = 0; i < 128; i++)
    waveform[i] =
      (0.2 + beat * 0.4) * Math.sin(i * 0.18) +
      0.13 * Math.sin(i * 0.51 + t * 0.6);
  return {
    spectrum,
    waveform,
    bass: 0.18 + beat * 0.75,
    mids: 0.4 + 0.25 * Math.sin(t * 0.79) + 0.08 * Math.sin(t * 2.1),
    treble:
      0.2 +
      0.45 * Math.pow(Math.max(0, Math.sin(((t * 128) / 60) * Math.PI * 4)), 8),
    energy: 0.34 + beat * 0.35,
    transient: beat,
    silent: false,
  };
}
