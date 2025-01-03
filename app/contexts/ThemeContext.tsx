"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, Theme } from '@mui/material';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // blue-600
      light: '#3b82f6', // blue-500
      dark: '#1d4ed8', // blue-700
    },
    secondary: {
      main: '#7c3aed', // violet-600
      light: '#8b5cf6', // violet-500
      dark: '#6d28d9', // violet-700
    },
    background: {
      default: 'rgb(203 213 225)', // slate-300 - Lighter background for better contrast
      paper: 'rgb(226 232 240)', // slate-200 - Crisp surface for content
    },
    text: {
      primary: '#1e293b', // slate-800 - Slightly softer than black for better readability
      secondary: '#475569', // slate-600 - Better contrast for secondary text
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    error: {
      main: '#dc2626', // red-600
      light: '#ef4444', // red-500
      dark: '#b91c1c', // red-700
    },
    warning: {
      main: '#d97706', // amber-600
      light: '#f59e0b', // amber-500
      dark: '#b45309', // amber-700
    },
    info: {
      main: '#0284c7', // sky-600
      light: '#0ea5e9', // sky-500
      dark: '#0369a1', // sky-700
    },
    success: {
      main: '#16a34a', // green-600
      light: '#22c55e', // green-500
      dark: '#15803d', // green-700
    },
    divider: 'rgb(148 163 184)', // slate-400
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#1e293b', // slate-800
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#1e293b',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1e293b',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#1e293b',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#1e293b',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#1e293b',
    },
    body1: {
      fontSize: '1rem',
      color: '#1e293b',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#475569', // slate-600
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '0.375rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6', // blue-500 - Brighter in dark mode
      light: '#60a5fa', // blue-400
      dark: '#2563eb', // blue-600
    },
    secondary: {
      main: '#8b5cf6', // violet-500
      light: '#a78bfa', // violet-400
      dark: '#7c3aed', // violet-600
    },
    background: {
      default: '#0f172a', // slate-900
      paper: '#1e293b', // slate-800
    },
    text: {
      primary: '#f8fafc', // slate-50
      secondary: '#cbd5e1', // slate-300
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    error: {
      main: '#ef4444', // red-500
      light: '#f87171', // red-400
      dark: '#dc2626', // red-600
    },
    warning: {
      main: '#f59e0b', // amber-500
      light: '#fbbf24', // amber-400
      dark: '#d97706', // amber-600
    },
    info: {
      main: '#0ea5e9', // sky-500
      light: '#38bdf8', // sky-400
      dark: '#0284c7', // sky-600
    },
    success: {
      main: '#22c55e', // green-500
      light: '#4ade80', // green-400
      dark: '#16a34a', // green-600
    },
    divider: '#334155', // slate-700
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#f8fafc', // slate-50
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#f8fafc',
    },
    body1: {
      fontSize: '1rem',
      color: '#f8fafc',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#cbd5e1', // slate-300
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '0.375rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
        },
      },
    },
  },
});

type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setIsDarkMode(storedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};