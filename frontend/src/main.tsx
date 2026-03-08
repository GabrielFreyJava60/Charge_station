import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import './index.css';
import App from './App.tsx';
import { getLogger } from '@/services/logging';
import router from './router/router.tsx';

const logger = getLogger();
logger.info("Application bootstrap");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
