export type ExampleState = { visible: boolean; details: boolean; more: boolean };
export type ExampleAction = 'open' | 'close' | 'toggleDetails' | 'toggleMore';
export const initialExampleState: ExampleState = { visible: false, details: false, more: false };
export function exampleNavigation(state: ExampleState, action: ExampleAction): ExampleState {
  if (action === 'open') return { ...initialExampleState, visible: true };
  if (action === 'close') return initialExampleState;
  if (!state.visible) return state;
  if (action === 'toggleDetails') return { ...state, details: !state.details };
  return { ...state, more: !state.more };
}
