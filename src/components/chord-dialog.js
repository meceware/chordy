'use client';

import { useState, useTransition } from 'react';
import { Check, ChevronDown, ExternalLink, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/components/config';
import { ChordDiagram } from '@/components/chord-diagram';
import { ChordShapeEditor } from '@/components/chord-shape-editor';
import { deleteChordShape } from '@/app/songs/shape-actions';
import { pinChordShape, unpinChordShape } from '@/app/songs/pref-actions';
import { chordVoicings, chordKeyOf } from '@/lib/chords/lookup';
import { cn } from '@/lib/utils';

function summary(name, shapes, prefs) {
  const { voicings, match } = chordVoicings(name, shapes);
  const chosen = prefs[chordKeyOf(name)] ?? [];
  const pinned = voicings.filter((voicing) => chosen.includes(voicing.ref));
  return { voicings, chosen, missing: match !== 'exact', cover: pinned[0] ?? voicings[0] ?? null };
}

function Choice({ chord, songId, voicing, chosen }) {
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      if (chosen) await unpinChordShape(songId, chord, voicing.ref);
      else await pinChordShape(songId, chord, voicing.ref);
    });

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border p-2 transition-colors',
        chosen ? 'border-brand bg-accent' : 'border-border',
      )}
    >
      <ChordDiagram position={voicing.position} className="w-full max-w-36" />

      <div className="mt-2 flex w-full items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant={chosen ? 'default' : 'outline'}
          className="h-10 flex-1 rounded-xl"
          aria-pressed={chosen}
          disabled={pending || !songId}
          onClick={toggle}
        >
          {chosen ? <Check className="size-4" /> : null}
          {chosen ? 'Using' : 'Use'}
        </Button>

        {voicing.mine ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 text-destructive"
            aria-label={`Delete your ${chord} shape`}
            disabled={pending}
            onClick={() => startTransition(() => deleteChordShape(voicing.position.id))}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * One chord, the same wherever it was tapped — in the sheet or in the song's chord card. With no
 * shape chosen for this song it shows them all, each ready to be marked as the one you use. Once
 * some are chosen it shows only those, and "Show N others" opens the full set again. Drawing a
 * shape of your own replaces the list until it is saved or cancelled; only then does a stray
 * click outside stay ignored, so the drawing is never thrown away by accident.
 *
 * Without a song (the landing page's example) there is nothing to save a choice to, so the shapes
 * show without their buttons.
 */
export function ChordDialog({ chord, onClose, shapes = {}, prefs = {}, songId = null }) {
  const [expanded, setExpanded] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const editable = Boolean(songId);
  const { voicings, chosen, missing } = chord ? summary(chord, shapes, prefs) : { voicings: [], chosen: [], missing: false };
  const pinned = voicings.filter((voicing) => chosen.includes(voicing.ref));
  const focused = pinned.length > 0 && !expanded;
  const shown = focused ? pinned : voicings;
  const hidden = focused ? voicings.length - pinned.length : 0;

  const close = () => {
    setExpanded(false);
    setDrawing(false);
    onClose();
  };

  const description = drawing
    ? null
    : focused
      ? pinned.length === 1
        ? 'The shape you use for this song'
        : `The ${pinned.length} shapes you use for this song`
      : `${voicings.length} shape${voicings.length === 1 ? '' : 's'}`;

  return (
    <ResponsiveDialog
      open={Boolean(chord)}
      onOpenChange={(open) => (open ? null : close())}
      persistent={drawing}
      className="sm:max-w-2xl"
      title={chord ? (drawing ? `Draw ${chord}` : chord) : ''}
      description={description}
    >
      {chord && drawing ? (
        <ChordShapeEditor chord={chord} onDone={() => setDrawing(false)} />
      ) : chord ? (
        <div className="space-y-4">
          {missing ? (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                No exact shape stored for {chord}.{' '}
                <a
                  href={siteConfig.links.reactChords}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
                >
                  Look one up
                  <ExternalLink className="size-3.5" />
                </a>
                {editable ? ' and add the fingering you use.' : null}
              </span>
            </p>
          ) : editable && !focused ? (
            <p className="text-sm text-muted-foreground">
              {chosen.length === 0
                ? 'Mark the shapes you play. Then only those show when you tap the chord.'
                : 'The shapes you mark are the ones that show when you tap the chord.'}
            </p>
          ) : null}

          {shown.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {shown.map((voicing) =>
                editable ? (
                  <Choice
                    key={voicing.ref}
                    chord={chord}
                    songId={songId}
                    voicing={voicing}
                    chosen={chosen.includes(voicing.ref)}
                  />
                ) : (
                  <div key={voicing.ref} className="flex justify-center rounded-xl border border-border p-2">
                    <ChordDiagram position={voicing.position} className="w-full max-w-36" />
                  </div>
                ),
              )}
            </div>
          ) : null}

          {hidden > 0 ? (
            <Button type="button" variant="outline" className="h-11 w-full rounded-xl" onClick={() => setExpanded(true)}>
              <ChevronDown className="size-4" />
              Show {hidden} other{hidden === 1 ? '' : 's'}
            </Button>
          ) : null}

          {editable && !focused ? (
            <Button type="button" variant="outline" className="h-11 w-full rounded-xl" onClick={() => setDrawing(true)}>
              <Plus className="size-4" />
              Draw your own shape
            </Button>
          ) : null}
        </div>
      ) : null}
    </ResponsiveDialog>
  );
}
