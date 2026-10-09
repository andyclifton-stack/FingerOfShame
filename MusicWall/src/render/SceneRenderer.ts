import * as THREE from "three";
import { scenes } from "../scenes";
import type { Settings, AudioFeatures, SceneDefinition } from "../types";
const vertex =
  "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}";
export interface RenderOptions {
  settings: Settings;
  reduced: boolean;
  paused: boolean;
}
export class SceneRenderer {
  readonly renderer: THREE.WebGLRenderer;
  private camera = new THREE.Camera();
  private plane = new THREE.PlaneGeometry(2, 2);
  private world = new THREE.Scene();
  private mesh: THREE.Mesh;
  private materials: THREE.ShaderMaterial[];
  private a = new THREE.WebGLRenderTarget(1, 1);
  private b = new THREE.WebGLRenderTarget(1, 1);
  private compositor: THREE.ShaderMaterial;
  private current = 0;
  private previous = 0;
  private blend = 1;
  private time = 0;
  private width = 1;
  private height = 1;
  private scale = 1;
  private lastQuality = "";
  private slowFrames = 0;
  private frames = 0;
  private elapsed = 0;
  private dynamic = 0.9;
  private smoothMood = 1;
  private currentPalette = -1;
  private reduced = false;
  private sizeChanges = 0;
  private stableChecks = 0;
  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(1);
    this.materials = scenes.map(
      (s) =>
        new THREE.ShaderMaterial({
          vertexShader: vertex,
          fragmentShader: s.fragment,
          uniforms: {
            resolution: { value: new THREE.Vector2(1, 1) },
            time: { value: 0 },
            bass: { value: 0 },
            mids: { value: 0 },
            treble: { value: 0 },
            energy: { value: 0 },
            pulse: { value: 0 },
            motion: { value: 1 },
            richness: { value: 1 },
            density: { value: 0.65 },
            particles: { value: 1 },
            reduced: { value: 0 },
            spectrum: { value: new Float32Array(32) },
            waveform: { value: new Float32Array(128) },
            bg: { value: new THREE.Color() },
            primary: { value: new THREE.Color() },
            secondary: { value: new THREE.Color() },
            highlight: { value: new THREE.Color() },
          },
        }),
    );
    this.compositor = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader:
        "varying vec2 vUv;uniform sampler2D a,b;uniform float blend,brightness;void main(){vec3 col=mix(texture2D(a,vUv).rgb,texture2D(b,vUv).rgb,smoothstep(0.,1.,blend));col*=brightness;gl_FragColor=vec4(col/(1.+max(vec3(0.),col-0.85)*.6),1.);}",
      uniforms: {
        a: { value: this.a.texture },
        b: { value: this.b.texture },
        blend: { value: 1 },
        brightness: { value: 1 },
      },
    });
    this.mesh = new THREE.Mesh(this.plane, this.materials[0]);
    this.world.add(this.mesh);
    this.materials.forEach((m, i) => this.palette(m, scenes[i], 0));
  }
  private palette(m: THREE.ShaderMaterial, s: SceneDefinition, p: number) {
    s.palettes[p].colors.forEach((hex, i) =>
      (
        m.uniforms[["bg", "primary", "secondary", "highlight"][i]]
          .value as THREE.Color
      ).setStyle(hex, THREE.LinearSRGBColorSpace),
    );
  }
  resize(width: number, height: number, quality: string) {
    this.width = width;
    this.height = height;
    this.lastQuality = quality;
    const cap =
      quality === "High"
        ? 1920
        : quality === "Balanced"
          ? 1440
          : quality === "Low power"
            ? 960
            : 1600;
    this.scale =
      Math.min(devicePixelRatio, cap / Math.max(width, height)) *
      (quality === "Auto" ? this.dynamic : 1);
    const w = Math.max(1, Math.round(width * this.scale)),
      h = Math.max(1, Math.round(height * this.scale));
    if (
      this.renderer.domElement.width !== w ||
      this.renderer.domElement.height !== h ||
      this.a.width !== w ||
      this.a.height !== h
    ) {
      this.renderer.setSize(w, h, false);
      this.a.setSize(w, h);
      this.b.setSize(w, h);
      this.sizeChanges++;
    }
    // Keep both targets allocated; an idle transition must not leave an unbound sampler.
    this.renderer.initRenderTarget(this.a);
    this.renderer.initRenderTarget(this.b);
    this.materials.forEach((m) =>
      m.uniforms.resolution.value.set(width, height),
    );
  }
  update(
    dt: number,
    features: AudioFeatures,
    { settings: s, reduced, paused }: RenderOptions,
  ) {
    const next = scenes.findIndex((x) => x.id === s.scene);
    if (next !== this.current) {
      this.previous = this.current;
      this.current = next;
      this.blend = 0;
      this.currentPalette = -1;
    }
    if (this.currentPalette !== s.palette) {
      this.palette(
        this.materials[this.current],
        scenes[this.current],
        s.palette,
      );
      this.currentPalette = s.palette;
    }
    if (s.quality !== this.lastQuality)
      this.resize(this.width, this.height, s.quality);
    this.reduced = reduced;
    if (paused) return;
    this.blend = Math.min(1, this.blend + dt / (reduced ? 0.5 : 1.5));
    const target = s.mood === "Calm" ? 0.6 : s.mood === "Party" ? 1.3 : 1;
    this.smoothMood += (target - this.smoothMood) * (1 - Math.exp(-dt * 2));
    this.time +=
      dt *
      s.motion *
      s.flowSpeed *
      Math.sqrt(s.intensity) *
      this.smoothMood *
      (reduced ? 0.12 : 1) *
      (0.45 + features.energy * 1.2 + features.transient * 0.22);
    for (const i of new Set([this.current, this.previous])) {
      const u = this.materials[i].uniforms;
      u.time.value = this.time;
      u.motion.value = s.motion;
      u.reduced.value = reduced ? 1 : 0;
      u.density.value =
        (s.quality === "Low power" ? 0.3 : 0.7) * this.smoothMood;
      u.particles.value = s.particles * Math.min(1, s.intensity);
      u.richness.value = (0.95 + 0.18 * this.smoothMood) * s.colourIntensity;
      this.audioDetail(
        u,
        features,
        s.intensity * Math.min(1.4, s.motion) * (reduced ? 0.25 : 1),
      );
      for (const k of ["bass", "mids", "treble", "energy"] as const)
        u[k].value = Math.min(
          reduced ? 0.35 : 1.5,
          features[k] *
            (k === "bass"
              ? s.beatImpact
              : k === "energy"
                ? 1
                : s.melodyDetail) *
            Math.min(1.4, this.smoothMood) *
            (reduced ? 0.25 : 1) *
            Math.min(1.4, s.motion) *
            s.intensity,
        );
      u.pulse.value = Math.min(
        reduced ? 0.1 : 1.5,
        features.transient *
          s.beatImpact *
          Math.min(1.5, this.smoothMood) *
          (reduced ? 0.08 : 1) *
          Math.min(1.4, s.motion) *
          s.intensity,
      );
    }
    this.frames++;
    this.elapsed += dt;
    if (dt > 0.024) this.slowFrames++;
    if (this.elapsed > 4) {
      if (s.quality === "Auto") {
        const before = this.dynamic;
        if (this.slowFrames / this.frames > 0.3) {
          this.dynamic = Math.max(0.45, this.dynamic - 0.12);
          this.stableChecks = 0;
        } else if (
          this.slowFrames / this.frames < 0.05 &&
          ++this.stableChecks >= 3
        ) {
          this.dynamic = Math.min(1, this.dynamic + 0.04);
          this.stableChecks = 0;
        }
        if (before !== this.dynamic)
          this.resize(this.width, this.height, s.quality);
      }
      this.frames = 0;
      this.slowFrames = 0;
      this.elapsed = 0;
    }
  }
  private audioDetail(
    u: THREE.ShaderMaterial["uniforms"],
    f: AudioFeatures,
    scale = 1,
  ) {
    const bands = u.spectrum.value as Float32Array,
      wave = u.waveform.value as Float32Array;
    for (let i = 0; i < bands.length; i++)
      bands[i] = Math.min(
        1.3,
        (f.spectrum?.[i] ??
          (i < 8 ? f.bass : i < 22 ? f.mids : f.treble) *
            (0.5 + 0.5 * Math.sin(i * 1.7) ** 2)) * scale,
      );
    for (let i = 0; i < wave.length; i++)
      wave[i] =
        (f.waveform?.[i] ??
          Math.sin(i * 0.19) * f.bass + Math.sin(i * 0.53) * f.mids * 0.3) *
        scale;
  }
  render(brightness: number) {
    if (this.blend < 1) {
      this.mesh.material = this.materials[this.previous];
      this.renderer.setRenderTarget(this.a);
      this.renderer.render(this.world, this.camera);
    }
    this.mesh.material = this.materials[this.current];
    this.renderer.setRenderTarget(this.b);
    this.renderer.render(this.world, this.camera);
    this.mesh.material = this.compositor;
    this.compositor.uniforms.blend.value = this.blend;
    this.compositor.uniforms.brightness.value = brightness;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.world, this.camera);
  }
  previews() {
    const images: Record<string, string> = {};
    this.renderer.setSize(320, 180, false);
    for (let i = 0; i < scenes.length; i++) {
      const m = this.materials[i];
      m.uniforms.resolution.value.set(320, 180);
      m.uniforms.time.value = 4;
      m.uniforms.bass.value = 0.45;
      m.uniforms.mids.value = 0.35;
      m.uniforms.treble.value = 0.25;
      m.uniforms.energy.value = 0.5;
      m.uniforms.pulse.value = 0.45;
      this.audioDetail(m.uniforms, {
        bass: 0.7,
        mids: 0.5,
        treble: 0.3,
        energy: 0.5,
        transient: 0.45,
        silent: false,
      });
      this.mesh.material = m;
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.world, this.camera);
      images[scenes[i].id] = this.renderer.domElement.toDataURL(
        "image/webp",
        0.8,
      );
    }
    return images;
  }
  fixed(time: number, features: AudioFeatures) {
    this.time = time;
    for (const m of this.materials) {
      m.uniforms.time.value = time;
      for (const k of ["bass", "mids", "treble", "energy"] as const)
        m.uniforms[k].value = features[k];
      m.uniforms.reduced.value = this.reduced ? 1 : 0;
      m.uniforms.pulse.value = features.transient * (this.reduced ? 0.08 : 1);
      this.audioDetail(m.uniforms, features, this.reduced ? 0.25 : 1);
    }
    this.blend = 1;
  }
  get debug() {
    return {
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      programs: this.renderer.info.programs?.length,
      scale: this.scale,
      sizeChanges: this.sizeChanges,
    };
  }
  dispose() {
    this.materials.forEach((m) => m.dispose());
    this.compositor.dispose();
    this.plane.dispose();
    this.a.dispose();
    this.b.dispose();
    this.renderer.dispose();
  }
}
