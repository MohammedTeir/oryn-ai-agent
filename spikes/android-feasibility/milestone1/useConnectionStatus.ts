import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getExecutionState } from '../modules/oryn-observer';
import { statusFromNative, type ConnectionStatus } from './connection';

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('unknown');
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (AppState.currentState !== 'active') return;
    const request = ++generation.current;
    setStatus('checking');
    try {
      const result = await getExecutionState();
      if (request === generation.current && AppState.currentState === 'active') setStatus(statusFromNative(result));
    } catch {
      if (request === generation.current && AppState.currentState === 'active') setStatus('unknown');
    }
  }, []);
  useEffect(() => {
    const tracker = generation;
    const initial = setTimeout(() => void refresh(), 0);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
      else { generation.current++; setStatus('unknown'); }
    });
    return () => { tracker.current++; clearTimeout(initial); subscription.remove(); };
  }, [refresh]);
  return { status, refresh };
}
