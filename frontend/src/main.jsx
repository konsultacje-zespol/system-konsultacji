import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import './i18n/i18n.js';
import './styles/global.scss';
import { queryClient } from './api/query-client.js';
import { router } from './router.jsx';

// mount the React application into the root DOM element
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* provide the shared react query client to the entire app */}
    <QueryClientProvider client={queryClient}>
      {/* render routes managed by react router */}
      <RouterProvider router={router} />
      {/* global toast notification container */}
      <Toaster position="top-right" />
    </QueryClientProvider>
  </StrictMode>,
);