import { useEffect, useRef, useState } from "react";
import { SceneRenderer } from "./render/SceneRenderer";
import { AutomaticDirector } from "./render/AutomaticDirector";
import { AudioEngine } from "./audio/engine";
import { scenes } from "./scenes";
import { defaults } from "./storage";
import type { AudioFeatures, Settings } from "./types";
const sound: AudioFeatures = {
  bass: 0.55,
  mids: 0.42,
  treble: 0.3,
  energy: 0.45,
  transient: 0.2,
  silent: false,
};
const nextFrame = () => new Promise<number>((r) => requestAnimationFrame(r));
export default function DevVerify() {
  const canvas = useRef<HTMLCanvasElement>(null),
    renderer = useRef<SceneRenderer | null>(null),
    audio = useRef<AudioEngine | null>(null),
    cancel = useRef(false);
  const [lines, setLines] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [images, setImages] = useState<Record<string, string>>({}),
    [minutes, setMinutes] = useState(2);
  const say = (line: string) => setLines((old) => [...old, line]);
  useEffect(() => {
    renderer.current = new SceneRenderer(canvas.current!);
    renderer.current.resize(640, 360, "Balanced");
    audio.current = new AudioEngine();
    return () => {
      cancel.current = true;
      renderer.current?.dispose();
      audio.current?.dispose();
    };
  }, []);
  const run = async () => {
    if (!renderer.current || !audio.current) return;
    const r = renderer.current,
      a = audio.current;
    setBusy(true);
    setLines([]);
    cancel.current = false;
    try {
      const unique = new Set<string>();
      const preview: Record<string, string> = {};
      let cases = 0;
      for (const scene of scenes) {
        for (let palette = 0; palette < 3; palette++)
          for (const mood of ["Calm", "Flow", "Party"] as const)
            for (const reduced of [false, true]) {
              const settings = { ...defaults, scene: scene.id, palette, mood };
              r.update(1, sound, { settings, reduced, paused: false });
              r.fixed(5, sound);
              r.render(1);
              const shot = r.renderer.domElement.toDataURL("image/png");
              unique.add(shot);
              if (palette === 0 && mood === "Flow" && !reduced)
                preview[scene.id] = shot;
              cases++;
              if (r.renderer.getContext().getError() !== 0)
                throw new Error("WebGL error in " + scene.name);
              await nextFrame();
            }
        say(
          "PASS " +
            scene.name +
            ": 3 palettes × 3 moods × reduced motion on/off",
        );
      }
      setImages(preview);
      say(
        "PASS " +
          cases +
          " rendered configurations; " +
          unique.size +
          " distinct images",
      );
      const settings = { ...defaults, scene: "velvet" as const };
      r.update(0.016, sound, { settings, reduced: false, paused: false });
      r.fixed(5, sound);
      r.render(1);
      const frozen = r.renderer.domElement.toDataURL();
      for (let i = 0; i < 30; i++) {
        r.update(
          0.016,
          { ...sound, bass: 1 },
          { settings, reduced: false, paused: true },
        );
        r.render(1);
      }
      if (frozen !== r.renderer.domElement.toDataURL())
        throw new Error("Visual pause changed pixels");
      say("PASS visual pause freezes rendered pixels");
      for (const scene of scenes) {
        const settings = { ...defaults, scene: scene.id };
        r.update(1 / 60, sound, { settings, reduced: false, paused: false });
        r.fixed(5, { ...sound, transient: 0 });
        r.render(1);
        const baseFrame = r.renderer.domElement.toDataURL();
        r.fixed(5, { ...sound, transient: 1 });
        r.render(1);
        if (baseFrame === r.renderer.domElement.toDataURL())
          throw new Error(scene.name + " ignores beat accents");
        r.fixed(5, { ...sound, mids: 0.95, treble: 0.85, transient: 0 });
        r.render(1);
        if (baseFrame === r.renderer.domElement.toDataURL())
          throw new Error(scene.name + " ignores melody and treble");
        const held = r.renderer.domElement.toDataURL();
        for (let n = 0; n < 10; n++) {
          r.update(
            1 / 30,
            { ...sound, transient: 1 },
            { settings, reduced: false, paused: true },
          );
          r.render(1);
        }
        if (held !== r.renderer.domElement.toDataURL())
          throw new Error(scene.name + " moves while visually paused");
      }
      say(
        "PASS all ten scenes respond separately to beat accents and melody/treble; all freeze exactly when paused",
      );
      for (const scene of scenes) {
        for (const key of [
          "beatImpact",
          "melodyDetail",
          "flowSpeed",
          "particles",
          "colourIntensity",
        ] as const) {
          const frames: string[] = [];
          for (const value of [0, 2]) {
            r.fixed(5, sound);
            r.update(key === "flowSpeed" ? 0.1 : 0, sound, {
              settings: { ...defaults, scene: scene.id, [key]: value },
              reduced: false,
              paused: false,
            });
            // Finish any scene transition without resetting effect uniforms.
            r.update(2, sound, {
              settings: { ...defaults, scene: scene.id, [key]: value },
              reduced: false,
              paused: false,
            });
            r.render(1);
            frames.push(r.renderer.domElement.toDataURL());
          }
          if (frames[0] === frames[1])
            throw new Error(scene.name + " ignores " + key);
        }
      }
      say(
        "PASS five independent effect sliders change rendered output in all ten scenes (50 comparisons)",
      );
      const base = r.debug;
      r.resize(640, 360, "Balanced");
      const sizes = r.debug.sizeChanges;
      for (let i = 0; i < 100; i++) r.resize(640, 360, "Balanced");
      if (sizes !== r.debug.sizeChanges)
        throw new Error("Unchanged layout reallocated render surfaces");
      say(
        "PASS 100 unchanged layout observations cause zero drawing-surface reallocations",
      );
      for (let i = 0; i < 50; i++) {
        r.update(0.016, sound, {
          settings: { ...settings, scene: scenes[i % scenes.length].id },
          reduced: false,
          paused: false,
        });
        r.render(1);
      }
      const after = r.debug;
      if (
        base.textures !== after.textures ||
        base.geometries !== after.geometries ||
        base.programs !== after.programs
      )
        throw new Error("Renderer resources grew across scene switches");
      say(
        "PASS 50 scene switches, stable GPU resources: " +
          JSON.stringify(after),
      );
      for (const ext of ["wav", "mp3", "m4a", "ogg", "flac", "aac"]) {
        try {
          const response = await fetch("/tests/fixtures/tone." + ext);
          if (!response.ok) throw new Error("Fixture missing");
          const file = new File([await response.blob()], "tone." + ext);
          a.addFiles([file]);
          a.setVolume(0);
          await a.play(a.queue.length - 1);
          let peak = 0;
          const start = performance.now();
          while (performance.now() - start < 700) {
            await nextFrame();
            peak = Math.max(peak, a.sample(1, 0.016, 1).energy);
          }
          if (a.state.status !== "active" || peak < 0.015)
            throw new Error(
              "No decoded audio energy (" + peak.toFixed(3) + ")",
            );
          say(
            "PASS " +
              ext.toUpperCase() +
              " real browser decoding and pre-volume analysis; peak " +
              peak.toFixed(3),
          );
        } catch (e) {
          say("FAIL " + ext.toUpperCase() + ": " + (e as Error).message);
        }
      }
      for (let i = 0; i < 20; i++) {
        a.demo();
        await a.play(i % a.queue.length);
      }
      a.stop();
      if (a.debug.contexts !== 1 || a.debug.tracks !== 0)
        throw new Error("Audio lifecycle resource mismatch");
      say(
        "PASS 20 demo/file source switches; one AudioContext, zero capture tracks",
      );
      say(
        "COMPLETE — synthetic fixtures only; physical microphone and desktop sharing require manual checks.",
      );
    } catch (e) {
      say("FAIL " + (e as Error).message);
    } finally {
      a.stop();
      setBusy(false);
    }
  };
  const soak = async () => {
    if (!renderer.current || !audio.current) return;
    const r = renderer.current,
      a = audio.current;
    setBusy(true);
    setLines([]);
    cancel.current = false;
    const ms = minutes * 60000;
    let start = performance.now(),
      last = start,
      lastScene = -1,
      lastSource = -1,
      frames = 0,
      deltas: number[] = [],
      check = 0,
      maxTextures = 0;
    const initial = { ...defaults };
    const director = new AutomaticDirector();
    try {
      r.previews();
      r.resize(1280, 720, "Auto");
      if (!a.queue.length) {
        const response = await fetch("/tests/fixtures/tone.wav");
        a.addFiles([new File([await response.blob()], "tone.wav")]);
      }
      a.setVolume(0);
      a.repeat = "All";
      await a.play(0);
      start = last = performance.now();
      while (performance.now() - start < ms && !cancel.current) {
        const now = await nextFrame();
        if (document.hidden) {
          say(
            "STOPPED — tab hidden; a foreground run is required for meaningful performance measurements.",
          );
          break;
        }
        const rawDt = (now - last) / 1000;
        const dt = Math.min(0.1, rawDt);
        last = now;
        const elapsed = (now - start) / 1000;
        const si = Math.floor(elapsed / 2) % scenes.length,
          source = Math.floor(elapsed / 5);
        if (source !== lastSource) {
          lastSource = source;
          if (source % 2 === 0) await a.play(0);
          else a.demo();
        }
        if (si !== lastScene) {
          lastScene = si;
          initial.scene = scenes[si].id;
        }
        const feature = a.sample(elapsed, dt, 1);
        r.update(dt, feature, {
          settings: director.update(dt, feature, initial).settings,
          reduced: false,
          paused: false,
        });
        r.render(1);
        frames++;
        deltas.push(rawDt * 1000);
        maxTextures = Math.max(maxTextures, r.debug.textures);
        if (Math.floor(elapsed / 15) > check) {
          check = Math.floor(elapsed / 15);
          say(
            "RUN " +
              Math.floor(elapsed) +
              " s · " +
              frames +
              " frames · " +
              r.debug.textures +
              " GPU textures · " +
              a.debug.contexts +
              " audio context",
          );
        }
      }
      const seconds = (performance.now() - start) / 1000;
      deltas = deltas.sort((x, y) => x - y);
      say(
        "RESULT " +
          seconds.toFixed(1) +
          " s; mean " +
          (frames / seconds).toFixed(1) +
          " fps; p95 frame interval " +
          (deltas[Math.floor(deltas.length * 0.95)] ?? 0).toFixed(1) +
          " ms; max " +
          (deltas[deltas.length - 1] ?? 0).toFixed(1) +
          " ms; frames over 100 ms " +
          deltas.filter((x) => x > 100).length +
          "; peak " +
          maxTextures +
          " textures; " +
          JSON.stringify(a.debug),
      );
      say(
        seconds >= ms / 1000
          ? "PASS sustained foreground run completed"
          : "INCOMPLETE duration",
      );
    } catch (e) {
      say("FAIL " + (e as Error).message);
    } finally {
      a.stop();
      setBusy(false);
    }
  };
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "auto" }}>
      <h1>Music Wall · development checks</h1>
      <p>
        Deterministic scene rendering, real local fixture decoding, silent
        playback and resource measurements. This page is excluded from
        production.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          className="primary-button"
          disabled={busy}
          onClick={() => void run()}
        >
          Run scene and audio matrix
        </button>
        <label>
          Soak minutes{" "}
          <input
            aria-label="Soak minutes"
            type="number"
            min="1"
            max="60"
            value={minutes}
            onChange={(e) =>
              setMinutes(Math.max(1, Math.min(60, Number(e.target.value))))
            }
          />
        </label>
        <button
          className="wide-button"
          style={{ width: "auto", padding: 12 }}
          disabled={busy}
          onClick={() => void soak()}
        >
          Run foreground soak
        </button>
        <button
          onClick={() => {
            cancel.current = true;
          }}
        >
          Stop soak
        </button>
        <a href="/">Return to Music Wall</a>
      </div>
      <canvas
        ref={canvas}
        style={{
          width: "100%",
          aspectRatio: "16/9",
          maxHeight: 480,
          marginTop: 20,
          borderRadius: 12,
        }}
      />
      <pre
        role="log"
        style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.8 }}
      >
        {lines.join("\n")}
      </pre>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
        }}
      >
        {Object.entries(images).map(([id, src]) => (
          <div key={id}>
            <img src={src} alt={id} style={{ width: "100%" }} />
            <p>{scenes.find((s) => s.id === id)!.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
