import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeSheet } from './tokenize.js';
import { pairLine, groupCells } from './pair.js';

function pairOf(chords, lyrics) {
  const [chordLine, lyricLine] = tokenizeSheet(`${chords}\n${lyrics}`);
  return pairLine(chordLine, lyricLine);
}

test('each chord takes the lyric fragment that starts beneath it', () => {
  const cells = pairOf('C                 Em', 'Somewhere over the rainbow');

  assert.deepEqual(cells.map((c) => [c.chord?.text ?? null, c.text]), [
    ['C', 'Somewhere over the '],
    ['Em', 'rainbow'],
  ]);
});

test('lyric text before the first chord becomes a leading cell', () => {
  const cells = pairOf('     G', 'Hey there you');

  assert.equal(cells[0].chord, null);
  assert.equal(cells[0].text, 'Hey t');
  assert.equal(cells[1].chord.text, 'G');
  assert.equal(cells[1].text, 'here you');
});

test('the fragments always rejoin into the original lyric line', () => {
  const lyric = "There's a land that I heard of once in a lullaby";
  const cells = pairOf('F              C        G       Am    F', lyric);

  assert.equal(cells.map((c) => c.text).join(''), lyric);
});

test('a chord landing inside a word is glued to the cell before it', () => {
  const cells = pairOf('F      Am', 'Hallelujah');

  assert.equal(cells[0].text, 'Hallelu');
  assert.equal(cells[1].text, 'jah');
  assert.equal(cells[1].glued, true);
});

test('a chord landing on a word boundary is not glued', () => {
  const cells = pairOf('C    Em', 'Some words');

  assert.equal(cells[1].glued, false);
});

test('chords past the end of the lyric get empty fragments', () => {
  const cells = pairOf('C   G   Am', 'Short');

  assert.deepEqual(cells.map((c) => c.text), ['Shor', 't', '']);
});

test('a chord line with no lyrics yields one cell per chord', () => {
  const [chordLine] = tokenizeSheet('G       D       Em      C');
  const cells = pairLine(chordLine, null);

  assert.equal(cells.length, 4);
  assert.deepEqual(cells.map((c) => c.chord.text), ['G', 'D', 'Em', 'C']);
  assert.deepEqual(cells.map((c) => c.text), ['', '', '', '']);
});

test('a lyric line with no chords yields a single chordless cell', () => {
  assert.deepEqual(pairLine(null, { text: 'just words' }), [
    { chord: null, text: 'just words', glued: false },
  ]);
});

test('glued runs are grouped so a word never breaks across lines', () => {
  const cells = pairOf('F        Am       F', 'Hallelujah, Hallelujah');
  const groups = groupCells(cells);

  for (const group of groups) {
    assert.ok(group.length >= 1);
    assert.equal(group[0].glued, false);
    assert.ok(group.slice(1).every((cell) => cell.glued));
  }
  assert.equal(groups.flat().length, cells.length);
});
