'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Saves `value` a moment after it stops changing, so a run of taps costs one round trip.
 *
 * `serialise` turns the value into the string that decides "has this changed?"; `initial` is
 * what the server already holds, so mounting never writes anything back. A save that throws,
 * or resolves to `{ error }`, leaves the change pending and reports `error` until `retry()` or
 * the next edit gets it through.
 *
 * Unmounting with a change still waiting sends it straight away instead of dropping it, which
 * is what makes leaving the page safe without a save button. `blocked` holds saving back while
 * the value is not saveable yet (an empty title, say) without counting as a failure.
 */
export function useAutosave(value, save, { initial, serialise = String, delay = 400, blocked = false } = {}) {
  const key = serialise(value);
  const [savedKey, setSavedKey] = useState(() => (initial === undefined ? key : serialise(initial)));
  const [status, setStatus] = useState('idle');
  const [problem, setProblem] = useState(null);
  const [attempt, setAttempt] = useState(0);

  const latest = useRef({ value, save, key, savedKey, blocked });
  const sequence = useRef(0);

  useEffect(() => {
    latest.current = { value, save, key, savedKey, blocked };
  });

  const run = useCallback(async () => {
    const { value: current, save: send, key: sending } = latest.current;
    const mine = ++sequence.current;
    setStatus('saving');

    try {
      const result = await send(current);
      if (result?.error) throw new Error(result.error);
      // A slower, older request finishing late must not overwrite the newer one's outcome.
      if (mine !== sequence.current) return true;
      latest.current.savedKey = sending;
      setSavedKey(sending);
      setProblem(null);
      setStatus('saved');
      return true;
    } catch (error) {
      if (mine !== sequence.current) return false;
      setProblem(error?.message || 'Could not save.');
      setStatus('error');
      return false;
    }
  }, []);

  const dirty = key !== savedKey;

  useEffect(() => {
    if (!dirty || blocked) return undefined;
    const timer = setTimeout(run, delay);
    return () => clearTimeout(timer);
  }, [dirty, blocked, key, delay, attempt, run]);

  // Leaving with an edit still in its debounce window sends it rather than losing it.
  useEffect(
    () => () => {
      const pending = latest.current;
      if (pending.key !== pending.savedKey && !pending.blocked) pending.save(pending.value);
    },
    [],
  );

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  /** Saves now if anything is waiting; resolves false if that save failed. For "Done" buttons. */
  const flush = useCallback(async () => {
    const { key: current, savedKey: saved, blocked: held } = latest.current;
    if (current === saved || held) return true;
    return run();
  }, [run]);

  return { status: dirty && status === 'saved' ? 'idle' : status, dirty, problem, retry, flush };
}
