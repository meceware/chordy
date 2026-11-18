// Pixels per second. One pixel a step is fine enough to settle on the pace a song needs, and the
// default is a plain, slow starting point rather than a guess from the tempo: how far a sheet
// scrolls per beat depends on how many bars each line holds, which is not recorded.
export const SPEED_MIN = 1;
export const SPEED_MAX = 60;
export const SPEED_STEP = 1;
export const SPEED_DEFAULT = 10;

export const clampSpeed = (value) => Math.min(SPEED_MAX, Math.max(SPEED_MIN, Math.round(value) || SPEED_DEFAULT));

/** The speed a song opens at: the one saved for it, or the default. */
export function initialSpeed(saved) {
  return saved ? clampSpeed(saved) : SPEED_DEFAULT;
}
