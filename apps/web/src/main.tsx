import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from './app/router';
import { AppProviders } from './app/providers';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not find the root element.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);
