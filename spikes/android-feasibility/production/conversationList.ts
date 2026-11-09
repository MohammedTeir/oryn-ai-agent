import type { Conversation, ConversationCursor } from '../storage/conversations';
type Result<T> = { ok: true; value: T } | { ok: false };
export interface ConversationListReader {
  listConversations(limit: number): Promise<Result<Conversation[]>>;
  listConversationsAfter(cursor: ConversationCursor, limit: number): Promise<Result<Conversation[]>>;
}
export type ConversationListPage = { kind: 'loaded'; conversations: Conversation[]; mayHaveMore: boolean } | { kind: 'error' };
const limit = 50;
export async function loadConversationList(repo: ConversationListReader, cursor: ConversationCursor | null): Promise<ConversationListPage> {
  try {
    const result = cursor ? await repo.listConversationsAfter(cursor, limit) : await repo.listConversations(limit);
    if (!result.ok || !Array.isArray(result.value) || result.value.length > limit) return { kind: 'error' };
    let previous = cursor;
    for (const row of result.value) {
      if (!row || typeof row.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(row.id) || !Number.isSafeInteger(row.createdAt) || row.createdAt < 0 || !Number.isSafeInteger(row.updatedAt) || row.updatedAt < row.createdAt || (previous && (row.updatedAt > previous.updatedAt || (row.updatedAt === previous.updatedAt && row.id <= previous.id)))) return { kind: 'error' };
      previous = { id: row.id, updatedAt: row.updatedAt };
    }
    return { kind: 'loaded', conversations: result.value, mayHaveMore: result.value.length === limit };
  } catch { return { kind: 'error' }; }
}
