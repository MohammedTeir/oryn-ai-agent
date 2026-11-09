import { openLocalDatabase } from './database';
import { createConversationRepository } from './conversations';

// A repository factory only; importing this module performs no database writes.
export function createAppConversationRepository() {
  return createConversationRepository(openLocalDatabase);
}
