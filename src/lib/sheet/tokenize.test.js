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

test('tab lines with lowercase or trailing notes are recognised', () => {
  const tab = [
    'e|---------------0-----|',
    'b|-------------0-----0-|',
    'g|-----------3-----3---|',
    'd|-----2---------------| Repeat',
    'a|---------------------|',
    'e|-0-------------------|',
  ].join('\n');
  assert.ok(tokenizeSheet(tab).every((l) => l.type === 'tab'));
});

test('a chord line can end with a repeat mark and a note', () => {
  const [line] = tokenizeSheet(' Em x 3 then chords');
  assert.equal(line.type, 'chords');
  assert.deepEqual(line.tokens.filter((t) => t.chord).map((t) => t.text), ['Em']);
  assert.equal(unrecognisedCount([line]), 0);
});

test('a lyric opening with a single chord name stays a lyric', () => {
  const lines = tokenizeSheet('A man walked in\nAm I dreaming');
  assert.deepEqual(lines.map((l) => l.type), ['lyrics', 'lyrics']);
});

test('arrows between chords are structural marks', () => {
  for (const text of ['C -> D x3', 'C → D', 'E G A D x 3']) {
    const [line] = tokenizeSheet(text);
    assert.equal(line.type, 'chords', text);
  }
  const [line] = tokenizeSheet('C -> D x3');
  assert.deepEqual(line.tokens.filter((t) => t.chord).map((t) => t.text), ['C', 'D']);
});
