export type LanguagePreference = 'system' | 'en' | 'ar';
export interface PreferenceDatabase {
  getFirstAsync<T>(sql: string, ...params: string[]): Promise<T | null>;
  runAsync(sql: string, ...params: string[]): Promise<{ changes: number }>;
  closeAsync(): Promise<void>;
}
type ReadResult = { ok: true; value: LanguagePreference } | { ok: false };
type WriteResult = { ok: true } | { ok: false };
const key = 'language_preference';
function valid(value: unknown): value is LanguagePreference {
  return value === 'system' || value === 'en' || value === 'ar';
}

// Explicitly stores one non-secret enum. The single SQL statement is atomic;
// serialized access prevents a later load from racing an earlier pending save.
export function createLanguagePreferenceStore(open: () => Promise<PreferenceDatabase>) {
  let queue: Promise<void> = Promise.resolve();
  function ordered<T>(work: () => Promise<T>): Promise<T> {
    const result = queue.then(work);
    queue = result.then(() => undefined, () => undefined);
    return result;
  }
  return {
    load(): Promise<ReadResult> {
      return ordered(async () => {
        try {
          const db = await open();
          let value: LanguagePreference;
          try {
            const row = await db.getFirstAsync<{ value: unknown }>('SELECT value FROM settings WHERE key = ?', key);
            if (row === null) value = 'system';
            else if (valid(row.value)) value = row.value;
            else throw new Error('Invalid saved preference');
          } finally { await db.closeAsync(); }
          return { ok: true, value };
        } catch { return { ok: false }; }
      });
    },
    save(value: unknown): Promise<WriteResult> {
      if (!valid(value)) return Promise.resolve({ ok: false });
      return ordered(async () => {
        try {
          const db = await open();
          try {
            const result = await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
            if (result.changes !== 1) throw new Error('Preference write not confirmed');
          } finally { await db.closeAsync(); }
          return { ok: true };
        } catch { return { ok: false }; }
      });
    },
  };
}
