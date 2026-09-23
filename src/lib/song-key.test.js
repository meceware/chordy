import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseKey, keyInput } from './song-key.js';

test('upper-cases the root without destroying a flat', () => {
  assert.equal(normaliseKey('g'), 'G');
  assert.equal(normaliseKey('bb'), 'Bb');
  assert.equal(normaliseKey('Bb'), 'Bb');
  assert.equal(normaliseKey('eb'), 'Eb');
});

test('keeps sharps and the minor mark', () => {
  assert.equal(normaliseKey('f#'), 'F#');
  assert.equal(normaliseKey('f#m'), 'F#m');
  assert.equal(normaliseKey('AM'), 'A');
  assert.equal(normaliseKey('am'), 'Am');
  assert.equal(normaliseKey('Amin'), 'Am');
  assert.equal(normaliseKey('c♯'), 'C#');
  assert.equal(normaliseKey('d♭'), 'Db');
});

test('an empty key stays empty, and prose is rejected', () => {
  assert.equal(normaliseKey(''), '');
  assert.equal(normaliseKey(null), '');
  assert.equal(normaliseKey('H'), null);
  assert.equal(normaliseKey('the key of g'), null);
  assert.equal(normaliseKey('G7'), null);
});

test('the input filter lets a key be typed one character at a time', () => {
  assert.equal(keyInput('f'), 'F');
  assert.equal(keyInput('f#'), 'F#');
  assert.equal(keyInput('f#m'), 'F#m');
  assert.equal(keyInput('bb'), 'Bb');
  assert.equal(keyInput('am'), 'Am');
  // Prose cannot survive: only the first A-G letter lands, and nothing after it fits.
  assert.equal(keyInput('the key of g'), 'E');
  assert.equal(keyInput('G7!!'), 'G');
  assert.equal(keyInput('Amin'), 'Am');
  assert.equal(keyInput(''), '');
});
