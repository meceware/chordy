import test from 'node:test';
import assert from 'node:assert/strict';
import { detectFormat } from './detect.js';
import { chordproToText } from './chordpro-to-text.js';
import { tokenizeSheet } from './tokenize.js';

const UG = [
  '[Intro]',
  'G       D       Em      C',
  '',
  '[Verse 1]',
  'G                  D',
  'Somewhere over the rainbow',
].join('\n');

const CHORDPRO = [
  '{title: Somewhere Over the Rainbow}',
  '{artist: Harold Arlen}',
  '{key: C}',
  '{capo: 2}',
  '',
  '{start_of_verse: Verse 1}',
  '[C]Somewhere over the [Em]rainbow',
  '[F]Way up [C]high',
  '{end_of_verse}',
].join('\n');

test('a chords-over-lyrics sheet is detected as text', () => {
  assert.equal(detectFormat(UG), 'text');
});

test('section headers alone on a line do not look like ChordPro', () => {
  assert.equal(detectFormat('[Verse 1]\nG  D\nsome words'), 'text');
  assert.equal(detectFormat('[Chorus]\n[Bridge]'), 'text');
});

test('inline chords and directives are detected as ChordPro', () => {
  assert.equal(detectFormat(CHORDPRO), 'chordpro');
  assert.equal(detectFormat('[C]Somewhere over the [Em]rainbow'), 'chordpro');
  assert.equal(detectFormat('{soc}\nsomething\n{eoc}'), 'chordpro');
});

test('ChordPro metadata directives become song fields', () => {
  const { meta } = chordproToText(CHORDPRO);
  assert.deepEqual(meta, {
    title: 'Somewhere Over the Rainbow',
    artist: 'Harold Arlen',
    songKey: 'C',
    capo: 2,
  });
});

test('inline chords become a chord line above the lyric line', () => {
  const { body } = chordproToText('[C]Somewhere over the [Em]rainbow');
  assert.deepEqual(body.split('\n'), [
    'C                  Em',
    'Somewhere over the rainbow',
  ]);
});

test('the lyric text is never altered by conversion', () => {
  const { body } = chordproToText('[Cmaj7]Way [G/B]up [Am7]high');
  const [, lyrics] = body.split('\n');
  assert.equal(lyrics, 'Way up high');
});

test('a wide chord shifts the next chord right instead of padding the lyric', () => {
  const { body } = chordproToText('[Cmaj7]Way [G]up');
  const [chords, lyrics] = body.split('\n');
  assert.equal(lyrics, 'Way up');
  assert.equal(chords, 'Cmaj7 G');
});

test('section directives become bracketed headers', () => {
  const { body } = chordproToText('{start_of_chorus}\n[C]Hey\n{end_of_chorus}');
  assert.equal(body.split('\n')[0], '[Chorus]');

  const labelled = chordproToText('{start_of_verse: Verse 2}\n[C]Hey');
  assert.equal(labelled.body.split('\n')[0], '[Verse 2]');
});

test('tab blocks pass through verbatim', () => {
  const { body } = chordproToText('{sot}\ne|--0--2--3--|\nB|--1--1--0--|\n{eot}');
  assert.deepEqual(body.split('\n'), ['e|--0--2--3--|', 'B|--1--1--0--|']);
});

test('a chord-only line produces no empty lyric line', () => {
  const { body } = chordproToText('[G]    [D]    [Em]');
  assert.deepEqual(body.split('\n'), ['G   D   Em']);
});

test('converted output re-tokenizes into the line types the renderer expects', () => {
  const { body } = chordproToText(CHORDPRO);
  const types = tokenizeSheet(body).map((line) => line.type);

  assert.deepEqual(types, ['section', 'chords', 'lyrics', 'chords', 'lyrics']);
});

test('converting text that is already two-line leaves it alone', () => {
  const { body } = chordproToText(UG);
  assert.equal(body, UG.trim());
});
