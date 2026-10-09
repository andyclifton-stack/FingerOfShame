export type SceneId =
  | "velvet"
  | "liquid"
  | "tunnel"
  | "disco"
  | "paper"
  | "orbit"
  | "prism"
  | "night"
  | "spectrum"
  | "waveform";
export type Mood = "Calm" | "Flow" | "Party";
export type Quality = "Auto" | "High" | "Balanced" | "Low power";
export interface AudioFeatures {
  bass: number;
  mids: number;
  treble: number;
  energy: number;
  transient: number;
  silent: boolean;
  spectrum?: Float32Array;
  waveform?: Float32Array;
}
export type SourceKind = "demo" | "mic" | "files" | "tab";
export interface SourceState {
  kind: SourceKind;
  status: "idle" | "starting" | "active" | "paused" | "error";
  message: string;
}
export interface VisualSettings {
  scene: SceneId;
  palette: number;
  mood: Mood;
  sensitivity: number;
  brightness: number;
  motion: number;
  beatImpact: number;
  melodyDetail: number;
  flowSpeed: number;
  particles: number;
  colourIntensity: number;
  intensity: number;
}
export interface SavedLook extends VisualSettings {
  id: string;
  name: string;
  favourite: boolean;
  automatic: boolean;
}
export interface Settings extends VisualSettings {
  automatic: boolean;
  autoCycle: boolean;
  quality: Quality;
  reduced: "system" | "on" | "off";
  large: boolean;
  awake: boolean;
  rotation: boolean;
  interval: number;
  favourites: SceneId[];
  palettes: Partial<Record<SceneId, number>>;
}
export interface Store {
  version: 1;
  settings: Settings;
  looks: SavedLook[];
}
export interface Palette {
  name: string;
  colors: [string, string, string, string];
}
export interface SceneDefinition {
  id: SceneId;
  name: string;
  tag: string;
  description: string;
  palettes: Palette[];
  fragment: string;
}
export const emptyFeatures: AudioFeatures = {
  bass: 0,
  mids: 0,
  treble: 0,
  energy: 0,
  transient: 0,
  silent: true,
};
