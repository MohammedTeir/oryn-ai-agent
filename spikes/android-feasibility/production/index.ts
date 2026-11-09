import { registerRootComponent } from 'expo';
import App from './App';
import { createElement } from 'react';
import { AppLanguageProvider } from '../milestone1/AppLanguage';
registerRootComponent(() => createElement(AppLanguageProvider, null, createElement(App)));
