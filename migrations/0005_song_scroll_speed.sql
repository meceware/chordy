-- Auto-scroll rate in pixels per second, set by the play bar. NULL means "derive it from the
-- tempo", which is what every existing row wants.
ALTER TABLE songs ADD COLUMN scroll_speed INTEGER;
