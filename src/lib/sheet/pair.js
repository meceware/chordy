/**
 * Splits a chord line and the lyric line beneath it into cells, each holding one chord
 * and the lyric fragment starting at that chord's column. Stacking a chord on its own
 * fragment makes alignment independent of column arithmetic, which is what allows the
 * row to wrap — `white-space: pre` cannot wrap without the two lines drifting apart.
 */
export function pairLine(chordLine, lyricLine) {
  const text = lyricLine ? lyricLine.text : '';
  const tokens = chordLine ? chordLine.tokens : [];

  if (tokens.length === 0) return [{ chord: null, text }];

  const bounds = snapToWords(tokens.map((token) => token.column), text);
  const cells = [];

  if (bounds[0] > 0) {
    cells.push({ chord: null, text: text.slice(0, bounds[0]) });
  }

  tokens.forEach((token, index) => {
    cells.push({
      chord: token,
      text: text.slice(bounds[index], index + 1 < bounds.length ? bounds[index + 1] : text.length),
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

// Characters of lyric a chord wants beneath it beyond its own name, so the next chord does not
// butt up against it. Only a heuristic: the layout still pads a fragment that falls short.
const CHORD_ROOM = 2;

// Words of lyric that chords played after the line ends take with them when they wrap. On their
// own they would wrap as a row of chords over nothing, and read as a line of their own.
const TAIL_WORDS = 2;

/**
 * Regroups cells into words, the units a row may wrap between. Cells are the wrong unit for
 * that: one cell's fragment usually holds several words, and a chord written over the middle
 * of a word splits that word across two cells. Wrapping by cell either strands the start of a
 * word on the line below or, to avoid that, refuses to wrap a whole phrase.
 *
 * Each word is a run of segments, and each segment is drawn with its chord, if any, above it.
 * A chord's segment takes in as many of the following words as it needs to sit over, so a
 * long chord name above a short word does not push the rest of the line apart.
 */
export function wordsOf(cells) {
  const words = [];
  let open = false;

  const place = (segment) => {
    if (open && segment.text !== '') words[words.length - 1].push(segment);
    else words.push([segment]);
    open = segment.text !== '' && !/\s$/.test(segment.text);
  };

  for (const cell of cells) {
    const pieces = cell.text.match(/\S+\s*|\s+/g) ?? [''];
    const room = cell.chord ? cell.chord.text.length + CHORD_ROOM : 0;

    let take = 1;
    let text = pieces[0];
    while (take < pieces.length && text.length < room) text += pieces[take++];

    place({ chord: cell.chord, text });
    for (const piece of pieces.slice(take)) place({ chord: null, text: piece });
  }

  let tail = words.length;
  while (tail > 0 && words[tail - 1].every((segment) => segment.text === '')) tail -= 1;
  if (tail === words.length || tail === 0) return words;

  const from = Math.max(0, tail - TAIL_WORDS);
  return [...words.slice(0, from), words.slice(from).flat()];
}
