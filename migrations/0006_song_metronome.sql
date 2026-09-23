-- Drum pattern id from src/lib/metronome.js, or NULL for no metronome.
ALTER TABLE songs ADD COLUMN metronome TEXT;
