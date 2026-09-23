'use client';

import { Minus, Plus, RotateCcw, Type, WrapText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { transposeName } from '@/lib/chords/parse';
import { cn } from '@/lib/utils';

const FONT_MIN = 0.75;
const FONT_MAX = 1.75;
const FONT_STEP = 0.125;

function Stepper({ className, children }) {
  return (
    <div className={cn('flex items-center rounded-md border border-input', className)}>{children}</div>
  );
}

// The shortcut goes in the tooltip rather than the accessible name, which keeps the name
// a plain action instead of something a screen reader reads as punctuation.
function StepButton({ label, shortcut, disabled, onClick, children }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function SheetControls({
  songKey,
  transpose,
  transposeLimit,
  onTransposeBy,
  onTransposeReset,
  view,
  onView,
  wrap,
  onWrap,
  fontSize,
  onFontSize,
}) {
  // With no key recorded there is nothing to name, but transposing still works, so the
  // readout falls back to the offset rather than going blank.
  const resulting = songKey ? transposeName(songKey, transpose) : null;
  const offset = transpose > 0 ? `+${transpose}` : String(transpose);

  return (
    <div className="no-print hide-in-stage flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-border bg-card px-2 py-1.5 text-sm">
      <div className="flex items-center gap-1">
        <span className="px-1 text-xs tracking-wide text-muted-foreground uppercase">Transpose</span>

        <Stepper>
          <StepButton
            label="Transpose down"
            shortcut="-"
            disabled={transpose <= -transposeLimit}
            onClick={() => onTransposeBy(-1)}
          >
            <Minus className="size-4" />
          </StepButton>

          <span className="min-w-14 px-1 text-center font-mono font-semibold text-primary">
            {resulting ?? offset}
            {resulting && transpose !== 0 ? (
              <span className="ml-1 text-xs font-normal text-muted-foreground">{offset}</span>
            ) : null}
          </span>

          <StepButton
            label="Transpose up"
            shortcut="+"
            disabled={transpose >= transposeLimit}
            onClick={() => onTransposeBy(1)}
          >
            <Plus className="size-4" />
          </StepButton>
        </Stepper>

        {transpose !== 0 ? (
          <StepButton label="Reset transpose" onClick={onTransposeReset}>
            <RotateCcw className="size-4" />
          </StepButton>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(next) => next && onView(next)}
          variant="outline"
          size="sm"
          aria-label="Show"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="lyrics">Lyrics</ToggleGroupItem>
        </ToggleGroup>

        <Toggle
          size="sm"
          variant="outline"
          pressed={wrap}
          onPressedChange={onWrap}
          title="Wrap long lines instead of scrolling sideways"
        >
          <WrapText className="size-4" />
          <span className="hidden sm:inline">Wrap</span>
        </Toggle>

        <Stepper className="gap-1 px-1">
          <StepButton
            label="Smaller text"
            disabled={fontSize <= FONT_MIN}
            onClick={() => onFontSize(Math.max(FONT_MIN, fontSize - FONT_STEP))}
          >
            <Minus className="size-4" />
          </StepButton>

          <Type className="size-4 text-muted-foreground" />

          <StepButton
            label="Larger text"
            disabled={fontSize >= FONT_MAX}
            onClick={() => onFontSize(Math.min(FONT_MAX, fontSize + FONT_STEP))}
          >
            <Plus className="size-4" />
          </StepButton>
        </Stepper>
      </div>
    </div>
  );
}
