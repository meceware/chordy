'use client';

import { useEffect, useRef, useState } from 'react';
import { Minus, Pause, Play, Plus } from 'lucide-react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  PRESETS,
  VOICES,
  MAX_BEATS,
  MAX_SUBBEATS,
  BPM_MIN,
  BPM_MAX,
  clampBpm,
  stepCount,
  resizePattern,
  toggleStep,
  setStep,
  isSilent,
} from '@/lib/metronome';
import { cn } from '@/lib/utils';

const VOICE_LABELS = {
  kick: 'Kick',
  snare: 'Snare',
  rim: 'Rim',
  clap: 'Clap',
  hightom: 'High tom',
  lowtom: 'Low tom',
  hat: 'Hat',
  openhat: 'Open hat',
  ride: 'Ride',
  cowbell: 'Cowbell',
  shaker: 'Shaker',
};

// Always on screen, being what most beats are built from. Eleven rows would bury the grid on a
// phone, so the rest appear only once the pattern plays them or you add one.
const CORE_VOICES = ['kick', 'snare', 'hat'];

function Section({ label, aside = null, children, className }) {
  return (
    <section className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-medium text-muted-foreground">{label}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

const square = (size) =>
  cn(
    'grid shrink-0 place-items-center rounded-xl border border-input text-foreground hover:bg-accent disabled:opacity-35',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    size,
  );

function MiniStepper({ label, value, min, max, onChange, unit }) {
  return (
    <span className="flex items-center gap-1">
      <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={square('size-9')}>
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-14 text-center text-sm">
        <b className="font-mono font-semibold">{value}</b> {unit}
      </span>
      <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className={square('size-9')}>
        <Plus className="size-3.5" />
      </button>
    </span>
  );
}

// "12/8 shuffle" does not fit a seventh of a phone; the full name stays in the tooltip.
const shortLabel = (label) => label.split(' ')[0];

/**
 * Persistent drawer: building a groove is several minutes of tapping cells, and a drag across the
 * grid must paint cells rather than pull the panel shut. It closes from its own Close button, and
 * the metronome keeps playing behind it.
 */
export function MetronomeDrawer({ open, onOpenChange, bpm, onBpm, pattern, onPattern, running, playhead, onToggle }) {
  const [sounding, setSounding] = useState(-1);
  // Held as text while being typed, so clearing the box to retype does not snap to the minimum.
  const [typed, setTyped] = useState(null);
  // Voices added from the menu or edited by hand stay on screen even with every cell cleared, so
  // a row does not vanish from under the finger that just emptied it.
  const [kept, setKept] = useState([]);
  const keep = (voice) => setKept((current) => (current.includes(voice) ? current : [...current, voice]));

  // Only while the grid is on screen: there is nothing to animate behind a closed panel, and the
  // poll has to run off the audio clock rather than the scheduler, which works a beat ahead.
  useEffect(() => {
    if (!running || !open) return undefined;

    let frame = requestAnimationFrame(function poll() {
      setSounding(playhead());
      frame = requestAnimationFrame(poll);
    });

    return () => cancelAnimationFrame(frame);
  }, [running, open, playhead]);

  const step = running && open ? sounding : -1;
  const steps = stepCount(pattern);

  /**
   * Press and drag across the grid to fill a run of cells. Dragging *sets* them all to one value
   * rather than toggling each, so sweeping back over a cell does not flicker it off; the value is
   * whatever the cell you pressed became.
   *
   * A mouse or pen acts on pointerdown and marks the click as already handled; touch and the
   * keyboard go through the click instead. Touch has to, or a sideways scroll that happens to
   * begin on a cell would toggle it — and the grid needs that scroll at thirty-two columns.
   */
  const painting = useRef(null);
  const handledOnPress = useRef(false);

  useEffect(() => {
    const stop = () => {
      painting.current = null;
    };

    // On the window rather than the grid, so releasing the button outside it still ends the drag.
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, []);

  const cellUnder = (event) => {
    const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-voice]');
    return cell ? { voice: cell.dataset.voice, step: Number(cell.dataset.step), key: cell.dataset.cell } : null;
  };

  const press = (event) => {
    if (event.pointerType === 'touch') return;

    const from = cellUnder(event);
    if (!from) return;

    const on = !pattern[from.voice].includes(from.step);
    painting.current = { on, last: from.key };
    handledOnPress.current = true;
    keep(from.voice);
    onPattern((current) => setStep(current, from.voice, from.step, on));
  };

  const dragAcross = (event) => {
    if (!painting.current) return;

    const over = cellUnder(event);
    if (!over || over.key === painting.current.last) return;

    painting.current.last = over.key;
    onPattern((current) => setStep(current, over.voice, over.step, painting.current.on));
  };

  const clicked = (voice, column) => {
    if (handledOnPress.current) {
      handledOnPress.current = false;
      return;
    }

    keep(voice);
    onPattern((current) => toggleStep(current, voice, column));
  };
  const silent = isSilent(pattern);

  const shown = VOICES.filter(
    (voice) => CORE_VOICES.includes(voice) || pattern[voice].length > 0 || kept.includes(voice),
  );
  const hidden = VOICES.filter((voice) => !shown.includes(voice));

  const commit = () => {
    if (typed !== null) onBpm(clampBpm(Number(typed)));
    setTyped(null);
  };

  const preset = Object.entries(PRESETS).find(
    ([, candidate]) =>
      candidate.beats === pattern.beats &&
      candidate.subbeats === pattern.subbeats &&
      VOICES.every((voice) => String(candidate[voice]) === String(pattern[voice])),
  );

  const label = preset ? preset[1].label : `${pattern.beats}×${pattern.subbeats}`;
  const meters = Object.entries(PRESETS).filter(([, candidate]) => !candidate.groove);
  const grooves = Object.entries(PRESETS).filter(([, candidate]) => candidate.groove);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      persistent
      className="sm:max-w-xl"
      title="Metronome"
      description={`${running ? 'Playing' : 'Stopped'} · ${label}`}
      footer={
        <Button
          type="button"
          size="lg"
          variant={running ? 'secondary' : 'default'}
          className="h-12 w-full rounded-xl text-base"
          aria-pressed={running}
          disabled={silent && !running}
          onClick={onToggle}
          title={`${running ? 'Stop' : 'Start'} the metronome (P)`}
        >
          {running ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
          {silent && !running ? 'Nothing to play — fill the grid' : running ? 'Stop' : 'Start'}
        </Button>
      }
    >
      <div className="space-y-6 pb-4">
        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            type="button"
            aria-label="Slower"
            disabled={bpm <= BPM_MIN}
            onClick={() => onBpm(clampBpm(bpm - 1))}
            className={square('size-12')}
          >
            <Minus className="size-5" />
          </button>

          <label className="w-24 text-center">
            <input
              value={typed ?? String(bpm)}
              onChange={(event) => setTyped(event.target.value.replace(/\D/g, '').slice(0, 3))}
              onBlur={commit}
              onKeyDown={(event) => event.key === 'Enter' && commit()}
              inputMode="numeric"
              aria-label={`Tempo in beats per minute, ${BPM_MIN} to ${BPM_MAX}`}
              className="w-full rounded-lg bg-transparent text-center font-mono text-4xl font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="text-xs text-muted-foreground">bpm · tap to type</span>
          </label>

          <button
            type="button"
            aria-label="Faster"
            disabled={bpm >= BPM_MAX}
            onClick={() => onBpm(clampBpm(bpm + 1))}
            className={square('size-12')}
          >
            <Plus className="size-5" />
          </button>
        </div>

        <Section label="Time">
          <div
            role="radiogroup"
            aria-label="Time signature"
            className="grid overflow-hidden rounded-xl border border-input"
            style={{ gridTemplateColumns: `repeat(${meters.length}, minmax(0, 1fr))` }}
          >
            {meters.map(([id, { label: name }]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={preset?.[0] === id}
                title={name}
                onClick={() => onPattern({ ...PRESETS[id] })}
                className={cn(
                  'h-11 border-r border-input text-sm last:border-r-0',
                  preset?.[0] === id ? 'bg-primary font-semibold text-primary-foreground' : 'hover:bg-accent',
                )}
              >
                {shortLabel(name)}
              </button>
            ))}
          </div>
        </Section>

        <Section label="Feel">
          <div className="-mx-2 flex flex-wrap">
            {grooves.map(([id, { label: name }]) => (
              <button
                key={id}
                type="button"
                aria-pressed={preset?.[0] === id}
                onClick={() => onPattern({ ...PRESETS[id] })}
                className={cn(
                  'h-10 rounded-lg px-2 text-[15px] underline-offset-[6px] hover:bg-accent',
                  preset?.[0] === id ? 'font-semibold text-foreground underline decoration-brand decoration-2' : 'text-muted-foreground',
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </Section>

        <Section
          label="Pattern"
          aside={
            <span className="flex flex-wrap items-center justify-end gap-3">
              <MiniStepper
                label="beats"
                unit="beats"
                value={pattern.beats}
                min={1}
                max={MAX_BEATS}
                onChange={(beats) => onPattern((current) => resizePattern(current, beats, current.subbeats))}
              />
              <MiniStepper
                label="steps per beat"
                unit="/ beat"
                value={pattern.subbeats}
                min={1}
                max={MAX_SUBBEATS}
                onChange={(subbeats) => onPattern((current) => resizePattern(current, current.beats, subbeats))}
              />
            </span>
          }
        >
          {/* Eight beats of four is thirty-two columns, which cannot fit a phone at a tappable
              size, so the grid pans instead of shrinking. */}
          <div
            data-vaul-no-drag
            className="-mx-4 overflow-x-auto px-4 pb-3 select-none [scrollbar-width:thin] sm:-mx-6 sm:px-6"
            onPointerDown={press}
            onPointerMove={dragAcross}
          >
            <div className="w-max space-y-1">
              <div className="flex items-center gap-1">
                <span className="w-14 shrink-0" />
                {Array.from({ length: steps }, (unused, column) => (
                  <span
                    key={column}
                    className={cn(
                      'w-8 rounded text-center text-[11px] tabular-nums',
                      column % pattern.subbeats === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground/50',
                      column === step && 'bg-brand/25 text-foreground',
                    )}
                  >
                    {column % pattern.subbeats === 0 ? column / pattern.subbeats + 1 : '·'}
                  </span>
                ))}
              </div>

              {shown.map((voice) => (
                <div key={voice} className="flex items-center gap-1">
                  <span className="w-14 shrink-0 truncate text-xs text-muted-foreground">{VOICE_LABELS[voice]}</span>

                  {Array.from({ length: steps }, (unused, column) => {
                    const on = pattern[voice].includes(column);

                    return (
                      <button
                        key={column}
                        type="button"
                        data-voice={voice}
                        data-step={column}
                        data-cell={`${voice}:${column}`}
                        aria-pressed={on}
                        aria-label={`${VOICE_LABELS[voice]} on step ${column + 1}`}
                        onClick={() => clicked(voice, column)}
                        className={cn(
                          'size-8 shrink-0 rounded-md border transition-colors',
                          on ? 'border-brand bg-brand' : 'border-input bg-background hover:bg-accent',
                          // The first cell of each beat gets a heavier edge, so the grouping reads
                          // without counting cells.
                          column % pattern.subbeats === 0 && !on && 'border-muted-foreground/40',
                          column === step && (on ? 'ring-2 ring-brand/60' : 'bg-brand/25'),
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {hidden.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="mt-1 mb-2 h-10 rounded-xl">
                  <Plus className="size-4" />
                  Add a sound
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-xl">
                {hidden.map((voice) => (
                  <DropdownMenuItem key={voice} onSelect={() => keep(voice)} className="min-h-10">
                    {VOICE_LABELS[voice]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </Section>
      </div>
    </ResponsiveDialog>
  );
}
