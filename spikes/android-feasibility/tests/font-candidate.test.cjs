const { test } = require('node:test');
const assert = require('node:assert/strict');
const { candidateTypography } = require('../production/typography.ts');
const config = require('../app.json');

test('Android font config contains every named candidate face and the license plugin', () => {
  const plugin = config.expo.plugins.find(item => Array.isArray(item) && item[0] === 'expo-font');
  assert.ok(plugin);
  const fonts = plugin[1].fonts;
  for (const family of Object.values(candidateTypography)) assert.ok(fonts.includes(`./production/fonts/${family}.ttf`), family);
  assert.ok(config.expo.plugins.includes('./plugins/withFontLicense.cjs'));
});
