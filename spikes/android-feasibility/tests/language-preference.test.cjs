const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createLanguagePreferenceStore } = require('../storage/languagePreference.ts');

function opener(file, failClose = false) {
  return async () => {
    const db = new DatabaseSync(file);
    return {
      async getFirstAsync(sql, ...params) { return db.prepare(sql).get(...params) ?? null; },
      async runAsync(sql, ...params) { return db.prepare(sql).run(...params); },
      async closeAsync() { db.close(); if (failClose) throw new Error('private failure'); },
    };
  };
}
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'oryn-language-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'settings.db'); const db = new DatabaseSync(file);
  db.exec('CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)'); db.close();
  return file;
}
test('persists explicit language selection across connections and supports device default', async t => {
  const file = fixture(t); const store = createLanguagePreferenceStore(opener(file));
  assert.deepEqual(await store.load(), { ok: true, value: 'system' });
  assert.deepEqual(await store.save('ar'), { ok: true });
  assert.deepEqual(await createLanguagePreferenceStore(opener(file)).load(), { ok: true, value: 'ar' });
  assert.deepEqual(await store.save('en'), { ok: true });
  assert.deepEqual(await store.load(), { ok: true, value: 'en' });
  assert.deepEqual(await store.save('system'), { ok: true });
  assert.deepEqual(await store.load(), { ok: true, value: 'system' });
});
test('rejects invalid input and does not silently accept corrupted saved values', async t => {
  const file = fixture(t); const store = createLanguagePreferenceStore(opener(file));
  for (const value of [null, '', 'fr', 'ar; DROP TABLE settings']) assert.deepEqual(await store.save(value), { ok: false });
  const db = new DatabaseSync(file); db.prepare('INSERT INTO settings VALUES (?, ?)').run('language_preference', 'invalid'); db.close();
  assert.deepEqual(await store.load(), { ok: false });
  assert.deepEqual(await store.save('en'), { ok: true });
  assert.deepEqual(await store.load(), { ok: true, value: 'en' });
});
test('fails safely on storage and close errors without returning their messages', async t => {
  const file = fixture(t);
  const unavailable = createLanguagePreferenceStore(async () => { throw new Error('private detail'); });
  assert.deepEqual(await unavailable.load(), { ok: false });
  assert.deepEqual(await unavailable.save('ar'), { ok: false });
  const badClose = createLanguagePreferenceStore(opener(file, true));
  assert.deepEqual(await badClose.save('ar'), { ok: false });
  assert.deepEqual(await badClose.load(), { ok: false });
  // The write may have committed before close failed; do not report it as absent.
  assert.deepEqual(await createLanguagePreferenceStore(opener(file)).load(), { ok: true, value: 'ar' });
});
test('a reload waits for an earlier unfinished save', async () => {
  let stored = null; let release; let signal;
  const started = new Promise(resolve => { signal = resolve; });
  const store = createLanguagePreferenceStore(async () => ({
    async getFirstAsync() { return stored === null ? null : { value: stored }; },
    async runAsync(sql, key, value) { signal(); await new Promise(resolve => { release = resolve; }); stored = value; return { changes: 1 }; },
    async closeAsync() {},
  }));
  const saving = store.save('ar'); await started;
  const loading = store.load(); release();
  assert.deepEqual(await saving, { ok: true });
  assert.deepEqual(await loading, { ok: true, value: 'ar' });
});

test('does not report success when SQLite reports no changed row', async () => {
  let closed = false;
  const store = createLanguagePreferenceStore(async () => ({
    async getFirstAsync() { return null; },
    async runAsync() { return { changes: 0 }; },
    async closeAsync() { closed = true; },
  }));
  assert.deepEqual(await store.save('ar'), { ok: false });
  assert.equal(closed, true);
});
