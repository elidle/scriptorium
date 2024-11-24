'use client';

import {ThemeProvider as MuiThemeProvider, useMediaQuery} from '@mui/material';
import {ThemeProvider, useTheme} from "@/app/contexts/ThemeContext";
import {AuthProvider} from "@/app/contexts/AuthContext";
import {ToastProvider} from "@/app/contexts/ToastContext";


// Create a wrapper component to use the theme hook
const ThemeWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  return (

    <MuiThemeProvider theme={theme}>
      <div className={`${isMobile ? 'w-fit' : 'w-full'}`}>
        {children}
      </div>
    </MuiThemeProvider>
  );
};

export function Providers({children }: { children: React.ReactNode }) {
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