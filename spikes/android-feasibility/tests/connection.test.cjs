const test = require('node:test');
const assert = require('node:assert/strict');
const { statusFromNative } = require('../milestone1/connection.ts');
const native = (prerequisites) => JSON.stringify({ externalPrerequisites: prerequisites });

test('only real negative prerequisites produce specific status', () => {
  assert.equal(statusFromNative(native({ packageState: 'not_detected', runCommandPermission: 'not_checked_package_missing' })), 'notDetected');
  assert.equal(statusFromNative(native({ packageState: 'detected', runCommandPermission: 'denied' })), 'permissionRequired');
  assert.equal(statusFromNative(native({ packageState: 'detected', runCommandPermission: 'granted' })), 'unknown');
  assert.equal(statusFromNative(native({ packageState: 'unknown', runCommandPermission: 'denied' })), 'unknown');
});
test('malformed, missing or forged success-looking observations remain unknown', () => {
  for (const value of ['no json', 'null', '[]', '{}', native(null), native({ packageState: 'connected', runCommandPermission: 'granted' })]) {
    assert.equal(statusFromNative(value), 'unknown');
  }
});
