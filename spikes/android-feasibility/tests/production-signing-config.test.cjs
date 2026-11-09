const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const tool = require.resolve('../scripts/prepare-release-gradle.py');
function run(t, source) {
  const dir = mkdtempSync(join(tmpdir(), 'oryn-sign-config-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'build.gradle'); writeFileSync(file, source);
  return { result: spawnSync('python3', [tool, file], { encoding: 'utf8' }), file };
}
test('release configuration removes debug signing without changing debug build signing', t => {
  const source = 'android {\n    buildTypes {\n        debug {\n            signingConfig signingConfigs.debug\n        }\n        release {\n            signingConfig signingConfigs.debug\n        }\n    }\n}\n';
  const { result, file } = run(t, source); assert.equal(result.status, 0, result.stderr);
  const output = readFileSync(file, 'utf8'); assert.equal((output.match(/signingConfig signingConfigs\.debug/g) || []).length, 1);
  assert.match(output, /debug \{\n\s*signingConfig signingConfigs\.debug/);
  assert.match(output, /Release is unsigned here/);
});
test('unexpected or ambiguous Gradle templates fail without being changed', t => {
  for (const source of ['no build type', '    buildTypes {\n        release {\n            signingConfig signingConfigs.release\n        }\n    }\n', '    buildTypes {\n        release {\n            signingConfig signingConfigs.debug\n            signingConfig signingConfigs.debug\n        }\n    }\n', '    buildTypes {\n        release {\n            signingConfig signingConfigs.debug\n            signingConfig signingConfigs.other\n        }\n    }\n']) {
    const { result, file } = run(t, source); assert.notEqual(result.status, 0); assert.equal(readFileSync(file, 'utf8'), source);
  }
});
test('phone key setup rejects an unexpected GitHub account before key generation', t => {
  const dir = mkdtempSync(join(tmpdir(), 'oryn-phone-setup-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const { chmodSync, existsSync } = require('node:fs');
  const fakeGh = join(dir, 'gh'); const fakeKeytool = join(dir, 'keytool'); const marker = join(dir, 'keytool-ran');
  writeFileSync(fakeGh, '#!/bin/sh\nprintf "WrongAccount\\n"\n'); chmodSync(fakeGh, 0o700);
  writeFileSync(fakeKeytool, '#!/bin/sh\nprintf ran > "$ORYN_TEST_MARKER"\n'); chmodSync(fakeKeytool, 0o700);
  const script = require.resolve('../scripts/setup-release-key-termux.sh');
  const result = spawnSync('bash', [script], { encoding: 'utf8', env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, ORYN_TEST_MARKER: marker } });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /MohammedTeir/); assert.equal(existsSync(marker), false);
});
test('signing fails before packaging when release credentials are absent', () => {
  const env = { ...process.env };
  for (const name of ['ORYN_RELEASE_KEYSTORE_FILE', 'ORYN_RELEASE_KEY_ALIAS', 'ORYN_RELEASE_STORE_PASSWORD', 'ORYN_RELEASE_KEY_PASSWORD', 'ORYN_RELEASE_CERT_SHA256']) delete env[name];
  const script = require.resolve('../scripts/sign-production-apk.sh');
  const result = spawnSync('bash', [script], { encoding: 'utf8', env });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Missing keystore file/);
});
test('signing fails closed if the required grep tool is unavailable', t => {
  const dir = mkdtempSync(join(tmpdir(), 'oryn-no-grep-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const script = require.resolve('../scripts/sign-production-apk.sh');
  const result = spawnSync('/bin/bash', [script], { encoding: 'utf8', env: { ...process.env, PATH: dir } });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /Required tool grep is unavailable/);
});
