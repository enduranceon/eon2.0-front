'use client';

import React from 'react';
import { createTheme, Theme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { PaletteMode } from '@mui/material';

declare module '@mui/material/styles' {
  interface Theme {
    colors: typeof baseColors & typeof lightPalette & typeof darkPalette;
  }
  interface ThemeOptions {
    colors?: typeof baseColors & typeof lightPalette & typeof darkPalette;
  }
  interface Palette {
    tertiary: Palette['primary'];
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
  }
}

const baseColors = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#ffffff',
  },
  tertiary: {
    main: '#f57c00',
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#ffffff',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #1976d2 0%, #2e7d32 100%)',
    secondary: 'linear-gradient(135deg, #2e7d32 0%, #f57c00 100%)',
    accent: 'linear-gradient(135deg, #f57c00 0%, #1976d2 100%)',
  },
};

const lightPalette = {
  background: {
    default: '#f8fafc',
    paper: '#ffffff',
  },
  text: {
    primary: '#1e293b',
    secondary: '#64748b',
    disabled: '#94a3b8',
  },
  surface: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
  },
  shadow: {
    primary: '0 4px 20px rgba(25, 118, 210, 0.15)',
    secondary: '0 8px 32px rgba(46, 125, 50, 0.12)',
    elevated: '0 12px 48px rgba(0, 0, 0, 0.1)',
  },
};

const darkPalette = {
  background: {
    default: '#0f172a',
    paper: '#1e293b',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    disabled: '#475569',
  },
  surface: {
    primary: '#334155',
    secondary: '#475569',
    tertiary: '#64748b',
  },
  shadow: {
    primary: '0 4px 20px rgba(0, 0, 0, 0.3)',
    secondary: '0 8px 32px rgba(0, 0, 0, 0.25)',
    elevated: '0 12px 48px rgba(0, 0, 0, 0.2)',
  },
};

export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    primary: baseColors.primary,
    secondary: baseColors.secondary,
    tertiary: baseColors.tertiary,
    ...(mode === 'light'
      ? {
          background: lightPalette.background,
          text: lightPalette.text,
        }
      : {
          background: darkPalette.background,
          text: darkPalette.text,
        }),
  },
  colors: {
    ...baseColors,
    ...(mode === 'light' ? lightPalette : darkPalette),
  },
});

export const createEnduranceTheme = (mode: PaletteMode): Theme => {
  const designTokens = getDesignTokens(mode);

  return createTheme({
    ...designTokens,
    typography: {
      fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
      h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.3 },
      h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
      h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
      h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
      h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
      body1: { fontSize: '1rem', lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none', // Reset for dark mode
            boxShadow: theme.colors.shadow.primary,
            borderRadius: 16,
            border: `1px solid ${
              theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)'
            }`,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: theme.colors.shadow.elevated,
              transform: 'translateY(-2px)',
            },
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 12,
            padding: '12px 24px',
            boxShadow: 'none',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: theme.colors.shadow.primary,
              transform: 'translateY(-1px)',
            },
          }),
          contained: {
            background: baseColors.gradient.primary,
            color: '#ffffff',
            '&:hover': {
              background: baseColors.gradient.secondary,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            borderRadius: 16,
            boxShadow: theme.colors.shadow.primary,
          }),
          elevation1: ({ theme }) => ({ boxShadow: theme.colors.shadow.primary }),
          elevation2: ({ theme }) => ({ boxShadow: theme.colors.shadow.secondary }),
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            background:
              theme.palette.mode === 'light'
                ? baseColors.gradient.primary
                : theme.palette.background.default,
            borderBottom: `1px solid ${
              theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)'
            }`,
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: 0,
            background: theme.palette.background.paper,
            borderRight: `1px solid ${
              theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)'
            }`,
          }),
        },
      },
    },
  });
};

// Para compatibilidade com importações existentes - só funciona no cliente
export const enduranceTheme = typeof window !== 'undefined' ? createEnduranceTheme('light') : null as any;

export default enduranceTheme; 