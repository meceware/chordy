import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSignUpDisabled } from './signup.js';

test('sign-up is open when the flag is unset or empty', () => {
  assert.equal(parseSignUpDisabled(undefined), false);
  assert.equal(parseSignUpDisabled(null), false);
  assert.equal(parseSignUpDisabled(''), false);
});

test('only true closes sign-up', () => {
  assert.equal(parseSignUpDisabled('true'), true);
  assert.equal(parseSignUpDisabled(' TRUE '), true);
  assert.equal(parseSignUpDisabled('false'), false);
});

test('any other value leaves sign-up open', () => {
  for (const value of ['0', '1', 'yes', 'no']) assert.equal(parseSignUpDisabled(value), false, value);
});
