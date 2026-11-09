const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { migrateLocalDatabase } = require('../storage/migrations.ts');
const { createConversationRepository } = require('../storage/conversations.ts');
function wrap(db) {
  return { async execAsync(sql) { db.exec(sql); }, async runAsync(sql, ...args) { return db.prepare(sql).run(...args); }, async getFirstAsync(sql, ...args) { const row = db.prepare(sql).get(...args); return row ? { ...row } : null; }, async getAllAsync(sql, ...args) { return db.prepare(sql).all(...args).map(row => ({ ...row })); }, async closeAsync() { db.close(); } };
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

test('paginates tied timestamps with deterministic cursors and excludes other conversations', async t => {
  const env = setup(t); await env.init(); const repo = createConversationRepository(env.open);
  assert.equal((await repo.createWithMessage('a', 'm1', 'one', 10)).ok, true);
  assert.equal((await repo.appendMessage('a', 'm2', 'two', 10)).ok, true);
  assert.equal((await repo.appendMessage('a', 'm3', 'three', 11)).ok, true);
  assert.equal((await repo.createWithMessage('b', 'other', 'other', 11)).ok, true);
  const first = (await repo.listMessages('a', 1)).value;
  const second = (await repo.listMessagesAfter('a', { createdAt: first[0].createdAt, id: first[0].id }, 1)).value;
  const third = (await repo.listMessagesAfter('a', { createdAt: second[0].createdAt, id: second[0].id }, 5)).value;
  assert.deepEqual([...first, ...second, ...third].map(m => m.id), ['m1', 'm2', 'm3']);
  const conversations = (await repo.listConversations(1)).value;
  const following = (await repo.listConversationsAfter({ updatedAt: conversations[0].updatedAt, id: conversations[0].id }, 5)).value;
  assert.deepEqual([...conversations, ...following].map(c => c.id), ['a', 'b']);
  assert.deepEqual(await repo.listMessagesAfter('a', { createdAt: -1, id: 'm1' }, 1), { ok: false });
  assert.deepEqual(await repo.listConversationsAfter({ updatedAt: 11, id: "a' OR 1=1" }, 1), { ok: false });
});

test('deletion is atomic and does not remove records referenced by tasks', async t => {
  const env = setup(t); await env.init(); const repo = createConversationRepository(env.open);
  assert.equal((await repo.createWithMessage('a', 'm1', 'keep', 1)).ok, true);
  assert.equal((await repo.createWithMessage('b', 'm2', 'delete', 2)).ok, true);
  const db = new DatabaseSync(env.file); db.exec('PRAGMA foreign_keys = ON');
  db.prepare('INSERT INTO tasks (id, conversation_id, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run('t', 'a', 'queued', 1, 1); db.close();
  assert.deepEqual(await repo.deleteConversation('a'), { ok: false });
  assert.equal((await repo.listMessages('a', 10)).value[0].content, 'keep');
  assert.deepEqual(await repo.deleteConversation('b'), { ok: true, value: null });
  assert.deepEqual((await repo.listMessages('b', 10)).value, []);
  assert.deepEqual(await repo.deleteConversation('b'), { ok: false });
});

test('reconciles a committed write when closing the connection reports failure', async t => {
  const env = setup(t); await env.init();
  const uncertain = createConversationRepository(async () => {
    const db = await env.open();
    const close = db.closeAsync;
    db.closeAsync = async () => { await close(); throw new Error('private failure details'); };
    return db;
  });
  assert.deepEqual(await uncertain.createWithMessage('c', 'm', 'saved text', 10), { ok: false });
  const repo = createConversationRepository(env.open);
  assert.deepEqual(await repo.getConversation('c'), { ok: true, value: { id: 'c', createdAt: 10, updatedAt: 10 } });
  assert.deepEqual(await repo.getUserMessage('c', 'm'), { ok: true, value: { id: 'm', conversationId: 'c', role: 'user', content: 'saved text', createdAt: 10 } });
  assert.deepEqual(await repo.getUserMessage('other', 'm'), { ok: true, value: null });
  assert.deepEqual(await repo.getConversation('missing'), { ok: true, value: null });
});

test('reconciliation refuses invalid IDs and malformed stored records', async t => {
  const env = setup(t); await env.init(); const repo = createConversationRepository(env.open);
  assert.deepEqual(await repo.getUserMessage('c', 'invalid id'), { ok: false });
  assert.equal((await repo.createWithMessage('c', 'm', 'text', 10)).ok, true);
  const db = new DatabaseSync(env.file);
  db.prepare('UPDATE agent_messages SET content = ? WHERE id = ?').run('  ', 'm');
  db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(1, 'c'); db.close();
  assert.deepEqual(await repo.getUserMessage('c', 'm'), { ok: false });
  assert.deepEqual(await repo.getConversation('c'), { ok: false });
});
