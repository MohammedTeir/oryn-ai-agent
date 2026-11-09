import type { Conversation, MessageCursor, UserMessage } from '../storage/conversations';
type Result<T> = { ok: true; value: T } | { ok: false };
export interface ConversationReader {
  listConversations(limit: number): Promise<Result<Conversation[]>>;
  listMessages(conversationId: string, limit: number): Promise<Result<UserMessage[]>>;
  listMessagesAfter(conversationId: string, cursor: MessageCursor, limit: number): Promise<Result<UserMessage[]>>;
}
export type MessagePage = { kind: 'loaded'; conversationId: string; messages: UserMessage[]; mayHaveMore: boolean };
export type LatestConversation = { kind: 'empty' } | MessagePage | { kind: 'error' };
const messageLimit = 100;

export async function loadMessagePage(repository: ConversationReader, conversationId: string, cursor: MessageCursor | null): Promise<MessagePage | { kind: 'error' }> {
  try {
    const result = cursor ? await repository.listMessagesAfter(conversationId, cursor, messageLimit) : await repository.listMessages(conversationId, messageLimit);
    if (!result.ok || !Array.isArray(result.value) || result.value.length > messageLimit) return { kind: 'error' };
    let previous = cursor;
    for (const message of result.value) {
      if (!message || typeof message.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(message.id) || message.conversationId !== conversationId || message.role !== 'user' || typeof message.content !== 'string' || !message.content.trim() || message.content.length > 20000 || !Number.isSafeInteger(message.createdAt) || message.createdAt < 0 || (previous && (message.createdAt < previous.createdAt || (message.createdAt === previous.createdAt && message.id <= previous.id)))) return { kind: 'error' };
      previous = { createdAt: message.createdAt, id: message.id };
    }
    return { kind: 'loaded', conversationId, messages: result.value, mayHaveMore: result.value.length === messageLimit };
  } catch { return { kind: 'error' }; }
}
export async function loadLatestConversation(repository: ConversationReader): Promise<LatestConversation> {
  try {
    const conversations = await repository.listConversations(1);
    if (!conversations.ok || !Array.isArray(conversations.value)) return { kind: 'error' };
    if (conversations.value.length === 0) return { kind: 'empty' };
    if (conversations.value.length !== 1 || typeof conversations.value[0]?.id !== 'string') return { kind: 'error' };
    return loadMessagePage(repository, conversations.value[0].id, null);
  } catch { return { kind: 'error' }; }
}
