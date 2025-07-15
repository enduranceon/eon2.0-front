'use client';

import React, { createContext, useState, useContext, ReactNode, useRef, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

const LoadingOverlay = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)', // Menos opaco
      backdropFilter: 'blur(2px)', // Menos blur
      zIndex: (theme) => theme.zIndex.drawer + 2,
      color: 'white',
      transition: 'all 0.2s ease-in-out', // Transição mais rápida
      opacity: 1,
      animation: 'fadeIn 0.2s ease-in-out',
      '@keyframes fadeIn': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    }}
  >
    <CircularProgress color="inherit" size={40} />
  </Box>
);

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setLoading = (loadingState: boolean) => {
    setIsLoading(loadingState);
    
    if (loadingState) {
      // Delay para evitar flicker em navegações rápidas
      timeoutRef.current = setTimeout(() => {
        setShowOverlay(true);
      }, 150); // Só mostra após 150ms
    } else {
      // Cancela o timeout se loading for desligado antes de mostrar overlay
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setShowOverlay(false);
    }
  };

  // Limpa timeout no unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {showOverlay && <LoadingOverlay />}
      {children}
    </LoadingContext.Provider>
  );
}; 