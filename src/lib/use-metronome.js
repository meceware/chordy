'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createMetronome } from './metronome.js';

/**
 * Owns one audio engine for the life of the page. The transport lives in the play bar and the
 * grid lives further up the page, so this sits above both of them.
 */
export function useMetronome(pattern, bpm) {
  const engine = useRef(null);
  const [running, setRunning] = useState(false);

  engine.current ??= createMetronome();

  useEffect(() => {
    const metronome = engine.current;
    // Leaving the song must not leave a drum kit playing behind you.
    return () => metronome.close();
  }, []);

  // Read by the scheduler on every step, so an edit lands within a beat without a restart.
  useEffect(() => {
    engine.current.update({ bpm, pattern });
  }, [bpm, pattern]);

  const toggle = useCallback(async () => {
    if (running) {
      engine.current.stop();
      setRunning(false);
      return;
    }

    // Reached from a click or a keypress, which is the gesture an AudioContext needs to resume.
    await engine.current.start({ bpm, pattern });
    setRunning(true);
  }, [bpm, pattern, running]);

  // Handed out rather than polled here: whoever draws the playhead should be the only thing that
  // re-renders for it. Polled from this hook it would re-render the whole sheet on every step.
  const playhead = useCallback(() => engine.current.playhead(), []);

  return { running, toggle, playhead };
}
