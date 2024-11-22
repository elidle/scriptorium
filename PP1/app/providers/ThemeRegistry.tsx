// ThemeRegistry.tsx
'use client';

import { createTheme, ThemeProvider } from "@mui/material";
import React from "react";

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2563eb', // blue-600
    },
    secondary: {
      main: '#7c3aed', // violet-600
    },
    background: {
      default: '#0f172a', // slate-900
      paper: '#1e293b', // slate-800
    },
    text: {
      primary: '#f8fafc', // slate-50
      secondary: '#cbd5e1', // slate-300
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#334155', // slate-700
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          backgroundColor: '#334155', // slate-700
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: '#2563eb', // blue-600
          '&:hover': {
            backgroundColor: '#1d4ed8', // blue-700
          },
        },
        containedSecondary: {
          backgroundColor: '#7c3aed', // violet-600
          '&:hover': {
            backgroundColor: '#6d28d9', // violet-700
          },
        },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}