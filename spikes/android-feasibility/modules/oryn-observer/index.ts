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
