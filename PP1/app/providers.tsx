'use client';

import { ThemeProvider as MuiThemeProvider } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { useTheme } from './contexts/ThemeContext';

// Create a wrapper component to use the theme hook
const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeWrapper>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </ThemeWrapper>
    </ThemeProvider>
  );
}