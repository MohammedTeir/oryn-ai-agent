import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { migrateLocalDatabase } from './migrations';

// Call only when the application is ready to use local persistence. Do not store
// credentials here; use a separately reviewed Keystore-backed secrets boundary.
export async function openLocalDatabase(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync('oryn-local.db', { useNewConnection: true });
  try {
    await migrateLocalDatabase(db);
    // Foreign key settings are per connection; any future connection, including
    // transaction-specific connections, must verify its own enforcement.
    await db.execAsync('PRAGMA foreign_keys = ON');
    const enabled = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys');
    if (enabled?.foreign_keys !== 1) throw new Error('Foreign key enforcement unavailable');
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}
