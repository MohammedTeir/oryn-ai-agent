const { test } = require('node:test');
const assert = require('node:assert/strict');
const { previewDestination } = require('../previewNavigation.ts');
test('test harness opens one preview at a time and always returns to feasibility', () => {
  assert.equal(previewDestination('feasibility', 'open-navigation'), 'navigation');
  assert.equal(previewDestination('feasibility', 'open-shell'), 'shell');
  assert.equal(previewDestination('shell', 'open-navigation'), 'shell');
  assert.equal(previewDestination('navigation', 'open-shell'), 'navigation');
  for (const state of ['feasibility', 'navigation', 'shell']) assert.equal(previewDestination(state, 'close'), 'feasibility');
});
