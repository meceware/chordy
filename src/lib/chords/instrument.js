// Built by hand rather than taken from chords-db's instruments.json, which has no
// `tunings`. Plain note names because Neck renders each entry as a label, so the
// database's scientific pitch ('E2', 'A2') would print the octave numbers.
export const guitar = {
  strings: 6,
  fretsOnChord: 4,
  name: 'Guitar',
  keys: [],
  tunings: { standard: ['E', 'A', 'D', 'G', 'B', 'E'] },
};
