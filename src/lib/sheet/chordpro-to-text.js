import { isChord } from '../chords/parse.js';

const DIRECTIVE = /^\s*\{\s*([a-z_]+)\s*(?::\s*(.*?))?\s*\}\s*$/i;
const LONE_BRACKET = /^\s*\[([^\]]*)\]\s*$/;

const META = { title: 'title', t: 'title', subtitle: 'artist', st: 'artist', artist: 'artist', key: 'songKey', capo: 'capo' };
const SECTION_START = { start_of_verse: 'Verse', sov: 'Verse', start_of_chorus: 'Chorus', soc: 'Chorus', start_of_bridge: 'Bridge', sob: 'Bridge', start_of_part: 'Part' };
const SECTION_END = new Set(['end_of_verse', 'eov', 'end_of_chorus', 'eoc', 'end_of_bridge', 'eob', 'end_of_part']);
const TAB_START = new Set(['start_of_tab', 'sot']);
const TAB_END = new Set(['end_of_tab', 'eot']);
const COMMENT = new Set(['comment', 'c', 'comment_italic', 'ci']);

/**
 * Splits one ChordPro line into a chord line and a lyric line. Each chord is placed at
 * the column where its lyric starts; where a previous chord is wide enough to collide,
 * the later chord shifts right rather than spaces being injected into the lyric, so the
 * lyric text is never altered.
 */
function splitLine(line) {
  let lyrics = '';
  let chords = '';
  const pattern = /\[([^\]]*)\]|([^[]+)/g;
  let match = pattern.exec(line);

  while (match !== null) {
    const [, chord, text] = match;

    if (chord !== undefined) {
      const column = Math.max(lyrics.length, chords.length === 0 ? 0 : chords.length + 1);
      chords = chords.padEnd(column) + chord;
    } else {
      lyrics += text;
    }
    match = pattern.exec(line);
  }

  return { chords: chords.trimEnd(), lyrics };
}

/**
 * One-way conversion to the canonical two-line form. This is the only lossy step in the
 * app, which is why the import lands in the editor for review before it is saved.
 */
export function chordproToText(source) {
  const out = [];
  const meta = {};
  let inTab = false;

  for (const raw of source.split('\n')) {
    if (inTab) {
      const directive = DIRECTIVE.exec(raw);
      if (directive && TAB_END.has(directive[1].toLowerCase())) inTab = false;
      else out.push(raw);
      continue;
    }

    const directive = DIRECTIVE.exec(raw);
    if (directive) {
      const name = directive[1].toLowerCase();
      const value = (directive[2] ?? '').trim();

      if (META[name]) {
        if (value) meta[META[name]] = value;
      } else if (TAB_START.has(name)) {
        inTab = true;
      } else if (SECTION_START[name] !== undefined) {
        out.push(`[${value || SECTION_START[name]}]`);
      } else if (COMMENT.has(name)) {
        if (value) out.push(`[${value}]`);
      } else if (!SECTION_END.has(name)) {
        // Unknown directives are dropped rather than guessed at.
      }
      continue;
    }

    // A bracket alone on a line whose contents are not a chord is a section header, in
    // both formats. Passing it through stops it being read as a chord named "Verse 1".
    const lone = LONE_BRACKET.exec(raw);
    if (lone && !isChord(lone[1])) {
      out.push(raw.trim());
      continue;
    }

    const { chords, lyrics } = splitLine(raw);
    if (chords) out.push(chords);
    if (lyrics.trim() !== '') out.push(lyrics.trimEnd());
    if (!chords && lyrics.trim() === '') out.push('');
  }

  if (meta.capo) meta.capo = Number.parseInt(meta.capo, 10) || null;

  return { body: out.join('\n').replace(/\n{3,}/g, '\n\n').trim(), meta };
}
