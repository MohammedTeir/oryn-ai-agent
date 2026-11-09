import { openLocalDatabase } from '../storage/database';

// SQLite creates random record identifiers; these identifiers are not grants.
export async function newMessageIds(): Promise<{ conversationId: string; messageId: string } | null> {
  try {
    const db = await openLocalDatabase();
    try {
      const row = await db.getFirstAsync<{ conversationId: string; messageId: string }>('SELECT lower(hex(randomblob(16))) AS conversationId, lower(hex(randomblob(16))) AS messageId');
      if (!row || !/^[a-f0-9]{32}$/.test(row.conversationId) || !/^[a-f0-9]{32}$/.test(row.messageId)) return null;
      return row;
    } finally { await db.closeAsync(); }
  } catch { return null; }
}
