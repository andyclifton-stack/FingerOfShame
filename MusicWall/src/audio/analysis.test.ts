import { describe, it, expect } from "vitest";
import { bandEnergy, FeatureAnalyser, demoFeatures } from "./analysis";
const wave = () =>
  Uint8Array.from(
    { length: 2048 },
    (_, i) => 128 + Math.round(45 * Math.sin(i * 0.2)),
  );
describe("musical analysis", () => {
  it.each([100, 1000, 6000])(
    "places %s Hz in its own spectrum region",
    (hz) => {
      const analyser = new FeatureAnalyser(),
        freq = new Uint8Array(1024);
      freq[Math.round((hz * 2048) / 48000)] = 255;
      const f = analyser.process(freq, wave(), 48000, 2048, 1, 0.1);
      const values = Array.from(f.spectrum!);
      const peak = values.indexOf(Math.max(...values));
      const frequency = 30 * (16000 / 30) ** ((peak + 0.5) / 32);
      expect(Math.abs(Math.log(frequency / hz))).toBeLessThan(0.22);
      expect(values.filter((x) => x > 0.01).length).toBeLessThan(3);
    },
  );
  it("provides a real signed waveform and a flat trace for silence", () => {
    const analyser = new FeatureAnalyser();
    const f = analyser.process(
      new Uint8Array(1024),
      wave(),
      48000,
      2048,
      1,
      0.1,
    );
    expect(Math.max(...f.waveform!)).toBeGreaterThan(0.3);
    expect(Math.min(...f.waveform!)).toBeLessThan(-0.3);
    const quiet = analyser.process(
      new Uint8Array(1024),
      new Uint8Array(2048).fill(128),
      48000,
      2048,
      3,
      0.1,
    );
    expect(Array.from(quiet.waveform!).every((x) => x === 0)).toBe(true);
  });
  it("detects a bass attack even when overall loudness stays constant", () => {
    const analyser = new FeatureAnalyser();
    const melody = new Uint8Array(1024);
    melody.fill(170, 20, 80);
    let before = analyser.process(melody, wave(), 48000, 2048, 1, 1 / 60);
    for (let i = 0; i < 90; i++)
      before = analyser.process(melody, wave(), 48000, 2048, 1, 1 / 60);
    const kick = melody.slice();
    kick.fill(240, 2, 11);
    const after = analyser.process(kick, wave(), 48000, 2048, 1, 1 / 60);
    expect(after.energy).toBeCloseTo(before.energy, 4);
    expect(before.transient).toBeLessThan(0.01);
    expect(after.transient).toBeGreaterThan(0.7);
    expect(after.mids).toBeCloseTo(before.mids, 3);
  });
  it("does not repeatedly retrigger a sustained bass note", () => {
    const analyser = new FeatureAnalyser();
    const note = new Uint8Array(1024);
    note.fill(220, 2, 11);
    let f = analyser.process(note, wave(), 48000, 2048, 1, 1 / 60);
    expect(f.transient).toBeGreaterThan(0.7);
    for (let i = 0; i < 120; i++)
      f = analyser.process(note, wave(), 48000, 2048, 1, 1 / 60);
    expect(f.bass).toBeGreaterThan(0.5);
    expect(f.transient).toBeLessThan(0.001);
  });
  it.each([30, 60])(
    "keeps four-on-the-floor kicks distinct at %s fps",
    (fps) => {
      const analyser = new FeatureAnalyser();
      let hits = 0,
        previous = 0;
      for (let i = 0; i < fps * 4; i++) {
        const beat = (i / fps) % 0.5 < 0.08;
        const spectrum = new Uint8Array(1024);
        spectrum.fill(beat ? 230 : 25, 2, 11);
        const f = analyser.process(spectrum, wave(), 48000, 2048, 1, 1 / fps);
        if (f.transient > 0.6 && previous <= 0.6) hits++;
        previous = f.transient;
      }
      expect(hits).toBe(8);
    },
  );
  it.each([
    [100, 30, 250],
    [1000, 250, 2000],
    [6000, 2000, 12000],
  ])("isolates a %s Hz band", (hz, lo, hi) => {
    const data = new Uint8Array(1024);
    data[Math.round((hz * 2048) / 48000)] = 255;
    expect(bandEnergy(data, 48000, 2048, lo, hi)).toBeGreaterThan(0);
    const other =
      hz === 100
        ? bandEnergy(data, 48000, 2048, 2000, 12000)
        : bandEnergy(data, 48000, 2048, 30, 250);
    expect(other).toBe(0);
  });
  it("clamps at Nyquist for lower sample rates", () => {
    expect(
      Number.isFinite(
        bandEnergy(new Uint8Array(1024).fill(128), 8000, 2048, 2000, 12000),
      ),
    ).toBe(true);
    expect(bandEnergy(new Uint8Array(1024), 8000, 2048, 9000, 12000)).toBe(0);
  });
  it("does not invent sound in silence even at maximum sensitivity", () => {
    const f = new FeatureAnalyser().process(
      new Uint8Array(1024).fill(80),
      new Uint8Array(2048).fill(128),
      48000,
      2048,
      3,
      0.016,
    );
    expect(f.energy).toBe(0);
    expect(f.bass).toBe(0);
    expect(f.silent).toBe(true);
  });
  it("smoothly settles after loud input", () => {
    const a = new FeatureAnalyser();
    for (let i = 0; i < 60; i++)
      a.process(new Uint8Array(1024).fill(220), wave(), 48000, 2048, 1, 0.016);
    let f = a.process(
      new Uint8Array(1024),
      new Uint8Array(2048).fill(128),
      48000,
      2048,
      1,
      0.016,
    );
    expect(f.bass).toBeGreaterThan(0.3);
    for (let i = 0; i < 240; i++)
      f = a.process(
        new Uint8Array(1024),
        new Uint8Array(2048).fill(128),
        48000,
        2048,
        1,
        0.016,
      );
    expect(f.bass).toBeLessThan(0.001);
    expect(f.silent).toBe(true);
  });
  it("demo is repeatable and independent of microphone input", () => {
    expect(demoFeatures(10)).toEqual(demoFeatures(10));
    expect(demoFeatures(11)).not.toEqual(demoFeatures(10));
  });
});
