const test = require('node:test');
const assert = require('node:assert/strict');
const { selectLanguage } = require('../language.ts');

test('uses the first supported language in device preference order', () => {
  assert.equal(selectLanguage([{ languageCode: 'fr' }, { languageCode: 'ar' }, { languageCode: 'en' }]), 'ar');
  assert.equal(selectLanguage([{ languageCode: 'en' }, { languageCode: 'ar' }]), 'en');
  assert.equal(selectLanguage([{ languageCode: 'AR' }]), 'ar');
});
test('unsupported or missing language falls back safely to English', () => {
  assert.equal(selectLanguage([{ languageCode: null }, { languageCode: 'ur' }]), 'en');
  assert.equal(selectLanguage([]), 'en');
});
