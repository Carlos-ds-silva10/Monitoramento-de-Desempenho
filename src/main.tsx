import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PeriodProvider } from './context/PeriodContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PeriodProvider>
      <App />
    </PeriodProvider>
  </StrictMode>
);
