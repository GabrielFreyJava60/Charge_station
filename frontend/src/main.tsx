import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import './index.css';
import { getLogger } from '@/services/logging';
import router from './router/router.tsx';
import { AuthProvider } from './auth/AuthProvider.tsx';

const logger = getLogger();
logger.info("Application bootstrap");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
