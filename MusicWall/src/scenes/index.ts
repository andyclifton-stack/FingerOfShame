import type { SceneDefinition, Palette } from "../types";
import velvet from "./velvet";
import liquid from "./liquid";
import tunnel from "./tunnel";
import disco from "./disco";
import paper from "./paper";
import orbit from "./orbit";
import prism from "./prism";
import night from "./night";
import spectrum from "./spectrum";
import waveform from "./waveform";
const p = (
  name: string,
  bg: string,
  a: string,
  b: string,
  c: string,
): Palette => ({ name, colors: [bg, a, b, c] });
export const scenes: SceneDefinition[] = [
  {
    id: "velvet",
    name: "Velvet Ribbon",
    tag: "SOFT / SCULPTURAL",
    description: "Soft folds. Deep colour. Let the sound unravel.",
    fragment: velvet,
    palettes: [
      p("Garnet & Rose", "#100a12", "#d91c70", "#ff84ba", "#ffe2b3"),
      p("Midnight & Gold", "#070d18", "#285bd7", "#efb733", "#fff2ad"),
      p("Peacock", "#061115", "#00c6bb", "#8548f3", "#c6fff0"),
    ],
  },
  {
    id: "liquid",
    name: "Liquid Light",
    tag: "FLUID / LUMINOUS",
    description: "Colour pools and drifts, finding its own rhythm.",
    fragment: liquid,
    palettes: [
      p("Lagoon", "#071418", "#009bbb", "#24ffd0", "#d8fff1"),
      p("Molten Amber", "#1a0c08", "#f04c16", "#ffc52c", "#fff0a6"),
      p("Violet Haze", "#0e0a20", "#7931ea", "#f33cae", "#ffe2ff"),
    ],
  },
  {
    id: "tunnel",
    name: "Afterglow Tunnel",
    tag: "DEEP / HYPNOTIC",
    description: "A slow journey through the spaces between beats.",
    fragment: tunnel,
    palettes: [
      p("Sunset Drive", "#110b1c", "#ff3878", "#753dff", "#ffdfa5"),
      p("Arctic Neon", "#050f1d", "#00c8ed", "#5662ff", "#d0ffff"),
      p("Plum & Copper", "#170c16", "#af257f", "#ff9343", "#ffeab6"),
    ],
  },
  {
    id: "disco",
    name: "Disco Mosaic",
    tag: "PLAYFUL / RHYTHMIC",
    description: "Little moments of colour. One big dance floor.",
    fragment: disco,
    palettes: [
      p("Studio 54", "#120f17", "#f52d99", "#ffa922", "#fff09c"),
      p("Candy Glass", "#110e21", "#5c50f5", "#fc58c4", "#83ffe1"),
      p("Electric Citrus", "#0e1510", "#b3f51b", "#00bba5", "#fff465"),
    ],
  },
  {
    id: "paper",
    name: "Paper Waves",
    tag: "TACTILE / LAYERED",
    description: "Layers of quiet colour, gently lifted by your music.",
    fragment: paper,
    palettes: [
      p("Terracotta", "#221512", "#d85439", "#ffb259", "#ffe9b7"),
      p("Coastal Paper", "#101d23", "#008fa8", "#55edc9", "#fff0c0"),
      p("Lavender Dusk", "#171526", "#714bd4", "#f194c0", "#ffe0dc"),
    ],
  },
  {
    id: "orbit",
    name: "Orbit Garden",
    tag: "SPACIOUS / ORGANIC",
    description: "A little universe, growing around your sound.",
    fragment: orbit,
    palettes: [
      p("Botanical", "#081713", "#00b77d", "#c5da41", "#fff3b1"),
      p("Moon Garden", "#0e1223", "#6471ec", "#bd85ff", "#d9f7ff"),
      p("Apricot Sky", "#1d131b", "#ff8c4c", "#d552b0", "#ffe5a3"),
    ],
  },
  {
    id: "prism",
    name: "Prism Bloom",
    tag: "FACETED / RADIANT",
    description: "A thousand little angles. A bloom of sound.",
    fragment: prism,
    palettes: [
      p("Opal", "#10121e", "#51c5ee", "#ed67ba", "#d7ffe5"),
      p("Solar Prism", "#1a1009", "#ffc127", "#fa4b64", "#fff3ac"),
      p("Amethyst", "#100b20", "#8e44ee", "#f278d5", "#ffe3fa"),
    ],
  },
  {
    id: "night",
    name: "Night Current",
    tag: "QUIET / ELECTRIC",
    description: "Follow the current. Leave the rest behind.",
    fragment: night,
    palettes: [
      p("Deep Ocean", "#040c17", "#007bbc", "#20ddeb", "#c0ffff"),
      p("Aurora", "#060f13", "#35eb98", "#9952f2", "#dcffd4"),
      p("Ember Night", "#120b0a", "#e95827", "#ffb33e", "#ffe4a7"),
    ],
  },
  {
    id: "spectrum",
    name: "Spectrum Hall",
    tag: "GLASS / FREQUENCY",
    description: "Thirty-two glass towers, each following its own frequency.",
    fragment: spectrum,
    palettes: [
      p("Neon Glass", "#060c18", "#13c8f6", "#df47ec", "#e2ffff"),
      p("Gold Record", "#160d08", "#ff7e28", "#ffd75c", "#fff6cd"),
      p("Emerald City", "#041510", "#21e8ac", "#78a5ff", "#e3fff1"),
    ],
  },
  {
    id: "waveform",
    name: "Live Wire",
    tag: "PURE / ELECTRIC",
    description: "Your actual sound, drawn as a luminous living trace.",
    fragment: waveform,
    palettes: [
      p("Mint Signal", "#061310", "#47ffc0", "#25b8ef", "#e7fff5"),
      p("Rose Voltage", "#140818", "#ff5a9e", "#9361ff", "#fff0fa"),
      p("Blue Horizon", "#060d1e", "#319fff", "#6affeb", "#edfaff"),
    ],
  },
];
