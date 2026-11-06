const test = require('node:test');
const assert = require('node:assert/strict');
const { exampleNavigation, initialExampleState } = require('../milestone1/approvalExampleState.ts');

test('closing and reopening the example resets expanded sections', () => {
  let state = exampleNavigation(initialExampleState, 'open');
  state = exampleNavigation(state, 'toggleDetails');
  state = exampleNavigation(state, 'toggleMore');
  assert.deepEqual(state, { visible: true, details: true, more: true });
  state = exampleNavigation(state, 'close');
  assert.deepEqual(exampleNavigation(state, 'open'), { visible: true, details: false, more: false });
});
test('disclosures cannot change while the example is closed', () => {
  assert.deepEqual(exampleNavigation(initialExampleState, 'toggleDetails'), initialExampleState);
  assert.deepEqual(exampleNavigation(initialExampleState, 'toggleMore'), initialExampleState);
});
