import { isChord } from '../chords/parse.js';

const DIRECTIVE = /^\s*\{\s*[a-z_]+\s*[:}]/im;
const BRACKETED = /\[([^\]]*)\]/g;

/**
 * Distinguishes ChordPro from the chords-over-lyrics layout. The discriminator is an
 * inline `[Chord]` sitting in a line that also has lyric text — a bracket alone on its
 * own line is a section header like `[Verse 1]`, which both formats use.
 */
export function detectFormat(text) {
  if (DIRECTIVE.test(text)) return 'chordpro';

  for (const line of text.split('\n')) {
    const brackets = [...line.matchAll(BRACKETED)];
    if (brackets.length === 0) continue;

    const outside = line.replace(BRACKETED, '').trim();
    if (outside === '') continue;

    if (brackets.some((match) => isChord(match[1]))) return 'chordpro';
  }

  return 'text';
}
