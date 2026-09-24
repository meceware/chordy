import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getIP } from '@better-auth/core/utils/ip';
import { ipResolution } from './auth.js';

// getIP takes the whole options object, and only reads advanced.ipAddress out of it.
const options = { advanced: { ipAddress: ipResolution } };
const resolve = (headers) => getIP(new Headers(headers), options);

test('recovers the client through the tunnel and the reverse proxy', () => {
  // Cloudflare appends the visitor, nginx appends the hop it received from.
  assert.equal(resolve({ 'x-forwarded-for': '203.0.113.7, 172.18.0.4' }), '203.0.113.7');
  assert.equal(resolve({ 'x-forwarded-for': '203.0.113.7, 10.1.2.3, 172.18.0.4' }), '203.0.113.7');
});

/**
 * The reason x-forwarded-for is consulted before cf-connecting-ip. A visitor who sends their own
 * X-Forwarded-For has it appended to, not replaced, so the forgery sits to the left of the real
 * address and walking the chain from the right discards it.
 */
test('a forged X-Forwarded-For from the visitor is discarded', () => {
  assert.equal(resolve({ 'x-forwarded-for': '1.2.3.4, 203.0.113.7, 172.18.0.4' }), '203.0.113.7');
});

test('falls back to cf-connecting-ip when nothing forwards a chain', () => {
  assert.equal(resolve({ 'cf-connecting-ip': '203.0.113.9' }), '203.0.113.9');
});

test('a single untrusted value is the client, as a lone proxy would send', () => {
  assert.equal(resolve({ 'x-forwarded-for': '203.0.113.7' }), '203.0.113.7');
});

test('IPv6 clients resolve, normalised to a /64 so one address is one bucket', () => {
  assert.equal(resolve({ 'x-forwarded-for': '2001:db8::1, 172.18.0.4' }), '2001:0db8:0000:0000:0000:0000:0000:0000');
});

test('a chain of nothing but our own proxies resolves to no client', () => {
  // Better a shared bucket than trusting a private address as if it were a visitor.
  assert.equal(resolve({ 'x-forwarded-for': '172.18.0.4, 10.1.2.3' }), null);
});
