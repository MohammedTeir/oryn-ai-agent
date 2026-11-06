// Only an Android Keystore-backed adapter may be used by the application.
// The vault is not an API-key validator and is not wired to onboarding yet.
export interface SecretBackend {
  isAvailableAsync(): Promise<boolean>;
  setItemAsync(key: string, value: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  deleteItemAsync(key: string): Promise<void>;
}
type Failure = { ok: false; reason: 'invalid' | 'unavailable' | 'failed' };
type WriteResult = { ok: true } | Failure;
type ReadResult = { ok: true; value: string | null } | Failure;
const ITEM = 'oryn.gemini.api-key';

export function createCredentialVault(backend: SecretBackend) {
  // Preserve operation order so an earlier slow write cannot resurrect a key
  // after a later delete. No key is retained in the settled queue promise.
  let queue: Promise<void> = Promise.resolve();
  function ordered<T>(work: () => Promise<T>): Promise<T> {
    const result = queue.then(work);
    queue = result.then(() => undefined, () => undefined);
    return result;
  }
  async function availability(): Promise<Failure | null> {
    try { return await backend.isAvailableAsync() ? null : { ok: false, reason: 'unavailable' }; }
    catch { return { ok: false, reason: 'failed' }; }
  }
  return {
    save(value: unknown): Promise<WriteResult> {
      if (typeof value !== 'string' || value.trim().length === 0) return Promise.resolve({ ok: false, reason: 'invalid' });
      return ordered(async () => {
        const failure = await availability(); if (failure) return failure;
        try { await backend.setItemAsync(ITEM, value); return { ok: true }; }
        catch { return { ok: false, reason: 'failed' }; }
      });
    },
    read(): Promise<ReadResult> {
      return ordered(async () => {
        const failure = await availability(); if (failure) return failure;
        try { return { ok: true, value: await backend.getItemAsync(ITEM) }; }
        catch { return { ok: false, reason: 'failed' }; }
      });
    },
    clear(): Promise<WriteResult> {
      return ordered(async () => {
        const failure = await availability(); if (failure) return failure;
        try { await backend.deleteItemAsync(ITEM); return { ok: true }; }
        catch { return { ok: false, reason: 'failed' }; }
      });
    },
  };
}
