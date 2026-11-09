export type PreviewDestination = 'feasibility' | 'navigation' | 'shell';
export function previewDestination(current: PreviewDestination, action: 'open-navigation' | 'open-shell' | 'close'): PreviewDestination {
  if (action === 'close') return 'feasibility';
  if (current !== 'feasibility') return current;
  return action === 'open-navigation' ? 'navigation' : 'shell';
}
