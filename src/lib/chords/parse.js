const PITCH = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, 'E#': 5, Fb: 4,
  F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10,
  B: 11, 'B#': 0, Cb: 11,
};

// Indexed by pitch class. Matches chords-db's `keys` array exactly, which is why a
// transposed root can be handed to the diagram lookup without further translation.
const ROOT_SPELLING = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Suffixes accepted as chords, mapped to how they are written back out. Case matters:
// `M7` is major seventh, `m7` is minor seventh. Anything absent makes the token a
// lyric rather than a chord, which is the conservative direction — a false positive
// turns a word into a clickable chord, a false negative just renders plain text.
const SUFFIXES = new Set([
  '', '5', 'maj', 'M', 'm', 'min', '-', 'dim', 'dim7', '°', '°7', 'aug', '+',
  'sus', 'sus2', 'sus4', '7sus', '7sus4', '7sus2', 'alt',
  '6', '69', '6/9', '7', 'dom7', '7b5', '7#5', '7+5', 'aug7',
  '9', '9b5', '9#5', 'aug9', '7b9', '7#9', '7b13', '11', '9#11', '13', '13b9',
  'maj7', 'M7', 'maj7b5', 'maj7#5', 'maj9', 'M9', 'maj11', 'maj13',
  'm6', 'min6', '-6', 'm69', 'm7', 'min7', '-7', 'm7b5', 'min7b5', 'm9', 'min9',
  'm11', 'm13', 'mmaj7', 'mM7', 'mmaj7b5', 'mmaj9', 'mmaj11',
  'add9', 'add11', 'madd9', '2', '4',
]);

const ROOT = /^([A-G][#b]?)(.*)$/;

export function parseChord(token) {
  const match = ROOT.exec(token);
  if (!match) return null;
  const [, root, rest] = match;

  // Try the whole remainder as a suffix before splitting on '/', because some
  // suffixes contain a slash themselves (C6/9) and would otherwise be read as a
  // slash bass of '9'.
  if (SUFFIXES.has(rest)) return { root, suffix: rest, bass: null };

  const slash = rest.lastIndexOf('/');
  if (slash === -1) return null;

  const suffix = rest.slice(0, slash);
  const bass = rest.slice(slash + 1);
  if (!SUFFIXES.has(suffix) || !(bass in PITCH)) return null;

  return { root, suffix, bass };
}

export function isChord(token) {
  return parseChord(token) !== null;
}

function formatChord(chord) {
  return chord.root + chord.suffix + (chord.bass ? `/${chord.bass}` : '');
}

function shift(note, semitones) {
  return ROOT_SPELLING[(((PITCH[note] + semitones) % 12) + 12) % 12];
}

function transposeChord(chord, semitones) {
  if (!semitones) return chord;
  return {
    root: shift(chord.root, semitones),
    suffix: chord.suffix,
    bass: chord.bass ? shift(chord.bass, semitones) : null,
  };
}

export function transposeName(token, semitones) {
  const chord = parseChord(token);
  if (!chord) return token;
  return formatChord(transposeChord(chord, semitones));
}

export function pitchOf(note) {
  return PITCH[note];
}

export function spell(pitch) {
  return ROOT_SPELLING[((pitch % 12) + 12) % 12];
}
