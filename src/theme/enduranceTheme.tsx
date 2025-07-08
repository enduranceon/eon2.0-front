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
    main: '#FF8012', // Laranja
    light: '#FF9933',
    dark: '#E67300',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#38B6FF', // Azul
    light: '#6ACDFF',
    dark: '#1F9CE6',
    contrastText: '#FFFFFF',
  },
  tertiary: {
    main: '#BFBFBF', // Cinza
    light: '#D9D9D9',
    dark: '#A6A6A6',
    contrastText: '#000000', // Preto para melhor contraste
  },
};

const lightPalette = {
  background: {
    default: '#FFFFFF', // Branco
    paper: '#FFFFFF',
  },
  text: {
    primary: '#000000', // Preto
    secondary: '#757575', // Cinza mais escuro para acessibilidade (WCAG AA)
    disabled: '#BFBFBF',
  },
  surface: {
    primary: '#F5F5F5', // Um cinza bem claro
    secondary: '#E0E0E0',
    tertiary: '#BFBFBF',
  },
  shadow: {
    primary: '0 4px 20px rgba(0, 0, 0, 0.05)',
    secondary: '0 8px 32px rgba(0, 0, 0, 0.04)',
    elevated: '0 12px 48px rgba(0, 0, 0, 0.08)',
  },
};

const darkPalette = {
  background: {
    default: '#000000', // Preto
    paper: '#1E1E1E', // Um cinza bem escuro para superfícies
  },
  text: {
    primary: '#FFFFFF', // Branco
    secondary: '#BFBFBF', // Cinza do guia
    disabled: '#757575',
  },
  surface: {
    primary: '#333333',
    secondary: '#424242',
    tertiary: '#616161',
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
      fontFamily: 'var(--font-montserrat), "Roboto", "Arial", sans-serif',
      h1: { fontFamily: 'var(--font-gotham), sans-serif', fontSize: '2.5rem', fontWeight: 'normal', fontStyle: 'italic', lineHeight: 1.2 },
      h2: { fontFamily: 'var(--font-gotham), sans-serif', fontSize: '2rem', fontWeight: 'normal', fontStyle: 'italic', lineHeight: 1.3 },
      h3: { fontFamily: 'var(--font-gotham), sans-serif', fontSize: '1.5rem', fontWeight: 'normal', fontStyle: 'italic', lineHeight: 1.4 },
      h4: { fontFamily: 'var(--font-gotham), sans-serif', fontSize: '1.25rem', fontWeight: 'normal', fontStyle: 'italic', lineHeight: 1.4 },
      h5: { fontFamily: 'var(--font-gotham), sans-serif', fontSize: '1.125rem', fontWeight: 'normal', fontStyle: 'italic', lineHeight: 1.4 },
      h6: { fontFamily: 'var(--font-gotham), sans-serif', fontSize: '1rem', fontWeight: 'normal', fontStyle: 'italic', lineHeight: 1.4 },
      body1: { fontFamily: 'var(--font-montserrat), sans-serif', fontSize: '1rem', lineHeight: 1.5 },
      body2: { fontFamily: 'var(--font-montserrat), sans-serif', fontSize: '0.875rem', lineHeight: 1.5 },
      caption: { fontFamily: 'var(--font-montserrat), sans-serif', fontSize: '0.75rem', lineHeight: 1.4 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none', // Reset for dark mode
            boxShadow: theme.colors.shadow.primary,
            borderRadius: 8,
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
            borderRadius: 8,
            padding: '12px 24px',
            boxShadow: 'none',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: theme.colors.shadow.primary,
              transform: 'translateY(-1px)',
            },
          }),
          contained: ({ theme }) => ({
            background: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              background: theme.palette.primary.dark,
            },
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            borderRadius: 8,
            boxShadow: theme.colors.shadow.primary,
          }),
          elevation1: ({ theme }) => ({ boxShadow: theme.colors.shadow.primary }),
          elevation2: ({ theme }) => ({ boxShadow: theme.colors.shadow.secondary }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 8,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            background:
              theme.palette.mode === 'light'
                ? theme.palette.primary.main
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