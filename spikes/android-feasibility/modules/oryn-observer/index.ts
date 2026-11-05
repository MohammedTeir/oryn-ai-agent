import { requireNativeModule } from 'expo-modules-core';

export type Observation = {
  observedAtEpochMs: number;
  androidRelease: string;
  apiLevel: number;
  supportedAbis: string[];
  manufacturer: string;
  model: string;
  applicationId: string;
  termux: { state: 'detected' | 'not_detected'; version: string | null };
  executionCapability: 'not_implemented';
};

// Loaded on explicit observation, so missing native registration becomes a visible error.
export function observe(): Promise<Observation> {
  return requireNativeModule<{ observe(): Promise<Observation> }>('OrynObserver').observe();
}

export type ProbeId = 'native_echo' | 'native_timeout' | 'native_cancel' | 'termux_echo' | 'termux_delay';
type ExecutionSpike = {
  getState(): Promise<string>;
  requestProbe(id: ProbeId): Promise<string>;
  requestCancel(): Promise<string>;
  negativeProbe(token: string | null): Promise<string>;
};
// These APIs never expose grant issuance or an arbitrary executable/argument.
const execution = () => requireNativeModule<ExecutionSpike>('OrynExecutionSpike');
export const getExecutionState = () => execution().getState();
export const requestProbe = (id: ProbeId) => execution().requestProbe(id);
export const requestCancel = () => execution().requestCancel();
// Native denial-only sink: neither invocation can execute a backend.
export async function checkMissingAndForgedGrant(): Promise<string[]> {
  return [await execution().negativeProbe(null), await execution().negativeProbe('deliberately-invalid-device-test-token')];
}

type EvidenceExporter = {
  copyEvidence(text: string): Promise<unknown>;
  saveEvidence(text: string): Promise<unknown>;
};
const exporter = () => requireNativeModule<EvidenceExporter>('OrynEvidenceExport');
export const copyEvidence = (text: string) => exporter().copyEvidence(text);
export const saveEvidence = (text: string) => exporter().saveEvidence(text);
