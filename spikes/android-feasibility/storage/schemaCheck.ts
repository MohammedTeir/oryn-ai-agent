const requiredTables = [
  'conversations', 'agent_messages', 'tasks', 'plan_steps', 'action_proposals', 'approval_audit',
  'executions', 'execution_events', 'tool_inventory', 'runtime_profiles', 'artifacts', 'settings',
] as const;

export interface SchemaConnection {
  getFirstAsync<T>(sql: string): Promise<T | null>;
  getAllAsync<T>(sql: string): Promise<T[]>;
  closeAsync(): Promise<void>;
}
export type SchemaCheck =
  | { state: 'tables_present'; schemaVersion: number; foreignKeysEnabled: true }
  | { state: 'check_failed' };

// This reports schema presence on one connection, not data durability, an
// authorization grant, encryption, process-death recovery or integrity of rows.
// Never include database contents, file paths or exception text in the result.
export async function inspectStorageSchema(open: () => Promise<SchemaConnection>, expectedVersion: number): Promise<SchemaCheck> {
  let db: SchemaConnection | undefined;
  let verified = false;
  try {
    db = await open();
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const keys = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys');
    const tables = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'");
    const names = new Set(tables.map(table => table.name));
    verified = version?.user_version === expectedVersion && keys?.foreign_keys === 1 && requiredTables.every(name => names.has(name));
  } catch {
    verified = false;
  } finally {
    if (db) {
      try { await db.closeAsync(); } catch { verified = false; }
    }
  }
  return verified ? { state: 'tables_present', schemaVersion: expectedVersion, foreignKeysEnabled: true } : { state: 'check_failed' };
}
