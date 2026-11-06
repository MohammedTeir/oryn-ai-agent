const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { Buffer } = require('node:buffer');
const { spawnSync } = require('node:child_process');
const script = path.resolve('scripts/publish-test-release.sh');

function fixture() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oryn-release-test-'));
  const artifacts = path.join(tmp, 'artifacts'); fs.mkdirSync(artifacts);
  const bin = path.join(tmp, 'bin'); fs.mkdirSync(bin);
  const calls = path.join(tmp, 'calls');
  const commit = 'a'.repeat(40);
  const apk = Buffer.from('test-only fixture');
  const hash = crypto.createHash('sha256').update(apk).digest('hex');
  fs.writeFileSync(path.join(artifacts, 'oryn-feasibility-phone.apk'), apk);
  fs.writeFileSync(path.join(artifacts, 'source-commit.txt'), `${commit}\n`);
  fs.writeFileSync(path.join(artifacts, 'SHA256SUMS'), `${hash}  oryn-feasibility-phone.apk\n`);
  fs.writeFileSync(path.join(artifacts, 'build-info.json'), JSON.stringify({ source_commit: commit, apk_sha256: hash, signing: 'Android debug signer; test-only feasibility app', signer_sha256: 'b'.repeat(64) }));
  fs.writeFileSync(path.join(artifacts, 'phone-apk-signature.txt'), `Verifies\nV2 Signer: certificate SHA-256 digest: ${'b'.repeat(64)}\n`);
  fs.writeFileSync(path.join(bin, 'gh'), '#!/bin/sh\nprintf "%s\\n" "$@" >> "$ORYN_TEST_CALLS"\nif [ "$ORYN_TEST_FAIL_CREATE" = 1 ] && [ "$2" = create ]; then exit 1; fi\n', { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, ORYN_TEST_CALLS: calls, GITHUB_SHA: commit, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '1', GITHUB_REPOSITORY: 'owner/repo', GITHUB_SERVER_URL: 'https://github.com' };
  return { tmp, artifacts, calls, env };
}

test('publishes only the verified APK as a prerelease targeting its commit', (t) => {
  const f = fixture(); t.after(() => fs.rmSync(f.tmp, { recursive: true, force: true }));
  const result = spawnSync('bash', [script, f.artifacts], { env: f.env, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const args = fs.readFileSync(f.calls, 'utf8').split('\n');
  assert.ok(args.includes('feasibility-test-123-1'));
  assert.ok(args.includes('--draft'));
  assert.ok(args.includes('--draft=false'));
  assert.ok(args.includes('--prerelease'));
  assert.ok(args.includes('edit'));
  assert.ok(args.includes('--latest=false'));
  assert.equal(args[args.indexOf('--target') + 1], f.env.GITHUB_SHA);
  assert.match(fs.readFileSync(path.join(f.artifacts, 'release-notes.md'), 'utf8'), /debug-signed test build/);
});

test('corrupt or wrong-commit artifacts cannot trigger a release', (t) => {
  const f = fixture(); t.after(() => fs.rmSync(f.tmp, { recursive: true, force: true }));
  fs.writeFileSync(path.join(f.artifacts, 'oryn-feasibility-phone.apk'), 'corrupt');
  let result = spawnSync('bash', [script, f.artifacts], { env: f.env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.equal(fs.existsSync(f.calls), false);
  f.env.GITHUB_SHA = 'c'.repeat(40);
  result = spawnSync('bash', [script, f.artifacts], { env: f.env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.equal(fs.existsSync(f.calls), false);
});

test('refuses to publish when signer metadata and verification output differ', (t) => {
  const f = fixture(); t.after(() => fs.rmSync(f.tmp, { recursive: true, force: true }));
  fs.writeFileSync(path.join(f.artifacts, 'phone-apk-signature.txt'), `Verifies\nV2 Signer: certificate SHA-256 digest: ${'c'.repeat(64)}\n`);
  const result = spawnSync('bash', [script, f.artifacts], { env: f.env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.equal(fs.existsSync(f.calls), false);
});

test('does not publish a draft if release creation or upload fails', (t) => {
  const f = fixture(); t.after(() => fs.rmSync(f.tmp, { recursive: true, force: true }));
  f.env.ORYN_TEST_FAIL_CREATE = '1';
  const result = spawnSync('bash', [script, f.artifacts], { env: f.env, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  const args = fs.readFileSync(f.calls, 'utf8').split('\n');
  assert.ok(args.includes('--draft'));
  assert.equal(args.includes('edit'), false);
});
