/**
 * A small drum machine, synthesised rather than sampled: no audio files to ship in the PWA and
 * no sample licence to reconcile with publishing the image.
 *
 * A pattern is `beats` beats of `subbeats` divisions each, and each voice holds step indices into
 * that grid. `beats` counts the pulse you would tap, and `bpm` counts those — which is why a
 * compound meter has fewer beats than its numerator: 6/8 is two beats of three, not six of one,
 * and 3/4 is three of two. Both come to six subdivisions; the grouping is the difference.
 */
export const VOICES = ['kick', 'snare', 'hat'];

export const MAX_BEATS = 12;
export const MAX_SUBBEATS = 4;

export const BPM_MIN = 40;
export const BPM_MAX = 220;
export const DEFAULT_BPM = 90;

export const clampBpm = (value) => Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(value) || DEFAULT_BPM));

const fill = (count) => Array.from({ length: count }, (unused, step) => step);

export const PRESETS = {
  click: { label: 'Click', beats: 4, subbeats: 1, kick: [], snare: [], hat: fill(4) },
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

export const DEFAULT_PRESET = '4/4';

export const stepCount = (pattern) => pattern.beats * pattern.subbeats;

export const isSilent = (pattern) => VOICES.every((voice) => pattern[voice].length === 0);

/**
 * Resizing keeps the kick and snare that still fit, and re-lays the hat across every subdivision:
 * the hat is the timekeeper, so choosing a division is a request to hear that division. Clearing
 * hat cells afterwards is how a shuffle gets built by hand, at the cost of losing that work if
 * the grid is resized again.
 */
export function resizePattern(pattern, beats, subbeats) {
  const limit = beats * subbeats;

  return {
    beats,
    subbeats,
    kick: pattern.kick.filter((step) => step < limit),
    snare: pattern.snare.filter((step) => step < limit),
    hat: fill(limit),
  };
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
    const { beats, subbeats, kick, snare, hat } = JSON.parse(stored);
    if (!(beats > 0 && subbeats > 0)) return null;
    return { beats, subbeats, kick: kick ?? [], snare: snare ?? [], hat: hat ?? [] };
  } catch {
    return null;
  }
}

export function serialisePattern({ beats, subbeats, kick, snare, hat }) {
  return JSON.stringify({ beats, subbeats, kick, snare, hat });
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

function envelope(ctx, at, peak, seconds) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
  return gain;
}

function burst({ ctx, noise, at }, { frequency, peak, seconds }) {
  const source = ctx.createBufferSource();
  source.buffer = noise;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = frequency;

  const gain = envelope(ctx, at, peak, seconds);
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

// Each voice returns the gain nodes it ends in, so the caller has one thing to connect.
const SOUNDS = {
  kick: (hit) => [tone(hit, { from: 150, to: 45, type: 'sine', peak: hit.accent ? 1 : 0.85, seconds: 0.18 })],
  snare: (hit) => [
    burst(hit, { frequency: 1200, peak: 0.7, seconds: 0.12 }),
    tone(hit, { from: 190, to: 160, type: 'triangle', peak: 0.3, seconds: 0.09 }),
  ],
  // Louder and longer on the downbeat, which is what makes the length of a bar audible and keeps
  // a 2/4 from sounding like a 4/4.
  hat: (hit) => [
    burst(hit, { frequency: 9000, peak: hit.accent ? 0.45 : 0.2, seconds: hit.accent ? 0.07 : 0.04 }),
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

  const schedule = () => {
    while (nextAt < ctx.currentTime + HORIZON) {
      // Read on every step, so a tempo or pattern edit lands within a beat rather than needing
      // the metronome stopped and started again.
      const current = pattern;
      const steps = stepCount(current);
      const index = step % steps;

      for (const voice of VOICES) {
        if (!current[voice].includes(index)) continue;
        for (const node of SOUNDS[voice]({ ctx, noise, at: nextAt, accent: index === 0 })) node.connect(out);
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
