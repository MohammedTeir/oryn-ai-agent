const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { migrateLocalDatabase, SCHEMA_VERSION } = require('../storage/migrations.ts');
const { inspectStorageSchema } = require('../storage/schemaCheck.ts');

function connection(db, close = () => {}) {
  return {
    async getFirstAsync(sql) { return db.prepare(sql).get() ?? null; },
    async getAllAsync(sql) { return db.prepare(sql).all(); },
    async closeAsync() { close(); },
  };
}
function adapter(db) {
  return { async withExclusiveTransactionAsync(callback) {
    db.exec('BEGIN EXCLUSIVE');
    try { await callback({ async getFirstAsync(sql) { return db.prepare(sql).get() ?? null; }, async execAsync(sql) { db.exec(sql); } }); db.exec('COMMIT'); }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  } };
}
test('reports only schema presence and connection settings for a real SQLite database', async t => {
  const db = new DatabaseSync(':memory:'); t.after(() => db.close());
  await migrateLocalDatabase(adapter(db)); db.exec('PRAGMA foreign_keys = ON');
  db.prepare('INSERT INTO conversations VALUES (?, ?, ?)').run('private-test-content', 1, 1);
  let closed = false;
  const result = await inspectStorageSchema(async () => connection(db, () => { closed = true; }), SCHEMA_VERSION);
  assert.deepEqual(result, { state: 'tables_present', schemaVersion: SCHEMA_VERSION, foreignKeysEnabled: true });
  assert.equal(closed, true);
  assert.equal(JSON.stringify(result).includes('private-test-content'), false);
  assert.deepEqual(await inspectStorageSchema(async () => connection(db), SCHEMA_VERSION + 1), { state: 'check_failed' });
});
test('missing tables, disabled foreign keys, open errors and close errors cannot report success', async t => {
  const db = new DatabaseSync(':memory:'); t.after(() => db.close());
  await migrateLocalDatabase(adapter(db)); db.exec('PRAGMA foreign_keys = OFF');
  assert.deepEqual(await inspectStorageSchema(async () => connection(db), SCHEMA_VERSION), { state: 'check_failed' });
  db.exec('PRAGMA foreign_keys = ON'); db.exec('DROP TABLE settings');
  assert.deepEqual(await inspectStorageSchema(async () => connection(db), SCHEMA_VERSION), { state: 'check_failed' });
  assert.deepEqual(await inspectStorageSchema(async () => { throw new Error('sensitive details'); }, SCHEMA_VERSION), { state: 'check_failed' });
  const complete = new DatabaseSync(':memory:'); t.after(() => complete.close());
  await migrateLocalDatabase(adapter(complete)); complete.exec('PRAGMA foreign_keys = ON');
  assert.deepEqual(await inspectStorageSchema(async () => connection(complete, () => { throw new Error('sensitive details'); }), SCHEMA_VERSION), { state: 'check_failed' });
});
