export type NativeRecord = Record<string, unknown>;
export type EvidenceEntry = { capturedAtEpochMs: number; source: string; value: NativeRecord };
export const HISTORY_LIMIT = 40;

// Invalid native responses remain errors, never substituted with a success value.
export function parseNativeRecord(raw: string): NativeRecord {
  const value: unknown = JSON.parse(raw);
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid native evidence');
  }
  return value as NativeRecord;
}

export function appendEvidence(history: EvidenceEntry[], entry: EvidenceEntry): EvidenceEntry[] {
  return [...history, entry].slice(-HISTORY_LIMIT);
}

export function createReport(observation: NativeRecord | null, entries: EvidenceEntry[]) {
  return {
    schema: 'oryn-milestone-0-device-evidence/v1',
    exportedAtEpochMs: Date.now(),
    scope: 'Debug feasibility evidence only; capture times are not command start times.',
    observation,
    historyLimit: HISTORY_LIMIT,
    entries,
  };
}
