import guitarDb from '@tombatossals/chords-db/lib/guitar.json' with { type: 'json' };
import { parseChord, pitchOf, spell } from './parse.js';
import { dbKey, dbSuffix, dbBass, canonicalName } from './normalize.js';

function positionsFor(root, suffix) {
  // The database stores one spelling per pitch class, so A# has to become Bb and Db
  // has to become C# before the group name is built.
  const group = guitarDb.chords[dbKey(spell(pitchOf(root)))];
  if (!group) return null;
  return group.find((entry) => entry.suffix === suffix)?.positions ?? null;
}

/**
 * Resolves a chord name to its stored voicings. Only exact matches are returned — a shape
 * for a different chord is a wrong shape, however it is labelled — so a name the database
 * does not carry reports `missing` and the panel offers to record one instead.
 *
 * `shapes` is the user's own library, keyed by `canonicalName`, and takes precedence.
 */
export function lookupChord(name, shapes = {}) {
  const chord = parseChord(name);
  if (!chord) return { name, positions: [], custom: [], match: 'unparsed' };

  const custom = shapes[canonicalName(chord)] ?? [];
  const suffix = dbSuffix(chord.suffix);

  let positions = null;
  if (suffix) {
    if (chord.bass) {
      const slash = suffix === 'minor' ? `m/${dbBass(chord.bass)}` : `/${dbBass(chord.bass)}`;
      positions = positionsFor(chord.root, slash);
    } else {
      positions = positionsFor(chord.root, suffix);
    }
  }

  if (custom.length > 0 || positions) {
    return { name, positions: positions ?? [], custom, match: 'exact' };
  }
  return { name, positions: [], custom: [], match: 'missing' };
}

export function lookupMessage(result) {
  if (result.match === 'unparsed') return `${result.name} — not recognised as a chord.`;
  if (result.match === 'missing') return `No shape stored for ${result.name}.`;
  return null;
}

/**
 * Flattens the result into one addressable list. Your own shapes come first, then the
 * database's. The `db:` index is positional within the chords-db group, which is stable
 * because the dependency is pinned.
 */
export function chordVoicings(name, shapes = {}) {
  const result = lookupChord(name, shapes);

  return {
    ...result,
    voicings: [
      ...result.custom.map((shape) => ({ ref: `custom:${shape.id}`, position: shape, mine: true })),
      ...result.positions.map((position, index) => ({ ref: `db:${index}`, position, mine: false })),
    ],
  };
}

export function chordKeyOf(name) {
  const chord = parseChord(name);
  return chord ? canonicalName(chord) : null;
}
