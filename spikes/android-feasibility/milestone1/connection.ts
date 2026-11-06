export type ConnectionStatus = 'checking' | 'unknown' | 'notDetected' | 'permissionRequired';

// This is a prerequisite observation, not a backend handshake. Even a granted
// permission cannot establish that Termux is configured or working.
export function statusFromNative(raw: string): ConnectionStatus {
  try {
    const record: unknown = JSON.parse(raw);
    if (!record || typeof record !== 'object' || Array.isArray(record) || !('externalPrerequisites' in record)) return 'unknown';
    const preflight = record.externalPrerequisites;
    if (!preflight || typeof preflight !== 'object' || Array.isArray(preflight)) return 'unknown';
    if ('packageState' in preflight && preflight.packageState === 'not_detected') return 'notDetected';
    if ('packageState' in preflight && preflight.packageState === 'detected' && 'runCommandPermission' in preflight && preflight.runCommandPermission === 'denied') return 'permissionRequired';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}
