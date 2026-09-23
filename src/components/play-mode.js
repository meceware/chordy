'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Drum, Maximize, Minimize, Minus, Pause, Play, Plus, Rewind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speedForBpm, SPEED_MIN, SPEED_MAX, SPEED_STEP } from '@/lib/scroll-speed';
import { saveScrollSpeed } from '@/app/songs/[id]/actions';
import { isTyping } from '@/lib/keys';
import { cn } from '@/lib/utils';

function useAutoScroll(playing, speed, onReachEnd) {
  useEffect(() => {
    if (!playing) return undefined;

    let frame = 0;
    let previous = 0;
    // Pixels per second rarely lands on whole pixels per frame, so the fraction is carried
    // forward instead of being floored away — otherwise slow speeds never move at all.
    let carried = 0;

    const step = (now) => {
      if (previous !== 0) {
        const travel = (speed * (now - previous)) / 1000 + carried;
        const whole = Math.trunc(travel);
        carried = travel - whole;

        if (whole !== 0) window.scrollBy(0, whole);

        const bottom = document.documentElement.scrollHeight - window.innerHeight;
        if (window.scrollY >= bottom - 1) {
          onReachEnd();
          return;
        }
      }

      previous = now;
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, onReachEnd]);
}

function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined;

    let sentinel = null;
    let released = false;

    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen');
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

export function PlayMode({
  songId,
  onTransposeBy,
  previous = null,
  next = null,
  bpm = null,
  scrollSpeed = null,
  metronomeRunning = false,
  onToggleMetronome,
}) {
  const [playing, setPlaying] = useState(false);
  // A speed set for this song wins over the one derived from its tempo.
  const [speed, setSpeed] = useState(() => scrollSpeed ?? speedForBpm(bpm));
  const [stage, setStage] = useState(false);
  const barRef = useRef(null);

  const stop = useCallback(() => setPlaying(false), []);

  useAutoScroll(playing, speed, stop);
  useWakeLock(playing);

  useEffect(() => {
    document.body.dataset.stage = String(stage);
    return () => {
      delete document.body.dataset.stage;
    };
  }, [stage]);

  const toggleStage = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be refused; the stage layout still applies without it.
    }
    setStage((current) => !current);
  }, []);

  const nudgeSpeed = useCallback((delta) => {
    setSpeed((current) => Math.min(SPEED_MAX, Math.max(SPEED_MIN, current + delta)));
  }, []);

  // Coalesced the same way as transpose: holding the stepper costs one write, not one per step.
  const stored = useRef(scrollSpeed ?? speedForBpm(bpm));
  useEffect(() => {
    if (speed === stored.current) return;

    const timer = setTimeout(() => {
      stored.current = speed;
      saveScrollSpeed(songId, speed);
    }, 400);
    return () => clearTimeout(timer);
  }, [songId, speed]);

  useEffect(() => {
    const onKey = (event) => {
      if (isTyping(event) || event.metaKey || event.ctrlKey) return;

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
          toggleStage();
          break;
        case 'p':
          onToggleMetronome?.();
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
  }, [nudgeSpeed, onToggleMetronome, onTransposeBy, toggleStage]);

  return (
    <div
      ref={barRef}
      className={cn(
        'no-print fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur',
        'supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <div className="mx-auto flex max-w-4xl items-center gap-1 px-2 py-2 sm:gap-2 sm:px-3">
        <Button
          asChild={Boolean(previous)}
          type="button"
          size="icon"
          variant="ghost"
          className="size-8"
          disabled={!previous}
          aria-label={previous ? `Previous song: ${previous.title}` : 'No previous song'}
          title={previous?.title}
        >
          {previous ? (
            <Link href={`/songs/${previous.id}`}>
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>

        <Button
          asChild={Boolean(next)}
          type="button"
          size="icon"
          variant="ghost"
          className="size-8"
          disabled={!next}
          aria-label={next ? `Next song: ${next.title}` : 'No next song'}
          title={next?.title}
        >
          {next ? (
            <Link href={`/songs/${next.id}`}>
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>

        <Button
          type="button"
          size="sm"
          variant={playing ? 'default' : 'outline'}
          onClick={() => setPlaying(!playing)}
          aria-pressed={playing}
          title={`${playing ? 'Pause' : 'Play'} (Space)`}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          <span className="hidden sm:inline">{playing ? 'Pause' : 'Play'}</span>
        </Button>

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label="Back to the start"
          title="Back to the start"
          onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
        >
          <Rewind className="size-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant={metronomeRunning ? 'default' : 'ghost'}
          className="size-8"
          aria-label={metronomeRunning ? 'Stop the metronome' : 'Start the metronome'}
          aria-pressed={metronomeRunning}
          title={`${metronomeRunning ? 'Stop' : 'Start'} the metronome (P)`}
          onClick={() => onToggleMetronome?.()}
        >
          <Drum className="size-4" />
        </Button>

        <div className="ml-auto flex items-center">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Scroll slower"
            title="Scroll slower ( [ )"
            disabled={speed <= SPEED_MIN}
            onClick={() => nudgeSpeed(-SPEED_STEP)}
          >
            <Minus className="size-4" />
          </Button>

          <span className="min-w-8 text-center font-mono text-sm text-muted-foreground tabular-nums sm:min-w-16">
            {speed}
            <span className="hidden sm:inline"> px/s</span>
          </span>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Scroll faster"
            title="Scroll faster ( ] )"
            disabled={speed >= SPEED_MAX}
            onClick={() => nudgeSpeed(SPEED_STEP)}
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <Button
          type="button"
          size="icon"
          variant={stage ? 'default' : 'ghost'}
          className="size-8"
          aria-label={stage ? 'Leave stage mode' : 'Stage mode'}
          title={`${stage ? 'Leave stage mode' : 'Stage mode'} (F)`}
          aria-pressed={stage}
          onClick={toggleStage}
        >
          {stage ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
