'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetView } from '@/components/sheet-view';
import { transposeName } from '@/lib/chords/parse';

// Traditional (the lyrics are public domain), so the page can show a real sheet to anyone. The
// progression is the one every guitarist knows.
const DEMO = [
  '[Verse 1]',
  '      Am   C        D     F',
  "There is a house in New Orleans",
  '     Am       C      E',
  "They call the Rising Sun",
  '         Am       C       D           F',
  "And it's been the ruin of many a poor boy",
  '    Am     E        Am',
  "And God, I know I'm one",
].join('\n');

const KEY = 'Am';
const LIMIT = 6;

/** The one thing worth showing rather than describing: tap a button and every chord moves. */
export function LandingDemo() {
  const [transpose, setTranspose] = useState(0);
  const shift = (delta) => setTranspose((current) => Math.max(-LIMIT, Math.min(LIMIT, current + delta)));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">House of the Rising Sun</p>
          <p className="truncate text-sm text-muted-foreground">Traditional</p>
        </div>

        <div role="group" aria-label="Transpose the example" className="flex h-11 items-center rounded-xl border border-input">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 rounded-xl"
            aria-label="Transpose down"
            disabled={transpose <= -LIMIT}
            onClick={() => shift(-1)}
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-9 text-center font-mono font-semibold" aria-live="polite">
            {transposeName(KEY, transpose)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 rounded-xl"
            aria-label="Transpose up"
            disabled={transpose >= LIMIT}
            onClick={() => shift(1)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4">
        <SheetView body={DEMO} transpose={transpose} />
      </div>
    </div>
  );
}
