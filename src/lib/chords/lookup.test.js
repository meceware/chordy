import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupChord, chordVoicings, chordKeyOf } from './lookup.js';
import { dbKey, dbBass, canonicalName } from './normalize.js';
import { spell, parseChord } from './parse.js';

test('finds plain and minor triads', () => {
  const c = lookupChord('C');
  assert.equal(c.match, 'exact');
  assert.equal(c.positions.length, 4);
  assert.deepEqual(c.positions[0].frets, [-1, 3, 2, 0, 1, 0]);

  assert.equal(lookupChord('Am').match, 'exact');
  assert.equal(lookupChord('F#m7b5').match, 'exact');
});

test('resolves enharmonic roots to the spelling the database uses', () => {
  assert.equal(lookupChord('A#').match, 'exact');
  assert.equal(lookupChord('Db').match, 'exact');
  assert.equal(lookupChord('D#m').match, 'exact');
  assert.equal(lookupChord('Gb').match, 'exact');
});

test('finds slash chords that are stored', () => {
  const g = lookupChord('G/B');
  assert.equal(g.match, 'exact');
  assert.equal(g.positions.length, 3);
});

test('never substitutes a different chord for a missing one', () => {
  // C exists but C/G# and C/B do not; showing C's shapes would be showing a wrong chord.
  for (const name of ['C/G#', 'C/B', 'Cm13', 'Dadd11']) {
    const result = lookupChord(name);
    assert.equal(result.match, 'missing', name);
    assert.deepEqual(result.positions, [], name);
  }

  assert.equal(lookupChord('C13').match, 'exact');
});

test('a stored custom shape answers a name the database lacks', () => {
  const shape = { frets: [-1, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], baseFret: 1, barres: [] };
  const shapes = { [canonicalName(parseChord('C/B'))]: [shape] };

  const result = lookupChord('C/B', shapes);
  assert.equal(result.match, 'exact');
  assert.deepEqual(result.custom, [shape]);

  // The same shape is found when the sheet spells the chord differently.
  assert.equal(lookupChord('C/B', shapes).custom.length, 1);
});

test('custom shapes sit alongside the database ones for a known chord', () => {
  const shape = { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], baseFret: 1, barres: [] };
  const result = lookupChord('C', { [canonicalName(parseChord('C'))]: [shape] });

  assert.equal(result.match, 'exact');
  assert.equal(result.custom.length, 1);
  assert.equal(result.positions.length, 4);
});

test('reports a miss rather than guessing', () => {
  const five = lookupChord('C5');
  assert.equal(five.match, 'missing');
  assert.deepEqual(five.positions, []);

  assert.equal(lookupChord('Chorus').match, 'unparsed');
});

test('bass spelling table differs from root spelling, as the database does', () => {
  assert.equal(spell(3), 'Eb');
  assert.equal(dbBass('Eb'), 'D#');
  assert.equal(spell(8), 'Ab');
  assert.equal(dbBass('Ab'), 'G#');
  assert.equal(dbBass('A#'), 'Bb');
});

test('sharp roots address the sharp-word database keys', () => {
  assert.equal(dbKey('C#'), 'Csharp');
  assert.equal(dbKey('F#'), 'Fsharp');
  assert.equal(dbKey('Bb'), 'Bb');
});

test('every chord reachable by transposing a triad has a diagram', () => {
  for (let pitch = 0; pitch < 12; pitch += 1) {
    for (const suffix of ['', 'm', '7', 'm7', 'maj7', 'sus4', 'sus2', 'dim', 'aug', '6', '9']) {
      const name = spell(pitch) + suffix;
      assert.equal(lookupChord(name).match, 'exact', `${name} should resolve exactly`);
    }
  }
});

test('voicings are addressable, with your own shapes first', () => {
  const shape = { id: 9, frets: [-1, 2, 0, 0, 1, 0], fingers: [0, 0, 0, 0, 0, 0], baseFret: 1, barres: [] };
  const { voicings } = chordVoicings('C', { [canonicalName(parseChord('C'))]: [shape] });

  assert.equal(voicings[0].ref, 'custom:9');
  assert.equal(voicings[0].mine, true);
  assert.deepEqual(voicings.slice(1).map((v) => v.ref), ['db:0', 'db:1', 'db:2', 'db:3']);
  assert.ok(voicings.slice(1).every((v) => v.mine === false));
});

test('a chord key is stable across respellings', () => {
  assert.equal(chordKeyOf('Bb'), chordKeyOf('A#'));
  assert.equal(chordKeyOf('Cmaj7'), chordKeyOf('CM7'));
  assert.equal(chordKeyOf('G/B'), 'G|major|B');
  assert.equal(chordKeyOf('Chorus'), null);
});
