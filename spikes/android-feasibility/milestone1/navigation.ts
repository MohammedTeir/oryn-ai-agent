export type Tab = 'agent' | 'terminal';
export type Segment = 'terminal' | 'tools' | 'history';
export type NavigationState = { tab: Tab; segment: Segment; settings: boolean };
export type NavigationAction =
  | { type: 'tab'; tab: Tab }
  | { type: 'segment'; segment: Segment }
  | { type: 'settings' }
  | { type: 'back' }
  | { type: 'history' };

export const initialNavigation: NavigationState = { tab: 'agent', segment: 'terminal', settings: false };

export function navigate(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'tab': return { ...state, tab: action.tab, settings: false };
    case 'segment': return { ...state, tab: 'terminal', segment: action.segment, settings: false };
    case 'settings': return { ...state, settings: true };
    case 'back': return { ...state, settings: false };
    case 'history': return { tab: 'terminal', segment: 'history', settings: false };
  }
}
