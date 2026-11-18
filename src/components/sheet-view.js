'use client';

import { useMemo, useState } from 'react';
import { tokenizeSheet } from '@/lib/sheet/tokenize';
import { transposeSheet } from '@/lib/sheet/transpose';
import { pairLine, wordsOf } from '@/lib/sheet/pair';
import { ChordDialog } from '@/components/chord-dialog';
import { cn } from '@/lib/utils';

function ChordButton({ text, onSelect, className }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(text)}
      className={cn(
        // The pseudo-element widens the tap target past the glyphs without moving a column:
        // a one-letter chord is otherwise a 9px-wide button.
        'relative rounded-sm font-semibold text-chord',
        'after:absolute after:-inset-x-1.5 after:-inset-y-1 hover:text-chord-hover',
        'active:text-chord-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className,
      )}
    >
      {text}
    </button>
  );
}

function ExactLine({ line, onSelect }) {
  const parts = [];
  let cursor = 0;

  for (const token of line.tokens) {
    if (token.column > cursor) parts.push(line.text.slice(cursor, token.column));

    parts.push(
      token.chord
        ? <ChordButton key={`${token.column}-${token.text}`} text={token.text} onSelect={onSelect} />
        : token.text,
    );
    cursor = token.column + token.text.length;
  }

  if (cursor < line.text.length) parts.push(line.text.slice(cursor));

  return <div className="font-semibold whitespace-pre">{parts}</div>;
}

function WrappedPair({ chordLine, lyricLine, onSelect }) {
  const words = wordsOf(pairLine(chordLine, lyricLine));

  return (
    <div className="flex flex-wrap items-start">
      {words.map((word, index) => (
        // Fragments are `pre` so that nothing can shrink a word and wrap it inside itself; a
        // word wider than the screen pans with the sheet instead.
        <span key={index} className="flex items-start">
          {word.map((segment, segmentIndex) => (
            // A fixed first row keeps the chord and lyric rows aligned across words even
            // where a word has no chord above it.
            <span key={segmentIndex} className="grid grid-rows-[1.5em_auto] items-start">
              {segment.chord?.chord ? (
                <ChordButton text={segment.chord.text} onSelect={onSelect} className="justify-self-start pr-3" />
              ) : segment.chord ? (
                <span className="pr-3 font-semibold">{segment.chord.text}</span>
              ) : (
                <span />
              )}
              <span className="whitespace-pre">{segment.text}</span>
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

export function SheetView({
  body,
  transpose = 0,
  showChords = true,
  showLyrics = true,
  // Chords stay over their syllables while long lines wrap; turning it off is only for tools that
  // must show the raw columns.
  wrap = true,
  fontSize = null,
  shapes,
  songId = null,
  prefs,
  // A page that keeps its own chord dialog (the song page, shared with its chord card) takes the
  // tap; anywhere else the sheet opens a dialog of its own.
  onChord = null,
}) {
  const [chord, setChord] = useState(null);
  const select = onChord ?? setChord;

  const lines = useMemo(
    () => transposeSheet(tokenizeSheet(body), transpose),
    [body, transpose],
  );

  // Pairing a chord with the lyric fragment beneath it is what allows a row to reflow,
  // but it only makes sense when both are on screen.
  const paired = wrap && showChords && showLyrics;

  const rendered = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.type === 'section') {
      rendered.push(
        <div
          key={index}
          className="mt-6 mb-1.5 font-sans text-xs font-semibold tracking-widest text-muted-foreground uppercase first:mt-0"
        >
          {line.label}
        </div>,
      );
      continue;
    }

    if (line.type === 'tab') {
      if (showChords) {
        rendered.push(<div key={index} className="whitespace-pre text-muted-foreground">{line.text}</div>);
      }
      continue;
    }

    if (line.type === 'chords') {
      if (!showChords) continue;

      // A chord-only line has no lyric to align to, so it keeps its original spacing
      // even when wrapping — that spacing is usually the riff's rhythm.
      const lyricLine = paired && lines[index + 1]?.type === 'lyrics' ? lines[index + 1] : null;

      if (lyricLine) {
        rendered.push(<WrappedPair key={index} chordLine={line} lyricLine={lyricLine} onSelect={select} />);
        index += 1;
      } else {
        rendered.push(<ExactLine key={index} line={line} onSelect={select} />);
      }
      continue;
    }

    if (line.type === 'lyrics') {
      if (showLyrics) {
        rendered.push(<div key={index} className={paired ? undefined : 'whitespace-pre'}>{line.text}</div>);
      }
      continue;
    }

    rendered.push(<div key={index} className={showChords && showLyrics ? 'h-4' : 'h-2'} />);
  }

  return (
    <>
      <div
        className={cn(
          'chord-sheet font-mono text-sheet-foreground',
          '-mx-4 overflow-x-auto px-4',
        )}
        style={fontSize ? { '--sheet-size': `${fontSize}rem` } : undefined}
      >
        {rendered}
      </div>

      {onChord ? null : (
        <ChordDialog chord={chord} shapes={shapes} songId={songId} prefs={prefs} onClose={() => setChord(null)} />
      )}
    </>
  );
}
