import { getDb, prepared } from './db.js';

const SONG_COLUMNS = `
  id, title, artist, body, source_text AS sourceText, source_format AS sourceFormat,
  song_key AS songKey, transpose, capo, bpm, media_url AS mediaUrl,
  tutorial_url AS tutorialUrl, scroll_speed AS scrollSpeed, metronome, favourite,
  created_at AS createdAt, updated_at AS updatedAt
`;

const SQL = {
  list: `
    SELECT ${SONG_COLUMNS}, v.viewed_at AS viewedAt
    FROM songs
    LEFT JOIN song_views v ON v.song_id = songs.id AND v.user_id = songs.user_id
    WHERE songs.user_id = ?
    ORDER BY title COLLATE NOCASE
  `,
  byId: `SELECT ${SONG_COLUMNS} FROM songs WHERE id = ? AND user_id = ?`,
  tagsFor: `
    SELECT st.song_id AS songId, t.name
    FROM song_tags st
    JOIN tags t ON t.id = st.tag_id
    WHERE t.user_id = ?
    ORDER BY t.name COLLATE NOCASE
  `,
  recordView: `
    INSERT INTO song_views (user_id, song_id, viewed_at) VALUES (?, ?, ?)
    ON CONFLICT (user_id, song_id) DO UPDATE SET viewed_at = excluded.viewed_at
  `,
  setTranspose: 'UPDATE songs SET transpose = ?, updated_at = ? WHERE id = ? AND user_id = ?',
  toggleFavourite: 'UPDATE songs SET favourite = 1 - favourite, updated_at = ? WHERE id = ? AND user_id = ?',
  setScrollSpeed: 'UPDATE songs SET scroll_speed = ? WHERE id = ? AND user_id = ?',
  setMetronome: 'UPDATE songs SET metronome = ? WHERE id = ? AND user_id = ?',
  setBpm: 'UPDATE songs SET bpm = ? WHERE id = ? AND user_id = ?',
};

function groupTags(userId) {
  const grouped = new Map();
  for (const row of prepared(SQL.tagsFor).all(userId)) {
    const names = grouped.get(row.songId) ?? [];
    names.push(row.name);
    grouped.set(row.songId, names);
  }
  return grouped;
}

export function listSongs(userId) {
  const tags = groupTags(userId);
  return prepared(SQL.list).all(userId).map((song) => ({ ...song, tags: tags.get(song.id) ?? [] }));
}

export function getSong(userId, id) {
  const song = prepared(SQL.byId).get(Number(id), userId);
  if (!song) return null;
  return { ...song, tags: groupTags(userId).get(song.id) ?? [] };
}

export function recordView(userId, id) {
  prepared(SQL.recordView).run(userId, Number(id), Date.now());
}

export function setTranspose(userId, id, semitones) {
  prepared(SQL.setTranspose).run(semitones, Date.now(), Number(id), userId);
}

export function toggleFavourite(userId, id) {
  prepared(SQL.toggleFavourite).run(Date.now(), Number(id), userId);
}

// Deliberately not touching updated_at: the sheet did not change, only how fast it rolls past.
export function setScrollSpeed(userId, id, speed) {
  prepared(SQL.setScrollSpeed).run(speed, Number(id), userId);
}

export function setMetronome(userId, id, pattern) {
  prepared(SQL.setMetronome).run(pattern, Number(id), userId);
}

// Tempo set from the metronome is the same field the editor writes, so the info bar and the
// scroll-speed derivation both pick it up. updated_at stays put, as with the other play controls.
export function setBpm(userId, id, bpm) {
  prepared(SQL.setBpm).run(bpm, Number(id), userId);
}

const WRITE = {
  insert: `
    INSERT INTO songs (
      user_id, title, artist, body, source_text, source_format,
      song_key, capo, bpm, media_url, tutorial_url
    ) VALUES (
      @userId, @title, @artist, @body, @sourceText, @sourceFormat,
      @songKey, @capo, @bpm, @mediaUrl, @tutorialUrl
    )
  `,
  update: `
    UPDATE songs SET
      title = @title, artist = @artist, body = @body, song_key = @songKey,
      capo = @capo, bpm = @bpm, media_url = @mediaUrl, tutorial_url = @tutorialUrl,
      updated_at = @updatedAt
    WHERE id = @id AND user_id = @userId
  `,
  remove: 'DELETE FROM songs WHERE id = ? AND user_id = ?',
  duplicate: `
    SELECT id, title, artist FROM songs
    WHERE user_id = ? AND title = ? COLLATE NOCASE
      AND IFNULL(artist, '') = IFNULL(?, '') COLLATE NOCASE
      AND id IS NOT ?
    LIMIT 1
  `,
  allTags: 'SELECT name FROM tags WHERE user_id = ? ORDER BY name COLLATE NOCASE',
  insertTag: 'INSERT OR IGNORE INTO tags (user_id, name) VALUES (?, ?)',
  findTag: 'SELECT id FROM tags WHERE user_id = ? AND name = ?',
  clearSongTags: 'DELETE FROM song_tags WHERE song_id = ?',
  linkTag: 'INSERT OR IGNORE INTO song_tags (song_id, tag_id) VALUES (?, ?)',
  pruneTags: 'DELETE FROM tags WHERE user_id = ? AND id NOT IN (SELECT tag_id FROM song_tags)',
};

export function findDuplicate(userId, title, artist, excludeId = null) {
  return prepared(WRITE.duplicate).get(userId, title, artist ?? '', excludeId) ?? null;
}

export function listTags(userId) {
  return prepared(WRITE.allTags).all(userId).map((row) => row.name);
}

function applyTags(userId, songId, tags) {
  prepared(WRITE.clearSongTags).run(songId);

  for (const raw of tags) {
    const name = raw.trim();
    if (!name) continue;

    prepared(WRITE.insertTag).run(userId, name);
    prepared(WRITE.linkTag).run(songId, prepared(WRITE.findTag).get(userId, name).id);
  }

  pruneTags(userId);
}

/**
 * A tag exists to label songs, so one that labels none is gone. Without this the editor's
 * suggestions fill up with names whose last song was renamed or deleted years ago. Runs after
 * every link change, inside the caller's transaction.
 */
function pruneTags(userId) {
  prepared(WRITE.pruneTags).run(userId);
}

export function createSong(userId, fields, tags = []) {
  return getDb().transaction(() => {
    const { lastInsertRowid } = prepared(WRITE.insert).run({ userId, ...fields });
    applyTags(userId, lastInsertRowid, tags);
    return Number(lastInsertRowid);
  })();
}

export function updateSong(userId, id, fields, tags = []) {
  getDb().transaction(() => {
    prepared(WRITE.update).run({ userId, id: Number(id), updatedAt: Date.now(), ...fields });
    applyTags(userId, Number(id), tags);
  })();
}

export function deleteSong(userId, id) {
  getDb().transaction(() => {
    // song_tags goes with the song by cascade, which can orphan the tags themselves.
    prepared(WRITE.remove).run(Number(id), userId);
    pruneTags(userId);
  })();
}

/**
 * The songs either side of this one for the play bar, in title order.
 *
 * It used to walk recently-viewed order, to match the home page's default sort. That could not
 * work: opening a song records a view, which moves it to the front of the very sequence being
 * walked, so with two songs you end up pinned at one end and next/previous swap on every step.
 * A sequence you navigate cannot be ordered by the act of navigating it. Title order is stable,
 * reaches every song, and reads the same on every visit.
 */
export function songNeighbours(userId, songId) {
  const ordered = prepared(SQL.list).all(userId);
  const index = ordered.findIndex((song) => song.id === Number(songId));
  if (index === -1) return { previous: null, next: null };

  const at = (position) => {
    const song = ordered[position];
    return song ? { id: song.id, title: song.title } : null;
  };

  return { previous: index > 0 ? at(index - 1) : null, next: at(index + 1) };
}
