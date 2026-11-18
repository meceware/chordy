import test from 'node:test';
import assert from 'node:assert/strict';
import { clampSpeed, initialSpeed, SPEED_DEFAULT, SPEED_MAX, SPEED_MIN, SPEED_STEP } from './scroll-speed.js';

test('a song with no saved speed starts at 10, stepping one at a time', () => {
  assert.equal(SPEED_DEFAULT, 10);
  assert.equal(SPEED_STEP, 1);
  assert.equal(initialSpeed(null), 10);
  assert.equal(initialSpeed(undefined), 10);
  assert.equal(initialSpeed(0), 10);
});

test('a saved speed is kept as it is, so songs set up before keep their pace', () => {
  assert.equal(initialSpeed(22), 22);
  assert.equal(initialSpeed(7), 7);
});

test('speeds stay within range', () => {
  assert.equal(clampSpeed(-5), SPEED_MIN);
  assert.equal(clampSpeed(400), SPEED_MAX);
  assert.equal(initialSpeed(400), SPEED_MAX);
});
