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

export type ExportStatus = 'copied' | 'saved' | 'cancelled' | 'error' | 'busy';
export function parseExportStatus(result: unknown, operation: 'copy' | 'save'): ExportStatus {
  if (result === null || typeof result !== 'object' || !('status' in result)) return 'error';
  const status = result.status;
  if (status === 'error') return status;
  if (operation === 'save' && (status === 'busy' || status === 'cancelled')) return status;
  if (operation === 'copy' && status === 'copied') return status;
  if (operation === 'save' && status === 'saved') return status;
  return 'error';
}
