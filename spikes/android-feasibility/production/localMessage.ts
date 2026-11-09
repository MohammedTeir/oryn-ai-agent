import type { UserMessage } from '../storage/conversations';
type Result<T> = { ok: true; value: T } | { ok: false };
export type PendingMessage = { conversationId: string; messageId: string; content: string; timestamp: number; newConversation: boolean };
export interface MessageWriter {
  createWithMessage(c: string, m: string, text: string, time: number): Promise<Result<null>>;
  appendMessage(c: string, m: string, text: string, time: number): Promise<Result<null>>;
  getUserMessage(c: string, m: string): Promise<Result<UserMessage | null>>;
}
export type SaveState = 'saved' | 'not_saved' | 'unknown' | 'conflict';
export async function reconcileMessage(repo: MessageWriter, pending: PendingMessage): Promise<SaveState> {
  try {
    const check = await repo.getUserMessage(pending.conversationId, pending.messageId);
    if (!check.ok) return 'unknown';
    if (check.value === null) return 'not_saved';
    const m = check.value;
    return m.id === pending.messageId && m.conversationId === pending.conversationId && m.role === 'user' && m.content === pending.content && m.createdAt === pending.timestamp ? 'saved' : 'conflict';
  } catch { return 'unknown'; }
}
export async function saveLocalMessage(repo: MessageWriter, pending: PendingMessage): Promise<SaveState> {
  try {
    const result = pending.newConversation
      ? await repo.createWithMessage(pending.conversationId, pending.messageId, pending.content, pending.timestamp)
      : await repo.appendMessage(pending.conversationId, pending.messageId, pending.content, pending.timestamp);
    if (result.ok) return 'saved';
  } catch { /* A failed response may still follow a commit. */ }
  return reconcileMessage(repo, pending);
}
