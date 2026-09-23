export const SPEED_MIN = 2;
export const SPEED_MAX = 60;
export const SPEED_STEP = 2;
export const SPEED_DEFAULT = 20;

const clamp = (value) => Math.min(SPEED_MAX, Math.max(SPEED_MIN, value));

/**
 * A starting scroll rate for a song's tempo, rounded to the stepper's increment so the
 * buttons stay on the same grid. A quarter of the tempo is a calibration rather than a
 * derivation — how far a sheet scrolls per beat depends on how many bars each line holds,
 * which is not recorded — so it is a sane opening position to adjust from.
 */
export function speedForBpm(bpm) {
  if (!bpm || bpm <= 0) return SPEED_DEFAULT;
  return clamp(Math.round(bpm / 4 / SPEED_STEP) * SPEED_STEP);
}
