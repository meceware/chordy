import { getDb } from '../src/lib/db.js';
import { songs } from '../src/data/fixtures.js';

const db = getDb();
const email = process.argv[2];

// Seeds onto a real account when one is named, so the fixtures are reachable after signing
// in; otherwise onto a placeholder that `npm run claim` can hand over later.
const owner = email
  ? db.prepare('SELECT id FROM user WHERE email = ? COLLATE NOCASE').get(email)?.id
  : 'dev-user';

if (!owner) {
  console.error(`No account for ${email}. Sign in once first, or omit the email.`);
  process.exit(1);
}

const insertSong = db.prepare(`
  INSERT INTO songs (
    user_id, title, artist, body, source_text, source_format, song_key,
    transpose, capo, bpm, media_url, tutorial_url, favourite
  ) VALUES (
    @userId, @title, @artist, @body, @body, 'text', @songKey,
    @transpose, @capo, @bpm, @mediaUrl, @tutorialUrl, @favourite
  )
`);

const insertTag = db.prepare('INSERT OR IGNORE INTO tags (user_id, name) VALUES (?, ?)');
const findTag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?');
const linkTag = db.prepare('INSERT OR IGNORE INTO song_tags (song_id, tag_id) VALUES (?, ?)');

const seed = db.transaction(() => {
  db.prepare('DELETE FROM songs WHERE user_id = ?').run(owner);
  db.prepare('DELETE FROM tags WHERE user_id = ?').run(owner);

  for (const song of songs) {
    const { lastInsertRowid } = insertSong.run({ ...song, userId: owner });

    for (const name of song.tags) {
      insertTag.run(owner, name);
      linkTag.run(lastInsertRowid, findTag.get(owner, name).id);
    }
  }
});

seed();

const count = db.prepare('SELECT COUNT(*) AS n FROM songs WHERE user_id = ?').get(owner).n;
console.log(`Seeded ${count} songs for ${owner}`);
