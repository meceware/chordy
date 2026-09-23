'use client';

import { useState, useTransition } from 'react';
import { Check, ChevronDown, ExternalLink, Guitar, Plus, Settings2, Trash2, TriangleAlert } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { siteConfig } from '@/components/config';
import { ChordDiagram } from '@/components/chord-diagram';
import { ChordShapeEditor } from '@/components/chord-shape-editor';
import { deleteChordShape } from '@/app/songs/shape-actions';
import { pinChordShape, unpinChordShape } from '@/app/songs/pref-actions';
import { chordVoicings, chordKeyOf } from '@/lib/chords/lookup';
import { cn } from '@/lib/utils';

function Choice({ chord, songId, voicing, chosen }) {
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      if (chosen) await unpinChordShape(songId, chord, voicing.ref);
      else await pinChordShape(songId, chord, voicing.ref);
    });

  return (
    <div className={cn('shrink-0 rounded-md border p-1', chosen ? 'border-primary bg-accent/50' : 'border-transparent')}>
      <ChordDiagram position={voicing.position} />

      <div className="mt-1 flex items-center justify-center gap-1">
        <Button
          type="button"
          size="sm"
          variant={chosen ? 'default' : 'outline'}
          className="h-6 px-2 text-xs"
          disabled={pending || !songId}
          onClick={toggle}
        >
          {chosen ? <Check className="size-3" /> : null}
          {chosen ? 'Using' : 'Use'}
        </Button>

        {voicing.mine ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            aria-label={`Delete your ${chord} shape`}
            onClick={() => startTransition(() => deleteChordShape(voicing.position.id))}
          >
            <Trash2 className="size-3.5 text-destructive" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function ChordRow({ name, shapes, songId, prefs }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const { voicings, match } = chordVoicings(name, shapes);
  const chosenRefs = prefs[chordKeyOf(name)] ?? [];
  const missing = match !== 'exact';

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Shapes for ${name}`}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent/40 sm:gap-3"
      >
        <span className="w-14 shrink-0 font-mono font-semibold text-chord sm:w-20">{name}</span>

        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {missing ? (
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
              <TriangleAlert className="size-3.5 shrink-0" />
              no shape stored
            </span>
          ) : chosenRefs.length > 0 ? (
            `${chosenRefs.length} of ${voicings.length} shapes chosen`
          ) : (
            `${voicings.length} shape${voicings.length === 1 ? '' : 's'}`
          )}
        </span>

        <Settings2 className="size-4 shrink-0 text-muted-foreground" />
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="border-t border-border bg-background/40 px-3 py-3">
          {adding ? (
            <ChordShapeEditor chord={name} onDone={() => setAdding(false)} />
          ) : (
            <>
              {voicings.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  {voicings.map((voicing) => (
                    <Choice
                      key={voicing.ref}
                      chord={name}
                      songId={songId}
                      voicing={voicing}
                      chosen={chosenRefs.includes(voicing.ref)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nothing stored for {name}. Add the fingering you use.
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
                  <Plus className="size-4" />
                  Add a shape
                </Button>

                {chosenRefs.length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {chosenRefs.length === 1
                      ? 'Only this one shows when you tap the chord while reading.'
                      : 'Both show when you tap the chord, so you can pick as you play.'}
                  </span>
                ) : null}
              </div>
            </>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function ChordsInSong({ chords, shapes = {}, songId, prefs = {} }) {
  const [open, setOpen] = useState(false);

  if (chords.length === 0) return null;

  const missing = chords.filter((name) => chordVoicings(name, shapes).match !== 'exact').length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="no-print hide-in-stage rounded-lg border border-border bg-card">
      <div className="flex items-center">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/40">
          <Guitar className="size-4 shrink-0 text-violet-500" />
          <span className="font-medium">Chords</span>
          <Badge variant="outline" className="text-xs">{chords.length}</Badge>

          {missing > 0 ? (
            <Badge className="border-transparent bg-amber-100 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {missing} without a shape
            </Badge>
          ) : null}
        </CollapsibleTrigger>

        {/* The way out when nothing is stored for a chord: somewhere to look the fingering up
            before recording it here. */}
        <a
          href={siteConfig.links.reactChords}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Look chord fingerings up on react-chords (opens in a new tab)"
          title="Look a fingering up on react-chords"
          className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
        >
          <ExternalLink className="size-4" />
        </a>

        <CollapsibleTrigger
          aria-label={open ? 'Collapse the chord list' : 'Expand the chord list'}
          className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
        >
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <ul className="divide-y divide-border border-t border-border">
          {chords.map((name) => (
            <ChordRow key={name} name={name} shapes={shapes} songId={songId} prefs={prefs} />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
