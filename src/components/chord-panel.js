'use client';

import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { ChordDiagram } from '@/components/chord-diagram';
import { chordVoicings, chordKeyOf, lookupMessage } from '@/lib/chords/lookup';

/**
 * The reader's view of a chord: the voicings this song pins, or all of them when it has
 * no opinion. Choosing and creating shapes lives in the song's chord list instead, so
 * tapping a chord mid-song never turns into an editing surface.
 */
export function ChordPanel({ chord, onOpenChange, shapes = {}, prefs = {} }) {
  const [expanded, setExpanded] = useState(false);

  const result = chord ? chordVoicings(chord, shapes) : null;
  const message = result ? lookupMessage(result) : null;

  const pinnedRefs = (chord ? prefs[chordKeyOf(chord)] : null) ?? [];
  const pinned = result?.voicings.filter((voicing) => pinnedRefs.includes(voicing.ref)) ?? [];

  const shown = pinned.length > 0 && !expanded ? pinned : (result?.voicings ?? []);
  const hidden = pinned.length > 0 && !expanded ? result.voicings.length - pinned.length : 0;

  const close = () => {
    setExpanded(false);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={Boolean(chord)}
      onOpenChange={(open) => (open ? null : close())}
      title={chord ?? ''}
      description={
        result
          ? pinned.length > 0 && !expanded
            ? pinned.length === 1
              ? 'Chosen for this song'
              : `${pinned.length} chosen for this song`
            : `${result.voicings.length} shape${result.voicings.length === 1 ? '' : 's'}`
          : ''
      }
      className="sm:max-w-xl"
    >
      {/* min-w-0 is load-bearing: as a grid item of the dialog this defaults to
          min-width:auto and would size itself to the carousel's full content width,
          overflowing the dialog instead of letting the carousel scroll. */}
      <div className="min-w-0 px-4 pb-6 sm:px-0">
        {message ? (
          <p className="mb-3 flex items-start gap-2 rounded-md bg-amber-50 p-2 text-sm text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
            <Info className="mt-0.5 size-4 shrink-0" />
            {message}
          </p>
        ) : null}

        {shown.length > 0 ? (
          <div
            data-testid="voicing-carousel"
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]"
          >
            {shown.map((voicing) => (
              <div key={voicing.ref} className="snap-start">
                <ChordDiagram position={voicing.position} />
              </div>
            ))}
          </div>
        ) : null}

        {hidden > 0 ? (
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setExpanded(true)}>
            <ChevronDown className="size-4" />
            Show {hidden} other{hidden === 1 ? '' : 's'}
          </Button>
        ) : null}
      </div>
    </ResponsiveDialog>
  );
}
