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
      // Redirecionar para dashboard específico baseado no tipo de usuário
      if (auth.user.userType === UserType.ADMIN) {
        router.push('/dashboard/admin');
      } else if (auth.user.userType === UserType.COACH) {
        router.push('/dashboard/coach');
      } else if (auth.user.userType === UserType.FITNESS_STUDENT) {
        router.push('/dashboard/aluno');
      } else {
        router.push('/login');
      }
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
        background: (theme) =>
          theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100],
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
          background: 'rgba(0, 0, 0, 0.1)',
          color: 'text.primary',
          mb: 3,
        }}
      >
        <RunIcon sx={{ fontSize: 40 }} />
      </Box>
      
      <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
        Preparando sua jornada...
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Redirecionando para o onboarding personalizado
      </Typography>
      
      <CircularProgress sx={{ color: 'primary.main' }} />
    </Box>
  );
} 