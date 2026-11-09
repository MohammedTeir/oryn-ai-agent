const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { migrateLocalDatabase, SCHEMA_VERSION } = require('../storage/migrations.ts');

function adapter(sqlite, failOnVersionWrite = false) {
  return { async withExclusiveTransactionAsync(callback) {
    sqlite.exec('BEGIN EXCLUSIVE');
    try {
      await callback({
        async getFirstAsync(sql) { return sqlite.prepare(sql).get() ?? null; },
        async execAsync(sql) { if (failOnVersionWrite && sql.startsWith('PRAGMA user_version =')) throw new Error('simulated interruption'); sqlite.exec(sql); },
      });
      sqlite.exec('COMMIT');
    } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
  } };
}

test('creates the schema once and preserves persisted data across reopen', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'oryn-storage-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'test.db'); let db = new DatabaseSync(file);
  await migrateLocalDatabase(adapter(db));
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
  db.prepare('INSERT INTO conversations VALUES (?, ?, ?)').run('c1', 1, 1);
  db.close(); db = new DatabaseSync(file); t.after(() => db.close());
  await migrateLocalDatabase(adapter(db));
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM conversations').get().n, 1);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(row => row.name);
  for (const name of ['conversations', 'agent_messages', 'tasks', 'plan_steps', 'action_proposals', 'approval_audit', 'executions', 'execution_events', 'tool_inventory', 'runtime_profiles', 'artifacts', 'settings']) assert.ok(tables.includes(name), name);
});

test('interruption rolls back schema and version and allows a retry', async t => {
  const db = new DatabaseSync(':memory:'); t.after(() => db.close());
  await assert.rejects(migrateLocalDatabase(adapter(db, true)), /simulated interruption/);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table'").get().n, 0);
  await migrateLocalDatabase(adapter(db));
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
});

test('refuses to downgrade a database with a newer schema', async t => {
  const db = new DatabaseSync(':memory:'); t.after(() => db.close()); db.exec(`PRAGMA user_version = ${SCHEMA_VERSION + 1}`);
  await assert.rejects(migrateLocalDatabase(adapter(db)), /Unsupported local database version/);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION + 1);
});

test('enforced relationships reject orphan rows and duplicate plan positions', async t => {
  const db = new DatabaseSync(':memory:'); t.after(() => db.close());
  await migrateLocalDatabase(adapter(db)); db.exec('PRAGMA foreign_keys = ON');
  assert.throws(() => db.prepare('INSERT INTO tasks VALUES (?, ?, ?, ?, ?)').run('t1', 'missing', 'queued', 1, 1));
  db.prepare('INSERT INTO tasks VALUES (?, ?, ?, ?, ?)').run('t1', null, 'queued', 1, 1);
  db.prepare('INSERT INTO plan_steps VALUES (?, ?, ?, ?)').run('s1', 't1', 0, 'queued');
  assert.throws(() => db.prepare('INSERT INTO plan_steps VALUES (?, ?, ?, ?)').run('s2', 't1', 0, 'queued'));
});

test('upgrades version 1 without losing conversations, and rolls back interruption', async t => {
  const db = new DatabaseSync(':memory:'); t.after(() => db.close());
  await migrateLocalDatabase(adapter(db));
  db.exec('DROP TABLE pending_local_message'); db.exec('PRAGMA user_version = 1');
  db.prepare('INSERT INTO conversations VALUES (?, ?, ?)').run('preserved', 1, 1);
  await assert.rejects(migrateLocalDatabase(adapter(db, true)), /simulated interruption/);
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, 1);
  assert.equal(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE name = 'pending_local_message'").get().n, 0);
  await migrateLocalDatabase(adapter(db));
  assert.equal(db.prepare('PRAGMA user_version').get().user_version, SCHEMA_VERSION);
  assert.equal(db.prepare('SELECT count(*) AS n FROM conversations WHERE id = ?').get('preserved').n, 1);
});
