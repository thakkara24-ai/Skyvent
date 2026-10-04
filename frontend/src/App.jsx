import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Toaster 
              position="top-right" 
              duration={1000}
              closeButton
              toastOptions={{
                duration: 1000,
                className: 'skyvent-toast',
                style: {
                  fontFamily: 'Inter, sans-serif',
                  borderRadius: '12px',
                  border: '1px solid var(--sand)',
                  backgroundColor: 'var(--cream)',
                  color: 'var(--ink-brown)',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxShadow: '0 8px 24px -4px rgba(42, 30, 24, 0.12)',
                  padding: '12px 16px',
                }
              }}
            />
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
