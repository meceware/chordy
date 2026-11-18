import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldIgnoreShortcut } from './keys.js';

const element = (tagName, { interactive = false } = {}) => ({
  tagName,
  isContentEditable: false,
  closest: () => (interactive ? {} : null),
});

const press = (key, target, extra = {}) => ({ key, target, metaKey: false, ctrlKey: false, altKey: false, ...extra });
const page = (dialogOpen = false) => ({ querySelector: () => (dialogOpen ? {} : null) });

test('a shortcut on the bare page goes through', () => {
  assert.equal(shouldIgnoreShortcut(press(' ', element('BODY')), page()), false);
  assert.equal(shouldIgnoreShortcut(press('f', element('BODY')), page()), false);
});

test('Space on a focused button presses the button, not the shortcut', () => {
  assert.equal(shouldIgnoreShortcut(press(' ', element('BUTTON', { interactive: true })), page()), true);
  // Letter shortcuts still work from a focused button, which cannot use them.
  assert.equal(shouldIgnoreShortcut(press('f', element('BUTTON', { interactive: true })), page()), false);
});

test('typing, modifiers and open dialogs all suppress shortcuts', () => {
  assert.equal(shouldIgnoreShortcut(press('-', element('INPUT')), page()), true);
  assert.equal(shouldIgnoreShortcut(press('f', element('BODY'), { metaKey: true }), page()), true);
  assert.equal(shouldIgnoreShortcut(press(' ', element('BODY')), page(true)), true);
});
