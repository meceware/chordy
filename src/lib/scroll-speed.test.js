import test from 'node:test';
import assert from 'node:assert/strict';
import { speedForBpm, SPEED_MIN, SPEED_MAX, SPEED_STEP, SPEED_DEFAULT } from './scroll-speed.js';

test('a missing tempo falls back to the default', () => {
  assert.equal(speedForBpm(null), SPEED_DEFAULT);
  assert.equal(speedForBpm(undefined), SPEED_DEFAULT);
  assert.equal(speedForBpm(0), SPEED_DEFAULT);
});

test('a tempo scales the starting speed to about a quarter of it', () => {
  assert.equal(speedForBpm(56), 14);
  assert.equal(speedForBpm(58), 14);
  assert.equal(speedForBpm(60), 16);
  assert.equal(speedForBpm(84), 22);
  assert.equal(speedForBpm(120), 30);
});

test('the result always lands on the stepper grid and within range', () => {
  for (let bpm = 1; bpm <= 400; bpm += 1) {
    const speed = speedForBpm(bpm);
    assert.equal(speed % SPEED_STEP, 0, `bpm ${bpm} gave ${speed}`);
    assert.ok(speed >= SPEED_MIN && speed <= SPEED_MAX, `bpm ${bpm} gave ${speed}`);
  }
});

test('extreme tempos clamp rather than running away', () => {
  assert.equal(speedForBpm(1), SPEED_MIN);
  assert.equal(speedForBpm(400), SPEED_MAX);
});
