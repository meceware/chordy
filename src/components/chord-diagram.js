'use client';

import Chord from '@tombatossals/react-chords/lib/Chord';
import { guitar } from '@/lib/chords/instrument';

// baseFret and lite are passed explicitly because the library declares them through
// defaultProps, which React 19 ignores.
export function ChordDiagram({ position }) {
  const chord = {
    frets: position.frets,
    fingers: position.fingers,
    barres: position.barres ?? [],
    capo: position.capo ?? false,
    baseFret: position.baseFret ?? 1,
  };

  return (
    <div className="w-32 shrink-0 sm:w-36">
      <Chord chord={chord} instrument={guitar} lite={false} />
      <p className="mt-1 text-center text-xs text-muted-foreground">
        {chord.baseFret === 1 ? 'Open position' : `From fret ${chord.baseFret}`}
      </p>
    </div>
  );
}
