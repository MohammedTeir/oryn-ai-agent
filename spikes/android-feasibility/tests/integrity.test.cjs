const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, writeFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { verify } = require('../scripts/integrity.cjs');

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'oryn-integrity-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'artifact');
  await writeFile(path, 'abc');
  return path;
}
const abc = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
test('accepts a file matching the published SHA-256 known vector', async t => {
  assert.equal(await verify(await fixture(t), abc), abc);
});
test('rejects a corrupted artifact', async t => {
  const path = await fixture(t);
  await writeFile(path, 'abd');
  await assert.rejects(verify(path, abc), /mismatch/);
});
test('rejects malformed or abbreviated checksums', async t => {
  const path = await fixture(t);
  for (const digest of ['', 'abc', 'g'.repeat(64), abc + '\n']) {
    await assert.rejects(verify(path, digest), /Invalid/);
  }
});
test('missing artifacts cannot pass integrity validation', async t => {
  const path = await fixture(t);
  await rm(path);
  await assert.rejects(verify(path, abc), { code: 'ENOENT' });
});
