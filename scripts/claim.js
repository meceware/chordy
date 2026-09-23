import { getDb } from '../src/lib/db.js';

const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run claim -- you@example.com');
  console.error('Moves data owned by a placeholder id onto the real account for that email.');
  process.exit(1);
}

const db = getDb();
const user = db.prepare('SELECT id, email FROM user WHERE email = ? COLLATE NOCASE').get(email);

if (!user) {
  console.error(`No account for ${email}. Sign in once first, then run this.`);
  process.exit(1);
}

// Orphaned means owned by an id that is not a real account — the seeded 'dev-user' from
// before sign-in existed. Scoping it this way makes the script safe to re-run.
const orphaned = 'user_id NOT IN (SELECT id FROM user)';

/**
 * Tags are `UNIQUE (user_id, name)`, so a plain UPDATE fails the moment the account already
 * has a tag of the same name — which it does as soon as you save one song before claiming.
 * Same-named tags are merged into the account's own instead.
 */
function claimTags() {
  const mine = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ? COLLATE NOCASE');
  // OR IGNORE because the song may already carry the account's own copy of the tag.
  const repoint = db.prepare('UPDATE OR IGNORE song_tags SET tag_id = ? WHERE tag_id = ?');
  const dropLinks = db.prepare('DELETE FROM song_tags WHERE tag_id = ?');
  const dropTag = db.prepare('DELETE FROM tags WHERE id = ?');
  const adopt = db.prepare('UPDATE tags SET user_id = ? WHERE id = ?');

  let moved = 0;
  let merged = 0;

  for (const tag of db.prepare(`SELECT id, name FROM tags WHERE ${orphaned}`).all()) {
    const own = mine.get(user.id, tag.name);
    if (!own) {
      adopt.run(user.id, tag.id);
      moved += 1;
      continue;
    }

    repoint.run(own.id, tag.id);
    dropLinks.run(tag.id);
    dropTag.run(tag.id);
    merged += 1;
  }

  return { moved, merged };
}

const moved = db.transaction(() => {
  const songs = db.prepare(`UPDATE songs SET user_id = ? WHERE ${orphaned}`).run(user.id).changes;
  const tags = claimTags();
  const views = db.prepare(`UPDATE OR REPLACE song_views SET user_id = ? WHERE ${orphaned}`).run(user.id).changes;
  const shapes = db.prepare(`UPDATE chord_shapes SET user_id = ? WHERE ${orphaned}`).run(user.id).changes;
  return { songs, tags: tags.moved, tagsMerged: tags.merged, views, shapes };
})();

console.log(`Moved to ${user.email}:`, moved);
