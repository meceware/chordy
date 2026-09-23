import { pitchOf, spell } from './parse.js';

// chords-db spells bass notes differently from roots: pitch 3 is Eb as a root but D#
// as a bass, 8 is Ab but G#. Both tables are taken from guitar.json verbatim rather
// than derived, because the inconsistency is in the data.
const BASS_SPELLING = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

const DB_SUFFIX = {
  '': 'major', maj: 'major', M: 'major', 2: 'sus2', 4: 'sus4',
  m: 'minor', min: 'minor', '-': 'minor',
  dim: 'dim', o: 'dim', dim7: 'dim7', o7: 'dim7',
  aug: 'aug', '+': 'aug',
  sus: 'sus4', sus2: 'sus2', sus4: 'sus4',
  '7sus': '7sus4', '7sus4': '7sus4', alt: 'alt',
  6: '6', 69: '69', '6/9': '69',
  7: '7', dom7: '7', '7b5': '7b5',
  '7#5': 'aug7', '7+5': 'aug7', aug7: 'aug7',
  9: '9', '9b5': '9b5', '9#5': 'aug9', aug9: 'aug9',
  '7b9': '7b9', '7#9': '7#9', 11: '11', '9#11': '9#11', 13: '13',
  maj7: 'maj7', M7: 'maj7', 'maj7b5': 'maj7b5', 'maj7#5': 'maj7#5',
  maj9: 'maj9', M9: 'maj9', maj11: 'maj11', maj13: 'maj13',
  m6: 'm6', min6: 'm6', '-6': 'm6', m69: 'm69',
  m7: 'm7', min7: 'm7', '-7': 'm7',
  'm7b5': 'm7b5', 'min7b5': 'm7b5',
  m9: 'm9', min9: 'm9', m11: 'm11',
  mmaj7: 'mmaj7', mM7: 'mmaj7', 'mmaj7b5': 'mmaj7b5', mmaj9: 'mmaj9', mmaj11: 'mmaj11',
  add9: 'add9', madd9: 'madd9',
};

export function dbKey(root) {
  return root.replace('#', 'sharp');
}

export function dbSuffix(suffix) {
  return DB_SUFFIX[suffix] ?? null;
}

export function dbBass(bass) {
  const pitch = pitchOf(bass);
  return pitch === undefined ? null : BASS_SPELLING[pitch];
}

/**
 * A spelling-independent key for a chord, so a shape saved for Bb is found when the sheet
 * says A#, and one saved for CM7 is found when the sheet says Cmaj7.
 */
export function canonicalName(chord) {
  const root = spell(pitchOf(chord.root));
  const suffix = dbSuffix(chord.suffix) ?? chord.suffix;
  const bass = chord.bass ? spell(pitchOf(chord.bass)) : '';
  return `${root}|${suffix}|${bass}`;
}
