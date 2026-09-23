import test from 'node:test';
import assert from 'node:assert/strict';
import { parseShapeText, formatShapeText, toPosition, DIAGRAM_FRETS } from './shape-text.js';

test('reads the spaced, run-together and dashed shorthands alike', () => {
  const expected = [-1, 3, 2, 0, 1, 0];
  assert.deepEqual(parseShapeText('x 3 2 0 1 0'), expected);
  assert.deepEqual(parseShapeText('x32010'), expected);
  assert.deepEqual(parseShapeText('x-3-2-0-1-0'), expected);
  assert.deepEqual(parseShapeText('X,3,2,0,1,0'), expected);
});

test('rejects anything that is not six strings', () => {
  assert.equal(parseShapeText(''), null);
  assert.equal(parseShapeText('x 3 2 0 1'), null);
  assert.equal(parseShapeText('x 3 2 0 1 0 2'), null);
  assert.equal(parseShapeText('x y 2 0 1 0'), null);
});

test('numbers are positions in the window, so nothing beyond it is accepted', () => {
  assert.deepEqual(parseShapeText('x 4 4 4 x x'), [-1, 4, 4, 4, -1, -1]);
  assert.equal(parseShapeText('x 5 2 0 1 0'), null);
  assert.equal(parseShapeText('10 12 12 12 10 10'), null);
  assert.equal(DIAGRAM_FRETS, 4);
});

test('round trips through the text form', () => {
  assert.equal(formatShapeText([-1, 3, 2, 0, 1, 0]), 'x 3 2 0 1 0');
  assert.deepEqual(parseShapeText(formatShapeText([-1, 1, 3, 3, 2, -1])), [-1, 1, 3, 3, 2, -1]);
});

test('the base fret positions the window without touching the pattern', () => {
  const frets = [-1, 1, 3, 3, 2, -1];

  for (const baseFret of [1, 3, 8, 12]) {
    const position = toPosition(frets, baseFret);
    assert.deepEqual(position.frets, frets, `pattern must not move at fret ${baseFret}`);
    assert.equal(position.baseFret, baseFret);
  }
});

test('an open shape keeps its open strings at every position', () => {
  const position = toPosition([0, 2, 2, 1, 0, 0], 5);
  assert.deepEqual(position.frets, [0, 2, 2, 1, 0, 0]);
  assert.equal(position.baseFret, 5);
});
