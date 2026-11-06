import { ArrowLeft, ArrowRight, History, Link, Settings, Terminal } from 'lucide-react-native';
import tokens from '../../../docs/design/tokens.json';

const icons = { back: ArrowLeft, backRtl: ArrowRight, history: History, connection: Link, settings: Settings, terminal: Terminal } as const;
export type IconName = keyof typeof icons;
export function AppIcon({ name, color }: { name: IconName; color: string }) {
  const Icon = icons[name];
  return <Icon size={tokens.spacing_dp.xl} color={color} strokeWidth={tokens.icons.defaultStroke} />;
}
