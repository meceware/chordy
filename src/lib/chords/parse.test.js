import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChord, isChord, transposeName } from './parse.js';

test('parses roots, suffixes and slash basses', () => {
  assert.deepEqual(parseChord('C'), { root: 'C', suffix: '', bass: null });
  assert.deepEqual(parseChord('Am'), { root: 'A', suffix: 'm', bass: null });
  assert.deepEqual(parseChord('Gmaj7'), { root: 'G', suffix: 'maj7', bass: null });
  assert.deepEqual(parseChord('F#m7b5'), { root: 'F#', suffix: 'm7b5', bass: null });
  assert.deepEqual(parseChord('D/F#'), { root: 'D', suffix: '', bass: 'F#' });
  assert.deepEqual(parseChord('Am/C'), { root: 'A', suffix: 'm', bass: 'C' });
  assert.deepEqual(parseChord('Bb'), { root: 'Bb', suffix: '', bass: null });
});

test('accepts the extended names chordsheetjs rejected', () => {
  assert.ok(isChord('C6/9'));
  assert.ok(isChord('Eadd9'));
  assert.ok(isChord('C5'));
});

test('suffix matching is case sensitive so M7 and m7 stay distinct', () => {
  assert.equal(parseChord('CM7').suffix, 'M7');
  assert.equal(parseChord('Cm7').suffix, 'm7');
});

test('rejects lyrics that merely start with a note letter', () => {
  const words = ['Go', 'And', 'Bit', 'Feel', 'Day', 'Everything', 'Cause', 'Do', 'Been', 'Girl'];
  for (const word of words) {
    assert.equal(isChord(word), false, `${word} should not parse as a chord`);
  }
});

test('transposes root and bass, leaving the suffix alone', () => {
  assert.equal(transposeName('G', 3), 'Bb');
  assert.equal(transposeName('Gmaj7', 1), 'Abmaj7');
  assert.equal(transposeName('D/F#', 2), 'E/Ab');
  assert.equal(transposeName('Bb', 1), 'B');
  assert.equal(transposeName('B', 1), 'C');
  assert.equal(transposeName('C', -1), 'B');
});

test('transposing by a full octave is identity in pitch', () => {
  assert.equal(transposeName('F#m', 12), 'F#m');
  assert.equal(transposeName('F#m', -12), 'F#m');
});

test('never spells a transposed chord as B#, Fb or Cb', () => {
  const forbidden = ['B#', 'Fb', 'Cb', 'E#', 'A#', 'Db', 'Gb', 'D#', 'G#'];
  for (let semitones = -12; semitones <= 12; semitones += 1) {
    for (const name of ['C', 'F', 'B', 'Eb', 'F#', 'Bb']) {
      const root = parseChord(transposeName(name, semitones)).root;
      assert.ok(!forbidden.includes(root), `${name} + ${semitones} gave ${root}`);
    }
  }
});

test('leaves unparseable tokens untouched when transposing', () => {
  assert.equal(transposeName('Chorus', 2), 'Chorus');
});
