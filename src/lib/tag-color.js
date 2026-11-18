// Translucent tints read on both themes: the fill and ring come from the hue at low opacity, the
// text from a shade that clears contrast on white and on near-black. `solid` is the same hue
// filled in, for a tag that is selected as a filter.
const PALETTE = [
  {
    tint: 'bg-rose-500/15 text-rose-700 ring-rose-500/25 dark:text-rose-300',
    solid: 'bg-rose-600 text-white ring-rose-600 dark:bg-rose-400 dark:text-rose-950 dark:ring-rose-400',
  },
  {
    tint: 'bg-amber-500/15 text-amber-800 ring-amber-500/25 dark:text-amber-300',
    solid: 'bg-amber-500 text-amber-950 ring-amber-500 dark:bg-amber-400 dark:ring-amber-400',
  },
  {
    tint: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300',
    solid: 'bg-emerald-600 text-white ring-emerald-600 dark:bg-emerald-400 dark:text-emerald-950 dark:ring-emerald-400',
  },
  {
    tint: 'bg-sky-500/15 text-sky-700 ring-sky-500/25 dark:text-sky-300',
    solid: 'bg-sky-600 text-white ring-sky-600 dark:bg-sky-400 dark:text-sky-950 dark:ring-sky-400',
  },
  {
    tint: 'bg-violet-500/15 text-violet-700 ring-violet-500/25 dark:text-violet-300',
    solid: 'bg-violet-600 text-white ring-violet-600 dark:bg-violet-400 dark:text-violet-950 dark:ring-violet-400',
  },
  {
    tint: 'bg-fuchsia-500/15 text-fuchsia-700 ring-fuchsia-500/25 dark:text-fuchsia-300',
    solid: 'bg-fuchsia-600 text-white ring-fuchsia-600 dark:bg-fuchsia-400 dark:text-fuchsia-950 dark:ring-fuchsia-400',
  },
  {
    tint: 'bg-teal-500/15 text-teal-700 ring-teal-500/25 dark:text-teal-300',
    solid: 'bg-teal-600 text-white ring-teal-600 dark:bg-teal-400 dark:text-teal-950 dark:ring-teal-400',
  },
  {
    tint: 'bg-orange-500/15 text-orange-800 ring-orange-500/25 dark:text-orange-300',
    solid: 'bg-orange-600 text-white ring-orange-600 dark:bg-orange-400 dark:text-orange-950 dark:ring-orange-400',
  },
];

// Same tag always gets the same colour without anyone choosing one.
function swatch(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function tagColor(name) {
  return swatch(name).tint;
}

export function tagColorSelected(name) {
  return swatch(name).solid;
}
