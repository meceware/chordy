const MUTED = /^[xX-]$/;

// The diagram draws this many frets, so a shape is described within that many.
export const DIAGRAM_FRETS = 4;

/**
 * Parses the tab-style shorthand players already use — `x 3 2 0 1 0`, `x32010`, or
 * `x-3-2-0-1-0` — into six strings. Numbers are positions within the diagram's window,
 * the same convention chords-db uses: 0 is open, 1 is the first fret of the window, and
 * where that window sits on the neck is the shape's base fret.
 */
export function parseShapeText(input) {
  const trimmed = (input ?? '').trim();
  if (trimmed === '') return null;

  const tokens = /[\s,|-]/.test(trimmed) ? trimmed.split(/[\s,|-]+/).filter(Boolean) : [...trimmed];
  if (tokens.length !== 6) return null;

  const frets = tokens.map((token) => {
    if (MUTED.test(token)) return -1;
    if (!/^\d{1,2}$/.test(token)) return null;
    return Number.parseInt(token, 10);
  });

  if (frets.some((fret) => fret === null || fret > DIAGRAM_FRETS)) return null;
  return frets;
}

export function formatShapeText(frets) {
  return frets.map((fret) => (fret < 0 ? 'x' : String(fret))).join(' ');
}

/**
 * Pairs the window-relative frets with where the window sits, which is the shape of a
 * chords-db position. Moving the base fret slides the whole shape up the neck without
 * disturbing the pattern.
 */
export function toPosition(frets, baseFret = 1) {
  return {
    frets,
    fingers: frets.map(() => 0),
    baseFret,
    barres: [],
  };
}
