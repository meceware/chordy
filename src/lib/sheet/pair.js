/**
 * Splits a chord line and the lyric line beneath it into cells, each holding one chord
 * and the lyric fragment starting at that chord's column. Stacking a chord on its own
 * fragment makes alignment independent of column arithmetic, which is what allows the
 * row to wrap — `white-space: pre` cannot wrap without the two lines drifting apart.
 *
 * `glued` marks a cell whose split fell inside a word, so callers can keep it on the
 * same visual line as the cell before it instead of breaking the word in half.
 */
export function pairLine(chordLine, lyricLine) {
  const text = lyricLine ? lyricLine.text : '';
  const tokens = chordLine ? chordLine.tokens : [];

  if (tokens.length === 0) return [{ chord: null, text, glued: false }];

  const bounds = snapToWords(tokens.map((token) => token.column), text);
  const cells = [];

  if (bounds[0] > 0) {
    cells.push({ chord: null, text: text.slice(0, bounds[0]), glued: false });
  }

  tokens.forEach((token, index) => {
    const start = bounds[index];
    const before = start > 0 ? text[start - 1] : ' ';

    cells.push({
      chord: token,
      text: text.slice(start, index + 1 < bounds.length ? bounds[index + 1] : text.length),
      glued: cells.length > 0 && before !== undefined && !/\s/.test(before),
    });
  });

  return cells;
}

// A chord written over the space before a word belongs to that word, so each boundary
// advances past whitespace. Boundaries stay non-decreasing so the fragments still
// reassemble into the original line.
function snapToWords(columns, text) {
  const bounds = [];
  let floor = 0;

  for (const column of columns) {
    let index = Math.min(column, text.length);
    while (index < text.length && /\s/.test(text[index])) index += 1;
    floor = Math.max(floor, index);
    bounds.push(floor);
  }
  return bounds;
}

// Consecutive glued cells have to travel together, so they are grouped into runs and
// the row wraps between runs rather than between cells.
export function groupCells(cells) {
  const groups = [];

  for (const cell of cells) {
    if (!cell.glued || groups.length === 0) groups.push([cell]);
    else groups[groups.length - 1].push(cell);
  }
  return groups;
}
