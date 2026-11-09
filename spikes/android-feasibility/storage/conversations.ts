// User-authored conversation data only; native grants and credential storage stay separate.
export interface ConversationDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: (string | number)[]): Promise<{ changes: number }>;
  getFirstAsync<T>(sql: string, ...params: (string | number)[]): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: (string | number)[]): Promise<T[]>;
  closeAsync(): Promise<void>;
}
type OpenDatabase = () => Promise<ConversationDatabase>;
export type Conversation = { id: string; createdAt: number; updatedAt: number };
export type UserMessage = { id: string; conversationId: string; role: 'user'; content: string; createdAt: number };
export type MessageCursor = { createdAt: number; id: string };
export type ConversationCursor = { updatedAt: number; id: string };
type Result<T> = { ok: true; value: T } | { ok: false };
const fail = { ok: false } as const;
const maxTextLength = 20000;
const maxPage = 100;
function idValid(id: unknown): id is string { return typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id); }
function timeValid(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0; }
function contentValid(value: unknown): value is string { return typeof value === 'string' && value.length <= maxTextLength && value.trim().length > 0; }
function pageValid(value: unknown): value is number { return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= maxPage; }
function messageCursorValid(value: unknown): value is MessageCursor {
  if (typeof value !== 'object' || value === null) return false;
  const cursor = value as Record<string, unknown>;
  return timeValid(cursor.createdAt) && idValid(cursor.id);
}
function conversationCursorValid(value: unknown): value is ConversationCursor {
  if (typeof value !== 'object' || value === null) return false;
  const cursor = value as Record<string, unknown>;
  return timeValid(cursor.updatedAt) && idValid(cursor.id);
}

export function createConversationRepository(open: OpenDatabase) {
  async function withDatabase<T>(fn: (db: ConversationDatabase) => Promise<T>): Promise<Result<T>> {
    try {
      const db = await open();
      let value: T;
      try {
        const foreignKeys = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys');
        if (foreignKeys?.foreign_keys !== 1) throw new Error('Foreign keys unavailable');
        value = await fn(db);
      } finally { await db.closeAsync(); }
      return { ok: true, value };
    } catch { return fail; }
  }
  async function transaction<T>(db: ConversationDatabase, fn: () => Promise<T>): Promise<T> {
    await db.execAsync('BEGIN IMMEDIATE');
    try {
      const value = await fn();
      await db.execAsync('COMMIT');
      return value;
    } catch (error) {
      try { await db.execAsync('ROLLBACK'); } catch { /* Preserve failure. */ }
      throw error;
    }
  }
  return {
    createWithMessage(conversationId: unknown, messageId: unknown, content: unknown, timestamp: unknown): Promise<Result<null>> {
      if (!idValid(conversationId) || !idValid(messageId) || !contentValid(content) || !timeValid(timestamp)) return Promise.resolve(fail);
      return withDatabase(db => transaction(db, async () => {
        await db.runAsync('INSERT INTO conversations (id, created_at, updated_at) VALUES (?, ?, ?)', conversationId, timestamp, timestamp);
        await db.runAsync('INSERT INTO agent_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)', messageId, conversationId, 'user', content, timestamp);
        return null;
      }));
    },
    appendMessage(conversationId: unknown, messageId: unknown, content: unknown, timestamp: unknown): Promise<Result<null>> {
      if (!idValid(conversationId) || !idValid(messageId) || !contentValid(content) || !timeValid(timestamp)) return Promise.resolve(fail);
      return withDatabase(db => transaction(db, async () => {
        const updated = await db.runAsync('UPDATE conversations SET updated_at = MAX(updated_at, ?) WHERE id = ?', timestamp, conversationId);
        if (updated.changes !== 1) throw new Error('Conversation missing');
        await db.runAsync('INSERT INTO agent_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)', messageId, conversationId, 'user', content, timestamp);
        return null;
      }));
    },
    listConversations(limit: unknown): Promise<Result<Conversation[]>> {
      if (!pageValid(limit)) return Promise.resolve(fail);
      return withDatabase(db => db.getAllAsync<Conversation>('SELECT id, created_at AS createdAt, updated_at AS updatedAt FROM conversations ORDER BY updated_at DESC, id ASC LIMIT ?', limit));
    },
    listMessages(conversationId: unknown, limit: unknown): Promise<Result<UserMessage[]>> {
      if (!idValid(conversationId) || !pageValid(limit)) return Promise.resolve(fail);
      return withDatabase(db => db.getAllAsync<UserMessage>("SELECT id, conversation_id AS conversationId, role, content, created_at AS createdAt FROM agent_messages WHERE conversation_id = ? AND role = 'user' ORDER BY created_at ASC, id ASC LIMIT ?", conversationId, limit));
    },
    listMessagesAfter(conversationId: unknown, cursor: unknown, limit: unknown): Promise<Result<UserMessage[]>> {
      if (!idValid(conversationId) || !messageCursorValid(cursor) || !pageValid(limit)) return Promise.resolve(fail);
      return withDatabase(db => db.getAllAsync<UserMessage>("SELECT id, conversation_id AS conversationId, role, content, created_at AS createdAt FROM agent_messages WHERE conversation_id = ? AND role = 'user' AND (created_at > ? OR (created_at = ? AND id > ?)) ORDER BY created_at ASC, id ASC LIMIT ?", conversationId, cursor.createdAt, cursor.createdAt, cursor.id, limit));
    },
    listConversationsAfter(cursor: unknown, limit: unknown): Promise<Result<Conversation[]>> {
      if (!conversationCursorValid(cursor) || !pageValid(limit)) return Promise.resolve(fail);
      return withDatabase(db => db.getAllAsync<Conversation>('SELECT id, created_at AS createdAt, updated_at AS updatedAt FROM conversations WHERE updated_at < ? OR (updated_at = ? AND id > ?) ORDER BY updated_at DESC, id ASC LIMIT ?', cursor.updatedAt, cursor.updatedAt, cursor.id, limit));
    },
    deleteConversation(conversationId: unknown): Promise<Result<null>> {
      if (!idValid(conversationId)) return Promise.resolve(fail);
      return withDatabase(db => transaction(db, async () => {
        await db.runAsync('DELETE FROM agent_messages WHERE conversation_id = ?', conversationId);
        const deleted = await db.runAsync('DELETE FROM conversations WHERE id = ?', conversationId);
        if (deleted.changes !== 1) throw new Error('Conversation missing or referenced');
        return null;
      }));
    },
  };
}
