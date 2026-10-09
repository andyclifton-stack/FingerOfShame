import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { AudioEngine } from "./engine";
class FakeNode {
  connections: FakeNode[] = [];
  connect(n: FakeNode) {
    this.connections.push(n);
    return n;
  }
  disconnect() {
    this.connections = [];
  }
}
class FakeAnalyser extends FakeNode {
  fftSize = 2048;
  frequencyBinCount = 1024;
  smoothingTimeConstant = 0;
  minDecibels = 0;
  maxDecibels = 0;
  getByteFrequencyData(v: Uint8Array) {
    v.fill(0);
  }
  getByteTimeDomainData(v: Uint8Array) {
    v.fill(128);
  }
}
class FakeAudio extends EventTarget {
  src = "";
  preload = "";
  paused = true;
  currentTime = 0;
  duration = 100;
  async play() {
    this.paused = false;
    this.dispatchEvent(new Event("play"));
  }
  pause() {
    const changed = !this.paused;
    this.paused = true;
    if (changed) this.dispatchEvent(new Event("pause"));
  }
  removeAttribute() {
    this.src = "";
  }
  load() {}
}
class FakeContext {
  static all: FakeContext[] = [];
  state = "running";
  sampleRate = 48000;
  destination = new FakeNode();
  analyser = new FakeAnalyser();
  gain = Object.assign(new FakeNode(), { gain: { value: 1 } });
  media = new FakeNode();
  input = new FakeNode();
  onstatechange = () => {};
  constructor() {
    FakeContext.all.push(this);
  }
  createAnalyser() {
    return this.analyser;
  }
  createGain() {
    return this.gain;
  }
  createMediaElementSource() {
    return this.media;
  }
  createMediaStreamSource() {
    return this.input;
  }
  async resume() {}
  async close() {
    this.state = "closed";
  }
}
function track(kind = "audio") {
  return {
    kind,
    readyState: "live",
    onended: null as null | (() => void),
    onmute: null as null | (() => void),
    onunmute: null as null | (() => void),
    stop: vi.fn(function (this: { readyState: string }) {
      this.readyState = "ended";
    }),
  };
}
class Stream {
  constructor(public tracks: ReturnType<typeof track>[]) {}
  getTracks() {
    return this.tracks;
  }
  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === "audio");
  }
}
const tick = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
let engine: AudioEngine;
let getUserMedia: ReturnType<typeof vi.fn>,
  getDisplayMedia: ReturnType<typeof vi.fn>;
let counter = 0;
beforeEach(() => {
  FakeContext.all = [];
  getUserMedia = vi.fn();
  getDisplayMedia = vi.fn();
  vi.stubGlobal("Audio", FakeAudio);
  vi.stubGlobal("AudioContext", FakeContext);
  vi.stubGlobal("MediaStream", Stream);
  vi.stubGlobal("document", { hidden: false });
  vi.stubGlobal("navigator", {
    mediaDevices: {
      getUserMedia,
      getDisplayMedia,
      enumerateDevices: async () => [],
    },
  });
  vi.spyOn(URL, "createObjectURL").mockImplementation(
    () => "blob:test-" + counter++,
  );
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  engine = new AudioEngine();
});
afterEach(() => {
  engine.dispose();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("managed audio lifecycle", () => {
  it("applies sensitivity in demo without creating audio resources", () => {
    const low = engine.sample(2, 0.016, 0.25),
      high = engine.sample(2, 0.016, 3);
    expect(high.bass).toBeGreaterThan(low.bass);
    expect(FakeContext.all).toHaveLength(0);
  });
  it("discards a capture granted after the page becomes hidden", async () => {
    const t = track();
    getUserMedia.mockImplementation(async () => {
      vi.stubGlobal("document", { hidden: true });
      return new Stream([t]);
    });
    await engine.capture("mic");
    expect(t.stop).toHaveBeenCalled();
    expect(engine.state.status).toBe("idle");
  });
  it("retries a failed file from the main Play control", async () => {
    engine.addFiles([new File(["a"], "a.wav")]);
    await engine.play();
    engine.media.dispatchEvent(new Event("error"));
    expect(engine.queue[0].failed).toBe(true);
    await engine.play();
    expect(engine.queue[0].failed).toBe(false);
    expect(engine.state.status).toBe("active");
  });
  it("keeps microphone analysis disconnected from speakers and stops real tracks", async () => {
    const t = track();
    getUserMedia.mockResolvedValue(new Stream([t]));
    await engine.capture("mic");
    const c = FakeContext.all[0];
    expect(c.input.connections).toEqual([c.analyser]);
    expect(c.analyser.connections).toHaveLength(0);
    engine.stop();
    expect(t.stop).toHaveBeenCalledOnce();
    expect(engine.debug.tracks).toBe(0);
  });
  it("cleans up delayed permission responses after Stop", async () => {
    let resolve!: (s: Stream) => void;
    getUserMedia.mockReturnValue(new Promise<Stream>((r) => (resolve = r)));
    const pending = engine.capture("mic");
    engine.stop();
    const t = track();
    resolve(new Stream([t]));
    await pending;
    expect(t.stop).toHaveBeenCalledOnce();
    expect(engine.state.status).toBe("idle");
    expect(FakeContext.all).toHaveLength(0);
  });
  it("keeps only the most recent capture request", async () => {
    let resolve!: (s: Stream) => void;
    getUserMedia.mockReturnValueOnce(new Promise<Stream>((r) => (resolve = r)));
    const first = engine.capture("mic");
    const current = track();
    getUserMedia.mockResolvedValueOnce(new Stream([current]));
    await engine.capture("mic");
    const stale = track();
    resolve(new Stream([stale]));
    await first;
    expect(stale.stop).toHaveBeenCalledOnce();
    expect(current.stop).not.toHaveBeenCalled();
    expect(engine.debug.tracks).toBe(1);
  });
  it("rejects a shared stream without audio and releases its video", async () => {
    const video = track("video");
    getDisplayMedia.mockResolvedValue(new Stream([video]));
    await engine.capture("tab");
    expect(video.stop).toHaveBeenCalled();
    expect(engine.state.status).toBe("error");
    expect(engine.state.kind).toBe("tab");
    expect(engine.state.message).toContain("No audio");
  });
  it("browser Stop sharing releases all capture tracks", async () => {
    const a = track(),
      v = track("video");
    getDisplayMedia.mockResolvedValue(new Stream([a, v]));
    await engine.capture("tab");
    v.onended!();
    expect(a.stop).toHaveBeenCalled();
    expect(v.stop).toHaveBeenCalled();
    expect(engine.state.status).toBe("idle");
  });
  it("permission denial does not fall back to another source", async () => {
    getUserMedia.mockRejectedValue(
      new DOMException("Denied", "NotAllowedError"),
    );
    await engine.capture("mic");
    expect(engine.state.kind).toBe("mic");
    expect(engine.state.status).toBe("error");
    expect(engine.state.message).toContain("declined");
  });
  it("uses one file playback connection and one AudioContext across repeated play", async () => {
    engine.addFiles([new File(["a"], "a.wav")]);
    await engine.play();
    await engine.play();
    const c = FakeContext.all[0];
    expect(FakeContext.all).toHaveLength(1);
    expect(c.media.connections).toEqual([c.analyser]);
    expect(c.analyser.connections).toEqual([c.gain]);
    expect(c.gain.connections).toEqual([c.destination]);
    engine.setVolume(0.1);
    expect(c.gain.gain.value).toBe(0.1);
  });
  it("removes the audible path when switching to capture", async () => {
    engine.addFiles([new File(["a"], "a.wav")]);
    await engine.play();
    getUserMedia.mockResolvedValue(new Stream([track()]));
    await engine.capture("mic");
    const c = FakeContext.all[0];
    expect(c.media.connections).toHaveLength(0);
    expect(c.analyser.connections).toHaveLength(0);
    expect(engine.media.paused).toBe(true);
  });
  it("revokes removed files and preserves current track when reordering", async () => {
    engine.addFiles([new File(["a"], "a.wav"), new File(["b"], "b.wav")]);
    await engine.play(0);
    const id = engine.queue[0].id;
    engine.move(id, 1);
    expect(engine.index).toBe(1);
    const url = engine.queue[0].url;
    engine.remove(engine.queue[0].id);
    expect(engine.index).toBe(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(url);
  });
  it("ends at the last file unless repeat All is selected", async () => {
    engine.addFiles([new File(["a"], "a.wav"), new File(["b"], "b.wav")]);
    await engine.play(1);
    engine.media.dispatchEvent(new Event("ended"));
    expect(engine.state.message).toBe("Queue finished");
    engine.repeat = "All";
    engine.media.dispatchEvent(new Event("ended"));
    await tick();
    expect(engine.index).toBe(0);
    expect(engine.state.status).toBe("active");
  });
  it("stops skipping after all files fail", async () => {
    engine.addFiles([new File(["a"], "a.wav"), new File(["b"], "b.wav")]);
    await engine.play(0);
    engine.media.dispatchEvent(new Event("error"));
    await tick();
    engine.media.dispatchEvent(new Event("error"));
    await tick();
    expect(engine.queue.every((t) => t.failed)).toBe(true);
    expect(engine.state.status).toBe("error");
    expect(engine.state.message).toContain("No more playable");
  });
});
