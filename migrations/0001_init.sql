CREATE TABLE songs (
  id            INTEGER PRIMARY KEY,
  -- No foreign key to BetterAuth's `user` table: its schema is created by a separate
  -- migration tool with no guaranteed ordering, and with foreign_keys ON a reference to
  -- a table that does not exist yet fails at insert time.
  user_id       TEXT    NOT NULL,
  title         TEXT    NOT NULL,
  artist        TEXT,
  body          TEXT    NOT NULL,
  source_text   TEXT,
  source_format TEXT    NOT NULL DEFAULT 'text',
  song_key      TEXT,
  transpose     INTEGER NOT NULL DEFAULT 0,
  capo          INTEGER,
  bpm           INTEGER,
  media_url     TEXT,
  tutorial_url  TEXT,
  favourite     INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE tags (
  id      INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  name    TEXT NOT NULL COLLATE NOCASE,
  UNIQUE (user_id, name)
);

CREATE TABLE song_tags (
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (song_id, tag_id)
);

CREATE TABLE song_views (
  user_id   TEXT    NOT NULL,
  song_id   INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  viewed_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, song_id)
);

CREATE INDEX idx_songs_user      ON songs(user_id, title COLLATE NOCASE);
CREATE INDEX idx_tags_user       ON tags(user_id);
CREATE INDEX idx_song_tags_tag   ON song_tags(tag_id);
CREATE INDEX idx_song_views_user ON song_views(user_id, viewed_at DESC);
