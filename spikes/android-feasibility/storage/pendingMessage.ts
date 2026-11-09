import type { ConversationDatabase } from './conversations';
type Result<T> = { ok: true; value: T } | { ok: false };
export type PendingMessageRecord = { conversationId: string; messageId: string; content: string; createdAt: number; newConversation: boolean };
type Row = { conversationId: string; messageId: string; content: string; createdAt: number; newConversation: number };
function valid(record: PendingMessageRecord): boolean {
  return !!record && typeof record.conversationId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(record.conversationId) && typeof record.messageId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(record.messageId) && typeof record.content === 'string' && record.content.length <= 20000 && record.content.trim().length > 0 && Number.isSafeInteger(record.createdAt) && record.createdAt >= 0 && typeof record.newConversation === 'boolean';
}
function decode(row: Row | null): PendingMessageRecord | null {
  if (row === null) return null;
  if (row.newConversation !== 0 && row.newConversation !== 1) throw new Error('Invalid pending record');
  const value = { ...row, newConversation: row.newConversation === 1 };
  if (!valid(value)) throw new Error('Invalid pending record');
  return value;
}
export function createPendingMessageStore(open: () => Promise<ConversationDatabase>) {
  async function withDb<T>(work: (db: ConversationDatabase) => Promise<T>): Promise<Result<T>> {
    try {
      const db = await open(); let result: T;
      try {
        if ((await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys'))?.foreign_keys !== 1) throw new Error('Foreign keys unavailable');
        result = await work(db);
      } finally { await db.closeAsync(); }
      return { ok: true, value: result };
    } catch { return { ok: false }; }
  }
  return {
    read(): Promise<Result<PendingMessageRecord | null>> {
      return withDb(async db => decode(await db.getFirstAsync<Row>('SELECT conversation_id AS conversationId, message_id AS messageId, content, created_at AS createdAt, new_conversation AS newConversation FROM pending_local_message WHERE slot = 1')));
    },
    stage(record: PendingMessageRecord): Promise<Result<null>> {
      if (!valid(record)) return Promise.resolve({ ok: false });
      return withDb(async db => {
        await db.runAsync('INSERT INTO pending_local_message (slot, conversation_id, message_id, content, created_at, new_conversation) VALUES (1, ?, ?, ?, ?, ?)', record.conversationId, record.messageId, record.content, record.createdAt, record.newConversation ? 1 : 0);
        return null;
      });
    },
    clearIfSaved(record: PendingMessageRecord): Promise<Result<null>> {
      if (!valid(record)) return Promise.resolve({ ok: false });
      return withDb(async db => {
        const deleted = await db.runAsync("DELETE FROM pending_local_message WHERE slot = 1 AND conversation_id = ? AND message_id = ? AND content = ? AND created_at = ? AND new_conversation = ? AND EXISTS (SELECT 1 FROM agent_messages WHERE id = ? AND conversation_id = ? AND role = 'user' AND content = ? AND created_at = ?)", record.conversationId, record.messageId, record.content, record.createdAt, record.newConversation ? 1 : 0, record.messageId, record.conversationId, record.content, record.createdAt);
        if (deleted.changes !== 1) throw new Error('Pending record unresolved');
        return null;
      });
    },
    discardIfUnwritten(record: PendingMessageRecord): Promise<Result<null>> {
      if (!valid(record)) return Promise.resolve({ ok: false });
      return withDb(async db => {
        const deleted = await db.runAsync("DELETE FROM pending_local_message WHERE slot = 1 AND conversation_id = ? AND message_id = ? AND content = ? AND created_at = ? AND new_conversation = ? AND NOT EXISTS (SELECT 1 FROM agent_messages WHERE id = ?)", record.conversationId, record.messageId, record.content, record.createdAt, record.newConversation ? 1 : 0, record.messageId);
        if (deleted.changes !== 1) throw new Error('Pending record cannot be discarded');
        return null;
      });
    },
  };
}
