const { test } = require('node:test');
const assert = require('node:assert/strict');
const { saveLocalMessage, reconcileMessage } = require('../production/localMessage.ts');
const pending = { conversationId: 'c', messageId: 'm', content: 'hello', timestamp: 123, newConversation: true };
const matching = { id: 'm', conversationId: 'c', role: 'user', content: 'hello', createdAt: 123 };
test('writes a new conversation once and reports confirmed success', async () => {
  let creates = 0;
  const repo = { async createWithMessage(...args) { creates++; assert.deepEqual(args, ['c', 'm', 'hello', 123]); return { ok: true }; }, async getUserMessage() { throw Error('not needed'); } };
  assert.equal(await saveLocalMessage(repo, pending), 'saved'); assert.equal(creates, 1);
});
test('checks exact saved payload after an uncertain write', async () => {
  const repo = { async createWithMessage() { return { ok: false }; }, async getUserMessage() { return { ok: true, value: matching }; } };
  assert.equal(await saveLocalMessage(repo, pending), 'saved');
  repo.getUserMessage = async () => ({ ok: true, value: { ...matching, content: 'different' } });
  assert.equal(await reconcileMessage(repo, pending), 'conflict');
  repo.getUserMessage = async () => ({ ok: true, value: null });
  assert.equal(await reconcileMessage(repo, pending), 'not_saved');
  repo.getUserMessage = async () => ({ ok: false });
  assert.equal(await reconcileMessage(repo, pending), 'unknown');
  repo.getUserMessage = async () => { throw Error('private'); };
  assert.equal(await reconcileMessage(repo, pending), 'unknown');
});
test('appends only to the selected conversation and reconciles thrown write errors', async () => {
  const repo = { async appendMessage(c) { assert.equal(c, 'c'); throw Error('unknown'); }, async getUserMessage() { return { ok: true, value: matching }; } };
  assert.equal(await saveLocalMessage(repo, { ...pending, newConversation: false }), 'saved');
});
