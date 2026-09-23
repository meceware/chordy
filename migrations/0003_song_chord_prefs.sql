CREATE TABLE song_chord_prefs (
  song_id   INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  -- Canonical key from the parser, so the choice survives a respelling of the chord.
  chord_key TEXT    NOT NULL,
  -- Which voicing: 'custom:<chord_shapes.id>' or 'db:<index into the chords-db group>'.
  shape_ref TEXT    NOT NULL,
  PRIMARY KEY (song_id, chord_key)
);
