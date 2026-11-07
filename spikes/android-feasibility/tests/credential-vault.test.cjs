const test = require('node:test');
const assert = require('node:assert/strict');
const { createCredentialVault } = require('../credentials/vault.ts');

function backend() {
  let value = null;
  const calls = [];
  return { calls, async isAvailableAsync() { return true; }, async setItemAsync(key, next) { calls.push(['set', key]); value = next; }, async getItemAsync(key) { calls.push(['get', key]); return value; }, async deleteItemAsync(key) { calls.push(['delete', key]); value = null; } };
}

test('stores, reads and removes only the dedicated credential item', async () => {
  const fake = backend(); const vault = createCredentialVault(fake);
  assert.deepEqual(await vault.read(), { ok: true, value: null });
  assert.deepEqual(await vault.save('sample-test-secret'), { ok: true });
  assert.deepEqual(await vault.read(), { ok: true, value: 'sample-test-secret' });
  assert.deepEqual(await vault.clear(), { ok: true });
  assert.deepEqual(await vault.read(), { ok: true, value: null });
  assert.ok(fake.calls.every(([, key]) => key === 'oryn.gemini.api-key'));
});
test('invalid input and unavailable storage never write to the backend', async () => {
  const fake = backend(); fake.isAvailableAsync = async () => false; const vault = createCredentialVault(fake);
  for (const value of ['', '   ', null, 123]) assert.deepEqual(await vault.save(value), { ok: false, reason: 'invalid' });
  assert.deepEqual(await vault.save('sample-test-secret'), { ok: false, reason: 'unavailable' });
  assert.deepEqual(await vault.read(), { ok: false, reason: 'unavailable' });
  assert.equal(fake.calls.length, 0);
});
test('native exceptions cannot leak their contents through results', async () => {
  const fake = backend();
  fake.isAvailableAsync = async () => { throw new Error('sample-test-secret'); };
  const availability = createCredentialVault(fake);
  assert.deepEqual(await availability.save('sample-test-secret'), { ok: false, reason: 'failed' });
  fake.isAvailableAsync = async () => true;
  fake.getItemAsync = async () => { throw new Error('sample-test-secret'); };
  fake.setItemAsync = async () => { throw new Error('sample-test-secret'); };
  fake.deleteItemAsync = async () => { throw new Error('sample-test-secret'); };
  const vault = createCredentialVault(fake);
  for (const result of [await vault.read(), await vault.save('sample-test-secret'), await vault.clear()]) {
    assert.deepEqual(result, { ok: false, reason: 'failed' });
    assert.equal(JSON.stringify(result).includes('sample-test-secret'), false);
  }
});
test('a later delete cannot be overtaken by an earlier pending save', async () => {
  const fake = backend(); let release;
  const original = fake.setItemAsync;
  fake.setItemAsync = async (key, value) => { await new Promise(resolve => { release = resolve; }); await original(key, value); };
  const vault = createCredentialVault(fake);
  const saving = vault.save('sample-test-secret');
  await new Promise(resolve => setImmediate(resolve));
  const clearing = vault.clear(); release();
  assert.deepEqual(await saving, { ok: true });
  assert.deepEqual(await clearing, { ok: true });
  assert.deepEqual(await vault.read(), { ok: true, value: null });
});
