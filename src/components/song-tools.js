'use client';

import { Metronome, Minus, Plus, TriangleAlert } from 'lucide-react';
import { ChordDiagram } from '@/components/chord-diagram';
import { transposeName } from '@/lib/chords/parse';
import { chordKeyOf, chordVoicings } from '@/lib/chords/lookup';
import { cn } from '@/lib/utils';

const FONT_MIN = 0.75;
const FONT_MAX = 1.75;
const FONT_STEP = 0.125;

const box = 'flex h-10 items-center rounded-xl border border-input bg-card';

function Step({ label, shortcut, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      className="grid size-10 shrink-0 place-items-center rounded-xl hover:bg-accent disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      {...props}
    />
  );
}

/**
 * One width whatever the key: the offset rides as a small superscript instead of a separate
 * reset button that would push everything after it sideways. Tapping the key goes back to the
 * original.
 */
export function Transpose({ songKey, transpose, limit, onBy, onReset }) {
  const resulting = songKey ? transposeName(songKey, transpose) : null;
  const offset = transpose > 0 ? `+${transpose}` : String(transpose);

  return (
    <div role="group" aria-label="Transpose" className={box}>
      <Step label="Transpose down" shortcut="-" disabled={transpose <= -limit} onClick={() => onBy(-1)}>
        <Minus className="size-4" />
      </Step>
      <button
        type="button"
        onClick={onReset}
        disabled={transpose === 0}
        title={transpose === 0 ? 'Key' : 'Back to the original key'}
        aria-label={transpose === 0 ? `Key ${resulting ?? 'as written'}` : `Key ${resulting ?? offset}, tap to go back to the original`}
        className="relative h-10 w-11 rounded-lg font-mono text-[15px] font-semibold text-chord disabled:cursor-default"
      >
        <span aria-live="polite">{resulting ?? (transpose === 0 ? '±0' : offset)}</span>
        {resulting && transpose !== 0 ? (
          <span className="absolute top-0.5 right-0 font-sans text-[10px] font-semibold text-muted-foreground">{offset}</span>
        ) : null}
      </button>
      <Step label="Transpose up" shortcut="+" disabled={transpose >= limit} onClick={() => onBy(1)}>
        <Plus className="size-4" />
      </Step>
    </div>
  );
}

function Segmented({ value, options, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-flow-col overflow-hidden rounded-xl border border-input">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-10 border-r border-input px-3 text-sm font-medium last:border-r-0',
            value === option.value ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Whether the sheet shows its chords or only the words: a two-way switch, set once. */
export function ChordVisibility({ view, onView }) {
  return (
    <Segmented
      label="Chords"
      value={view}
      onChange={onView}
      options={[
        { value: 'all', label: 'Show' },
        { value: 'lyrics', label: 'Hide' },
      ]}
    />
  );
}

/** The sheet's text size, as a share of the screen's default, in steps either way. */
export function TextSize({ fontSize, defaultFontSize, onFontSize }) {
  const percent = Math.round((fontSize / defaultFontSize) * 100);

  return (
    <div role="group" aria-label="Text size" className={box}>
      <Step label="Smaller text" disabled={fontSize <= FONT_MIN} onClick={() => onFontSize(Math.max(FONT_MIN, fontSize - FONT_STEP))}>
        <Minus className="size-4" />
      </Step>
      <span className="w-12 text-center font-mono text-sm font-semibold tabular-nums" aria-live="polite">
        {percent}%
      </span>
      <Step label="Larger text" disabled={fontSize >= FONT_MAX} onClick={() => onFontSize(Math.min(FONT_MAX, fontSize + FONT_STEP))}>
        <Plus className="size-4" />
      </Step>
    </div>
  );
}

/**
 * The metronome as set for this song — its pattern and tempo — and the way into its settings. The
 * play bar only starts and stops it; this is where it is shaped.
 */
export function MetronomeSettings({ label, tempo, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Metronome settings: ${label}, ${tempo} bpm`}
      className={cn(box, 'gap-2 px-3 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none')}
    >
      <Metronome className="size-4 text-muted-foreground" />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground" aria-hidden>
        ·
      </span>
      <span className="font-mono font-semibold tabular-nums">{tempo}</span>
    </button>
  );
}

function ChordTile({ name, shapes, prefs, onOpen, className, diagram }) {
  const { voicings, match } = chordVoicings(name, shapes);
  const chosen = prefs[chordKeyOf(name)] ?? [];
  const cover = voicings.find((voicing) => chosen.includes(voicing.ref)) ?? voicings[0] ?? null;

  return (
    <button
      type="button"
      onClick={() => onOpen(name)}
      aria-label={`Shapes for ${name}`}
      className={cn(
        'flex shrink-0 flex-col items-center gap-1 rounded-xl border border-border bg-card p-2 hover:bg-accent',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className,
      )}
    >
      <span className="font-mono text-sm font-semibold text-chord">{name}</span>
      {cover && match === 'exact' ? (
        <ChordDiagram position={cover.position} caption={false} className={diagram} />
      ) : (
        <span className={cn('grid aspect-[5/4] place-items-center text-brand', diagram)}>
          <TriangleAlert className="size-5" />
        </span>
      )}
    </button>
  );
}

/** The same chords as a grid: the card under the sheet. As many to a row as the width allows. */
export function ChordGrid({ chords, shapes, prefs, onOpen }) {
  if (chords.length === 0) return <p className="text-sm text-muted-foreground">No chords in this sheet.</p>;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
      {chords.map((name) => (
        <ChordTile key={name} name={name} shapes={shapes} prefs={prefs} onOpen={onOpen} diagram="w-full sm:w-full" />
      ))}
    </div>
  );
}
