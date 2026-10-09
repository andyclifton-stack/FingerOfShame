import { describe, it, expect } from "vitest";
import { AutomaticDirector } from "./AutomaticDirector";
import { defaults, sceneIds } from "../storage";
import { emptyFeatures, type AudioFeatures } from "../types";
const music = (t: number): AudioFeatures => ({
  bass: 0.7,
  mids: 0.5,
  treble: 0.3,
  energy: 0.6,
  transient: Math.exp(-(t % 0.5) * 20),
  silent: false,
});
describe("automatic direction", () => {
  it("keeps tour duration in real seconds when rendering is slow", () => {
    const d = new AutomaticDirector(),
      s = { ...defaults, interval: 30 };
    for (let second = 1; second < 32; second++)
      expect(
        d.update(1, { ...music(0), transient: 0 }, s).next,
      ).toBeUndefined();
    expect(d.update(1, { ...music(0), transient: 0 }, s).next).toBeDefined();
  });
  it("is off for manual styles and never changes the stored preferences", () => {
    const s = { ...defaults, automatic: false };
    const original = JSON.stringify(s);
    const d = new AutomaticDirector();
    for (let i = 0; i < 2000; i++)
      expect(d.update(0.1, music(i / 10), s).settings).toBe(s);
    expect(JSON.stringify(s)).toBe(original);
  });
  it("distinguishes sustained melodic sound from steady beats", () => {
    const a = new AutomaticDirector(),
      b = new AutomaticDirector();
    let beat, melodic;
    for (let i = 0; i < 3000; i++) {
      beat = a.update(0.02, music(i * 0.02), defaults);
      melodic = b.update(
        0.02,
        { ...music(0), transient: 0, energy: 0.3, mids: 0.8 },
        defaults,
      );
    }
    expect(beat!.atmosphere).toBe("Beat driven");
    expect(melodic!.atmosphere).toBe("Melodic flow");
    expect(beat!.settings.beatImpact).toBeGreaterThan(
      melodic!.settings.beatImpact,
    );
  });
  it("changes atmosphere smoothly rather than jumping at a loud sample", () => {
    const d = new AutomaticDirector();
    const before = d.update(0.02, { ...music(0), energy: 0.2 }, defaults);
    const after = d.update(0.02, { ...music(0), energy: 1 }, defaults);
    expect(
      Math.abs(before.settings.motion - after.settings.motion),
    ).toBeLessThan(0.02);
  });
  it("uses particle preference as a ceiling and keeps zero off", () => {
    for (const particles of [0, 0.1, 0.59, 2]) {
      const d = new AutomaticDirector();
      for (let i = 0; i < 1000; i++) {
        const r = d.update(0.1, music(i / 10), { ...defaults, particles });
        expect(r.settings.particles).toBeLessThanOrEqual(particles);
      }
    }
  });
  it("silence neither tours scenes nor manufactures energy", () => {
    const d = new AutomaticDirector();
    let r;
    for (let i = 0; i < 4000; i++) {
      r = d.update(0.1, emptyFeatures, defaults);
      expect(r.next).toBeUndefined();
    }
    expect(r!.atmosphere).toBe("Waiting for music");
    expect(r!.settings.particles).toBe(0);
  });
  it("honours the selected interval and tours all scenes with changing palettes", () => {
    const d = new AutomaticDirector();
    let s = { ...defaults, interval: 60 },
      last = 0;
    const visited = new Set([s.scene]);
    const palettes = new Set([s.palette]);
    for (let i = 0; i < 26000; i++) {
      const t = i * 0.1,
        r = d.update(0.1, music(t), s);
      if (r.next) {
        expect(t - last).toBeGreaterThanOrEqual(59.9);
        expect(t - last).toBeLessThanOrEqual(62.2);
        last = t;
        s = {
          ...s,
          ...r.next,
          palettes: { ...s.palettes, [r.next.scene]: r.next.palette },
        };
        visited.add(s.scene);
        palettes.add(s.palette);
      }
    }
    expect([...visited]).toEqual(sceneIds);
    expect(palettes.size).toBe(3);
  });
  it.each([30, 60, 180, 300])(
    "changes within two seconds of %s seconds, even without a regular beat",
    (interval) => {
      const director = new AutomaticDirector();
      let changedAt = 0;
      for (let i = 0; i <= (interval + 3) * 10; i++) {
        if (
          director.update(
            0.1,
            { ...music(0), transient: 0 },
            { ...defaults, interval },
          ).next
        ) {
          changedAt = (i + 1) / 10;
          break;
        }
      }
      expect(changedAt).toBeGreaterThanOrEqual(interval);
      expect(changedAt).toBeLessThanOrEqual(interval + 2.2);
    },
  );
  it("continues adapting while the scene is held, but never changes it", () => {
    const d = new AutomaticDirector();
    for (let i = 0; i < 3000; i++)
      expect(
        d.update(0.1, music(i / 10), { ...defaults, autoCycle: false }).next,
      ).toBeUndefined();
  });
  it("visual pause freezes the director and the tour clock", () => {
    const d = new AutomaticDirector();
    const first = d.update(0.1, music(0), defaults);
    for (let i = 0; i < 3000; i++) {
      const paused = d.update(0.1, music(i / 10), defaults, true);
      expect(paused.next).toBeUndefined();
      expect(paused.atmosphere).toBe(first.atmosphere);
    }
    expect(d.update(0.1, music(0), defaults).next).toBeUndefined();
  });
  it("editing pauses only the tour clock, while live adaptation continues", () => {
    const d = new AutomaticDirector(),
      s = { ...defaults, interval: 30 };
    for (let i = 0; i < 200; i++) d.update(0.1, music(i / 10), s);
    let response;
    for (let i = 0; i < 1000; i++) {
      response = d.update(
        0.1,
        { ...music(0), mids: 0.9, energy: 0.8 },
        s,
        false,
        true,
      );
      expect(response.next).toBeUndefined();
    }
    expect(response!.settings.motion).toBeGreaterThan(0.9);
    let changed = 0;
    for (let i = 0; i < 130; i++)
      if (d.update(0.1, music(i / 10), s).next) {
        changed = (i + 1) / 10;
        break;
      }
    expect(changed).toBeGreaterThanOrEqual(9.9);
    expect(changed).toBeLessThanOrEqual(12.2);
  });
  it("resuming a held tour gives the current scene a fresh minimum dwell", () => {
    const d = new AutomaticDirector();
    for (let i = 0; i < 1500; i++)
      d.update(0.1, music(i / 10), { ...defaults, autoCycle: false });
    for (let i = 0; i < 599; i++)
      expect(d.update(0.1, music(i / 10), defaults).next).toBeUndefined();
  });
});
