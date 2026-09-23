import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESETS,
  VOICES,
  DEFAULT_PRESET,
  BPM_MIN,
  BPM_MAX,
  clampBpm,
  stepCount,
  isSilent,
  resizePattern,
  toggleStep,
  setStep,
  parsePattern,
  serialisePattern,
} from './metronome.js';

/**
 * What a pattern actually sounds like, reduced to its shortest repeating unit and tagged with its
 * subdivision rate. Two presets that differ only by how many times the same figure is written out
 * — a 12/8 against a 6/8, say — then collide instead of passing on a length difference.
 */
function sound(pattern) {
  const steps = stepCount(pattern);
  const cells = Array.from(
    { length: steps },
    (unused, step) => VOICES.filter((voice) => pattern[voice].includes(step)).join('+') || '-',
  );

  for (let period = 1; period <= steps; period += 1) {
    if (steps % period !== 0) continue;
    if (cells.every((cell, index) => cell === cells[index % period])) {
      return `${pattern.subbeats}:${cells.slice(0, period).join('|')}`;
    }
  }

  return `${pattern.subbeats}:${cells.join('|')}`;
}

test('every preset is fully described', () => {
  for (const [id, preset] of Object.entries(PRESETS)) {
    assert.ok(preset.label, `${id} has no label`);
    assert.ok(preset.beats > 0 && preset.subbeats > 0, `${id} has no grid`);
    for (const voice of VOICES) {
      assert.ok(Array.isArray(preset[voice]), `${id} is missing ${voice}`);
      assert.ok(
        preset[voice].every((step) => step < stepCount(preset)),
        `${id} places ${voice} outside its own grid`,
      );
    }
  }
  assert.ok(PRESETS[DEFAULT_PRESET]);
});

test('no two presets are the same figure written out twice', () => {
  const seen = new Map();

  for (const [id, preset] of Object.entries(PRESETS)) {
    const signature = sound(preset);
    assert.equal(seen.get(signature), undefined, `${id} is the same as ${seen.get(signature)}`);
    seen.set(signature, id);
  }
});

test('no preset leaves a beat you would count out loud silent', () => {
  for (const [id, preset] of Object.entries(PRESETS)) {
    for (let beat = 0; beat < preset.beats; beat += 1) {
      const step = beat * preset.subbeats;
      assert.ok(
        VOICES.some((voice) => preset[voice].includes(step)),
        `${id} is silent on beat ${beat + 1}`,
      );
    }
  }
});

test('resizing keeps the kick and snare that fit and re-lays the hat', () => {
  const half = resizePattern(PRESETS['4/4'], 2, 2);

  assert.equal(stepCount(half), 4);
  assert.deepEqual(half.kick, [0]);
  assert.deepEqual(half.snare, [2]);
  // Choosing a division is a request to hear it, so every subdivision gets a hat.
  assert.deepEqual(half.hat, [0, 1, 2, 3]);
  assert.deepEqual(resizePattern(PRESETS['4/4'], 4, 4).hat, Array.from({ length: 16 }, (u, i) => i));
});

test('3/4 and 6/8 hold the same subdivisions but group them differently', () => {
  const simple = PRESETS['3/4'];
  const compound = PRESETS['6/8'];

  assert.equal(stepCount(simple), stepCount(compound));
  assert.equal(simple.beats, 3);
  assert.equal(compound.beats, 2);
  // Where the beats fall is the whole difference: 2+2+2 against 3+3.
  assert.deepEqual([0, 1, 2].map((beat) => beat * simple.subbeats), [0, 2, 4]);
  assert.deepEqual([0, 1].map((beat) => beat * compound.subbeats), [0, 3]);
});

test('toggling a step adds it, then takes it away', () => {
  const empty = { beats: 1, subbeats: 2, kick: [], snare: [], hat: [] };

  assert.ok(isSilent(empty));

  const withKick = toggleStep(empty, 'kick', 1);
  assert.deepEqual(withKick.kick, [1]);
  assert.ok(!isSilent(withKick));
  assert.deepEqual(toggleStep(withKick, 'kick', 1).kick, []);
});

test('setting a step is idempotent, which is what dragging across cells relies on', () => {
  const pattern = { beats: 2, subbeats: 2, kick: [], snare: [], hat: [] };

  const on = setStep(pattern, 'kick', 2, true);
  assert.deepEqual(on.kick, [2]);
  // The same object back when nothing changes, so dragging over a painted cell is free.
  assert.equal(setStep(on, 'kick', 2, true), on);
  assert.deepEqual(setStep(on, 'kick', 2, false).kick, []);
});

test('a pattern survives a round trip through the database column', () => {
  const pattern = { beats: 3, subbeats: 4, kick: [0, 5], snare: [4], hat: [1, 2, 11] };
  assert.deepEqual(parsePattern(serialisePattern(pattern)), pattern);
});

test('a preset id stored before the grid existed still loads', () => {
  assert.deepEqual(parsePattern('4/4'), { ...PRESETS['4/4'] });
  assert.equal(parsePattern(null), null);
  assert.equal(parsePattern('not json and not a preset'), null);
  assert.equal(parsePattern('{"beats":0,"subbeats":2}'), null);
});

test('tempo is clamped to a playable range', () => {
  assert.equal(clampBpm(0), 90);
  assert.equal(clampBpm(10), BPM_MIN);
  assert.equal(clampBpm(1000), BPM_MAX);
  assert.equal(clampBpm(120.4), 120);
});
