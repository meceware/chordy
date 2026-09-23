import { prepared } from './db.js';
import { parseChord } from './chords/parse.js';
import { canonicalName } from './chords/normalize.js';

const SQL = {
  list: 'SELECT id, chord_key AS chordKey, name, frets, fingers, base_fret AS baseFret, barres FROM chord_shapes WHERE user_id = ? ORDER BY created_at',
  insert: `
    INSERT INTO chord_shapes (user_id, chord_key, name, frets, fingers, base_fret, barres)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  remove: 'DELETE FROM chord_shapes WHERE id = ? AND user_id = ?',
};

function hydrate(row) {
  return {
    id: row.id,
    name: row.name,
    frets: JSON.parse(row.frets),
    fingers: JSON.parse(row.fingers),
    baseFret: row.baseFret,
    barres: JSON.parse(row.barres),
  };
}

/** Grouped by canonical key, which is the shape `lookupChord` expects. */
export function chordShapeLibrary(userId) {
  const library = {};

  for (const row of prepared(SQL.list).all(userId)) {
    library[row.chordKey] ??= [];
    library[row.chordKey].push(hydrate(row));
  }
  return library;
}

export function addChordShape(userId, name, shape) {
  const chord = parseChord(name);
  if (!chord) return { error: `“${name}” is not a chord name.` };

  const frets = shape.frets;
  if (!Array.isArray(frets) || frets.length !== 6) return { error: 'A shape needs a fret for each of the six strings.' };
  if (frets.every((fret) => fret <= 0)) return { error: 'At least one string has to be fretted.' };

  prepared(SQL.insert).run(
    userId,
    canonicalName(chord),
    name,
    JSON.stringify(frets),
    JSON.stringify(shape.fingers ?? frets.map(() => 0)),
    shape.baseFret ?? 1,
    JSON.stringify(shape.barres ?? []),
  );
  return { ok: true };
}

export function removeChordShape(userId, id) {
  prepared(SQL.remove).run(Number(id), userId);
}
