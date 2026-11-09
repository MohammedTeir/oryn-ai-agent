import { strings } from '../milestone1/strings';
import { AppLanguageProvider } from '../milestone1/AppLanguage';
import App from './App';
import { RecoveryBoundary } from './RecoveryBoundary';

export default function ProductionRoot() {
  return <RecoveryBoundary message={`${strings.en.shellError}\n${strings.ar.shellError}`} retryLabel={`${strings.en.shellRetry} / ${strings.ar.shellRetry}`}><AppLanguageProvider><App /></AppLanguageProvider></RecoveryBoundary>;
}
