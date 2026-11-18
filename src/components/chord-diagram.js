'use client';

import Chord from '@tombatossals/react-chords/lib/Chord';
import { guitar } from '@/lib/chords/instrument';
import { cn } from '@/lib/utils';

// baseFret and lite are passed explicitly because the library declares them through
// defaultProps, which React 19 ignores. Its colours are re-themed in globals.css.
export function ChordDiagram({ position, className, caption = true }) {
  const chord = {
    frets: position.frets,
    fingers: position.fingers,
    barres: position.barres ?? [],
    capo: position.capo ?? false,
    baseFret: position.baseFret ?? 1,
  };

  return (
    <div className={cn('chord-diagram w-32 shrink-0 sm:w-36', className)}>
      <Chord chord={chord} instrument={guitar} lite={false} />
      {caption ? (
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {chord.baseFret === 1 ? 'Open position' : `From fret ${chord.baseFret}`}
        </p>
      ) : null}
    </div>
  );
}
