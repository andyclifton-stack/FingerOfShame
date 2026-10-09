import fs from "node:fs";
fs.mkdirSync("tests/fixtures", { recursive: true });
const rate = 44100,
  seconds = 3,
  count = rate * seconds,
  buffer = Buffer.alloc(44 + count * 2);
buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + count * 2, 4);
buffer.write("WAVEfmt ", 8);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(rate, 24);
buffer.writeUInt32LE(rate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(count * 2, 40);
for (let i = 0; i < count; i++) {
  const t = i / rate,
    envelope = Math.min(1, t * 30, (seconds - t) * 30);
  const v =
    envelope *
    (Math.sin(t * 2 * Math.PI * 100) * 0.13 +
      Math.sin(t * 2 * Math.PI * 1000) * 0.08 +
      Math.sin(t * 2 * Math.PI * 6000) * 0.045);
  buffer.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
}
fs.writeFileSync("tests/fixtures/tone.wav", buffer);
fs.writeFileSync(
  "tests/fixtures/corrupt.mp3",
  "This is deliberately not audio.",
);
console.log("Created original synthetic WAV and corrupt-file fixtures.");
