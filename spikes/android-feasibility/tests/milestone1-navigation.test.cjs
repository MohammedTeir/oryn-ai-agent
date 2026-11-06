const test = require('node:test');
const assert = require('node:assert/strict');
const { initialNavigation, navigate } = require('../milestone1/navigation.ts');

test('settings returns to the selected tab and segment', () => {
  const tools = navigate(initialNavigation, { type: 'segment', segment: 'tools' });
  assert.deepEqual(navigate(navigate(tools, { type: 'settings' }), { type: 'back' }), tools);
});
test('header history opens history even from settings', () => {
  const settings = navigate(initialNavigation, { type: 'settings' });
  assert.deepEqual(navigate(settings, { type: 'history' }), { tab: 'terminal', segment: 'history', settings: false });
});
test('changing primary tabs closes settings and preserves terminal segment', () => {
  const history = navigate(initialNavigation, { type: 'history' });
  const agent = navigate(navigate(history, { type: 'settings' }), { type: 'tab', tab: 'agent' });
  assert.deepEqual(navigate(agent, { type: 'tab', tab: 'terminal' }), history);
});
