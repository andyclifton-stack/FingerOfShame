import type {
  Settings,
  Store,
  VisualSettings,
  SavedLook,
  SceneId,
} from "./types";
export const sceneIds: SceneId[] = [
  "velvet",
  "liquid",
  "tunnel",
  "disco",
  "paper",
  "orbit",
  "prism",
  "night",
  "spectrum",
  "waveform",
];
export const defaults: Settings = {
  scene: "velvet",
  palette: 0,
  mood: "Flow",
  sensitivity: 1,
  brightness: 1,
  motion: 1,
  beatImpact: 1,
  melodyDetail: 1,
  flowSpeed: 1,
  particles: 0.45,
  colourIntensity: 1,
  intensity: 1,
  automatic: true,
  autoCycle: true,
  quality: "Auto",
  reduced: "system",
  large: false,
  awake: false,
  rotation: false,
  interval: 180,
  favourites: [],
  palettes: {},
};
const key = "music-wall.v1";
const record = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);
const range = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
export function visualValid(v: unknown): v is VisualSettings {
  return (
    record(v) &&
    sceneIds.includes(v.scene as SceneId) &&
    Number.isInteger(v.palette) &&
    range(v.palette, 0, 2) &&
    ["Calm", "Flow", "Party"].includes(v.mood as string) &&
    range(v.sensitivity, 0.25, 3) &&
    range(v.brightness, 0.2, 1.5) &&
    range(v.motion, 0, 2) &&
    (v.intensity === undefined || range(v.intensity, 0, 1.5)) &&
    [
      "beatImpact",
      "melodyDetail",
      "flowSpeed",
      "particles",
      "colourIntensity",
    ].every((k) => v[k] === undefined || range(v[k], 0, 2))
  );
}
export function parseStore(text: string): Store {
  if (text.length > 1000000)
    throw new Error("This settings file is too large.");
  const v: unknown = JSON.parse(text);
  if (!record(v) || v.version !== 1)
    throw new Error("This is not a supported Music Wall settings file.");
  const s = v.settings;
  if (
    !visualValid(s) ||
    !record(s) ||
    (s.automatic !== undefined && typeof s.automatic !== "boolean") ||
    (s.autoCycle !== undefined && typeof s.autoCycle !== "boolean") ||
    !["Auto", "High", "Balanced", "Low power"].includes(s.quality as string) ||
    !["system", "on", "off"].includes(s.reduced as string) ||
    !["large", "awake", "rotation"].every((k) => typeof s[k] === "boolean") ||
    ![30, 60, 180, 300].includes(s.interval as number) ||
    !Array.isArray(s.favourites) ||
    !s.favourites.every((id) => sceneIds.includes(id)) ||
    !record(s.palettes) ||
    !Object.entries(s.palettes).every(
      ([id, n]) =>
        sceneIds.includes(id as SceneId) &&
        Number.isInteger(n) &&
        range(n, 0, 2),
    )
  )
    throw new Error("Some settings are invalid. Nothing has been changed.");
  if (
    !Array.isArray(v.looks) ||
    v.looks.length > 500 ||
    !v.looks.every(
      (l) =>
        visualValid(l) &&
        record(l) &&
        (l.automatic === undefined || typeof l.automatic === "boolean") &&
        typeof l.id === "string" &&
        l.id.length > 0 &&
        l.id.length < 100 &&
        typeof l.name === "string" &&
        l.name.trim().length > 0 &&
        l.name.length <= 80 &&
        typeof l.favourite === "boolean",
    )
  )
    throw new Error("The saved looks are invalid. Nothing has been changed.");
  if (new Set(v.looks.map((l) => l.id)).size !== v.looks.length)
    throw new Error("This file contains duplicate look identifiers.");
  // Copy only recognised fields. Never persist arbitrary imported object properties.
  return {
    version: 1,
    settings: {
      ...pickVisual(s),
      automatic: s.automatic ?? true,
      autoCycle: s.autoCycle ?? true,
      quality: s.quality as Settings["quality"],
      reduced: s.reduced as Settings["reduced"],
      large: s.large as boolean,
      awake: s.awake as boolean,
      rotation: s.rotation as boolean,
      interval: s.interval as number,
      favourites: [...new Set(s.favourites)] as SceneId[],
      palettes: { ...s.palettes },
    },
    looks: v.looks.map((l) => ({
      ...pickVisual(l),
      id: l.id,
      name: l.name.trim(),
      favourite: l.favourite,
      automatic: l.automatic ?? false,
    })),
  };
}
export function pickVisual(s: VisualSettings): VisualSettings {
  return {
    scene: s.scene,
    palette: s.palette,
    mood: s.mood,
    sensitivity: s.sensitivity,
    brightness: s.brightness,
    motion: s.motion,
    beatImpact: s.beatImpact ?? 1,
    melodyDetail: s.melodyDetail ?? 1,
    flowSpeed: s.flowSpeed ?? 1,
    particles: s.particles ?? 1,
    colourIntensity: s.colourIntensity ?? 1,
    intensity: s.intensity ?? 1,
  };
}
export function loadStore(): { store: Store; warning: string } {
  try {
    const raw = localStorage.getItem(key);
    return {
      store: raw
        ? parseStore(raw)
        : { version: 1, settings: { ...defaults }, looks: [] },
      warning: "",
    };
  } catch {
    return {
      store: { version: 1, settings: { ...defaults }, looks: [] },
      warning:
        "Saved settings could not be read. Your original data has been left untouched; export your current session before closing.",
    };
  }
}
export function saveStore(store: Store) {
  localStorage.setItem(key, JSON.stringify(store));
}
export function mergeStores(current: Store, incoming: Store): Store {
  const looks: SavedLook[] = [...current.looks];
  incoming.looks.forEach((l) => {
    const same = looks.find((x) => x.id === l.id);
    if (!same) looks.push(l);
    else if (JSON.stringify(same) !== JSON.stringify(l))
      looks.push({
        ...l,
        id: crypto.randomUUID(),
        name: l.name.slice(0, 69) + " (imported)",
      });
  });
  if (looks.length > 500)
    throw new Error(
      "The combined collection exceeds 500 looks. Export a backup and remove some looks first.",
    );
  return {
    ...current,
    looks,
    settings: {
      ...current.settings,
      favourites: [
        ...new Set([
          ...current.settings.favourites,
          ...incoming.settings.favourites,
        ]),
      ],
    },
  };
}
