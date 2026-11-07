// Test-only: the caller opens an isolated database, never the app database.
export interface ProbeConnection {
  getFirstAsync<T>(sql: string): Promise<T | null>;
  closeAsync(): Promise<void>;
  withExclusiveTransactionAsync(task: (tx: ProbeTransaction) => Promise<void>): Promise<void>;
}
export interface ProbeTransaction {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: string[]): Promise<unknown>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
}
export type WriteObservation =
  | { state: 'test_record_written'; marker: string; writerSession: string }
  | { state: 'write_failed' };
export type ReadObservation =
  | { state: 'test_record_found'; marker: string; writerSession: string; readerSession: string; javascriptSessionChanged: boolean }
  | { state: 'test_record_absent' | 'read_failed' };
const tokenPattern = /^[0-9a-f]{32}$/;
const randomSql = 'SELECT lower(hex(randomblob(16))) AS token';
const createSql = 'CREATE TABLE IF NOT EXISTS test_markers (id INTEGER PRIMARY KEY, marker TEXT NOT NULL, writer_session TEXT NOT NULL)';

export function createPersistenceProbe(open: () => Promise<ProbeConnection>) {
  // A JS-session token is not an OS process identifier: a JS reload can change it.
  let session: string | null = null;
  async function sessionToken(db: ProbeConnection): Promise<string> {
    if (session) return session;
    const candidate = await db.getFirstAsync<{ token: string }>(randomSql);
    if (typeof candidate?.token !== 'string' || !tokenPattern.test(candidate.token)) throw new Error('Invalid probe token');
    session = candidate.token;
    return session;
  }
  return {
    async write(): Promise<WriteObservation> {
      let db: ProbeConnection | undefined;
      let result: WriteObservation = { state: 'write_failed' };
      try {
        db = await open();
        const writerSession = await sessionToken(db);
        let marker = '';
        await db.withExclusiveTransactionAsync(async tx => {
          await tx.execAsync(createSql);
          const generated = await tx.getFirstAsync<{ token: string }>(randomSql);
          if (typeof generated?.token !== 'string' || !tokenPattern.test(generated.token)) throw new Error('Invalid probe token');
          marker = generated.token;
          await tx.runAsync('INSERT INTO test_markers (marker, writer_session) VALUES (?, ?)', marker, writerSession);
        });
        result = { state: 'test_record_written', marker, writerSession };
      } catch { result = { state: 'write_failed' }; }
      finally { if (db) { try { await db.closeAsync(); } catch { result = { state: 'write_failed' }; } } }
      return result;
    },
    async read(): Promise<ReadObservation> {
      let db: ProbeConnection | undefined;
      let result: ReadObservation = { state: 'read_failed' };
      try {
        db = await open();
        const readerSession = await sessionToken(db);
        const table = await db.getFirstAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'test_markers'");
        if (!table) result = { state: 'test_record_absent' };
        else {
          const row = await db.getFirstAsync<{ marker: string; writer_session: string }>('SELECT marker, writer_session FROM test_markers ORDER BY id DESC LIMIT 1');
          if (!row) result = { state: 'test_record_absent' };
          else if (typeof row.marker !== 'string' || !tokenPattern.test(row.marker) || typeof row.writer_session !== 'string' || !tokenPattern.test(row.writer_session)) throw new Error('Invalid test record');
          else result = { state: 'test_record_found', marker: row.marker, writerSession: row.writer_session, readerSession, javascriptSessionChanged: row.writer_session !== readerSession };
        }
      } catch { result = { state: 'read_failed' }; }
      finally { if (db) { try { await db.closeAsync(); } catch { result = { state: 'read_failed' }; } } }
      return result;
    },
  };
}
