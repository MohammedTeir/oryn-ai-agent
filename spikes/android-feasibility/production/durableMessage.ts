import type { PendingMessageRecord } from '../storage/pendingMessage';
import { reconcileMessage, saveLocalMessage, type MessageWriter, type PendingMessage } from './localMessage.ts';
type Result<T> = { ok: true; value: T } | { ok: false };
export interface PendingStore {
  read(): Promise<Result<PendingMessageRecord | null>>;
  stage(record: PendingMessageRecord): Promise<Result<null>>;
  clearIfSaved(record: PendingMessageRecord): Promise<Result<null>>;
  discardIfUnwritten(record: PendingMessageRecord): Promise<Result<null>>;
}
export type DurableState = 'saved' | 'not_saved' | 'not_staged' | 'unknown' | 'conflict';
export function toRecord(p: PendingMessage): PendingMessageRecord { return { conversationId: p.conversationId, messageId: p.messageId, content: p.content, createdAt: p.timestamp, newConversation: p.newConversation }; }
export function fromRecord(p: PendingMessageRecord): PendingMessage { return { conversationId: p.conversationId, messageId: p.messageId, content: p.content, timestamp: p.createdAt, newConversation: p.newConversation }; }
function same(a: PendingMessageRecord, b: PendingMessageRecord): boolean { return a.conversationId === b.conversationId && a.messageId === b.messageId && a.content === b.content && a.createdAt === b.createdAt && a.newConversation === b.newConversation; }
export async function checkDurable(store: PendingStore, repo: MessageWriter, pending: PendingMessage): Promise<DurableState> {
  try {
    const record = toRecord(pending); const stored = await store.read();
    if (!stored.ok) return 'unknown';
    if (stored.value && !same(stored.value, record)) return 'conflict';
    const result = await reconcileMessage(repo, pending);
    if (result !== 'saved') return stored.value ? result : result === 'not_saved' ? 'not_staged' : result;
    if (!stored.value) return 'saved';
    const cleared = await store.clearIfSaved(record);
    if (cleared.ok) return 'saved';
    const after = await store.read();
    return after.ok && after.value === null ? 'saved' : 'unknown';
  } catch { return 'unknown'; }
}
export async function stageAndSave(store: PendingStore, repo: MessageWriter, pending: PendingMessage): Promise<DurableState> {
  try {
    const record = toRecord(pending);
    await store.stage(record);
    const stored = await store.read();
    if (!stored.ok) return 'unknown';
    if (!stored.value) return 'not_staged';
    if (!same(stored.value, record)) return 'conflict';
    const result = await saveLocalMessage(repo, pending);
    if (result !== 'saved') return result;
    return checkDurable(store, repo, pending);
  } catch { return 'unknown'; }
}
export async function retryDurable(store: PendingStore, repo: MessageWriter, pending: PendingMessage): Promise<DurableState> {
  const current = await checkDurable(store, repo, pending);
  if (current !== 'not_saved') return current;
  const result = await saveLocalMessage(repo, pending);
  return result === 'saved' ? checkDurable(store, repo, pending) : result;
}
