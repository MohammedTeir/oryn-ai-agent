import type { Conversation, UserMessage } from '../storage/conversations';
type Result<T> = { ok: true; value: T } | { ok: false };
export interface ConversationReader {
  listConversations(limit: number): Promise<Result<Conversation[]>>;
  listMessages(conversationId: string, limit: number): Promise<Result<UserMessage[]>>;
}
export type LatestConversation = { kind: 'empty' } | { kind: 'loaded'; messages: UserMessage[]; mayHaveMore: boolean } | { kind: 'error' };
const messageLimit = 100;

export async function loadLatestConversation(repository: ConversationReader): Promise<LatestConversation> {
  try {
    const conversations = await repository.listConversations(1);
    if (!conversations.ok) return { kind: 'error' };
    if (conversations.value.length === 0) return { kind: 'empty' };
    if (conversations.value.length !== 1 || typeof conversations.value[0]?.id !== 'string') return { kind: 'error' };
    const messages = await repository.listMessages(conversations.value[0].id, messageLimit);
    if (!messages.ok) return { kind: 'error' };
    if (!Array.isArray(messages.value) || messages.value.length > messageLimit || messages.value.some(message => !message || typeof message.id !== 'string' || message.conversationId !== conversations.value[0].id || message.role !== 'user' || typeof message.content !== 'string' || !message.content.trim() || message.content.length > 20000 || !Number.isSafeInteger(message.createdAt) || message.createdAt < 0)) return { kind: 'error' };
    return { kind: 'loaded', messages: messages.value, mayHaveMore: messages.value.length === messageLimit };
  } catch {
    return { kind: 'error' };
  }
}
