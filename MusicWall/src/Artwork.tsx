import { useEffect, useRef } from "react";
import { SceneRenderer } from "./render/SceneRenderer";
import { AutomaticDirector, type Atmosphere } from "./render/AutomaticDirector";
import type { Settings, AudioFeatures, SceneId } from "./types";
import type { AudioEngine } from "./audio/engine";
interface Props {
  settings: Settings;
  paused: boolean;
  editing: boolean;
  reduced: boolean;
  engine: AudioEngine;
  onPreviews: (p: Record<string, string>) => void;
  onError: (error: string) => void;
  onLevel: (n: number) => void;
  onAtmosphere: (status: Atmosphere) => void;
  onAdvance: (scene: SceneId, palette: number) => void;
}
export default function Artwork(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null),
    latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    let engine: SceneRenderer | undefined,
      frame = 0,
      last = performance.now(),
      lastRender = last,
      levelTime = 0,
      clock = 0,
      lost = false,
      failed = false;
    let director = new AutomaticDirector(),
      sourceKey = "";
    const el = canvas.current!;
    const visibility = () => {
      lastRender = last = performance.now();
    };
    document.addEventListener("visibilitychange", visibility);
    const resize = () => {
      if (engine && !lost) {
        const r = el.getBoundingClientRect();
        engine.resize(r.width, r.height, latest.current.settings.quality);
      }
    };
    const create = () => {
      try {
        engine = new SceneRenderer(el);
        latest.current.onPreviews(engine.previews());
        resize();
        latest.current.onError("");
      } catch {
        failed = true;
        latest.current.onError(
          "The artwork could not start. Enable hardware acceleration or try Chrome or Edge.",
        );
      }
    };
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (document.hidden || lost || failed || !engine) {
        lastRender = now;
        return;
      }
      const p = latest.current;
      const fps = p.settings.quality === "Low power" ? 30 : 60;
      if (now - lastRender < 1000 / fps - 2) return;
      const elapsed = (now - lastRender) / 1000;
      const renderDt = Math.min(0.1, elapsed);
      lastRender = now;
      clock += renderDt;
      const features = p.engine.sample(clock, renderDt, p.settings.sensitivity);
      const key = p.engine.state.kind + ":" + p.engine.state.status;
      if (key !== sourceKey) {
        director = new AutomaticDirector();
        sourceKey = key;
      }
      const direction = director.update(
        elapsed,
        features,
        p.settings,
        p.paused,
        p.editing,
      );
      if (direction.next)
        p.onAdvance(direction.next.scene, direction.next.palette);
      if (now - levelTime > 150) {
        p.onLevel(features.energy);
        p.onAtmosphere(direction.atmosphere);
        levelTime = now;
      }
      engine.update(renderDt || dt, features, {
        ...p,
        settings: direction.settings,
      });
      if (
        import.meta.env.DEV &&
        new URLSearchParams(location.search).has("scene-test")
      ) {
        const params = new URLSearchParams(location.search);
        const val = (key: string, d: number) => {
          const n = Number(params.get(key) ?? d);
          return Number.isFinite(n) ? n : d;
        };
        engine.fixed(val("time", 4), {
          bass: val("bass", 0.45),
          mids: val("mids", 0.35),
          treble: val("treble", 0.25),
          energy: val("energy", 0.4),
          transient: val("pulse", 0),
          silent: false,
        } as AudioFeatures);
      }
      engine.render(p.settings.brightness);
    };
    const loss = (e: Event) => {
      e.preventDefault();
      lost = true;
      latest.current.onError(
        "Graphics were interrupted. Waiting for your device to recover…",
      );
    };
    const restore = () => {
      engine?.dispose();
      lost = false;
      failed = false;
      create();
    };
    el.addEventListener("webglcontextlost", loss);
    el.addEventListener("webglcontextrestored", restore);
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    create();
    frame = requestAnimationFrame(draw);
    if (import.meta.env.DEV)
      (window as unknown as { musicWallDebug: () => unknown }).musicWallDebug =
        () => ({ audio: latest.current.engine.debug, render: engine?.debug });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      el.removeEventListener("webglcontextlost", loss);
      el.removeEventListener("webglcontextrestored", restore);
      engine?.dispose();
    };
  }, []);
  return (
    <canvas
      className="artwork"
      ref={canvas}
      aria-label="Music-reactive artwork"
      role="img"
    />
  );
}
