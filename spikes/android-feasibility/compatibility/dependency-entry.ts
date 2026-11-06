/** Build-only fixture: no API key, SDK client, HTTP request or backend dispatch. */
import { GoogleGenAI } from '@google/genai/web';
import { Plug, Unplug, Link, Unlink, KeyRound, ShieldCheck } from 'lucide-react-native';
import Svg from 'react-native-svg';
import { openLocalDatabase } from '../storage/database';
import { credentialVault } from '../credentials/androidVault';

// Exported references force Metro to resolve the real published imports.
export const compatibilityImports = { GoogleGenAI, Svg, openLocalDatabase, credentialVault, Plug, Unplug, Link, Unlink, KeyRound, ShieldCheck };
