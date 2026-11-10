/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const tool = require.resolve('../scripts/verify-font-apk.py');
test('APK font verification detects missing or modified candidate assets', t => {
  const dir = mkdtempSync(join(tmpdir(), 'oryn-font-apk-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const make = `import pathlib,sys,zipfile
root=pathlib.Path(sys.argv[1]); out=sys.argv[2]; mode=sys.argv[3]
with zipfile.ZipFile(out,'w') as z:
 for name in ['IBMPlexSansArabic-Regular.ttf','IBMPlexSansArabic-SemiBold.ttf','IBMPlexSansArabic-Bold.ttf']:
  if mode == 'missing' and name.endswith('Bold.ttf'): continue
  content=(root/name).read_bytes()
  if mode == 'changed' and name.endswith('Regular.ttf'): content=b'bad'
  z.writestr('assets/fonts/'+name,content)
 if mode != 'license': z.writestr('assets/licenses/IBM-Plex-OFL.txt',(root/'OFL.txt').read_bytes())`;
  for (const mode of ['valid', 'missing', 'changed', 'license']) {
    const apk = join(dir, `${mode}.apk`);
    const built = spawnSync('python3', ['-c', make, join(__dirname, '../production/fonts'), apk, mode]); assert.equal(built.status, 0, String(built.stderr));
    const result = spawnSync('python3', [tool, apk]);
    assert.equal(result.status === 0, mode === 'valid', String(result.stderr));
  }
});
