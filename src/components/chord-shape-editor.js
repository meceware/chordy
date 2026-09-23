'use client';

import { Fragment, useState, useTransition } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChordDiagram } from '@/components/chord-diagram';
import { parseShapeText, formatShapeText, toPosition, DIAGRAM_FRETS } from '@/lib/chords/shape-text';
import { saveChordShape } from '@/app/songs/shape-actions';
import { cn } from '@/lib/utils';

const STRINGS = ['E', 'A', 'D', 'G', 'B', 'E'];
// Matches the diagram so the grid can never show a dot the diagram cannot draw.
const WINDOW = DIAGRAM_FRETS;
const HIGHEST_START = 20;

export function ChordShapeEditor({ chord, onDone }) {
  const [frets, setFrets] = useState([-1, -1, -1, -1, -1, -1]);
  const [text, setText] = useState('x x x x x x');
  // Frets are absolute, so the grid is a window onto the neck rather than the whole of it.
  const [firstFret, setFirstFret] = useState(1);
  const [problem, setProblem] = useState(null);
  const [pending, startTransition] = useTransition();

  const apply = (next) => {
    setFrets(next);
    setText(formatShapeText(next));
    setProblem(null);
  };

  const onText = (value) => {
    setText(value);
    const parsed = parseShapeText(value);
    if (parsed) {
      setFrets(parsed);
      setProblem(null);
    }
  };

  // Clicking the fret already set clears it back to muted, so a cell is a toggle.
  const setString = (index, fret) => {
    const next = [...frets];
    next[index] = next[index] === fret ? -1 : fret;
    apply(next);
  };

  const save = () => {
    const parsed = parseShapeText(text);
    if (!parsed) {
      return setProblem(
        `Give a position for each of the six strings, low E first: x for muted, 0 for open, 1 to ${DIAGRAM_FRETS} within the window.`,
      );
    }

    startTransition(async () => {
      const result = await saveChordShape(chord, toPosition(parsed, firstFret));
      if (result?.error) setProblem(result.error);
      else onDone();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-xs tracking-wide text-muted-foreground uppercase">From fret</span>
        <div className="flex items-center rounded-md border border-input">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Move the shape down the neck"
            disabled={firstFret <= 1}
            onClick={() => setFirstFret(firstFret - 1)}
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-8 text-center font-mono font-semibold text-primary">{firstFret}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Move the shape up the neck"
            disabled={firstFret >= HIGHEST_START}
            onClick={() => setFirstFret(firstFret + 1)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="grid grid-cols-[auto_repeat(6,minmax(0,1fr))] gap-px text-center text-xs">
          <span />
          {STRINGS.map((note, index) => (
            <button
              key={`open-${index}`}
              type="button"
              aria-label={`${note} string open`}
              onClick={() => setString(index, 0)}
              className={cn(
                'rounded-t border border-border px-1 py-0.5 font-mono',
                frets[index] === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              {frets[index] < 0 ? 'x' : frets[index] === 0 ? 'o' : ''}
            </button>
          ))}

          {Array.from({ length: WINDOW }, (_, offset) => offset + 1).map((position) => (
            <Fragment key={position}>
              <span className="pr-1 font-mono text-muted-foreground tabular-nums">
                {firstFret + position - 1}
              </span>
              {STRINGS.map((note, index) => (
                <button
                  key={`${position}-${index}`}
                  type="button"
                  aria-label={`${note} string fret ${firstFret + position - 1}`}
                  onClick={() => setString(index, position)}
                  className={cn(
                    'size-7 border border-border',
                    frets[index] === position ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                  )}
                >
                  {frets[index] === position ? firstFret + position - 1 : ''}
                </button>
              ))}
            </Fragment>
          ))}

          <span />
          {STRINGS.map((note, index) => (
            <span key={`label-${index}`} className="pt-1 font-mono text-muted-foreground">
              {note}
            </span>
          ))}
        </div>

        <div className="flex-1">
          {parseShapeText(text) ? <ChordDiagram position={toPosition(parseShapeText(text), firstFret)} /> : null}
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs tracking-wide text-muted-foreground uppercase">
          Or type it — low E first, x for muted, 0 for open
        </span>
        <Input
          value={text}
          onChange={(event) => onText(event.target.value)}
          aria-label="Shape as text"
          className="font-mono"
          placeholder="x 3 2 0 1 0"
        />
      </label>

      {problem ? <p className="text-sm text-destructive">{problem}</p> : null}

      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          <Check className="size-4" />
          {pending ? 'Saving…' : `Save shape for ${chord}`}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          <X className="size-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
