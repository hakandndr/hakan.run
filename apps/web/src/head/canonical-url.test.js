import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCanonicalUrl, CANONICAL_SELECTOR } from './useCanonicalUrl.js';

test('canonical URL ownership rewrites and restores the existing tag', () => {
  const attributes = new Map([['href', 'https://hakan.run/']]);
  const link = {
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
  };
  const head = {
    querySelector(selector) {
      assert.equal(selector, CANONICAL_SELECTOR);
      return link;
    },
  };

  const restore = applyCanonicalUrl(head, 'https://hakan.run/card');
  assert.equal(attributes.get('href'), 'https://hakan.run/card');
  restore();
  assert.equal(attributes.get('href'), 'https://hakan.run/');
});

test('canonical URL ownership does not create a second tag', () => {
  const head = { querySelector: () => null };
  assert.equal(applyCanonicalUrl(head, 'https://hakan.run/card'), undefined);
});
