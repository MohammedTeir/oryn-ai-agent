const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const verifier = require.resolve('../scripts/verify-shell-apk.py');
function fixture(t, entries) {
  const dir = mkdtempSync(join(tmpdir(), 'oryn-shell-apk-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const json = join(dir, 'entries.json'); const apk = join(dir, 'test.apk');
  writeFileSync(json, JSON.stringify(entries));
  const make = spawnSync('python3', ['-c', "import json,sys,zipfile; z=zipfile.ZipFile(sys.argv[1],'w'); [z.writestr(k,v) for k,v in json.load(open(sys.argv[2])).items()]; z.close()", apk, json]);
  assert.equal(make.status, 0, String(make.stderr));
  return spawnSync('python3', [verifier, apk]);
}
test('shell APK boundary requires bundle and DEX without feasibility code', t => {
  assert.equal(fixture(t, { 'assets/index.android.bundle': 'Saved conversations', 'classes.dex': 'ordinary app' }).status, 0);
  assert.notEqual(fixture(t, { 'classes.dex': 'ordinary app' }).status, 0);
  assert.notEqual(fixture(t, { 'assets/index.android.bundle': 'Saved conversations Open local app shell preview', 'classes.dex': 'ordinary' }).status, 0);
  assert.notEqual(fixture(t, { 'assets/index.android.bundle': 'Saved conversations' }).status, 0);
  assert.notEqual(fixture(t, { 'assets/index.android.bundle': 'Saved conversations', 'classes2.dex': 'Lio/github/mohammedteir/oryn/feasibility/ExecutionModule;' }).status, 0);
  assert.notEqual(fixture(t, { 'assets/index.android.bundle': 'Saved conversations', 'classes.dex': 'ordinary', 'lib/arm64-v8a/liboryn_feasibility_probe.so': 'probe' }).status, 0);
});
