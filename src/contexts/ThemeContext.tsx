'use client';

import React, { createContext, useState, useMemo, useEffect, ReactNode, useContext } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, PaletteMode } from '@mui/material';
import { createEnduranceTheme } from '../theme/enduranceTheme';

interface ColorModeContextType {
  toggleColorMode: () => void;
  mode: PaletteMode;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  toggleColorMode: () => {},
  mode: 'light',
});

interface ColorModeProviderProps {
  children: ReactNode;
}

export function ColorModeProvider({ children }: ColorModeProviderProps) {
  const [mode, setMode] = useState<PaletteMode>('light');

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('colorMode') as PaletteMode;
      if (savedMode) {
        setMode(savedMode);
      }
    } catch (error) {
      console.log('localStorage is not available, using default light mode.');
    }
  }, []);

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          try {
            localStorage.setItem('colorMode', newMode);
          } catch (error) {
             console.log('localStorage is not available, cannot save color mode.');
          }
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(() => createEnduranceTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext); 