'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { UserType } from '../../types/api';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import { DirectionsRun as RunIcon } from '@mui/icons-material';

export default function OnboardingPage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      router.push('/login');
      return;
    }

    // Verificar se já completou onboarding
    if (auth.user.onboardingCompleted) {
      router.push('/dashboard');
      return;
    }

    // Redirecionar baseado no tipo de usuário
    const redirectPath = {
      [UserType.FITNESS_STUDENT]: '/onboarding/quiz-plano',
      [UserType.COACH]: '/onboarding/coach-profile',
      [UserType.ADMIN]: '/dashboard/admin',
    }[auth.user.userType];

    if (redirectPath) {
      router.push(redirectPath);
    }
  }, [auth.isAuthenticated, auth.user, router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          mb: 3,
        }}
      >
        <RunIcon sx={{ fontSize: 40 }} />
      </Box>
      
      <Typography variant="h4" fontWeight="bold" color="white" gutterBottom>
        Preparando sua jornada...
      </Typography>
      
      <Typography variant="body1" color="rgba(255, 255, 255, 0.8)" sx={{ mb: 4 }}>
        Redirecionando para o onboarding personalizado
      </Typography>
      
      <CircularProgress sx={{ color: 'white' }} />
    </Box>
  );
} 