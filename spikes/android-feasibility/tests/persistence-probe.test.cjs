const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createPersistenceProbe } = require('../storage/persistenceProbe.ts');

function opener(file, failAfterInsert = false, failClose = false) {
  return async () => {
    const db = new DatabaseSync(file);
    const view = {
      async getFirstAsync(sql) { return db.prepare(sql).get() ?? null; },
      async closeAsync() { db.close(); if (failClose) throw new Error('private error'); },
      async withExclusiveTransactionAsync(work) {
        db.exec('BEGIN EXCLUSIVE');
        try {
          await work({
            async execAsync(sql) { db.exec(sql); },
            async getFirstAsync(sql) { return db.prepare(sql).get() ?? null; },
            async runAsync(sql, ...params) { db.prepare(sql).run(...params); if (failAfterInsert) throw new Error('private error'); },
          });
          db.exec('COMMIT');
        } catch (error) { db.exec('ROLLBACK'); throw error; }
      },
    };
    return view;
  };
}
test('a test marker survives reopening and a new JS session without overwriting earlier markers', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'oryn-probe-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'probe.db');
  const first = createPersistenceProbe(opener(file));
  assert.deepEqual(await first.read(), { state: 'test_record_absent' });
  const written = await first.write(); assert.equal(written.state, 'test_record_written');
  const same = await first.read(); assert.equal(same.state, 'test_record_found');
  assert.equal(same.marker, written.marker); assert.equal(same.javascriptSessionChanged, false);
  const reopened = createPersistenceProbe(opener(file));
  const second = await reopened.read(); assert.equal(second.state, 'test_record_found');
  assert.equal(second.marker, written.marker); assert.equal(second.writerSession, written.writerSession);
  assert.equal(second.javascriptSessionChanged, true);
  const again = await reopened.write(); assert.equal(again.state, 'test_record_written');
  const db = new DatabaseSync(file); t.after(() => db.close());
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM test_markers').get().n, 2);
  assert.equal((await reopened.read()).marker, again.marker);
});
test('failed transactions, opens and closes never report a successful check or expose error text', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'oryn-probe-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'probe.db');
  const interrupted = createPersistenceProbe(opener(file, true));
  assert.deepEqual(await interrupted.write(), { state: 'write_failed' });
  assert.deepEqual(await createPersistenceProbe(opener(file)).read(), { state: 'test_record_absent' });
  assert.deepEqual(await createPersistenceProbe(async () => { throw new Error('private error'); }).read(), { state: 'read_failed' });
  assert.deepEqual(await createPersistenceProbe(opener(file, false, true)).write(), { state: 'write_failed' });
});

test('malformed records cannot be reported as valid persistence evidence', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'oryn-probe-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const file = join(dir, 'probe.db');
  const db = new DatabaseSync(file);
  db.exec("CREATE TABLE test_markers (id INTEGER PRIMARY KEY, marker TEXT NOT NULL, writer_session TEXT NOT NULL); INSERT INTO test_markers (marker, writer_session) VALUES ('bad', 'bad')");
  db.close();
  assert.deepEqual(await createPersistenceProbe(opener(file)).read(), { state: 'read_failed' });
});
