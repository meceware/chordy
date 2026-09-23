/**
 * A key is a root note, an optional accidental, and an optional minor mark — `G`, `Bb`, `F#m`.
 * Case carries meaning here and cannot simply be upper-cased: `b` is a flat, `B` is a note, and
 * the `m` of a minor key is lower case. So the root is upper-cased and the rest is mapped
 * explicitly.
 */
export function normaliseKey(value) {
  const cleaned = (value ?? '').replace(/\s+/g, '');
  if (cleaned === '') return '';

  const match = /^([A-Ga-g])([#b♯♭]?)(m|min|minor|M|maj|major)?$/.exec(cleaned);
  if (!match) return null;

  const [, root, accidental, quality] = match;
  const flat = accidental === 'b' || accidental === '♭';

  return root.toUpperCase() + (accidental ? (flat ? 'b' : '#') : '') + (/^m(in(or)?)?$/.test(quality ?? '') ? 'm' : '');
}

/**
 * What the Key input keeps as you type. Refusing keystrokes outright would be hostile — `F#m`
 * has to pass through `F` and `F#` — so each character is judged by the position it lands in
 * instead, which leaves no way to type prose into the field.
 */
export function keyInput(value) {
  let key = '';

  for (const character of value ?? '') {
    if (key === '') {
      if (/[A-Ga-g]/.test(character)) key = character.toUpperCase();
      continue;
    }

    if (key.length === 1 && /[#♯]/.test(character)) key += '#';
    else if (key.length === 1 && /[b♭]/.test(character)) key += 'b';
    else if (/m/i.test(character) && !key.endsWith('m')) key += 'm';
  }

  return key;
}
