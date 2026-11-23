'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpToLine, Lightbulb, ListMusic, Maximize, Metronome, Minimize, Minus, Pause, Play, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { clampSpeed, SPEED_MIN, SPEED_MAX, SPEED_STEP } from '@/lib/scroll-speed';
import { shouldIgnoreShortcut } from '@/lib/keys';
import { useHydrated, useSessionFlag } from '@/lib/hooks';
import { cn } from '@/lib/utils';

// Reaching the bottom does not end play mode: the song is still being played from the last
// screen, so the screen has to stay awake. The loop idles there instead, and picks up again if
// you drag back up to repeat a section. It scrolls the window, the page's one scroller.
// `hold` pauses the loop without stopping play, while the glide back to the top is moving the
// page; scrolling picks up again from wherever the glide leaves off.
function useAutoScroll(playing, speed, hold) {
  useEffect(() => {
    if (!playing) return undefined;

    let frame = 0;
    let previous = 0;
    // Pixels per second rarely lands on whole pixels per frame, so the fraction is carried
    // forward instead of being floored away — otherwise slow speeds never move at all.
    let carried = 0;

    const step = (now) => {
      if (hold.current) {
        carried = 0;
      } else if (previous !== 0) {
        const travel = (speed * (now - previous)) / 1000 + carried;
        const whole = Math.trunc(travel);
        carried = travel - whole;

        if (whole !== 0) window.scrollBy(0, whole);
      }

      previous = now;
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, hold]);
}

/**
 * Eases the page back to the top: quick to start, gentle to land, longer for a longer way but
 * never past ~0.9s. Animated here rather than with the browser's smooth scrolling, which some
 * browsers skip outright and which a scroll from the play loop would cut short. A touch, a wheel
 * or a key from the reader stops it where it is. Returns a function that stops it too.
 */
function glideToTop(onEnd) {
  const from = window.scrollY;
  const duration = Math.min(900, 250 + from / 6);
  const start = performance.now();
  let frame = 0;

  const stop = () => {
    cancelAnimationFrame(frame);
    for (const type of ['wheel', 'touchstart', 'keydown']) window.removeEventListener(type, stop);
    onEnd();
  };

  const step = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    window.scrollTo(0, from * (1 - progress) ** 3);
    if (progress < 1) frame = requestAnimationFrame(step);
    else stop();
  };

  for (const type of ['wheel', 'touchstart', 'keydown']) window.addEventListener(type, stop, { passive: true });
  frame = requestAnimationFrame(step);
  return stop;
}

function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;

    let sentinel = null;
    let released = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        // Pausing while the request was in flight would otherwise leave this lock held for good.
        if (released) lock.release().catch(() => {});
        else sentinel = lock;
      } catch {
        // Denied, or the tab is not visible; the visibility listener retries.
      }
    };

    // The browser drops the lock whenever the page is hidden, so it has to be retaken
    // rather than requested once.
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !released) acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVisibility);
      sentinel?.release?.().catch(() => {});
    };
  }, [active]);
}

// One look for every control in the bar, and one "on" state: filled with the accent. Hover only
// ever applies to the off state, so a pressed button never flickers to grey under the pointer.
const control = (on) =>
  cn(
    'grid place-items-center transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    'disabled:opacity-40',
    on ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
  );

function BarButton({ on = false, className, children, ...props }) {
  return (
    <button type="button" className={cn(control(on), 'size-11 shrink-0 rounded-xl', className)} {...props}>
      {children}
    </button>
  );
}

/**
 * A transport: the icon half starts and stops at once, the number half adjusts. Two halves of one
 * outlined control, so they read as a pair rather than two unrelated buttons. Both halves are a
 * fixed size — the number half fits three digits — so the control is as wide as it needs to be and
 * never shifts as the value changes; the small word under the number says what it measures.
 */
function Transport({ on, icon, label, value, unit, onToggle, adjust }) {
  return (
    <div className="flex h-11 shrink-0 overflow-hidden rounded-xl border border-border">
      <button type="button" aria-pressed={on} aria-label={label} title={label} onClick={onToggle} className={cn(control(on), 'w-11 shrink-0')}>
        {icon}
      </button>
      {adjust(
        <span className="flex w-12 flex-col items-center justify-center border-l border-border leading-none hover:bg-accent">
          <span className="font-mono text-sm font-semibold tabular-nums">{value}</span>
          <span className="mt-0.5 text-[10px] text-muted-foreground">{unit}</span>
        </span>,
      )}
    </div>
  );
}

export function PlayMode({
  speed,
  onSpeed,
  onPanel,
  onTransposeBy,
  stage = false,
  onToggleStage,
  metronomeRunning = false,
  metronomeSilent = false,
  onToggleMetronome,
}) {
  const [playing, setPlaying] = useState(false);
  // Its own switch, apart from Play: working on one passage means sitting still on it, and the
  // screen must not go dark just because nothing is scrolling.
  const [awake, setAwake] = useSessionFlag('chordy.awake');
  const hydrated = useHydrated();
  // Assumed available until hydration can ask, so the button does not flash disabled on load.
  const canWake = !hydrated || 'wakeLock' in navigator;

  const hold = useRef(false);
  const stopGlide = useRef(null);
  useAutoScroll(playing, speed, hold);
  useEffect(() => () => stopGlide.current?.(), []);

  // Back to the top as a glide, so you see where you are going; a jump for anyone who has asked
  // their system for less motion. Scrolling, if it is on, carries on from the top.
  const toTop = () => {
    stopGlide.current?.();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, 0);
      return;
    }

    hold.current = true;
    stopGlide.current = glideToTop(() => {
      hold.current = false;
      stopGlide.current = null;
    });
  };
  // A running metronome means you are playing too, scrolling or not.
  useWakeLock(awake || playing || metronomeRunning);

  const nudgeSpeed = useCallback((delta) => onSpeed((current) => clampSpeed(current + delta)), [onSpeed]);

  // An empty grid has nothing to play, so the one-tap start opens the grid instead of doing
  // nothing silently.
  const beat = useCallback(() => {
    if (metronomeSilent && !metronomeRunning) onPanel('metronome');
    else onToggleMetronome?.();
  }, [metronomeRunning, metronomeSilent, onPanel, onToggleMetronome]);

  useEffect(() => {
    const onKey = (event) => {
      if (shouldIgnoreShortcut(event)) return;

      switch (event.key) {
        case ' ':
          event.preventDefault();
          setPlaying((current) => !current);
          break;
        case '[':
          nudgeSpeed(-SPEED_STEP);
          break;
        case ']':
          nudgeSpeed(SPEED_STEP);
          break;
        case 'f':
          onToggleStage?.();
          break;
        case 'p':
          beat();
          break;
        case 'w':
          setAwake((current) => !current);
          break;
        case '+':
        case '=':
          onTransposeBy?.(1);
          break;
        case '-':
          onTransposeBy?.(-1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [beat, nudgeSpeed, onToggleStage, onTransposeBy, setAwake]);

  return (
    <nav aria-label="Play controls" className="no-print border-t border-border bg-background">
      {/* Spread across a phone's width; gathered in the middle of a wide one. */}
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-1.5 px-3 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] sm:justify-center sm:gap-2.5">
        <BarButton aria-label="Songs" title="Songs" onClick={() => onPanel('songs')}>
          <ListMusic className="size-5" />
        </BarButton>

        <BarButton aria-label="Back to the top" title="Back to the top" onClick={toTop}>
          <ArrowUpToLine className="size-5" />
        </BarButton>

        <Transport
          on={playing}
          label={playing ? 'Pause scrolling (Space)' : 'Start scrolling (Space)'}
          icon={playing ? <Pause className="size-[18px] fill-current" /> : <Play className="size-[18px] fill-current" />}
          value={speed}
          unit="speed"
          onToggle={() => setPlaying(!playing)}
          adjust={(face) => (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" aria-label={`Scroll speed ${speed}`} className="flex">
                  {face}
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-60 space-y-2 rounded-xl">
                <p className="text-xs font-medium text-muted-foreground">Scroll speed · pixels per second</p>
                <div className="flex h-12 items-center justify-between rounded-xl border border-input">
                  <BarButton aria-label="Scroll slower" title="Scroll slower ( [ )" disabled={speed <= SPEED_MIN} onClick={() => nudgeSpeed(-SPEED_STEP)} className="size-12">
                    <Minus className="size-4" />
                  </BarButton>
                  <span className="font-mono text-xl font-semibold tabular-nums">{speed}</span>
                  <BarButton aria-label="Scroll faster" title="Scroll faster ( ] )" disabled={speed >= SPEED_MAX} onClick={() => nudgeSpeed(SPEED_STEP)} className="size-12">
                    <Plus className="size-4" />
                  </BarButton>
                </div>
              </PopoverContent>
            </Popover>
          )}
        />

        {/* Only the start: the metronome is shaped in the song's card, before you play. */}
        <BarButton
          on={metronomeRunning}
          aria-pressed={metronomeRunning}
          aria-label={metronomeRunning ? 'Stop the metronome (P)' : 'Start the metronome (P)'}
          title={metronomeRunning ? 'Stop the metronome (P)' : 'Start the metronome (P)'}
          onClick={beat}
        >
          <Metronome className="size-5" />
        </BarButton>

        <BarButton
          on={awake}
          disabled={!canWake}
          aria-pressed={awake}
          aria-label="Keep the screen on (W)"
          title={canWake ? 'Keep the screen on (W)' : 'This browser cannot keep the screen on'}
          onClick={() => setAwake(!awake)}
        >
          <Lightbulb className="size-5" />
        </BarButton>

        {/* The play bar stays on screen in stage mode, so this is also the way back out. */}
        <BarButton
          on={stage}
          aria-pressed={stage}
          aria-label={stage ? 'Leave stage mode (F)' : 'Stage mode: fullscreen, sheet only (F)'}
          title={stage ? 'Leave stage mode (F)' : 'Stage mode: fullscreen, sheet only (F)'}
          onClick={onToggleStage}
        >
          {stage ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
        </BarButton>
      </div>
    </nav>
  );
}
