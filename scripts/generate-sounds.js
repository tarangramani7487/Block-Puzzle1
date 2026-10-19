/**
 * Synthesizes the game's sound effects as small 16-bit mono WAV files.
 * Run: node scripts/generate-sounds.js
 */
const fs = require('fs');
const path = require('path');

const RATE = 22050;
const OUT = path.join(__dirname, '..', 'assets', 'sounds');

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

/** Renders `dur` seconds by summing voices: fn(t) → sample. */
function render(dur, fn) {
  const n = Math.floor(dur * RATE);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / RATE);
  // soft fade-out to avoid clicks
  const fade = Math.min(n, Math.floor(0.01 * RATE));
  for (let i = 0; i < fade; i++) out[n - 1 - i] *= i / fade;
  return out;
}

const env = (t, attack, decay) => (t < attack ? t / attack : Math.exp(-(t - attack) / decay));
const sine = (f, t) => Math.sin(2 * Math.PI * f * t);
const tri = (f, t) => (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * f * t));

function note(t, start, freq, decay = 0.12, gain = 0.5) {
  if (t < start) return 0;
  const lt = t - start;
  return gain * env(lt, 0.004, decay) * (0.7 * sine(freq, lt) + 0.3 * tri(freq * 2, lt));
}

const sounds = {
  // Soft upward "pop" when a piece is lifted from the tray.
  pickup: render(0.08, (t) => {
    const f = 520 + 520 * (t / 0.08);
    return 0.35 * env(t, 0.003, 0.025) * (sine(f, t) + 0.25 * sine(f * 2, t));
  }),
  // Tiny wooden tick each time the dragged piece moves onto a new cell.
  tick: render(0.035, (t) => 0.3 * env(t, 0.001, 0.007) * (sine(1150, t) + 0.35 * sine(2300, t))),
  // Gentle downward swish when a piece slides back to the tray.
  return: render(0.11, (t) => {
    const f = 760 - 380 * (t / 0.11);
    return 0.25 * env(t, 0.004, 0.035) * sine(f, t);
  }),
  place: render(0.14, (t) => {
    const f = 260 * Math.exp(-t * 18) + 120;
    return 0.6 * env(t, 0.002, 0.045) * sine(f, t) + 0.12 * env(t, 0.001, 0.006) * (Math.random() * 2 - 1);
  }),
  clear: render(0.5, (t) => note(t, 0, 1046.5) + note(t, 0.06, 1318.5) + note(t, 0.12, 1568, 0.2) + note(t, 0.18, 2093, 0.25, 0.3)),
  combo: render(0.65, (t) =>
    [1318.5, 1568, 1975.5, 2349, 2637].reduce((s, f, i) => s + note(t, i * 0.055, f, 0.18, 0.32), 0),
  ),
  fusion: render(0.42, (t) => {
    const f = 420 + 1100 * (t / 0.42) ** 1.5;
    const vib = 1 + 0.02 * sine(28, t);
    return 0.4 * env(t, 0.02, 0.16) * (sine(f * vib, t) + 0.4 * sine(f * 1.5 * vib, t));
  }),
  invalid: render(0.16, (t) => 0.3 * env(t, 0.004, 0.06) * Math.sign(sine(150, t)) * 0.6 + 0.2 * env(t, 0.004, 0.06) * sine(110, t)),
  gameover: render(1.1, (t) => note(t, 0, 784, 0.25) + note(t, 0.22, 659.3, 0.25) + note(t, 0.44, 523.3, 0.45) + note(t, 0.44, 392, 0.5, 0.3)),
};

fs.mkdirSync(OUT, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  fs.writeFileSync(path.join(OUT, `${name}.wav`), wav(samples));
  console.log(`wrote ${name}.wav (${samples.length} samples)`);
}
