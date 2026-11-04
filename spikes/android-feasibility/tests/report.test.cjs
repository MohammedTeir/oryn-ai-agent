const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseNativeRecord, appendEvidence, createReport, HISTORY_LIMIT } = require('../report.ts');

test('malformed or non-object native responses cannot become success evidence', () => {
  for (const raw of ['invalid', 'null', '[]', 'true', '7', '"ready"']) {
    assert.throws(() => parseNativeRecord(raw));
  }
  assert.deepEqual(parseNativeRecord('{"state":"unknown_timeout","exitCode":null}'),
    { state: 'unknown_timeout', exitCode: null });
});
test('evidence is bounded without modifying earlier captured entries', () => {
  const original = Array.from({ length: HISTORY_LIMIT }, (_, i) => ({ capturedAtEpochMs: i, source: 'fixture', value: { state: 'unknown' } }));
  const entry = { capturedAtEpochMs: 100, source: 'fixture', value: { state: 'exited', exitCode: 7 } };
  const next = appendEvidence(original, entry);
  assert.equal(next.length, HISTORY_LIMIT);
  assert.equal(next[0].capturedAtEpochMs, 1);
  assert.equal(next.at(-1), entry);
  assert.equal(original[0].capturedAtEpochMs, 0);
});
test('export preserves missing observation and denied or uncertain results honestly', () => {
  const entries = [{ capturedAtEpochMs: 1, source: 'fixture', value: { requestState: 'rejected_no_dispatch' } }];
  const report = createReport(null, entries);
  assert.equal(report.observation, null);
  assert.deepEqual(report.entries, entries);
  assert.equal(report.schema, 'oryn-milestone-0-device-evidence/v1');
  assert.ok(Number.isFinite(report.exportedAtEpochMs));
});
