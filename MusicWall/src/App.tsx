import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useId,
  type ReactNode,
} from "react";
import {
  AudioLines,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  Heart,
  Headphones,
  LayoutGrid,
  Mic,
  Monitor,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  Radio,
  Repeat,
  Settings2,
  ShieldCheck,
  SkipBack,
  SkipForward,
  Sparkles,
  Square,
  Sun,
  Upload,
  Volume2,
  Waves,
  X,
  Trash2,
  Pencil,
  ArrowUp,
  ArrowDown,
  Minimize,
  Bookmark,
} from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import Artwork from "./Artwork";
import type { Atmosphere } from "./render/AutomaticDirector";
import { AudioEngine } from "./audio/engine";
import { scenes } from "./scenes";
import {
  loadStore,
  saveStore,
  parseStore,
  mergeStores,
  pickVisual,
} from "./storage";
import type { Store, Settings, SavedLook, SceneId, Mood } from "./types";

type Panel = "source" | "scene" | "mood" | "looks" | "settings" | null;
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const stamp = (n: number) => {
  if (!Number.isFinite(n)) return "0:00";
  return Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0");
};
function IconButton({
  label,
  onClick,
  children,
  active = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className={"icon-button" + (active ? " active" : "")}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
  unit?: string;
}) {
  const id = useId();
  return (
    <label className="slider-label" htmlFor={id}>
      <span>
        {label}
        <output htmlFor={id}>{unit ?? Math.round(value * 100) + "%"}</output>
      </span>
      <input
        id={id}
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
export default function App() {
  const [initial] = useState(loadStore);
  const [store, setStore] = useState<Store>(initial.store);
  const [blocked, setBlocked] = useState(Boolean(initial.warning));
  const [storageWarning, setStorageWarning] = useState(initial.warning);
  const s = store.settings;
  const [engine] = useState(() => new AudioEngine());
  const [, refresh] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [paused, setPaused] = useState(false);
  const [theatre, setTheatre] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [level, setLevel] = useState(0);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>("Waiting for music");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [graphicsError, setGraphicsError] = useState("");
  const [notice, setNotice] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [calibrating, setCalibrating] = useState(false);
  const [imported, setImported] = useState<Store | null>(null);
  const [lookName, setLookName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [wakeStatus, setWakeStatus] = useState("");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [systemReduced, setSystemReduced] = useState(
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const panelRef = useRef<HTMLElement>(null),
    lastFocus = useRef<HTMLElement | null>(null),
    audioInput = useRef<HTMLInputElement>(null),
    importInput = useRef<HTMLInputElement>(null),
    activity = useRef(performance.now()),
    consumeClick = useRef(false),
    latest = useRef(s);
  latest.current = s;
  const scene = scenes.find((x) => x.id === s.scene)!;
  const palette = scene.palettes[s.palette];
  const reduced =
    s.reduced === "on" || (s.reduced === "system" && systemReduced);
  const viewing = theatre || fullscreen;
  const state = engine.state;
  const capturing =
    (state.kind === "mic" || state.kind === "tab") &&
    ["active", "paused", "starting"].includes(state.status);
  const [cachedReady, setCachedReady] = useState(false);
  const {
    offlineReady: [justCached],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () =>
      setNotice(
        "Offline caching could not finish. Keep this page open and try reloading when online.",
      ),
  });
  const offlineReady = justCached || cachedReady;
  useEffect(() => {
    let cancelled = false;
    if ("serviceWorker" in navigator && import.meta.env.PROD)
      void navigator.serviceWorker.ready.then((reg) => {
        if (!cancelled && reg.active) setCachedReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const patch = useCallback(
    (change: Partial<Settings>) =>
      setStore((old) => ({ ...old, settings: { ...old.settings, ...change } })),
    [],
  );
  const open = (next: Panel) => {
    activity.current = performance.now();
    setHidden(false);
    lastFocus.current = document.activeElement as HTMLElement;
    setPanel((v) => (v === next ? null : next));
  };
  const choose = (id: SceneId) => {
    patch({
      scene: id,
      palette: s.palettes[id] ?? 0,
      rotation: false,
      autoCycle: false,
    });
  };
  const changePalette = (n: number) =>
    patch({
      palette: n,
      palettes: { ...s.palettes, [s.scene]: n },
      autoCycle: false,
    });
  const advance = useCallback((scene: SceneId, palette: number) => {
    setStore((old) =>
      !old.settings.automatic || !old.settings.autoCycle
        ? old
        : {
            ...old,
            settings: {
              ...old.settings,
              scene,
              palette,
              palettes: { ...old.settings.palettes, [scene]: palette },
            },
          },
    );
  }, []);
  const fullscreenToggle = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else {
        setTheatre(true);
        setNotice("Fullscreen is unavailable here. Theatre view is ready.");
      }
    } catch {
      setTheatre(true);
      setNotice("Fullscreen is unavailable here. Theatre view is ready.");
    }
  };
  useEffect(() => {
    if (blocked) return;
    try {
      saveStore(store);
      setStorageWarning("");
    } catch {
      setStorageWarning(
        "Your browser could not save changes. Export your looks before closing.",
      );
    }
  }, [store, blocked]);
  useEffect(() => {
    engine.onChange = () => refresh((n) => n + 1);
    const visibility = () => {
      if (document.hidden && ["mic", "tab"].includes(engine.state.kind))
        engine.stop(
          "Listening stopped while Music Wall was hidden. Start again when ready.",
        );
    };
    const sync = () => {
      setPosition(engine.media.currentTime);
      setDuration(engine.media.duration);
    };
    document.addEventListener("visibilitychange", visibility);
    engine.media.addEventListener("timeupdate", sync);
    engine.media.addEventListener("loadedmetadata", sync);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      engine.media.removeEventListener("timeupdate", sync);
      engine.media.removeEventListener("loadedmetadata", sync);
      engine.dispose();
    };
  }, [engine]);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setSystemReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const change = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      setHidden(false);
    };
    document.addEventListener("fullscreenchange", change);
    const before = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", before);
    return () => {
      document.removeEventListener("fullscreenchange", change);
      window.removeEventListener("beforeinstallprompt", before);
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      activity.current = performance.now();
      setHidden(false);
      if (e.key === "Escape") {
        setPanel(null);
        setTheatre(false);
        return;
      }
      if (
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        (e.target as HTMLElement).matches(
          "input,textarea,select,[contenteditable]",
        )
      )
        return;
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        void fullscreenToggle();
      }
      if (e.key.toLowerCase() === "v") {
        e.preventDefault();
        setPaused((v) => !v);
      }
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (["mic", "tab"].includes(engine.state.kind)) engine.stop();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [engine]);
  useEffect(() => {
    const tick = window.setInterval(() => {
      if (!viewing || panel || document.hidden) return;
      const focused = document.activeElement;
      if (
        focused instanceof HTMLElement &&
        focused.matches("button,input,select") &&
        focused.matches(":focus-visible")
      )
        return;
      if (performance.now() - activity.current > 4000) setHidden(true);
    }, 500);
    return () => clearInterval(tick);
  }, [viewing, panel]);
  useEffect(() => {
    if (!panel) {
      lastFocus.current?.focus();
      return;
    }
    const el = panelRef.current;
    el?.querySelector<HTMLElement>("button")?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !el) return;
      const list = Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),summary,a[href],[tabindex="0"]',
        ),
      ).filter((item) => item.getClientRects().length > 0);
      const first = list[0],
        last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    el?.addEventListener("keydown", trap);
    return () => el?.removeEventListener("keydown", trap);
  }, [panel]);
  useEffect(() => {
    if (s.automatic || !s.rotation || paused || panel) return;
    let elapsed = 0,
      last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      if (!document.hidden) elapsed += (now - last) / 1000;
      last = now;
      if (elapsed < latest.current.interval) return;
      elapsed = 0;
      setStore((old) => {
        const ids = scenes
          .filter(
            (x) =>
              !old.settings.favourites.length ||
              old.settings.favourites.includes(x.id),
          )
          .map((x) => x.id);
        const id = ids[(ids.indexOf(old.settings.scene) + 1) % ids.length];
        return {
          ...old,
          settings: {
            ...old.settings,
            scene: id,
            palette: old.settings.palettes[id] ?? 0,
          },
        };
      });
    }, 500);
    return () => clearInterval(timer);
  }, [s.automatic, s.rotation, paused, s.interval, s.favourites, panel]);
  useEffect(() => {
    if (!s.awake) {
      setWakeStatus("");
      return;
    }
    let lock: WakeLockSentinel | null = null,
      cancelled = false;
    const acquire = async () => {
      if (document.hidden || cancelled || lock) return;
      if (!("wakeLock" in navigator)) {
        setWakeStatus("Keep awake is unavailable in this browser.");
        return;
      }
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await next.release();
          return;
        }
        lock = next;
        setWakeStatus("Keeping your screen awake");
        next.addEventListener("release", () => {
          lock = null;
          if (!cancelled)
            setWakeStatus("Screen wake lock released by your device.");
        });
      } catch {
        setWakeStatus("Your device could not keep the screen awake.");
      }
    };
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      void lock?.release();
      document.removeEventListener("visibilitychange", acquire);
    };
  }, [s.awake]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    if (state.kind === "mic" && state.status === "active")
      void engine.devices().then(setDevices);
  }, [engine, state.kind, state.status]);
  const receiveFiles = (files: File[]) => {
    if (!files.length) return;
    const start = engine.queue.length;
    const append =
      engine.state.kind === "files" &&
      engine.index >= 0 &&
      ["active", "paused"].includes(engine.state.status);
    engine.addFiles(files);
    if (!append) {
      engine.selectFiles();
      void engine.play(start);
    } else
      setNotice(
        files.length +
          " file" +
          (files.length === 1 ? "" : "s") +
          " added to your queue",
      );
    setPanel("source");
  };
  const download = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "music-wall-looks.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importFile = async (file: File) => {
    try {
      if (file.size > 1000000)
        throw new Error("Choose a Music Wall JSON file smaller than 1 MB.");
      setImported(parseStore(await file.text()));
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const commitImport = (merge: boolean) => {
    if (!imported) return;
    try {
      const next = merge ? mergeStores(store, imported) : imported;
      saveStore(next);
      setStore(next);
      setBlocked(false);
      setImported(null);
      setNotice(
        merge
          ? "Looks merged. Your current device settings were kept."
          : "Settings and looks imported. Your audio source has not changed.",
      );
    } catch (e) {
      setNotice((e as Error).message);
    }
  };
  const saveLook = () => {
    const name = lookName.trim();
    if (!name) return;
    if (!editing && store.looks.length >= 500) {
      setNotice(
        "Your collection is full. Export a backup and remove a look first.",
      );
      return;
    }
    setStore((old) => ({
      ...old,
      looks: editing
        ? old.looks.map((l) => (l.id === editing ? { ...l, name } : l))
        : [
            ...old.looks,
            {
              ...pickVisual(s),
              id: crypto.randomUUID(),
              name,
              favourite: false,
              automatic: s.automatic,
            },
          ],
    }));
    setLookName("");
    setEditing(null);
    setNotice(editing ? "Look renamed" : "Look saved");
  };
  const applyLook = (look: SavedLook) => {
    patch({
      ...pickVisual(look),
      palettes: { ...s.palettes, [look.scene]: look.palette },
      rotation: false,
      automatic: look.automatic,
      autoCycle: false,
    });
    setNotice("Now showing " + look.name);
  };
  const toggleFavourite = (id: SceneId) =>
    patch({
      favourites: s.favourites.includes(id)
        ? s.favourites.filter((x) => x !== id)
        : [...s.favourites, id],
    });
  const activeMessage =
    state.status === "active" && state.kind === "mic"
      ? "Listening to your microphone"
      : state.message;
  const sourceName = {
    demo: "Demo",
    mic: "Microphone",
    files: "Local files",
    tab: "Browser tab",
  }[state.kind];
  const reveal = () => {
    activity.current = performance.now();
    setHidden(false);
  };
  const panelTitles = {
    source: "Music source",
    scene: "Choose a scene",
    mood: "Automatic & tour",
    looks: "Your favourite moments",
    settings: "Customise",
  };
  return (
    <div
      className={
        "app" +
        (panel ? " panel-open" : "") +
        (viewing ? " theatre" : "") +
        (s.large ? " large-controls" : "") +
        (hidden && viewing ? " controls-hidden" : "")
      }
      onPointerMove={reveal}
      onPointerDownCapture={(e) => {
        if (hidden && viewing) {
          consumeClick.current = true;
          e.preventDefault();
          e.stopPropagation();
          reveal();
        } else activity.current = performance.now();
      }}
      onClickCapture={(e) => {
        if (consumeClick.current) {
          consumeClick.current = false;
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <header className="topbar chrome">
        <a className="brand" href="./" aria-label="Music Wall home">
          <AudioLines />
          <span>
            music wall<span className="brand-dot">.</span>
          </span>
        </a>
        <span className="brand-note">A LITTLE SPACE TO FEEL YOUR SOUND</span>
        <div className="top-actions">
          <span className="private">
            <ShieldCheck size={14} /> On your device. Just for you.
          </span>
          {install && (
            <button
              className="text-button"
              onClick={async () => {
                await install.prompt();
                await install.userChoice;
                setInstall(null);
              }}
            >
              <Download size={15} /> Install
            </button>
          )}
        </div>
      </header>
      <main className="stage">
        <Artwork
          settings={s}
          editing={panel !== null}
          paused={paused}
          reduced={reduced}
          engine={engine}
          onPreviews={setPreviews}
          onError={setGraphicsError}
          onLevel={setLevel}
          onAtmosphere={setAtmosphere}
          onAdvance={advance}
        />
        <div className="stage-shade" />
        <div className="stage-top chrome">
          <span className="eyebrow">
            <span className="tiny-dot" /> THE LISTENING ROOM{" "}
            <span className="divider">/</span>{" "}
            {String(scenes.indexOf(scene) + 1).padStart(2, "0")} —{" "}
            {String(scenes.length).padStart(2, "0")}
          </span>
          <div className="stage-actions">
            <IconButton
              label={
                s.favourites.includes(s.scene)
                  ? "Unfavourite scene"
                  : "Favourite scene"
              }
              active={s.favourites.includes(s.scene)}
              onClick={() => toggleFavourite(s.scene)}
            >
              <Heart
                size={17}
                fill={s.favourites.includes(s.scene) ? "currentColor" : "none"}
              />
            </IconButton>
            <IconButton
              label={paused ? "Resume visuals" : "Pause visuals"}
              active={paused}
              onClick={() => setPaused((v) => !v)}
            >
              {paused ? <Play size={17} /> : <Pause size={17} />}
            </IconButton>
          </div>
        </div>
        <div className="scene-caption chrome">
          <div className="scene-tag">{scene.tag}</div>
          <h1>{scene.name}</h1>
          <p className="scene-description">{scene.description}</p>
          <div className="palette-inline">
            {scene.palettes.map((p, i) => (
              <button
                key={p.name}
                title={p.name}
                aria-label={"Use " + p.name + " palette"}
                aria-pressed={i === s.palette}
                className={"palette-dot " + (i === s.palette ? "selected" : "")}
                onClick={() => changePalette(i)}
                style={{
                  background:
                    "linear-gradient(130deg," +
                    p.colors.slice(1).join(",") +
                    ")",
                }}
              />
            ))}
            <span>{palette.name}</span>
          </div>
        </div>
        <div className="scene-navigation chrome">
          <IconButton
            label="Previous scene"
            onClick={() =>
              choose(
                scenes[
                  (scenes.indexOf(scene) + scenes.length - 1) % scenes.length
                ].id,
              )
            }
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            label="Next scene"
            onClick={() =>
              choose(scenes[(scenes.indexOf(scene) + 1) % scenes.length].id)
            }
          >
            <ChevronRight />
          </IconButton>
        </div>
        {graphicsError && (
          <div className="graphics-error" role="alert">
            <Monitor />
            <h2>Let’s bring the artwork back</h2>
            <p>{graphicsError}</p>
            <button onClick={() => location.reload()}>Reload Music Wall</button>
          </div>
        )}
      </main>
      <div className="bottom-area chrome">
        <div className="session-row">
          {(state.kind === "demo" ||
            (state.kind === "mic" && state.status === "idle")) && (
            <button
              className="start-listening"
              onClick={() => void engine.capture("mic")}
            >
              <Mic size={15} /> Start listening
            </button>
          )}
          <button
            className={"source-badge " + (capturing ? "listening" : "")}
            onClick={() => open("source")}
          >
            <span
              className={
                "status-dot " +
                (capturing && level >= 0.015 ? "sound-present" : "")
              }
            />
            {state.kind === "demo"
              ? state.message
              : sourceName +
                " · " +
                (state.status === "active"
                  ? state.kind === "mic"
                    ? "Listening"
                    : state.kind === "files"
                      ? "Playing"
                      : "Sharing"
                  : state.status === "paused"
                    ? "Paused"
                    : state.status === "starting"
                      ? "Connecting"
                      : "Stopped")}
            <ChevronDown size={12} />
          </button>
          {capturing && (
            <button className="stop-button" onClick={() => engine.stop()}>
              <Square size={11} fill="currentColor" />
              {state.kind === "mic" ? "Stop listening" : "Stop sharing"}
            </button>
          )}
          {paused && (
            <span className="small-status">
              Visuals paused · audio unchanged
            </span>
          )}
          {s.automatic && <span className="director-status">Automatic on</span>}
          {(s.automatic || s.rotation) && (
            <button
              className="text-button tour-control"
              onClick={() => open(s.automatic ? "mood" : "scene")}
            >
              <Repeat size={13} />{" "}
              {s.automatic
                ? s.autoCycle
                  ? `Tour · ${s.interval < 60 ? s.interval + " sec" : s.interval / 60 + " min"} · Edit`
                  : "Scene held · Tour settings"
                : "Tour settings"}
            </button>
          )}
        </div>
        {state.kind === "files" && engine.queue.length > 0 && (
          <div className="transport">
            <div className="transport-name">
              <Music2 size={16} />
              <span>
                {engine.queue[engine.index]?.name ?? "Choose a track"}
              </span>
            </div>
            <div className="transport-buttons">
              <IconButton
                label="Previous track"
                onClick={() => engine.next(-1)}
              >
                <SkipBack size={16} />
              </IconButton>
              <IconButton
                label={engine.media.paused ? "Play audio" : "Pause audio"}
                onClick={() => engine.toggle()}
              >
                {engine.media.paused ? <Play size={19} /> : <Pause size={19} />}
              </IconButton>
              <IconButton label="Next track" onClick={() => engine.next(1)}>
                <SkipForward size={16} />
              </IconButton>
            </div>
            <label className="seek">
              <span>{stamp(position)}</span>
              <input
                aria-label="Seek audio"
                type="range"
                min="0"
                max={Number.isFinite(duration) ? duration : 0}
                value={Math.min(
                  position,
                  Number.isFinite(duration) ? duration : 0,
                )}
                step=".1"
                onChange={(e) => engine.seek(Number(e.target.value))}
              />
              <span>{stamp(duration)}</span>
            </label>
            <label className="volume">
              <Volume2 size={16} />
              <input
                aria-label="Playback volume"
                type="range"
                min="0"
                max="1"
                step=".01"
                value={engine.volume}
                onChange={(e) => engine.setVolume(Number(e.target.value))}
              />
            </label>
            <button
              className="repeat-button"
              title="Change repeat mode"
              onClick={() => {
                engine.repeat =
                  engine.repeat === "Off"
                    ? "One"
                    : engine.repeat === "One"
                      ? "All"
                      : "Off";
                refresh((n) => n + 1);
              }}
            >
              <Repeat size={15} />
              {engine.repeat}
            </button>
          </div>
        )}
        <nav className="dock" aria-label="Viewing controls">
          <button
            className={panel === "source" ? "selected" : ""}
            onClick={() => open("source")}
          >
            <Headphones />
            <span>Music source</span>
            <ChevronDown className="chevron" />
          </button>
          <button
            className={
              "automatic-control " +
              (s.automatic ? "enabled " : "") +
              (panel === "mood" ? "selected" : "")
            }
            onClick={() => open("mood")}
          >
            <Sparkles />
            <span>
              Automatic <small>{s.automatic ? "On" : "Off"}</small>
            </span>
            <ChevronDown className="chevron" />
          </button>
          <button
            className={panel === "scene" ? "selected" : ""}
            onClick={() => open("scene")}
          >
            <LayoutGrid />
            <span>Scenes</span>
          </button>
          <button
            className={
              panel === "settings" || panel === "looks" ? "selected" : ""
            }
            onClick={() => open("settings")}
          >
            <Settings2 />
            <span>Customise</span>
          </button>
          <button onClick={() => void fullscreenToggle()}>
            {fullscreen ? <Minimize /> : <Expand />}
            <span>{fullscreen ? "Exit" : "Fullscreen"}</span>
          </button>
          <button
            className="hide-interface-control"
            onClick={() => {
              setTheatre((v) => !v);
              setHidden(false);
            }}
          >
            <Monitor />
            <span>{theatre ? "Show interface" : "Hide interface"}</span>
          </button>
        </nav>
        <footer>
          <span>Ten scenes. Endless ways to feel it.</span>
          <span>
            {offlineReady ? "READY TO GO OFFLINE" : "PERSONAL EDITION"}{" "}
            <span className="footer-dot">·</span> MUSIC WALL
          </span>
        </footer>
      </div>
      {viewing && hidden && (
        <button
          className="reveal-control"
          onClick={reveal}
          aria-label="Show viewing controls"
        >
          <AudioLines size={18} />
          {capturing ? (
            <span>Listening · Show controls</span>
          ) : (
            <span>Show controls</span>
          )}
        </button>
      )}
      {panel && (
        <>
          <div className="panel-scrim" onClick={() => setPanel(null)} />
          <aside
            className="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-title"
          >
            <div className="panel-heading">
              <div>
                <span className="eyebrow">
                  MUSIC WALL / {panel.toUpperCase()}
                </span>
                <h2 id="panel-title">{panelTitles[panel]}</h2>
              </div>
              <IconButton label="Close panel" onClick={() => setPanel(null)}>
                <X size={20} />
              </IconButton>
            </div>
            <div className="panel-content">
              {panel === "source" && (
                <>
                  <p className="intro">
                    Choose what moves your artwork. Your sound stays right here,
                    on your device.
                  </p>
                  <div className="source-options">
                    <button
                      className={
                        "source-option " +
                        (state.kind === "demo" ? "chosen" : "")
                      }
                      onClick={() => engine.demo()}
                    >
                      <Sparkles />
                      <span>
                        <strong>Just exploring</strong>
                        <small>A silent demo. No microphone needed.</small>
                      </span>
                      {state.kind === "demo" && <Check size={17} />}
                    </button>
                    <button
                      className={
                        "source-option " +
                        (state.kind === "mic" ? "chosen" : "")
                      }
                      onClick={() => void engine.capture("mic")}
                    >
                      <Mic />
                      <span>
                        <strong>Listen to the room</strong>
                        <small>Use your microphone. Never played back.</small>
                      </span>
                      {state.kind === "mic" && <Check size={17} />}
                    </button>
                    <button
                      className={
                        "source-option " +
                        (state.kind === "files" ? "chosen" : "")
                      }
                      onClick={() => audioInput.current?.click()}
                    >
                      <Music2 />
                      <span>
                        <strong>Play your music</strong>
                        <small>Open audio files from this device.</small>
                      </span>
                      <Plus size={17} />
                    </button>
                    {typeof navigator.mediaDevices?.getDisplayMedia ===
                      "function" &&
                    !/Android|iPhone|iPad/i.test(navigator.userAgent) ? (
                      <button
                        className={
                          "source-option " +
                          (state.kind === "tab" ? "chosen" : "")
                        }
                        onClick={() => void engine.capture("tab")}
                      >
                        <Monitor />
                        <span>
                          <strong>Another browser tab</strong>
                          <small>Choose a tab and enable Share audio.</small>
                        </span>
                        <ArrowUpRight size={17} />
                      </button>
                    ) : (
                      <div className="unavailable">
                        <Monitor size={18} />
                        <p>
                          Tab audio is available on supported desktop browsers.
                          On your phone, use room sound or local files.
                        </p>
                      </div>
                    )}
                  </div>
                  <div
                    className={
                      "audio-status " +
                      (state.status === "error" ? "error" : "")
                    }
                    role="status"
                  >
                    <div>
                      <span className="status-dot" />
                      {activeMessage}
                    </div>
                    <div className="level-track">
                      <span
                        style={{ width: Math.min(100, level * 180) + "%" }}
                      />
                    </div>
                    {capturing && (
                      <button
                        className="stop-button"
                        onClick={() => engine.stop()}
                      >
                        <Square size={12} />
                        {state.kind === "mic"
                          ? "Stop listening"
                          : "Stop sharing"}
                      </button>
                    )}
                    {state.status === "paused" && (
                      <button onClick={() => void engine.resume()}>
                        Resume audio
                      </button>
                    )}
                  </div>
                  {state.kind === "mic" && (
                    <>
                      <label className="field-label">
                        Microphone
                        <select
                          aria-label="Microphone input"
                          onChange={(e) =>
                            void engine.capture("mic", e.target.value)
                          }
                          defaultValue=""
                        >
                          <option value="">System default</option>
                          {devices.map((d) => (
                            <option value={d.deviceId} key={d.deviceId}>
                              {d.label || "Microphone"}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Slider
                        label="Sensitivity"
                        value={s.sensitivity}
                        min={0.25}
                        max={3}
                        onChange={(n) => patch({ sensitivity: n })}
                      />
                      <button
                        className="wide-button"
                        disabled={calibrating || state.status !== "active"}
                        onClick={async () => {
                          setCalibrating(true);
                          await engine.calibrate();
                          setCalibrating(false);
                          setNotice(
                            engine.state.status === "active"
                              ? "Room noise calibrated"
                              : "Calibration cancelled",
                          );
                        }}
                      >
                        {calibrating
                          ? "Listening to room noise for 3 seconds…"
                          : "Calibrate quiet room"}
                      </button>
                      <p className="hint">
                        Keep the room quiet during calibration. Switching away
                        stops listening; return here to start again.
                      </p>
                    </>
                  )}
                  {engine.queue.length > 0 && (
                    <>
                      <div className="section-heading">
                        <h3>
                          Session queue <span>{engine.queue.length}</span>
                        </h3>
                        <button
                          className="text-button"
                          onClick={() => audioInput.current?.click()}
                        >
                          <Plus size={15} /> Add files
                        </button>
                      </div>
                      <div className="queue">
                        {engine.queue.map((t, i) => (
                          <div
                            className={
                              "queue-item " +
                              (engine.index === i ? "current" : "")
                            }
                            key={t.id}
                          >
                            <button
                              className="queue-name"
                              onClick={() => engine.retry(i)}
                            >
                              <span>{String(i + 1).padStart(2, "0")}</span>
                              <span>
                                {t.name}
                                {t.failed && (
                                  <small>
                                    Unsupported or corrupt · tap to retry
                                  </small>
                                )}
                              </span>
                            </button>
                            <IconButton
                              label={"Move " + t.name + " up"}
                              disabled={i === 0}
                              onClick={() => engine.move(t.id, -1)}
                            >
                              <ArrowUp size={14} />
                            </IconButton>
                            <IconButton
                              label={"Move " + t.name + " down"}
                              disabled={i === engine.queue.length - 1}
                              onClick={() => engine.move(t.id, 1)}
                            >
                              <ArrowDown size={14} />
                            </IconButton>
                            <IconButton
                              label={"Remove " + t.name}
                              onClick={() => engine.remove(t.id)}
                            >
                              <X size={14} />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                      <p className="hint">
                        Files are never uploaded. This queue lasts for this
                        session; choose your files again after reopening.
                      </p>
                    </>
                  )}
                  {state.kind === "files" && (
                    <>
                      <Slider
                        label="Playback volume"
                        value={engine.volume}
                        min={0}
                        max={1}
                        onChange={(n) => engine.setVolume(n)}
                      />
                      <label className="field-label">
                        Repeat
                        <select
                          value={engine.repeat}
                          onChange={(e) => {
                            engine.repeat = e.target.value as
                              "Off" | "One" | "All";
                            refresh((n) => n + 1);
                          }}
                        >
                          <option>Off</option>
                          <option>One</option>
                          <option>All</option>
                        </select>
                      </label>
                    </>
                  )}
                  <div className="privacy-note">
                    <ShieldCheck size={18} />
                    <p>
                      No recording. No uploads. No accounts.
                      <br />
                      Just you and your music.
                    </p>
                  </div>
                </>
              )}
              {panel === "scene" && (
                <>
                  <p className="intro">
                    Ten different worlds. Find somewhere you want to stay.
                  </p>
                  <div className="scene-grid">
                    {scenes.map((item, i) => (
                      <div
                        className={
                          "scene-card " + (s.scene === item.id ? "chosen" : "")
                        }
                        key={item.id}
                      >
                        <button
                          className="scene-select"
                          aria-pressed={s.scene === item.id}
                          onClick={() => choose(item.id)}
                        >
                          {previews[item.id] ? (
                            <img
                              src={previews[item.id]}
                              alt=""
                              width="320"
                              height="180"
                            />
                          ) : (
                            <div className="preview-placeholder" />
                          )}
                          <span>
                            <small>{String(i + 1).padStart(2, "0")}</small>
                            {item.name}
                          </span>
                        </button>
                        <button
                          className="card-heart"
                          aria-label={
                            (s.favourites.includes(item.id)
                              ? "Unfavourite "
                              : "Favourite ") + item.name
                          }
                          onClick={() => toggleFavourite(item.id)}
                        >
                          <Heart
                            size={15}
                            fill={
                              s.favourites.includes(item.id)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                  <h3>Colour story</h3>
                  <div className="palette-list">
                    {scene.palettes.map((p, i) => (
                      <button
                        className={i === s.palette ? "chosen" : ""}
                        aria-pressed={i === s.palette}
                        onClick={() => changePalette(i)}
                        key={p.name}
                      >
                        <span className="swatches">
                          {p.colors.slice(1).map((c) => (
                            <i key={c} style={{ background: c }} />
                          ))}
                        </span>
                        {p.name}
                        {i === s.palette && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                  {s.automatic ? (
                    <div className="tour-note">
                      <label className="field-label">
                        Change scene every
                        <select
                          value={s.interval}
                          onChange={(e) =>
                            patch({ interval: Number(e.target.value) })
                          }
                        >
                          <option value={30}>30 seconds</option>
                          <option value={60}>1 minute</option>
                          <option value={180}>3 minutes</option>
                          <option value={300}>5 minutes</option>
                        </select>
                      </label>
                      <h3>
                        {s.autoCycle
                          ? "Automatic is touring all ten scenes"
                          : "Staying on this scene"}
                      </h3>
                      <p className="hint">
                        Choosing a scene or palette holds it. The music can
                        still shape the effects.
                      </p>
                      <button
                        className="wide-button"
                        onClick={() => patch({ autoCycle: !s.autoCycle })}
                      >
                        {s.autoCycle
                          ? "Stay on this scene"
                          : "Resume automatic tour"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="section-heading">
                        <h3>Let it wander</h3>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={s.rotation}
                            onChange={(e) =>
                              patch({ rotation: e.target.checked })
                            }
                          />
                          <span />
                          <span className="sr-only">Timed scene rotation</span>
                        </label>
                      </div>
                      <p className="hint">
                        Rotate through your favourite scenes, or all ten if none
                        are favourited.
                      </p>
                      <label className="field-label">
                        Change scene every
                        <select
                          value={s.interval}
                          onChange={(e) =>
                            patch({ interval: Number(e.target.value) })
                          }
                        >
                          <option value={30}>30 seconds</option>
                          <option value={60}>1 minute</option>
                          <option value={180}>3 minutes</option>
                          <option value={300}>5 minutes</option>
                        </select>
                      </label>
                      {s.rotation && (
                        <button
                          className="wide-button"
                          onClick={() => patch({ rotation: false })}
                        >
                          Stay on this scene
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
              {panel === "mood" && (
                <>
                  <p className="intro">
                    Let the music lead. Beats add impact; melodies keep things
                    flowing. The atmosphere changes gradually.
                  </p>
                  <label className="setting-row prominent-toggle">
                    <span>
                      <strong>Automatic</strong>
                      <small>Shape the visuals for me</small>
                    </span>
                    <span className="toggle">
                      <input
                        type="checkbox"
                        checked={s.automatic}
                        onChange={(e) => patch({ automatic: e.target.checked })}
                        aria-label="Automatic direction"
                      />
                      <span />
                    </span>
                  </label>
                  <label className="setting-row">
                    <span>Cycle scenes and colours</span>
                    <span className="toggle">
                      <input
                        type="checkbox"
                        checked={s.autoCycle}
                        disabled={!s.automatic}
                        onChange={(e) => patch({ autoCycle: e.target.checked })}
                      />
                      <span />
                    </span>
                  </label>
                  <label className="field-label">
                    Change scene every
                    <select
                      value={s.interval}
                      onChange={(e) =>
                        patch({ interval: Number(e.target.value) })
                      }
                    >
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={180}>3 minutes</option>
                      <option value={300}>5 minutes</option>
                    </select>
                  </label>
                  <p className="hint">
                    All ten scenes, with a new palette on each visit. Changes
                    wait up to two seconds for a beat. The tour timer pauses
                    while music is quiet or a panel is open; the artwork keeps
                    responding.
                  </p>
                  <div className="direction-card">
                    <Sparkles size={22} />
                    <div>
                      <strong>
                        {s.automatic ? atmosphere : "You are in control"}
                      </strong>
                      <p>
                        {s.automatic
                          ? "Your fine-tuning sets the limits. Automatic never increases your particle limit."
                          : "Choose a style and adjust the details in Customise."}
                      </p>
                    </div>
                  </div>
                  <Slider
                    label="Intensity"
                    value={s.intensity}
                    min={0}
                    max={1.5}
                    onChange={(n) => patch({ intensity: n })}
                  />
                  <div className="range-captions">
                    <span>Gentle</span>
                    <span>Balanced</span>
                    <span>Immersive</span>
                  </div>

                  <button
                    className="wide-button"
                    onClick={() => setPanel("settings")}
                  >
                    <Settings2 size={17} /> Customise the details
                  </button>
                  {reduced && (
                    <p className="hint">
                      Reduced motion is on and always takes priority.
                    </p>
                  )}
                  <p className="hint">
                    {state.kind === "demo"
                      ? "You are exploring a silent demo. Choose Music source to start listening or play a file."
                      : "Audio is analysed on this device. No recording, upload or song recognition."}
                  </p>
                </>
              )}
              {panel === "looks" && (
                <>
                  <p className="intro">
                    Save your scene, colours and fine-tuning, including
                    Automatic or manual style. Opening a look holds its scene.
                    Your looks stay on this device until you export them.
                  </p>
                  <form
                    className="save-look"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveLook();
                    }}
                  >
                    <label className="field-label" htmlFor="look-name">
                      {editing ? "Rename look" : "Save this look"}
                    </label>
                    <div>
                      <input
                        id="look-name"
                        placeholder={
                          scene.name +
                          " · " +
                          (s.automatic
                            ? "Automatic"
                            : {
                                Calm: "Relaxed",
                                Flow: "Balanced",
                                Party: "Energetic",
                              }[s.mood])
                        }
                        maxLength={80}
                        value={lookName}
                        onChange={(e) => setLookName(e.target.value)}
                      />
                      <button
                        className="primary-button"
                        disabled={!lookName.trim()}
                        type="submit"
                      >
                        {editing ? "Rename" : "Save"}
                      </button>
                    </div>
                    {editing && (
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          setEditing(null);
                          setLookName("");
                        }}
                      >
                        Cancel rename
                      </button>
                    )}
                  </form>
                  {store.looks.length === 0 ? (
                    <div className="empty-state">
                      <Bookmark size={30} />
                      <h3>A place for your favourites</h3>
                      <p>
                        Find a look you love, give it a name,
                        <br />
                        and come back whenever you like.
                      </p>
                    </div>
                  ) : (
                    <div className="looks-list">
                      {[...store.looks]
                        .sort(
                          (a, b) => Number(b.favourite) - Number(a.favourite),
                        )
                        .map((l) => (
                          <div className="look-card" key={l.id}>
                            <button
                              className="look-main"
                              onClick={() => applyLook(l)}
                            >
                              <span
                                className="look-colour"
                                style={{
                                  background:
                                    "linear-gradient(135deg," +
                                    scenes
                                      .find((x) => x.id === l.scene)!
                                      .palettes[l.palette].colors.slice(1)
                                      .join(",") +
                                    ")",
                                }}
                              />
                              <span>
                                <strong>{l.name}</strong>
                                <small>
                                  {scenes.find((x) => x.id === l.scene)!.name} ·{" "}
                                  {l.automatic
                                    ? "Automatic"
                                    : {
                                        Calm: "Relaxed",
                                        Flow: "Balanced",
                                        Party: "Energetic",
                                      }[l.mood]}
                                </small>
                              </span>
                            </button>
                            <div className="look-actions">
                              <IconButton
                                label={"Favourite look " + l.name}
                                active={l.favourite}
                                onClick={() =>
                                  setStore((old) => ({
                                    ...old,
                                    looks: old.looks.map((x) =>
                                      x.id === l.id
                                        ? { ...x, favourite: !x.favourite }
                                        : x,
                                    ),
                                  }))
                                }
                              >
                                <Heart
                                  size={15}
                                  fill={l.favourite ? "currentColor" : "none"}
                                />
                              </IconButton>
                              <IconButton
                                label={"Rename " + l.name}
                                onClick={() => {
                                  setEditing(l.id);
                                  setLookName(l.name);
                                  document.getElementById("look-name")?.focus();
                                }}
                              >
                                <Pencil size={15} />
                              </IconButton>
                              <IconButton
                                label={"Delete " + l.name}
                                onClick={() => setDeleteId(l.id)}
                              >
                                <Trash2 size={15} />
                              </IconButton>
                            </div>
                            {deleteId === l.id && (
                              <div className="delete-confirm">
                                <span>Delete this look?</span>
                                <button
                                  onClick={() => {
                                    setStore((old) => ({
                                      ...old,
                                      looks: old.looks.filter(
                                        (x) => x.id !== l.id,
                                      ),
                                    }));
                                    setDeleteId(null);
                                  }}
                                >
                                  Delete
                                </button>
                                <button onClick={() => setDeleteId(null)}>
                                  Keep
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                  <button className="wide-button" onClick={download}>
                    <Download size={16} /> Export looks and settings
                  </button>
                </>
              )}
              {panel === "settings" && (
                <>
                  <p className="intro">
                    Make the music feel right. Start with intensity, then
                    explore the details if you want to.
                  </p>
                  <Slider
                    label="Intensity"
                    value={s.intensity}
                    min={0}
                    max={1.5}
                    onChange={(n) => patch({ intensity: n })}
                  />
                  <div className="range-captions">
                    <span>Gentle</span>
                    <span>Balanced</span>
                    <span>Immersive</span>
                  </div>
                  <button
                    className="wide-button mode-link"
                    onClick={() => setPanel("mood")}
                  >
                    <Sparkles size={16} />{" "}
                    {s.automatic
                      ? "Automatic is on · " + atmosphere
                      : "Automatic is off · Change mode"}
                  </button>
                  <h3>Manual style</h3>
                  <div className="style-options">
                    {(
                      [
                        ["Calm", "Relaxed", "Slow & spacious"],
                        ["Flow", "Balanced", "Smooth & rhythmic"],
                        ["Party", "Energetic", "Bold & lively"],
                      ] as const
                    ).map(([mood, title, detail]) => (
                      <button
                        key={mood}
                        aria-pressed={!s.automatic && s.mood === mood}
                        className={
                          !s.automatic && s.mood === mood ? "chosen" : ""
                        }
                        onClick={() => patch({ mood, automatic: false })}
                      >
                        <strong>{title}</strong>
                        <small>{detail}</small>
                      </button>
                    ))}
                  </div>
                  <p className="hint">
                    Choosing a style turns Automatic off. Your intensity and
                    fine-tuning still apply.
                  </p>
                  <button
                    className="wide-button"
                    onClick={() => setPanel("looks")}
                  >
                    <Bookmark size={16} /> Save or open a look
                  </button>
                  <details className="fine-tune">
                    <summary>Fine-tune the effects</summary>
                    <Slider
                      label="Audio sensitivity"
                      value={s.sensitivity}
                      min={0.25}
                      max={3}
                      onChange={(n) => patch({ sensitivity: n })}
                    />
                    <Slider
                      label="Artwork brightness"
                      value={s.brightness}
                      min={0.2}
                      max={1.5}
                      onChange={(n) => patch({ brightness: n })}
                    />
                    <Slider
                      label="Motion amount"
                      value={s.motion}
                      min={0}
                      max={2}
                      onChange={(n) => patch({ motion: n })}
                    />
                    <p className="hint">
                      These are your preferences, not moving readouts. Automatic
                      works within them. Saved looks remember your choices.
                    </p>
                    {(
                      [
                        [
                          "beatImpact",
                          "Beat impact",
                          "How strongly kicks and bass push the shapes.",
                        ],
                        [
                          "melodyDetail",
                          "Melody detail",
                          "How much melodies and high notes bend and shimmer.",
                        ],
                        [
                          "flowSpeed",
                          "Flow speed",
                          "How quickly waves, currents and shapes travel.",
                        ],
                        [
                          "particles",
                          "Particle amount",
                          "A limit on stars, grains and droplets. 45% is a light dusting; 0% hides them.",
                        ],
                        [
                          "colourIntensity",
                          "Colour intensity",
                          "From monochrome at 0% to vivid, saturated colour.",
                        ],
                      ] as const
                    ).map(([key, label, hint]) => (
                      <div key={key}>
                        <Slider
                          label={label}
                          value={s[key]}
                          min={0}
                          max={2}
                          onChange={(n) => patch({ [key]: n })}
                        />
                        <p className="hint">{hint}</p>
                      </div>
                    ))}
                    <button
                      className="wide-button"
                      onClick={() =>
                        patch({
                          beatImpact: 1,
                          melodyDetail: 1,
                          flowSpeed: 1,
                          particles: 0.45,
                          colourIntensity: 1,
                        })
                      }
                    >
                      Reset effect balance
                    </button>
                    <p className="hint">
                      Reduced motion still limits movement. Pause visuals
                      freezes everything.
                    </p>
                  </details>
                  <details className="fine-tune">
                    <summary>Device & accessibility</summary>
                    <label className="field-label">
                      Performance quality
                      <select
                        value={s.quality}
                        onChange={(e) =>
                          patch({
                            quality: e.target.value as Settings["quality"],
                          })
                        }
                      >
                        {["Auto", "High", "Balanced", "Low power"].map((q) => (
                          <option key={q}>{q}</option>
                        ))}
                      </select>
                    </label>
                    <p className="hint">
                      Auto adapts to your device. Low power uses a gentler 30
                      fps target.
                    </p>
                    <label className="field-label">
                      Reduced motion
                      <select
                        value={s.reduced}
                        onChange={(e) =>
                          patch({
                            reduced: e.target.value as Settings["reduced"],
                          })
                        }
                      >
                        <option value="system">Follow device preference</option>
                        <option value="on">Always on</option>
                        <option value="off">Off</option>
                      </select>
                    </label>
                    {[
                      { label: "Larger controls for TV viewing", key: "large" },
                      { label: "Keep screen awake", key: "awake" },
                    ].map(({ label, key }) => (
                      <label className="setting-row" key={key}>
                        <span>{label}</span>
                        <span className="toggle">
                          <input
                            type="checkbox"
                            checked={s[key as "large" | "awake"]}
                            onChange={(e) => patch({ [key]: e.target.checked })}
                          />
                          <span />
                        </span>
                      </label>
                    ))}
                    {wakeStatus && <p className="hint">{wakeStatus}</p>}
                  </details>
                  <div className="settings-actions">
                    <button
                      className="wide-button"
                      onClick={() => {
                        setTheatre((v) => !v);
                        setPanel(null);
                      }}
                    >
                      <Monitor size={16} />
                      {theatre ? "Show interface" : "Hide interface"}
                    </button>
                    <button
                      className="wide-button"
                      onClick={() => {
                        setPaused((v) => !v);
                        setPanel(null);
                      }}
                    >
                      {paused ? <Play size={16} /> : <Pause size={16} />}{" "}
                      {paused ? "Resume visuals" : "Pause visuals"}
                    </button>
                  </div>
                  <h3>Take your looks with you</h3>
                  <div className="two-buttons">
                    <button onClick={download}>
                      <Download size={16} /> Export
                    </button>
                    <button onClick={() => importInput.current?.click()}>
                      <Upload size={16} /> Import
                    </button>
                  </div>
                  {imported && (
                    <div className="import-preview">
                      <h3>Ready to import</h3>
                      <p>
                        {imported.looks.length} saved looks ·{" "}
                        {imported.settings.favourites.length} favourite scenes
                      </p>
                      <p className="hint">
                        Merge keeps device settings and adds looks. Replace uses
                        the imported settings and collection. Audio capture
                        never starts from an import.
                      </p>
                      <div className="two-buttons">
                        <button onClick={() => commitImport(true)}>
                          Merge looks
                        </button>
                        <button onClick={() => commitImport(false)}>
                          Replace all
                        </button>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setImported(null)}
                      >
                        Cancel import
                      </button>
                    </div>
                  )}
                  <div className="offline-card">
                    <ShieldCheck size={20} />
                    <div>
                      <strong>
                        {offlineReady
                          ? "Ready for offline use"
                          : "Offline preparation"}
                      </strong>
                      <p>
                        {offlineReady
                          ? "All ten scenes are saved on this device. Local files and demo work without a connection."
                          : "Open the installed or production app online once to cache all ten scenes. Browser data must remain available."}
                      </p>
                    </div>
                  </div>
                  {needRefresh && (
                    <button
                      className="wide-button"
                      onClick={() => {
                        engine.stop();
                        void updateServiceWorker(true);
                      }}
                    >
                      Update available · stop audio and reload
                    </button>
                  )}
                  <p className="hint">
                    To install: use Install above, or your browser’s “Install
                    app” / “Add to Home screen” menu. On TV, connect your
                    computer and use fullscreen. Your phone is a separate
                    visualiser, not a remote.
                  </p>
                  <p className="shortcut-help">
                    F — fullscreen · V — pause visuals · S — stop listening
                  </p>
                </>
              )}
            </div>
          </aside>
        </>
      )}
      <input
        ref={audioInput}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose local audio files"
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
        multiple
        onChange={(e) => {
          receiveFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <input
        ref={importInput}
        className="sr-only"
        tabIndex={-1}
        aria-label="Import Music Wall settings"
        type="file"
        accept=".json,application/json"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importFile(f);
          e.target.value = "";
        }}
      />
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="Dismiss message" onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {storageWarning && (
        <div className="storage-warning" role="alert">
          <p>{storageWarning}</p>
          <button onClick={download}>Export session</button>
          {blocked && (
            <button
              onClick={() => {
                setBlocked(false);
                setStorageWarning("");
              }}
            >
              Use new settings
            </button>
          )}
        </div>
      )}
    </div>
  );
}
