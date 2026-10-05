/**
 * A small drum machine, synthesised rather than sampled: no audio files to ship in the PWA and
 * no sample licence to reconcile with publishing the image.
 *
 * A pattern is `beats` beats of `subbeats` divisions each, and each voice holds step indices into
 * that grid. `beats` counts the pulse you would tap, and `bpm` counts those — which is why a
 * compound meter has fewer beats than its numerator: 6/8 is two beats of three, not six of one,
 * and 3/4 is three of two. Both come to six subdivisions; the grouping is the difference.
 */
export const VOICES = [
  'kick',
  'snare',
  'rim',
  'clap',
  'hightom',
  'lowtom',
  'hat',
  'openhat',
  'ride',
  'cowbell',
  'shaker',
];

export const MAX_BEATS = 12;
export const MAX_SUBBEATS = 4;

export const BPM_MIN = 40;
export const BPM_MAX = 220;
export const DEFAULT_BPM = 90;

export const clampBpm = (value) => Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(value) || DEFAULT_BPM));

const fill = (count) => Array.from({ length: count }, (unused, step) => step);

/**
 * Fills in an empty row for every voice a pattern does not play. Presets name only the voices
 * they use, and rows saved before a voice existed lack it, but the scheduler and the grid read
 * every voice of every pattern.
 */
export const withVoices = (pattern) => ({
  ...Object.fromEntries(VOICES.map((voice) => [voice, []])),
  ...pattern,
});

// Meters set a time signature; grooves are a feel to play along to, and are kept apart in the
// picker so the plain time signatures stay easy to find.
const METERS = {
  click: { label: 'Click', beats: 4, subbeats: 1, hat: fill(4) },
  '2/4': { label: '2/4', beats: 2, subbeats: 2, kick: [0], snare: [2], hat: fill(4) },
  '3/4': { label: '3/4', beats: 3, subbeats: 2, kick: [0], snare: [2, 4], hat: fill(6) },
  // Kick on one and three plus the second half of three: without that extra kick a 4/4 is
  // literally a 2/4 played twice, and sounds like it.
  '4/4': { label: '4/4', beats: 4, subbeats: 2, kick: [0, 4, 5], snare: [2, 6], hat: fill(8) },
  '6/8': { label: '6/8', beats: 2, subbeats: 3, kick: [0], snare: [3], hat: fill(6) },
  '9/8': { label: '9/8', beats: 3, subbeats: 3, kick: [0], snare: [3, 6], hat: fill(9) },
  // No plain 12/8: as a drum figure it is a 6/8 written out twice, so only the shuffle hat — the
  // empty middle of each triplet — makes it a different thing to hear.
  shuffle: {
    label: '12/8 shuffle',
    beats: 4,
    subbeats: 3,
    kick: [0, 6],
    snare: [3, 9],
    hat: [0, 2, 3, 5, 6, 8, 9, 11],
  },
};

const GROOVES = {
  // The backbeat moves to three, so the bar feels half as fast at the same tempo.
  halftime: { label: 'Half-time', beats: 4, subbeats: 2, kick: [0], snare: [4], hat: fill(8) },
  // Closed hats on the beat cut each open hat off, which is the disco "tss" on every offbeat.
  disco: {
    label: 'Four on the floor',
    beats: 4,
    subbeats: 2,
    kick: [0, 2, 4, 6],
    clap: [2, 6],
    hat: [0, 2, 4, 6],
    openhat: [1, 3, 5, 7],
  },
  ballad: { label: 'Ballad 16ths', beats: 4, subbeats: 4, kick: [0, 10], snare: [4, 12], hat: fill(16) },
  funk: { label: 'Funk 16ths', beats: 4, subbeats: 4, kick: [0, 3, 10], snare: [4, 12], hat: fill(16) },
  // Nothing on one: the kick and the side stick land together on three.
  onedrop: { label: 'One drop', beats: 4, subbeats: 2, kick: [4], rim: [4], hat: fill(8) },
  // Two bars, because the side-stick clave takes two bars to come round.
  bossa: {
    label: 'Bossa nova',
    beats: 8,
    subbeats: 2,
    kick: [0, 3, 4, 7, 8, 11, 12, 15],
    rim: [0, 3, 6, 10, 13],
    hat: fill(16),
  },
  // The ride's "ding, ding-ga" with the hat foot on two and four.
  swing: { label: 'Swing', beats: 4, subbeats: 3, kick: [0, 6], hat: [3, 9], ride: [0, 3, 5, 6, 9, 11] },
};

const preset = (groove) => ([id, pattern]) => [id, withVoices({ ...pattern, groove })];

export const PRESETS = Object.fromEntries([
  ...Object.entries(METERS).map(preset(false)),
  ...Object.entries(GROOVES).map(preset(true)),
]);

export const DEFAULT_PRESET = '4/4';

export const stepCount = (pattern) => pattern.beats * pattern.subbeats;

export const isSilent = (pattern) => VOICES.every((voice) => pattern[voice].length === 0);

/**
 * Resizing keeps every hit that still fits, and re-lays the hat across every subdivision: the hat
 * is the timekeeper, so choosing a division is a request to hear that division. Clearing hat
 * cells afterwards is how a shuffle gets built by hand, at the cost of losing that work if the
 * grid is resized again.
 */
export function resizePattern(pattern, beats, subbeats) {
  const limit = beats * subbeats;
  const kept = VOICES.map((voice) => [voice, pattern[voice].filter((step) => step < limit)]);

  return { beats, subbeats, ...Object.fromEntries(kept), hat: fill(limit) };
}

export function setStep(pattern, voice, step, on) {
  const steps = pattern[voice];
  if (steps.includes(step) === on) return pattern;

  const next = on ? [...steps, step].sort((a, b) => a - b) : steps.filter((each) => each !== step);
  return { ...pattern, [voice]: next };
}

export function toggleStep(pattern, voice, step) {
  return setStep(pattern, voice, step, !pattern[voice].includes(step));
}

/**
 * Stored as JSON in `songs.metronome`. Rows written before the grid existed hold a preset id
 * instead, so a value that is not JSON is looked up as one — no migration for a handful of rows.
 */
export function parsePattern(stored) {
  if (!stored) return null;
  if (PRESETS[stored]) return { ...PRESETS[stored] };

  try {
    const parsed = JSON.parse(stored);
    if (!(parsed.beats > 0 && parsed.subbeats > 0)) return null;

    const rows = VOICES.map((voice) => [voice, Array.isArray(parsed[voice]) ? parsed[voice] : []]);
    return { beats: parsed.beats, subbeats: parsed.subbeats, ...Object.fromEntries(rows) };
  } catch {
    return null;
  }
}

// Only the voices that play are written, so a pattern costs what it uses rather than a row for
// every instrument in the kit.
export function serialisePattern(pattern) {
  const rows = VOICES.filter((voice) => pattern[voice].length > 0).map((voice) => [voice, pattern[voice]]);
  return JSON.stringify({ beats: pattern.beats, subbeats: pattern.subbeats, ...Object.fromEntries(rows) });
}

// Scheduling ahead in time is the whole trick. A timer that fires one sound per beat drifts
// audibly within a minute, because timer callbacks are only approximately on time; instead a
// coarse timer queues notes at exact AudioContext timestamps a little way into the future.
const LOOKAHEAD_MS = 25;
const HORIZON = 0.12;

function noiseBuffer(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
  return buffer;
}

// A hard edge by default; an attack swells in instead, for sounds that are shaken rather than struck.
function envelope(ctx, at, peak, seconds, attack = 0) {
  const gain = ctx.createGain();
  if (attack > 0) {
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(peak, at + attack);
  } else {
    gain.gain.setValueAtTime(peak, at);
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  return gain;
}

function burst({ ctx, noise, at }, { frequency, peak, seconds, type = 'highpass', q = 1, attack = 0 }) {
  const source = ctx.createBufferSource();
  source.buffer = noise;

  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;

  const gain = envelope(ctx, at, peak, seconds, attack);
  source.connect(filter).connect(gain);
  source.start(at);
  source.stop(at + seconds);
  return gain;
}

function tone({ ctx, at }, { from, to, type, peak, seconds }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + seconds);

  const gain = envelope(ctx, at, peak, seconds);
  osc.connect(gain);
  osc.start(at);
  osc.stop(at + seconds);
  return gain;
}

// Square waves at clashing, unrelated pitches with only their upper partials let through: the
// 808's recipe for anything made of metal, from cymbals to a cowbell.
function metal({ ctx, at }, { frequencies, band, q, peak, seconds }) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = band;
  filter.Q.value = q;

  const gain = envelope(ctx, at, peak, seconds);
  filter.connect(gain);

  for (const frequency of frequencies) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = frequency;
    osc.connect(filter);
    osc.start(at);
    osc.stop(at + seconds);
  }
  return gain;
}

const CYMBAL = [2, 3, 4.16, 5.43, 6.79, 8.21].map((ratio) => ratio * 60);
const OPEN_HAT_SECONDS = 0.4;

// The open and closed hats are one pair of cymbals, so any hat stops an open one still ringing.
// Without this, open hats ring on through the closed hats after them and smear the offbeats.
function choke({ at, ringing }) {
  const open = ringing.openhat;
  if (!open || open.until <= at) return;

  open.gate.gain.setValueAtTime(1, at);
  open.gate.gain.linearRampToValueAtTime(0, at + 0.02);
  ringing.openhat = null;
}

// Each voice returns the gain nodes it ends in, so the caller has one thing to connect.
const SOUNDS = {
  kick: (hit) => [tone(hit, { from: 150, to: 45, type: 'sine', peak: hit.accent ? 1 : 0.85, seconds: 0.18 })],
  snare: (hit) => [
    burst(hit, { frequency: 1200, peak: 0.7, seconds: 0.12 }),
    tone(hit, { from: 190, to: 160, type: 'triangle', peak: 0.3, seconds: 0.09 }),
  ],
  // A side stick: a short woody knock with a click on top, and none of the snare's rattle.
  rim: (hit) => [
    tone(hit, { from: 1700, to: 1700, type: 'triangle', peak: 0.55, seconds: 0.03 }),
    tone(hit, { from: 480, to: 400, type: 'sine', peak: 0.4, seconds: 0.05 }),
  ],
  // Several hands landing a few milliseconds apart, then the room behind them.
  clap: (hit) => [
    ...[0, 0.011, 0.023].map((offset) =>
      burst({ ...hit, at: hit.at + offset }, { type: 'bandpass', frequency: 1200, q: 1.2, peak: 2, seconds: 0.012 }),
    ),
    burst({ ...hit, at: hit.at + 0.03 }, { type: 'bandpass', frequency: 1200, q: 1.2, peak: 1.5, seconds: 0.16 }),
  ],
  hightom: (hit) => [tone(hit, { from: 220, to: 150, type: 'sine', peak: 0.6, seconds: 0.25 })],
  lowtom: (hit) => [tone(hit, { from: 140, to: 90, type: 'sine', peak: 0.65, seconds: 0.32 })],
  // Louder and longer on the downbeat, which is what makes the length of a bar audible and keeps
  // a 2/4 from sounding like a 4/4.
  hat: (hit) => {
    choke(hit);
    return [burst(hit, { frequency: 9000, peak: hit.accent ? 0.45 : 0.2, seconds: hit.accent ? 0.07 : 0.04 })];
  },
  // Through a gate of its own, so that the next hat can close it.
  openhat: (hit) => {
    choke(hit);

    const gate = hit.ctx.createGain();
    burst(hit, { frequency: 7000, peak: hit.accent ? 0.25 : 0.18, seconds: OPEN_HAT_SECONDS }).connect(gate);
    hit.ringing.openhat = { gate, until: hit.at + OPEN_HAT_SECONDS };
    return [gate];
  },
  ride: (hit) => [metal(hit, { frequencies: CYMBAL, band: 7500, q: 0.6, peak: hit.accent ? 0.28 : 0.2, seconds: 0.9 })],
  cowbell: (hit) => [metal(hit, { frequencies: [540, 800], band: 1200, q: 1, peak: 0.22, seconds: 0.3 })],
  // Swells in rather than starting on a hard edge, which is what makes it a shake and not a hat.
  shaker: (hit) => [
    burst(hit, {
      type: 'bandpass',
      frequency: 6000,
      q: 1.2,
      peak: hit.accent ? 0.42 : 0.28,
      seconds: 0.08,
      attack: 0.02,
    }),
  ],
};

export function createMetronome() {
  let ctx = null;
  let noise = null;
  let out = null;
  let timer = 0;
  let step = 0;
  let nextAt = 0;
  let pattern = { ...PRESETS[DEFAULT_PRESET] };
  let bpm = DEFAULT_BPM;
  let queued = [];
  let sounding = -1;
  const ringing = { openhat: null };

  const schedule = () => {
    while (nextAt < ctx.currentTime + HORIZON) {
      // Read on every step, so a tempo or pattern edit lands within a beat rather than needing
      // the metronome stopped and started again.
      const current = pattern;
      const steps = stepCount(current);
      const index = step % steps;

      for (const voice of VOICES) {
        if (!current[voice].includes(index)) continue;
        const hit = { ctx, noise, ringing, at: nextAt, accent: index === 0 };
        for (const node of SOUNDS[voice](hit)) node.connect(out);
      }

      queued.push({ step: index, at: nextAt });
      nextAt += 60 / bpm / current.subbeats;
      step = (step + 1) % steps;
    }

    timer = setTimeout(schedule, LOOKAHEAD_MS);
  };

  return {
    async start(next) {
      this.update(next);

      ctx ??= new AudioContext();
      noise ??= noiseBuffer(ctx);
      if (!out) {
        out = ctx.createGain();
        out.gain.value = 0.7;
        out.connect(ctx.destination);
      }

      // Every browser starts the context suspended and only a user gesture may resume it, so
      // this has to be reached from a click or a keypress.
      if (ctx.state !== 'running') await ctx.resume();

      clearTimeout(timer);
      step = 0;
      queued = [];
      sounding = -1;
      nextAt = ctx.currentTime + 0.06;
      schedule();
    },

    update(next = {}) {
      if (next.bpm) bpm = next.bpm;
      if (next.pattern) pattern = next.pattern;
    },

    /**
     * Which step is sounding right now. Notes are queued ahead of being heard, so this drains
     * everything whose moment has arrived and keeps the last one: the queue only ever holds the
     * scheduling horizon, which is shorter than a beat, so its contents are the future rather
     * than a history to look back through.
     */
    playhead() {
      if (!ctx) return -1;
      while (queued.length > 0 && queued[0].at <= ctx.currentTime) sounding = queued.shift().step;
      return sounding;
    },

    stop() {
      clearTimeout(timer);
      timer = 0;
      queued = [];
      sounding = -1;
    },

    close() {
      this.stop();
      ctx?.close();
      ctx = null;
      noise = null;
      out = null;
    },
  };
}
