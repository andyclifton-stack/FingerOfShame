import { FeatureAnalyser, demoFeatures } from "./analysis";
import { emptyFeatures, type SourceKind, type SourceState } from "../types";
export interface Track {
  id: string;
  name: string;
  url: string;
  failed: boolean;
}
export class AudioEngine {
  readonly media = new Audio();
  private context?: AudioContext;
  private analyser?: AnalyserNode;
  private gain?: GainNode;
  private mediaNode?: MediaElementAudioSourceNode;
  private stream?: MediaStream;
  private input?: MediaStreamAudioSourceNode;
  private token = 0;
  private disposed = false;
  private freq = new Uint8Array(1024);
  private wave = new Uint8Array(2048);
  private features = new FeatureAnalyser();
  private calibration?: {
    start: number;
    sum: number;
    count: number;
    resolve: () => void;
  };
  state: SourceState = {
    kind: "demo",
    status: "active",
    message: "Demo — not listening",
  };
  queue: Track[] = [];
  index = -1;
  repeat: "Off" | "One" | "All" = "Off";
  volume = 0.7;
  onChange: () => void = () => {};
  constructor() {
    this.media.preload = "metadata";
    this.media.addEventListener("ended", this.ended);
    this.media.addEventListener("error", this.failed);
    this.media.addEventListener("play", this.played);
    this.media.addEventListener("pause", this.paused);
  }
  private publish(
    kind: SourceKind,
    status: SourceState["status"],
    message: string,
  ) {
    if (this.disposed) return;
    this.state = { kind, status, message };
    this.onChange();
  }
  private async initialise() {
    if (!this.context) {
      this.context = new AudioContext();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.35;
      this.analyser.minDecibels = -85;
      this.analyser.maxDecibels = -15;
      this.gain = this.context.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(this.context.destination);
      this.mediaNode = this.context.createMediaElementSource(this.media);
      this.context.onstatechange = () => {
        if (
          this.context?.state === "suspended" &&
          this.state.kind !== "demo" &&
          this.state.status === "active"
        )
          this.publish(
            this.state.kind,
            "paused",
            "Audio interrupted. Press Resume to continue.",
          );
      };
    }
    await this.context.resume();
  }
  private cleanup() {
    this.token++;
    this.stream?.getTracks().forEach((t) => {
      t.onended = null;
      t.onmute = null;
      t.onunmute = null;
      t.stop();
    });
    this.stream = undefined;
    this.input?.disconnect();
    this.input = undefined;
    this.media.pause();
    this.mediaNode?.disconnect();
    this.analyser?.disconnect();
    this.features.reset();
    if (this.calibration) {
      this.calibration.resolve();
      this.calibration = undefined;
    }
  }
  stop(message = "Stopped — choose a source to continue") {
    const kind = this.state.kind;
    this.cleanup();
    this.publish(kind, "idle", message);
  }
  demo() {
    this.cleanup();
    this.publish("demo", "active", "Demo — not listening");
  }
  selectFiles() {
    this.cleanup();
    this.publish(
      "files",
      "idle",
      this.queue.length
        ? "Choose a track or press Play."
        : "Choose audio files to begin.",
    );
  }
  async capture(kind: "mic" | "tab", deviceId?: string) {
    this.cleanup();
    const ticket = this.token;
    this.publish(
      kind,
      "starting",
      kind === "mic"
        ? "Waiting for microphone permission…"
        : "Choose a tab and enable Share audio…",
    );
    try {
      if (!navigator.mediaDevices)
        throw new Error(
          "Audio capture requires HTTPS or localhost in a supported browser.",
        );
      // Start the picker directly within the user's activation, before awaiting context setup.
      const request =
        kind === "mic"
          ? navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: deviceId ? { exact: deviceId } : undefined,
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
              },
              video: false,
            })
          : navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true,
            });
      const stream = await request;
      if (ticket !== this.token || this.disposed || document.hidden) {
        stream.getTracks().forEach((t) => t.stop());
        if (ticket === this.token && !this.disposed)
          this.stop("Capture stopped while Music Wall was hidden.");
        return;
      }
      if (!stream.getAudioTracks().some((t) => t.readyState === "live")) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error(
          "No audio was shared. Choose a browser tab and tick Share audio, or use local files.",
        );
      }
      this.stream = stream;
      await this.initialise();
      if (ticket !== this.token || this.disposed) return;
      this.input = this.context!.createMediaStreamSource(
        new MediaStream(stream.getAudioTracks()),
      );
      this.input.connect(this.analyser!);
      // Capture analyser has NO connection to output. Microphone and shared audio are never echoed.
      stream.getTracks().forEach((t) => {
        t.onended = () =>
          this.stop(
            kind === "mic"
              ? "Microphone disconnected. Choose an input to restart."
              : "Sharing ended. Choose a tab to restart.",
          );
      });
      stream.getAudioTracks().forEach((t) => {
        t.onmute = () =>
          this.publish(
            kind,
            "paused",
            "The shared input is muted or interrupted.",
          );
        t.onunmute = () =>
          this.publish(
            kind,
            "active",
            kind === "mic" ? "Listening" : "Tab audio connected",
          );
      });
      this.publish(
        kind,
        "active",
        kind === "mic" ? "Listening" : "Tab audio connected",
      );
    } catch (e) {
      if (ticket !== this.token || this.disposed) return;
      this.cleanup();
      const error = e as Error;
      const message =
        error.name === "NotAllowedError"
          ? "Permission was declined or sharing was cancelled. Try again when ready."
          : error.name === "NotFoundError"
            ? "No microphone was found. Connect one or choose another source."
            : error.name === "NotReadableError"
              ? "This input is unavailable or being used elsewhere. Try another input."
              : error.message;
      this.publish(kind, "error", message);
    }
  }
  async devices() {
    try {
      return (await navigator.mediaDevices.enumerateDevices()).filter(
        (d) => d.kind === "audioinput",
      );
    } catch {
      return [];
    }
  }
  addFiles(files: File[]) {
    for (const file of files)
      this.queue.push({
        id: crypto.randomUUID(),
        name: file.name,
        url: URL.createObjectURL(file),
        failed: false,
      });
    this.onChange();
  }
  async play(index = this.index < 0 ? 0 : this.index) {
    if (!this.queue[index] || this.disposed) return;
    this.queue[index].failed = false;
    const changed =
      this.index !== index ||
      this.media.src !== this.queue[index].url ||
      Boolean(this.media.error);
    this.cleanup();
    const ticket = this.token;
    this.index = index;
    this.publish("files", "starting", "Preparing your track…");
    try {
      await this.initialise();
      if (ticket !== this.token || this.disposed) return;
      this.mediaNode!.connect(this.analyser!);
      this.analyser!.connect(this.gain!);
      if (changed) this.media.src = this.queue[index].url;
      await this.media.play();
      if (ticket === this.token)
        this.publish("files", "active", "Playing local audio");
    } catch (e) {
      if (ticket !== this.token || this.disposed) return;
      const err = e as Error;
      if (err.name === "NotAllowedError")
        this.publish("files", "paused", "Press Play to allow audio playback.");
      else if (err.name !== "AbortError") this.failed();
    }
  }
  toggle() {
    if (this.media.paused) void this.play();
    else this.media.pause();
  }
  async resume() {
    if (this.state.kind === "files") {
      await this.play();
      return;
    }
    try {
      await this.context?.resume();
      if (this.stream) {
        if (this.stream.getAudioTracks().some((t) => t.muted)) {
          this.publish(
            this.state.kind,
            "paused",
            "The input is still muted. Resume it in the source app or choose your source again.",
          );
          return;
        }
        this.publish(
          this.state.kind,
          "active",
          this.state.kind === "mic" ? "Listening" : "Tab audio connected",
        );
      }
    } catch {
      this.stop("Audio could not resume. Choose your source again.");
    }
  }
  private played = () => {
    if (this.state.kind === "files")
      this.publish("files", "active", "Playing local audio");
  };
  private paused = () => {
    if (this.state.kind === "files" && this.state.status === "active")
      this.publish("files", "paused", "Playback paused");
  };
  private ended = () => {
    if (this.repeat === "One") {
      this.media.currentTime = 0;
      void this.play();
    } else this.next(1, true);
  };
  private failed = () => {
    const track = this.queue[this.index];
    if (this.state.kind !== "files" || !track || track.failed) return;
    track.failed = true;
    this.publish(
      "files",
      "error",
      `Could not play “${track.name}”. Trying the next supported track.`,
    );
    this.next(1, true, true);
  };
  next(direction: number, ended = false, failed = false) {
    if (!this.queue.length) return;
    if (direction < 0 && this.media.currentTime > 3 && !ended) {
      this.media.currentTime = 0;
      return;
    }
    let next = this.index + direction;
    for (let tried = 0; tried < this.queue.length; tried++, next += direction) {
      if (next < 0 || next >= this.queue.length) {
        if (this.repeat === "All" || !ended)
          next = (next + this.queue.length) % this.queue.length;
        else break;
      }
      if (!this.queue[next].failed) {
        void this.play(next);
        return;
      }
    }
    this.media.pause();
    this.publish(
      "files",
      failed ? "error" : "paused",
      failed
        ? "No more playable tracks. Choose another file or select a track to retry."
        : "Queue finished",
    );
  }
  retry(index: number) {
    if (this.queue[index]) this.queue[index].failed = false;
    void this.play(index);
  }
  remove(id: string) {
    const i = this.queue.findIndex((t) => t.id === id);
    if (i < 0) return;
    const current = i === this.index;
    if (current) {
      this.stop("Track removed. Choose another track.");
      this.media.removeAttribute("src");
      this.media.load();
    }
    URL.revokeObjectURL(this.queue[i].url);
    this.queue.splice(i, 1);
    if (current) this.index = -1;
    else if (i < this.index) this.index--;
    this.onChange();
  }
  move(id: string, delta: number) {
    const i = this.queue.findIndex((t) => t.id === id),
      j = i + delta;
    if (j < 0 || j >= this.queue.length) return;
    const current = this.queue[this.index]?.id;
    [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    this.index = this.queue.findIndex((t) => t.id === current);
    this.onChange();
  }
  setVolume(value: number) {
    this.volume = value;
    if (this.gain) this.gain.gain.value = value;
    this.onChange();
  }
  seek(value: number) {
    if (Number.isFinite(this.media.duration))
      this.media.currentTime = Math.min(
        this.media.duration,
        Math.max(0, value),
      );
  }
  calibrate() {
    if (this.state.kind !== "mic" || this.state.status !== "active")
      return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.calibration = {
        start: performance.now(),
        sum: 0,
        count: 0,
        resolve,
      };
    });
  }
  sample(t: number, dt: number, sensitivity: number) {
    if (this.state.kind === "demo") {
      const f = demoFeatures(t);
      for (const k of [
        "bass",
        "mids",
        "treble",
        "energy",
        "transient",
      ] as const)
        f[k] = Math.min(1, f[k] * sensitivity);
      if (f.spectrum)
        for (let i = 0; i < f.spectrum.length; i++)
          f.spectrum[i] = Math.min(1, f.spectrum[i] * sensitivity);
      if (f.waveform)
        for (let i = 0; i < f.waveform.length; i++)
          f.waveform[i] = Math.max(
            -1,
            Math.min(1, f.waveform[i] * sensitivity),
          );
      return f;
    }
    if (this.state.status !== "active" || !this.analyser || !this.context)
      return { ...emptyFeatures };
    this.analyser.getByteFrequencyData(this.freq);
    this.analyser.getByteTimeDomainData(this.wave);
    if (this.calibration) {
      let sum = 0;
      for (const v of this.wave) sum += ((v - 128) / 128) ** 2;
      this.calibration.sum += Math.sqrt(sum / this.wave.length);
      this.calibration.count++;
      if (performance.now() - this.calibration.start >= 3000) {
        this.features.noiseFloor = Math.min(
          0.12,
          Math.max(
            0.008,
            (this.calibration.sum / this.calibration.count) * 1.4,
          ),
        );
        this.calibration.resolve();
        this.calibration = undefined;
      }
    }
    return this.features.process(
      this.freq,
      this.wave,
      this.context.sampleRate,
      this.analyser.fftSize,
      sensitivity,
      dt,
    );
  }
  get debug() {
    return {
      tracks:
        this.stream?.getTracks().filter((t) => t.readyState === "live")
          .length ?? 0,
      contexts: this.context ? 1 : 0,
      queue: this.queue.length,
      source: this.state.kind,
    };
  }
  dispose() {
    this.cleanup();
    this.disposed = true;
    this.media.removeEventListener("ended", this.ended);
    this.media.removeEventListener("error", this.failed);
    this.media.removeEventListener("play", this.played);
    this.media.removeEventListener("pause", this.paused);
    this.media.removeAttribute("src");
    this.media.load();
    this.queue.forEach((t) => URL.revokeObjectURL(t.url));
    this.queue = [];
    void this.context?.close();
  }
}
