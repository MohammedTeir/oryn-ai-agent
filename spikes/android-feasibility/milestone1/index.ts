import { registerRootComponent } from 'expo';
import App from './App';
import { PreviewLanguageProvider } from './PreviewLanguage';
import { createElement } from 'react';
registerRootComponent(() => createElement(PreviewLanguageProvider, null, createElement(App)));
