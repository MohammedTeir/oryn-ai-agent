import { registerRootComponent } from 'expo';
import App from './App';
import { AppLanguageProvider } from './AppLanguage';
import { createElement } from 'react';
registerRootComponent(() => createElement(AppLanguageProvider, null, createElement(App)));
