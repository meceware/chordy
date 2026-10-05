import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenizeSheet } from './tokenize.js';
import { pairLine, wordsOf } from './pair.js';

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
    { chord: null, text: 'just words' },
  ]);
});

function wordsOfPair(chords, lyrics) {
  return wordsOf(pairOf(chords, lyrics)).map((word) => word.map((segment) => segment.text).join(''));
}

test('a chord inside a word keeps the word whole', () => {
  // G sits over the "n" of "answer" and F over the "e" of "be"; wrapping by cell used to
  // strand the "a" and the "b" on the line below.
  assert.deepEqual(
    wordsOfPair('C                 G              F  C/E Dm7 C', 'There will be an answer, let it be'),
    ['There ', 'will ', 'be ', 'an ', 'answer, ', 'let ', 'it be'],
  );
});

test('a word split by a chord holds both chords, each over its own fragment', () => {
  const [word] = wordsOf(pairOf('F      Am', 'Hallelujah'));

  assert.deepEqual(word.map((segment) => [segment.chord?.text ?? null, segment.text]), [
    ['F', 'Hallelu'],
    ['Am', 'jah'],
  ]);
});

test('a chord wider than the word beneath it sits over the words that follow', () => {
  // Am/G over the "n" of "in" covers "n the", rather than padding "in" out to its width.
  const words = wordsOf(pairOf('    Am      Am/G  Fmaj7', '    living in the world'));
  const segments = words.flat().filter((segment) => segment.chord);

  assert.deepEqual(segments.map((segment) => [segment.chord.text, segment.text]), [
    ['Am', 'living '],
    ['Am/G', 'n the '],
    ['Fmaj7', 'world'],
  ]);
});

test('every chord appears exactly once, on the first word of its fragment', () => {
  const words = wordsOf(pairOf('F              C        G       Am    F', "There's a land that I heard of once"));
  const chords = words.flat().filter((segment) => segment.chord).map((segment) => segment.chord.text);

  assert.deepEqual(chords, ['F', 'C', 'G', 'Am', 'F']);
});

test('words always rejoin into the original lyric line', () => {
  const lyric = 'For though they may be parted, there is still a chance that they will see';
  const words = wordsOf(pairOf('     C                    G             Am        Am/G        Fmaj7    F6', lyric));

  assert.equal(words.flat().map((segment) => segment.text).join(''), lyric);
});

test('chords past the end of the lyric take the last words with them', () => {
  const words = wordsOf(pairOf('C                 G              F  C/E Dm7 C', 'Speaking words of wisdom, let it be'));
  const last = words.at(-1);

  assert.equal(last.map((segment) => segment.text).join(''), 'it be');
  assert.deepEqual(last.filter((segment) => segment.chord).map((segment) => segment.chord.text), ['F', 'C/E', 'Dm7', 'C']);
  assert.deepEqual(wordsOfPair('C   G   Am', 'Short'), ['Short']);
});

test('a line whose chords all sit over its lyric keeps every word free to wrap', () => {
  assert.deepEqual(wordsOfPair('       Am         G', 'Let it be, let it be'), ['Let ', 'it ', 'be, ', 'let ', 'it ', 'be']);
});
