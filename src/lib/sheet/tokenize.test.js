import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeSheet, sheetChords, unrecognisedCount } from './tokenize.js';
import { transposeChordLine, transposeSheet } from './transpose.js';

const SHEET = [
  '[Intro]',
  'G       D       Em      C',
  '',
  '[Verse 1]',
  'G                 D',
  'Somewhere over the rainbow',
  'Em            C',
  'Way up high',
].join('\n');

test('classifies each line by type', () => {
  const lines = tokenizeSheet(SHEET);
  assert.deepEqual(lines.map((l) => l.type), [
    'section', 'chords', 'blank', 'section', 'chords', 'lyrics', 'chords', 'lyrics',
  ]);
  assert.equal(lines[0].label, 'Intro');
});

test('records the source column of every chord', () => {
  const [, intro] = tokenizeSheet(SHEET);
  assert.deepEqual(intro.tokens.map((t) => [t.text, t.column]), [
    ['G', 0], ['D', 8], ['Em', 16], ['C', 24],
  ]);
});

test('a chord-only line keeps its exact spacing', () => {
  const [, intro] = tokenizeSheet(SHEET);
  assert.equal(intro.text, 'G       D       Em      C');
});

test('lyric lines beginning with a note letter are not chord lines', () => {
  const lines = tokenizeSheet('Go and feel the day\nBut everything is fine');
  assert.deepEqual(lines.map((l) => l.type), ['lyrics', 'lyrics']);
});

test('tab blocks are passed through untouched', () => {
  const tab = 'e|--0--2--3--|\nB|--1--1--0--|';
  const lines = tokenizeSheet(tab);
  assert.deepEqual(lines.map((l) => l.type), ['tab', 'tab']);
  assert.equal(lines.join('') && lines[0].text, 'e|--0--2--3--|');
});

test('structural marks sit on a chord line without becoming chords', () => {
  const [line] = tokenizeSheet('| G  D | Em  C | x2');
  assert.equal(line.type, 'chords');
  assert.deepEqual(line.tokens.filter((t) => t.chord).map((t) => t.text), ['G', 'D', 'Em', 'C']);
});

test('a bar-separated chord line is not mistaken for tablature', () => {
  const [line] = tokenizeSheet('D  |  G  |  A  |  D  x2');
  assert.equal(line.type, 'chords');
  assert.deepEqual(line.tokens.filter((t) => t.chord).map((t) => t.text), ['D', 'G', 'A', 'D']);
});

test('a chord line with leading whitespace keeps its columns', () => {
  const [line] = tokenizeSheet('   Bm        F#m   G           A');
  assert.equal(line.type, 'chords');
  assert.deepEqual(line.tokens.map((t) => t.column), [3, 13, 19, 31]);
});

test('collects the distinct chords of a sheet', () => {
  assert.deepEqual(sheetChords(tokenizeSheet(SHEET)), ['G', 'D', 'Em', 'C']);
});

test('counts unrecognised tokens on chord lines', () => {
  const lines = tokenizeSheet('G  D  Zx9  C');
  assert.equal(lines[0].type, 'lyrics');
  assert.equal(unrecognisedCount(lines), 0);
});

test('transposing preserves columns when names keep their width', () => {
  const [, intro] = tokenizeSheet(SHEET);
  assert.equal(transposeChordLine(intro, 5), 'C       G       Am      F');
});

test('transposing shifts later chords right only as far as needed', () => {
  const [line] = tokenizeSheet('G   D   A');
  assert.equal(transposeChordLine(line, 1), 'Ab  Eb  Bb');
});

test('round trip through transpose and back is identity', () => {
  const [, intro] = tokenizeSheet(SHEET);
  const up = transposeSheet([intro], 4);
  const down = transposeSheet(up, -4);
  assert.equal(down[0].text, intro.text);
});

test('the sheet body survives tokenizing unchanged', () => {
  const lines = tokenizeSheet(SHEET);
  assert.equal(lines.map((l) => l.text).join('\n'), SHEET);
});
