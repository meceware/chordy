import { isChord } from '../chords/parse.js';

const TAB_LINE = /^\s*[eEADGBb]\s*[|:]/;
const DASH_RUN = /-{2,}/g;
const SECTION_BRACKET = /^\s*\[([^\]]+)\]\s*$/;
const SECTION_COLON = /^\s*([A-Z][A-Za-z0-9 .'#-]{0,28}):\s*$/;

// Written on a chord line but not themselves chords.
const STRUCTURAL = /^(\|{1,2}|:\||\|:|%|\/|x\d+|\d+x|N\.?C\.?|\(.*\)|\[.*\]|-+)$/i;

// A dash run is required, because a chord line like "D | G | A | D" also opens with a
// note letter followed by a bar and would otherwise be mistaken for tablature.
function isTabLine(line) {
  const runs = line.match(DASH_RUN);
  if (runs === null) return false;
  return TAB_LINE.test(line) || runs.length >= 3;
}

function chordTokens(line) {
  const tokens = [];
  const pattern = /\S+/g;
  let match = pattern.exec(line);

  while (match !== null) {
    tokens.push({ text: match[0], column: match.index });
    match = pattern.exec(line);
  }
  return tokens;
}

function isChordLine(tokens) {
  if (tokens.length === 0) return false;
  let chords = 0;

  for (const token of tokens) {
    if (isChord(token.text)) chords += 1;
    else if (!STRUCTURAL.test(token.text)) return false;
  }
  return chords > 0;
}

export function tokenizeSheet(body) {
  return body.split('\n').map((text) => {
    if (text.trim() === '') return { type: 'blank', text };
    if (isTabLine(text)) return { type: 'tab', text };

    const bracket = SECTION_BRACKET.exec(text);
    if (bracket) return { type: 'section', text, label: bracket[1] };

    const tokens = chordTokens(text);
    if (isChordLine(tokens)) {
      return { type: 'chords', text, tokens: tokens.map((t) => ({ ...t, chord: isChord(t.text) })) };
    }

    const colon = SECTION_COLON.exec(text);
    if (colon) return { type: 'section', text, label: colon[1] };

    return { type: 'lyrics', text };
  });
}

export function sheetChords(lines) {
  const seen = new Set();
  for (const line of lines) {
    if (line.type !== 'chords') continue;
    for (const token of line.tokens) {
      if (token.chord) seen.add(token.text);
    }
  }
  return [...seen];
}

export function unrecognisedCount(lines) {
  let count = 0;
  for (const line of lines) {
    if (line.type !== 'chords') continue;
    for (const token of line.tokens) {
      if (!token.chord && !STRUCTURAL.test(token.text)) count += 1;
    }
  }
  return count;
}
