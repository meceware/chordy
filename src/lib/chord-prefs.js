import { prepared } from './db.js';
import { parseChord } from './chords/parse.js';
import { canonicalName } from './chords/normalize.js';

const SQL = {
  list: 'SELECT chord_key AS chordKey, shape_ref AS shapeRef FROM song_chord_prefs WHERE song_id = ?',
  add: 'INSERT OR IGNORE INTO song_chord_prefs (song_id, chord_key, shape_ref) VALUES (?, ?, ?)',
  remove: 'DELETE FROM song_chord_prefs WHERE song_id = ? AND chord_key = ? AND shape_ref = ?',
  owns: 'SELECT 1 FROM songs WHERE id = ? AND user_id = ?',
};

function keyFor(name) {
  const chord = parseChord(name);
  return chord ? canonicalName(chord) : null;
}

/** Canonical chord name to the list of voicings this song pins for it. */
export function chordPrefs(songId) {
  const prefs = {};
  for (const row of prepared(SQL.list).all(Number(songId))) {
    prefs[row.chordKey] ??= [];
    prefs[row.chordKey].push(row.shapeRef);
  }
  return prefs;
}

function ownsSong(userId, songId) {
  return Boolean(prepared(SQL.owns).get(Number(songId), userId));
}

export function addChordPref(userId, songId, name, shapeRef) {
  const key = keyFor(name);
  if (!key || !ownsSong(userId, songId)) return;
  prepared(SQL.add).run(Number(songId), key, shapeRef);
}

export function removeChordPref(userId, songId, name, shapeRef) {
  const key = keyFor(name);
  if (!key || !ownsSong(userId, songId)) return;
  prepared(SQL.remove).run(Number(songId), key, shapeRef);
}
