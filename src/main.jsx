import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AppProvider } from './state/AppContext.jsx';
import { I18nProvider } from './lib/i18n.js';
import { initTheme } from './lib/theme.js';
import './index.css';

// Initialize theme listener
initTheme();

createRoot(document.getElementById('root')).render(
  <I18nProvider>
    <AppProvider>
      <App />
    </AppProvider>
  </I18nProvider>
);
