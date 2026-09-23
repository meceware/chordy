'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Drum, Minus, Plus } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

const VOICE_LABELS = { kick: 'Kick', snare: 'Snare', hat: 'Hat' };

function Count({ label, value, max, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-xs tracking-wide text-muted-foreground uppercase">{label}</span>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: max }, (unused, index) => index + 1).map((count) => (
          <Button
            key={count}
            type="button"
            size="icon"
            variant={value === count ? 'default' : 'outline'}
            className="size-7 text-xs"
            aria-pressed={value === count}
            aria-label={`${label}: ${count}`}
            onClick={() => onChange(count)}
          >
            {count}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function MetronomeEditor({ bpm, onBpm, pattern, onPattern, running, playhead, onToggle }) {
  const [open, setOpen] = useState(false);
  const [sounding, setSounding] = useState(-1);
  // Held as text while being typed, so clearing the box to retype does not snap to the minimum.
  const [typed, setTyped] = useState(null);

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

    onPattern((current) => toggleStep(current, voice, column));
  };
  const silent = isSilent(pattern);

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

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="no-print hide-in-stage rounded-lg border border-border bg-card"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/40">
        <Drum className={cn('size-4 shrink-0', running ? 'text-primary' : 'text-rose-500')} />
        <span className="font-medium">Metronome</span>
        <Badge variant="outline" className="text-xs">
          {bpm} bpm
        </Badge>
        <Badge variant="outline" className="text-xs">
          {preset ? preset[1].label : `${pattern.beats}×${pattern.subbeats}`}
        </Badge>
        {running ? <span className="text-xs text-primary">playing</span> : null}

        <ChevronDown className={cn('ml-auto size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3 border-t border-border px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="w-16 text-xs tracking-wide text-muted-foreground uppercase">Tempo</span>

          <div className="flex items-center rounded-md border border-input">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Slower"
              disabled={bpm <= BPM_MIN}
              onClick={() => onBpm(clampBpm(bpm - 1))}
            >
              <Minus className="size-3.5" />
            </Button>

            <Input
              value={typed ?? String(bpm)}
              onChange={(event) => setTyped(event.target.value.replace(/\D/g, '').slice(0, 3))}
              onBlur={commit}
              onKeyDown={(event) => event.key === 'Enter' && commit()}
              inputMode="numeric"
              aria-label={`Tempo in beats per minute, ${BPM_MIN} to ${BPM_MAX}`}
              className="h-7 w-14 border-0 text-center font-mono tabular-nums shadow-none focus-visible:ring-0"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Faster"
              disabled={bpm >= BPM_MAX}
              onClick={() => onBpm(clampBpm(bpm + 1))}
            >
              <Plus className="size-3.5" />
            </Button>
          </div>

          <span className="text-xs text-muted-foreground">bpm</span>
        </div>

        <Count
          label="Beats"
          value={pattern.beats}
          max={MAX_BEATS}
          onChange={(beats) => onPattern((current) => resizePattern(current, beats, current.subbeats))}
        />
        <Count
          label="Divide"
          value={pattern.subbeats}
          max={MAX_SUBBEATS}
          onChange={(subbeats) => onPattern((current) => resizePattern(current, current.beats, subbeats))}
        />

        {/* Eight beats of four is thirty-two columns, which cannot fit a phone at a tappable
            size, so the grid pans instead of shrinking. */}
        <div
          className="-mx-1 overflow-x-auto px-1 pb-1 select-none [scrollbar-width:thin]"
          onPointerDown={press}
          onPointerMove={dragAcross}
        >
          <div className="w-max space-y-1">
            <div className="flex items-center gap-1">
              <span className="w-12 shrink-0" />
              {Array.from({ length: steps }, (unused, column) => (
                <span
                  key={column}
                  className={cn(
                    'w-7 rounded text-center text-[10px] tabular-nums',
                    column % pattern.subbeats === 0 ? 'text-foreground' : 'text-muted-foreground/50',
                    column === step && 'bg-primary/20 text-primary',
                  )}
                >
                  {column % pattern.subbeats === 0 ? column / pattern.subbeats + 1 : '·'}
                </span>
              ))}
            </div>

            {VOICES.map((voice) => (
              <div key={voice} className="flex items-center gap-1">
                <span className="w-12 shrink-0 text-xs text-muted-foreground">{VOICE_LABELS[voice]}</span>

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
                        'size-7 shrink-0 rounded border text-xs transition-colors',
                        on ? 'border-primary bg-primary' : 'border-input hover:bg-accent',
                        // The first cell of each beat gets a heavier edge, so the grouping reads
                        // without counting cells.
                        column % pattern.subbeats === 0 && !on && 'border-muted-foreground/40',
                        column === step && (on ? 'ring-2 ring-primary/50' : 'bg-primary/20'),
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="w-16 text-xs tracking-wide text-muted-foreground uppercase">Presets</span>
          {Object.entries(PRESETS).map(([id, { label }]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={preset?.[0] === id ? 'default' : 'outline'}
              className="h-7 px-2 text-xs"
              onClick={() => onPattern({ ...PRESETS[id] })}
            >
              {label}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          variant={running ? 'default' : 'outline'}
          size="sm"
          className="w-full"
          aria-pressed={running}
          disabled={silent && !running}
          onClick={onToggle}
          title={`${running ? 'Stop' : 'Start'} the metronome (P)`}
        >
          <Drum className="size-4" />
          {silent && !running ? 'Nothing to play — fill the grid' : running ? 'Stop' : 'Start'}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
