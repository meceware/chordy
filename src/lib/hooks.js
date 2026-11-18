'use client';

import { useCallback, useSyncExternalStore } from 'react';

const neverChanges = () => () => {};

// Server renders false, the client renders true from the first commit onwards. Used to
// hold back anything whose value is unknowable during SSR, without a setState effect.
export function useHydrated() {
  return useSyncExternalStore(neverChanges, () => true, () => false);
}

export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const flagListeners = new Set();

function readFlag(key) {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

/**
 * A boolean that lives for the browser session and survives moving between pages, so a choice
 * like "keep the screen on" carries from one song to the next but is not on by itself next week.
 * Server render is always false.
 */
export function useSessionFlag(key) {
  const subscribe = useCallback((onChange) => {
    flagListeners.add(onChange);
    return () => flagListeners.delete(onChange);
  }, []);

  const value = useSyncExternalStore(subscribe, () => readFlag(key), () => false);

  const setValue = useCallback(
    (next) => {
      const resolved = typeof next === 'function' ? next(readFlag(key)) : next;
      try {
        if (resolved) sessionStorage.setItem(key, '1');
        else sessionStorage.removeItem(key);
      } catch {
        // Storage refused (private mode, quota): the flag simply does not persist.
      }
      for (const listener of flagListeners) listener();
    },
    [key],
  );

  return [value, setValue];
}

const choiceListeners = new Set();

function readChoice(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * One of a fixed set of values, remembered in this browser (never the database) and shared by
 * every tab: a library sorted by artist stays sorted by artist next week. Anything stored that is
 * not one of `choices` reads as `fallback`, as does the server render.
 */
export function useStoredChoice(key, fallback, choices) {
  const subscribe = useCallback(
    (onChange) => {
      const onStorage = (event) => {
        if (event.key === key) onChange();
      };
      choiceListeners.add(onChange);
      window.addEventListener('storage', onStorage);
      return () => {
        choiceListeners.delete(onChange);
        window.removeEventListener('storage', onStorage);
      };
    },
    [key],
  );

  const stored = useSyncExternalStore(subscribe, () => readChoice(key), () => null);

  const setValue = useCallback(
    (next) => {
      try {
        localStorage.setItem(key, next);
      } catch {
        // Storage refused (private mode, quota): the choice lasts until the page closes.
      }
      for (const listener of choiceListeners) listener();
    },
    [key],
  );

  return [choices.includes(stored) ? stored : fallback, setValue];
}
