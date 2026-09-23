import { transposeName } from '../chords/parse.js';

/**
 * Re-emits a chord line at its original columns. When a transposed name grows (G to
 * G#) the tokens after it shift right by the minimum needed rather than the whole line
 * being re-flowed, so alignment with the lyric line below degrades locally instead of
 * everywhere.
 */
export function transposeChordLine(line, semitones) {
  if (!semitones) return line;

  let out = '';
  for (const token of line.tokens) {
    if (out.length < token.column) out = out.padEnd(token.column);
    else if (out.length > 0) out += ' ';
    out += token.chord ? transposeName(token.text, semitones) : token.text;
  }
  return out;
}

export function transposeSheet(lines, semitones) {
  if (!semitones) return lines;

  return lines.map((line) => {
    if (line.type !== 'chords') return line;

    const text = transposeChordLine(line, semitones);
    const tokens = [];
    const pattern = /\S+/g;
    let match = pattern.exec(text);

    while (match !== null) {
      const original = line.tokens[tokens.length];
      tokens.push({ text: match[0], column: match.index, chord: original ? original.chord : false });
      match = pattern.exec(text);
    }
    return { ...line, text, tokens };
  });
}
