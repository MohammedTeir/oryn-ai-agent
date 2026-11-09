const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { migrateLocalDatabase } = require('../storage/migrations.ts');
const { createConversationRepository } = require('../storage/conversations.ts');
function wrap(db) {
  return { async execAsync(sql) { db.exec(sql); }, async runAsync(sql, ...args) { return db.prepare(sql).run(...args); }, async getFirstAsync(sql, ...args) { return db.prepare(sql).get(...args) ?? null; }, async getAllAsync(sql, ...args) { return db.prepare(sql).all(...args).map(row => ({ ...row })); }, async closeAsync() { db.close(); } };
}
function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), 'oryn-conversation-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'data.db'); const sqlite = new DatabaseSync(file);
  return { file, async init() { await migrateLocalDatabase({ async withExclusiveTransactionAsync(fn) { sqlite.exec('BEGIN'); try { await fn({ async execAsync(sql) { sqlite.exec(sql); }, async getFirstAsync(sql) { return sqlite.prepare(sql).get() ?? null; } }); sqlite.exec('COMMIT'); } catch (e) { sqlite.exec('ROLLBACK'); throw e; } } }); sqlite.close(); }, open: async () => { const db = new DatabaseSync(file); db.exec('PRAGMA foreign_keys = ON'); return wrap(db); } };
}
test('writes and restores real user messages across database connections', async t => {
  const env = setup(t); await env.init(); const repo = createConversationRepository(env.open);
  assert.equal((await repo.createWithMessage('c1', 'm1', "hello ' world", 10)).ok, true);
  assert.equal((await repo.appendMessage('c1', 'm2', 'مرحبا', 20)).ok, true);
  assert.deepEqual((await repo.listConversations(10)).value, [{ id: 'c1', createdAt: 10, updatedAt: 20 }]);
  assert.deepEqual((await repo.listMessages('c1', 10)).value, [{ id: 'm1', conversationId: 'c1', role: 'user', content: "hello ' world", createdAt: 10 }, { id: 'm2', conversationId: 'c1', role: 'user', content: 'مرحبا', createdAt: 20 }]);
});
test('duplicate message rolls back creation and timestamp update', async t => {
  const env = setup(t); await env.init(); const repo = createConversationRepository(env.open);
  assert.equal((await repo.createWithMessage('c1', 'm1', 'one', 10)).ok, true);
  assert.equal((await repo.createWithMessage('c2', 'm1', 'two', 30)).ok, false);
  assert.equal((await repo.appendMessage('c1', 'm1', 'again', 40)).ok, false);
  assert.deepEqual((await repo.listConversations(10)).value, [{ id: 'c1', createdAt: 10, updatedAt: 10 }]);
  assert.equal((await repo.appendMessage('missing', 'm2', 'no parent', 20)).ok, false);
});
test('rejects invalid inputs and connections without foreign keys', async t => {
  const env = setup(t); await env.init(); let opened = 0;
  const repo = createConversationRepository(async () => { opened++; return env.open(); });
  for (const args of [['', 'm', 'text', 1], ['c', 'm', '  ', 1], ['c', 'm', 'a'.repeat(20001), 1], ['c', 'm', 'text', -1]]) assert.equal((await repo.createWithMessage(...args)).ok, false);
  assert.equal((await repo.listMessages('c', 101)).ok, false); assert.equal(opened, 0);
  const unsafe = createConversationRepository(async () => { const db = new DatabaseSync(env.file); db.exec('PRAGMA foreign_keys = OFF'); return wrap(db); });
  assert.deepEqual(await unsafe.createWithMessage('c', 'm', 'text', 1), { ok: false });
  assert.deepEqual((await repo.listConversations(10)).value, []);
});
