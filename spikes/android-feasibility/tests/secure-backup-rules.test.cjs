const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const script = path.resolve('scripts/verify-secure-store-backup.py');

function exclusions(tree) {
  const py = 'import importlib.util,json,sys; sys.dont_write_bytecode=True; s=importlib.util.spec_from_file_location("rules",sys.argv[1]); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); print(json.dumps(sorted(m.exclusions(sys.argv[2]))))';
  const result = spawnSync('python3', ['-c', py, script, tree], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}
test('recognizes backup exclusions only within their real scope', () => {
  const tree = `E: data-extraction-rules (line=1)
  E: cloud-backup (line=2)
    E: exclude (line=3)
      A: domain="sharedpref" (Raw: "sharedpref")
      A: path="SecureStore" (Raw: "SecureStore")
  E: device-transfer (line=4)
    E: exclude (line=5)
      A: domain="sharedpref" (Raw: "sharedpref")
      A: path="other" (Raw: "other")`;
  assert.deepEqual(exclusions(tree), [['data-extraction-rules', 'cloud-backup']]);
  assert.deepEqual(exclusions(tree.replace('path="other"', 'path="SecureStore"')), [['data-extraction-rules', 'cloud-backup'], ['data-extraction-rules', 'device-transfer']]);
});

test('fails closed when a packaged transfer exclusion is missing', (t) => {
  const fs = require('node:fs');
  const os = require('node:os');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oryn-backup-test-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const fake = path.join(tmp, 'aapt');
  fs.writeFileSync(fake, `#!/usr/bin/env python3
import os, sys
args = sys.argv[1:]
if args[1:3] == ['--values', 'resources']:
 print('  resource 0x7f120002 app:xml/secure_store_backup_rules: x\\n    (string8) "res/legacy.xml"\\n  resource 0x7f120003 app:xml/secure_store_data_extraction_rules: x\\n    (string8) "res/modern.xml"')
elif args[-1] == 'AndroidManifest.xml':
 print('A: android:fullBackupContent(0x010104eb)=@0x7f120002\\nA: android:dataExtractionRules(0x0101063e)=@0x7f120003')
elif args[-1] == 'res/legacy.xml':
 print('E: full-backup-content (line=1)\\n  E: exclude (line=2)\\n    A: domain="sharedpref"\\n    A: path="SecureStore"')
elif args[-1] == 'res/modern.xml':
 print('E: data-extraction-rules (line=1)\\n  E: cloud-backup (line=2)\\n    E: exclude (line=3)\\n      A: domain="sharedpref"\\n      A: path="SecureStore"')
 if not os.environ.get('ORYN_TEST_OMIT_TRANSFER'):
  print('  E: device-transfer (line=4)\\n    E: exclude (line=5)\\n      A: domain="sharedpref"\\n      A: path="SecureStore"')
else: sys.exit(1)
`, { mode: 0o755 });
  let result = spawnSync('python3', [script, fake, 'fixture.apk'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  result = spawnSync('python3', [script, fake, 'fixture.apk'], { encoding: 'utf8', env: { ...process.env, ORYN_TEST_OMIT_TRANSFER: '1' } });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /device-transfer does not exclude SecureStore/);
});
