const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadLatestConversation, loadMessagePage } = require('../production/latestConversation.ts');
const conversation = { id: 'c1', createdAt: 1, updatedAt: 2 };
const message = { id: 'm1', conversationId: 'c1', role: 'user', content: 'hello', createdAt: 2 };
test('loads the latest persisted conversation and its user messages', async () => {
  const result = await loadLatestConversation({ async listConversations(limit) { assert.equal(limit, 1); return { ok: true, value: [conversation] }; }, async listMessages(id, limit) { assert.equal(id, 'c1'); assert.equal(limit, 100); return { ok: true, value: [message] }; } });
  assert.deepEqual(result, { kind: 'loaded', conversationId: 'c1', messages: [message], mayHaveMore: false });
});
test('distinguishes empty storage from failures and rejects malformed messages', async () => {
  assert.deepEqual(await loadLatestConversation({ async listConversations() { return { ok: true, value: [] }; }, async listMessages() { throw Error('must not run'); } }), { kind: 'empty' });
  for (const repo of [
    { async listConversations() { return { ok: false }; } },
    { async listConversations() { throw Error('private details'); } },
    { async listConversations() { return { ok: true, value: [conversation] }; }, async listMessages() { return { ok: false }; } },
    { async listConversations() { return { ok: true, value: [conversation] }; }, async listMessages() { return { ok: true, value: [{ ...message, role: 'assistant' }] }; } },
  ]) assert.deepEqual(await loadLatestConversation(repo), { kind: 'error' });
});
test('marks a full page as potentially incomplete', async () => {
  const result = await loadLatestConversation({ async listConversations() { return { ok: true, value: [conversation] }; }, async listMessages() { return { ok: true, value: Array.from({ length: 100 }, (_, i) => ({ ...message, id: `m${String(i).padStart(3, '0')}` })) }; } });
  assert.equal(result.kind, 'loaded'); assert.equal(result.mayHaveMore, true);
});
test('loads next pages using the exact cursor and rejects stale or unordered rows', async () => {
  const cursor = { createdAt: 2, id: 'm1' };
  const next = { ...message, id: 'm2' };
  const repo = { async listMessagesAfter(id, given, limit) { assert.equal(id, 'c1'); assert.deepEqual(given, cursor); assert.equal(limit, 100); return { ok: true, value: [next] }; } };
  assert.deepEqual(await loadMessagePage(repo, 'c1', cursor), { kind: 'loaded', conversationId: 'c1', messages: [next], mayHaveMore: false });
  repo.listMessagesAfter = async () => ({ ok: true, value: [message] });
  assert.deepEqual(await loadMessagePage(repo, 'c1', cursor), { kind: 'error' });
  repo.listMessagesAfter = async () => ({ ok: false });
  assert.deepEqual(await loadMessagePage(repo, 'c1', cursor), { kind: 'error' });
});
