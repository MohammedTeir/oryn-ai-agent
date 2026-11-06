const test = require('node:test');
const assert = require('node:assert/strict');
const { removeUnqualifiedApi33Attribute } = require('../plugins/withCompatibleSplash.cjs');

test('removes only the unsupported splash preference and preserves other resources', () => {
  const item = (name) => ({ $: { name }, _: 'value' });
  const resources = { style: [
    { $: { name: 'Theme.App.SplashScreen' }, item: [item('windowSplashScreenBackground'), item('android:windowSplashScreenBehavior'), item('postSplashScreenTheme')] },
    { $: { name: 'AnotherTheme' }, item: [item('android:windowSplashScreenBehavior')] },
  ] };
  removeUnqualifiedApi33Attribute(resources);
  assert.deepEqual(resources.style[0].item.map((entry) => entry.$.name), ['windowSplashScreenBackground', 'postSplashScreenTheme']);
  assert.equal(resources.style[1].item.length, 1);
  assert.doesNotThrow(() => removeUnqualifiedApi33Attribute({}));
});
