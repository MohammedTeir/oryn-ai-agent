import { openDatabaseAsync } from 'expo-sqlite';
import { createPersistenceProbe } from './persistenceProbe';

// Kept separate from oryn-local.db and only opened after an explicit button tap.
export const persistenceProbe = createPersistenceProbe(() => openDatabaseAsync('oryn-persistence-probe.db', { useNewConnection: true }));
