import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCanonicalUrl, CANONICAL_SELECTOR } from './useCanonicalUrl.js';

// A minimal head: an ordered list of elements with the operations the owner
// uses. The contract under test is one link at most, rewritten, added,
// removed and put back, which does not need a DOM implementation to state.
const fakeHead = (initialHref) => {
  const head = { children: [] };
  const element = (tag) => {
    const attributes = new Map();
    const node = {
      tag,
      parentNode: null,
      getAttribute: (name) => attributes.get(name) ?? null,
      setAttribute: (name, value) => attributes.set(name, String(value)),
      removeAttribute: (name) => attributes.delete(name),
      remove: () => {
        if (!node.parentNode) return;
        head.children.splice(head.children.indexOf(node), 1);
        node.parentNode = null;
      },
      get nextSibling() {
        const index = head.children.indexOf(node);
        return index < 0 ? null : head.children[index + 1] ?? null;
      },
    };
    return node;
  };
  head.ownerDocument = { createElement: element };
  head.appendChild = (node) => head.insertBefore(node, null);
  head.insertBefore = (node, reference) => {
    const index = reference ? head.children.indexOf(reference) : head.children.length;
    head.children.splice(index, 0, node);
    node.parentNode = head;
    return node;
  };
  head.querySelector = (selector) => {
    assert.equal(selector, CANONICAL_SELECTOR);
    return head.children.find((node) => node.tag === 'link' && node.getAttribute('rel') === 'canonical') ?? null;
  };
  head.canonicals = () => head.children
    .filter((node) => node.tag === 'link' && node.getAttribute('rel') === 'canonical')
    .map((node) => node.getAttribute('href'));
  head.tags = () => head.children.map((node) => node.tag);

  head.appendChild(element('title'));
  if (initialHref !== undefined) {
    const link = element('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', initialHref);
    head.appendChild(link);
  }
  head.appendChild(element('meta'));
  return head;
};

test('canonical URL ownership rewrites and restores the existing tag', () => {
  const head = fakeHead('https://hakan.run/');
  const restore = applyCanonicalUrl(head, 'https://hakan.run/card');
  assert.deepEqual(head.canonicals(), ['https://hakan.run/card']);
  restore();
  assert.deepEqual(head.canonicals(), ['https://hakan.run/']);
});

test('a page reached from a document without a canonical link adds the one link', () => {
  // A 404 document carries no canonical link; the page reached from it must.
  const head = fakeHead();
  const restore = applyCanonicalUrl(head, 'https://hakan.run/');
  assert.deepEqual(head.canonicals(), ['https://hakan.run/']);
  restore();
  assert.deepEqual(head.canonicals(), []);
});

test('a route that is not a page removes the link and puts it back where it was', () => {
  const head = fakeHead('https://hakan.run/');
  const before = head.tags();
  const restore = applyCanonicalUrl(head, null);
  assert.deepEqual(head.canonicals(), []);
  restore();
  assert.deepEqual(head.canonicals(), ['https://hakan.run/']);
  assert.deepEqual(head.tags(), before);
});

test('no canonical on a document that has none stays none', () => {
  const head = fakeHead();
  assert.equal(applyCanonicalUrl(head, null), undefined);
  assert.deepEqual(head.canonicals(), []);
});

test('putting a removed link back never makes a second one', () => {
  const head = fakeHead('https://hakan.run/');
  const restore = applyCanonicalUrl(head, null);
  applyCanonicalUrl(head, 'https://hakan.run/contact');
  restore();
  assert.deepEqual(head.canonicals(), ['https://hakan.run/contact']);
});

test('the 404 → page → 404 → page sequence ends with exactly the page link', () => {
  // The commit order React uses: the leaving route's cleanup, then the
  // entering route's declaration.
  const head = fakeHead();
  let restore = applyCanonicalUrl(head, null);
  assert.equal(restore, undefined);
  restore = applyCanonicalUrl(head, 'https://hakan.run/');
  assert.deepEqual(head.canonicals(), ['https://hakan.run/']);
  restore();
  restore = applyCanonicalUrl(head, null);
  assert.deepEqual(head.canonicals(), []);
  restore?.();
  restore = applyCanonicalUrl(head, 'https://hakan.run/notes');
  assert.deepEqual(head.canonicals(), ['https://hakan.run/notes']);
});

test('no head, no ownership', () => {
  assert.equal(applyCanonicalUrl(undefined, 'https://hakan.run/'), undefined);
});
