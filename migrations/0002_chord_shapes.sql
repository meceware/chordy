CREATE TABLE chord_shapes (
  id         INTEGER PRIMARY KEY,
  user_id    TEXT    NOT NULL,
  -- Canonical lookup key from the parser, so Bb and A# resolve to the same shape.
  chord_key  TEXT    NOT NULL,
  -- The name as typed, kept for display.
  name       TEXT    NOT NULL,
  frets      TEXT    NOT NULL,
  fingers    TEXT    NOT NULL,
  base_fret  INTEGER NOT NULL DEFAULT 1,
  barres     TEXT    NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX idx_chord_shapes_user ON chord_shapes(user_id, chord_key);
