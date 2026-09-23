-- One chord can be played two ways in the same song, so a song may pin more than one
-- voicing per chord; the reader picks between them.
CREATE TABLE song_chord_prefs_new (
  song_id   INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  chord_key TEXT    NOT NULL,
  shape_ref TEXT    NOT NULL,
  PRIMARY KEY (song_id, chord_key, shape_ref)
);

INSERT INTO song_chord_prefs_new (song_id, chord_key, shape_ref)
SELECT song_id, chord_key, shape_ref FROM song_chord_prefs;

DROP TABLE song_chord_prefs;
ALTER TABLE song_chord_prefs_new RENAME TO song_chord_prefs;
