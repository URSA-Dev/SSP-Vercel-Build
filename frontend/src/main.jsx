import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import QueryProvider from './providers/QueryProvider';
import { ToastProvider } from './components/Toast/toast-context';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import App from './App';
import './styles/design-tokens.css';
import './styles/globals.css';
import './styles/utilities.css';
import './styles/animations.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>
);
