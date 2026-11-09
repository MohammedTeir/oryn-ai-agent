const { test } = require('node:test');
const assert = require('node:assert/strict');
const { stageAndSave, checkDurable, retryDurable, toRecord } = require('../production/durableMessage.ts');
const pending = { conversationId: 'c', messageId: 'm', content: 'hello', timestamp: 12, newConversation: true };
const message = { id: 'm', conversationId: 'c', role: 'user', content: 'hello', createdAt: 12 };
function fixture() {
  let slot = null, saved = null, writes = 0;
  return {
    store: { async read() { return { ok: true, value: slot }; }, async stage(record) { if (slot) return { ok: false }; slot = record; return { ok: true }; }, async clearIfSaved() { if (!saved) return { ok: false }; slot = null; return { ok: true }; }, async discardIfUnwritten() { if (saved) return { ok: false }; slot = null; return { ok: true }; } },
    repo: { async createWithMessage() { writes++; saved = message; return { ok: true }; }, async getUserMessage() { return { ok: true, value: saved }; } },
    writes: () => writes, slot: () => slot,
  };
}
test('stages before writing and clears only after checking the exact saved message', async () => {
  const f = fixture(); assert.equal(await stageAndSave(f.store, f.repo, pending), 'saved');
  assert.equal(f.writes(), 1); assert.equal(f.slot(), null);
});
test('restart checks interrupted work without saving; retry is explicit', async () => {
  const f = fixture(); await f.store.stage(toRecord(pending));
  assert.equal(await checkDurable(f.store, f.repo, pending), 'not_saved'); assert.equal(f.writes(), 0);
  assert.equal(await retryDurable(f.store, f.repo, pending), 'saved'); assert.equal(f.writes(), 1);
});
test('does not dispatch on failed read, absent slot or conflicting pending record', async () => {
  const f = fixture(); f.store.read = async () => ({ ok: false });
  assert.equal(await stageAndSave(f.store, f.repo, pending), 'unknown'); assert.equal(f.writes(), 0);
  const absent = fixture(); absent.store.stage = async () => ({ ok: false });
  assert.equal(await stageAndSave(absent.store, absent.repo, pending), 'not_staged'); assert.equal(absent.writes(), 0);
  const conflict = fixture(); await conflict.store.stage(toRecord({ ...pending, messageId: 'other' }));
  assert.equal(await stageAndSave(conflict.store, conflict.repo, pending), 'conflict'); assert.equal(conflict.writes(), 0);
});
test('failed clear remains uncertain until slot removal is confirmed', async () => {
  const f = fixture(); f.store.clearIfSaved = async () => ({ ok: false });
  assert.equal(await stageAndSave(f.store, f.repo, pending), 'unknown'); assert.ok(f.slot());
});
