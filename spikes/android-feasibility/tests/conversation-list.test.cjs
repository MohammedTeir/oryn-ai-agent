const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadConversationList } = require('../production/conversationList.ts');
test('loads a bounded page with a stable timestamp and ID cursor', async () => {
  const cursor = { id: 'a', updatedAt: 20 };
  const rows = [{ id: 'b', createdAt: 1, updatedAt: 20 }, { id: 'c', createdAt: 1, updatedAt: 19 }];
  const repo = { async listConversationsAfter(actual, limit) { assert.deepEqual(actual, cursor); assert.equal(limit, 50); return { ok: true, value: rows }; } };
  assert.deepEqual(await loadConversationList(repo, cursor), { kind: 'loaded', conversations: rows, mayHaveMore: false });
});
test('distinguishes empty pages from errors and rejects invalid ordering or records', async () => {
  const repo = { async listConversations() { return { ok: true, value: [] }; } };
  assert.deepEqual(await loadConversationList(repo, null), { kind: 'loaded', conversations: [], mayHaveMore: false });
  repo.listConversations = async () => ({ ok: false });
  assert.deepEqual(await loadConversationList(repo, null), { kind: 'error' });
  repo.listConversations = async () => ({ ok: true, value: [{ id: 'a', createdAt: 5, updatedAt: 4 }] });
  assert.deepEqual(await loadConversationList(repo, null), { kind: 'error' });
  repo.listConversations = async () => ({ ok: true, value: [{ id: 'b', createdAt: 1, updatedAt: 5 }, { id: 'a', createdAt: 1, updatedAt: 5 }] });
  assert.deepEqual(await loadConversationList(repo, null), { kind: 'error' });
});
