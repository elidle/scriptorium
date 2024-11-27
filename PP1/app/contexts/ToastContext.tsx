"use client";
import React, { createContext, useContext, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  showToast: (toast: Toast) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [open, setOpen] = useState(false);

  const showToast = (newToast: Toast) => {
    setToast(newToast);
    setOpen(true);
  };

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={toast?.type || 'info'} 
          variant="filled"
          sx={{ 
            width: '100%',
            bgcolor: toast?.type === 'error' ? 'rgb(239, 68, 68)' : 
                    toast?.type === 'success' ? 'rgb(34, 197, 94)' : 
                    toast?.type === 'warning' ? 'rgb(234, 179, 8)' : 
                    'rgb(59, 130, 246)',
          }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};