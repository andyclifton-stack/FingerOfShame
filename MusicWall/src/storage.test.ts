import { describe, it, expect } from "vitest";
import { defaults, parseStore, mergeStores } from "./storage";
import type { Store } from "./types";
const sample = (): Store => ({
  version: 1,
  settings: { ...defaults, favourites: ["velvet"], palettes: { velvet: 2 } },
  looks: [
    {
      scene: "velvet",
      palette: 2,
      mood: "Flow",
      sensitivity: 1,
      brightness: 0.8,
      motion: 0.5,
      beatImpact: 1,
      melodyDetail: 1,
      flowSpeed: 1,
      particles: 1,
      colourIntensity: 1,
      intensity: 1,
      id: "look-1",
      name: "Evening",
      favourite: true,
      automatic: false,
    },
  ],
});
describe("settings transfer", () => {
  it.each(["spectrum", "waveform"] as const)(
    "round-trips %s looks, palettes, favourites and tour timing",
    (scene) => {
      const store = sample();
      store.settings = {
        ...store.settings,
        scene,
        palette: 2,
        interval: 30,
        favourites: [scene],
        palettes: { [scene]: 2 },
      };
      store.looks[0] = {
        ...store.looks[0],
        scene,
        palette: 2,
        automatic: true,
      };
      expect(parseStore(JSON.stringify(store))).toEqual(store);
    },
  );
  it("restores Version 1 settings and looks with neutral effect defaults", () => {
    const old = JSON.parse(JSON.stringify(sample()));
    for (const key of [
      "beatImpact",
      "melodyDetail",
      "flowSpeed",
      "particles",
      "colourIntensity",
    ]) {
      delete old.settings[key];
      delete old.looks[0][key];
    }
    const expected = sample();
    expected.settings.particles = 1; // Legacy settings keep the old particle balance.
    expect(parseStore(JSON.stringify(old))).toEqual(expected);
  });
  it("migrates older exports without losing a reduced particle preference", () => {
    const old = JSON.parse(JSON.stringify(sample()));
    old.settings.particles = 0.59;
    delete old.settings.automatic;
    delete old.settings.autoCycle;
    delete old.settings.intensity;
    delete old.looks[0].intensity;
    delete old.looks[0].automatic;
    const actual = parseStore(JSON.stringify(old));
    expect(actual.settings).toMatchObject({
      automatic: true,
      autoCycle: true,
      intensity: 1,
      particles: 0.59,
    });
    expect(actual.looks[0].intensity).toBe(1);
    expect(actual.looks[0].automatic).toBe(false);
  });
  it("round trips independently customised effects including off and maximum", () => {
    const s = sample();
    Object.assign(s.settings, {
      beatImpact: 2,
      melodyDetail: 0.6,
      flowSpeed: 0.2,
      particles: 0,
      colourIntensity: 1.7,
    });
    Object.assign(s.looks[0], {
      beatImpact: 0,
      melodyDetail: 2,
      flowSpeed: 1.6,
      particles: 0.7,
      colourIntensity: 0,
      automatic: true,
    });
    expect(parseStore(JSON.stringify(s))).toEqual(s);
  });
  it("round trips settings and named looks exactly", () => {
    const s = sample();
    expect(parseStore(JSON.stringify(s))).toEqual(s);
  });
  it.each([2, null, "1"])("rejects unsupported version %s", (v) => {
    expect(() =>
      parseStore(JSON.stringify({ ...sample(), version: v })),
    ).toThrow();
  });
  it.each([
    { scene: "unknown" },
    { palette: 3 },
    { motion: -1 },
    { automatic: "yes" },
    { autoCycle: null },
    { intensity: 2 },
    { beatImpact: 3 },
    { melodyDetail: -1 },
    { flowSpeed: "fast" },
    { particles: null },
    { colourIntensity: 5 },
    { sensitivity: 100 },
    { brightness: 0 },
    { quality: "ultra" },
    { reduced: true },
    { interval: 0 },
    { palettes: { velvet: 7 } },
    { favourites: ["bad"] },
  ])("rejects invalid settings %j", (change) => {
    expect(() =>
      parseStore(
        JSON.stringify({ ...sample(), settings: { ...defaults, ...change } }),
      ),
    ).toThrow();
  });
  it("rejects duplicate ids and empty names", () => {
    const s = sample();
    s.looks.push({ ...s.looks[0] });
    expect(() => parseStore(JSON.stringify(s))).toThrow();
    s.looks = [{ ...s.looks[0], name: " " }];
    expect(() => parseStore(JSON.stringify(s))).toThrow();
  });
  it("merge keeps device preferences and deduplicates exact looks", () => {
    const current = sample(),
      incoming = sample();
    incoming.settings.quality = "Low power";
    incoming.settings.favourites = ["night"];
    const merged = mergeStores(current, incoming);
    expect(merged.settings.quality).toBe("Auto");
    expect(merged.settings.favourites).toEqual(["velvet", "night"]);
    expect(merged.looks).toHaveLength(1);
  });
  it("preserves conflicting looks under a new identifier", () => {
    const current = sample(),
      incoming = sample();
    incoming.looks[0].mood = "Party";
    const merged = mergeStores(current, incoming);
    expect(merged.looks).toHaveLength(2);
    expect(merged.looks[1].id).not.toBe("look-1");
    expect(current.looks).toHaveLength(1);
  });
  it("strips unexpected fields including attempted capture preferences", () => {
    const s = sample();
    const parsed = parseStore(
      JSON.stringify({
        ...s,
        recordAudio: true,
        settings: { ...s.settings, microphone: "start" },
      }),
    );
    expect(parsed).not.toHaveProperty("recordAudio");
    expect(parsed.settings).not.toHaveProperty("microphone");
  });
});
