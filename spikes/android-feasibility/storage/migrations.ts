// The database contains application data, never API keys or authorization grants.
// Approval records are history only: the native gateway remains the sole authority.
export interface MigrationTransaction {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
}
export interface MigrationDatabase {
  withExclusiveTransactionAsync(task: (transaction: MigrationTransaction) => Promise<void>): Promise<void>;
}
export const SCHEMA_VERSION = 2;

// Fixed SQL only: no user data is interpolated into migration statements.
const SCHEMA_V1 = `
CREATE TABLE conversations (id TEXT PRIMARY KEY NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE agent_messages (id TEXT PRIMARY KEY NOT NULL, conversation_id TEXT NOT NULL REFERENCES conversations(id), role TEXT NOT NULL, content TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE tasks (id TEXT PRIMARY KEY NOT NULL, conversation_id TEXT REFERENCES conversations(id), state TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE plan_steps (id TEXT PRIMARY KEY NOT NULL, task_id TEXT NOT NULL REFERENCES tasks(id), position INTEGER NOT NULL, state TEXT NOT NULL, UNIQUE(task_id, position));
CREATE TABLE action_proposals (id TEXT PRIMARY KEY NOT NULL, task_id TEXT NOT NULL REFERENCES tasks(id), descriptor TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE approval_audit (id TEXT PRIMARY KEY NOT NULL, proposal_id TEXT NOT NULL REFERENCES action_proposals(id), decision TEXT NOT NULL, recorded_at INTEGER NOT NULL);
CREATE TABLE executions (id TEXT PRIMARY KEY NOT NULL, proposal_id TEXT NOT NULL REFERENCES action_proposals(id), state TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE execution_events (id TEXT PRIMARY KEY NOT NULL, execution_id TEXT NOT NULL REFERENCES executions(id), kind TEXT NOT NULL, recorded_at INTEGER NOT NULL);
CREATE TABLE tool_inventory (id TEXT PRIMARY KEY NOT NULL, observed_at INTEGER NOT NULL, observation TEXT NOT NULL);
CREATE TABLE runtime_profiles (id TEXT PRIMARY KEY NOT NULL, observed_at INTEGER NOT NULL, observation TEXT NOT NULL);
CREATE TABLE artifacts (id TEXT PRIMARY KEY NOT NULL, task_id TEXT NOT NULL REFERENCES tasks(id), metadata TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
CREATE INDEX agent_messages_conversation ON agent_messages(conversation_id, created_at);
CREATE INDEX tasks_conversation ON tasks(conversation_id);
CREATE INDEX execution_events_execution ON execution_events(execution_id, recorded_at);
`;

export async function migrateLocalDatabase(db: MigrationDatabase): Promise<void> {
  await db.withExclusiveTransactionAsync(async tx => {
    const result = await tx.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const version = result?.user_version;
    if (!Number.isInteger(version) || version === undefined || version < 0 || version > SCHEMA_VERSION) {
      throw new Error('Unsupported local database version');
    }
    if (version === 0) {
      await tx.execAsync(SCHEMA_V1);
    }
    if (version <= 1) {
      await tx.execAsync(`CREATE TABLE pending_local_message (
        slot INTEGER PRIMARY KEY CHECK(slot = 1),
        conversation_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        new_conversation INTEGER NOT NULL CHECK(new_conversation IN (0, 1))
      )`);
      await tx.execAsync('PRAGMA user_version = 2');
    }
  });
}
