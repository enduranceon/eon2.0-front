'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: string[];
}

export default function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const auth = useAuth();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (!auth.isLoading) {
      // Não autenticado
      if (!auth.isAuthenticated) {
        router.push('/login');
        return;
      }

      // Verificação de assinatura para alunos
      if (auth.user?.userType === 'FITNESS_STUDENT') {
        // Pagamento em processamento
        if (auth.subscriptionStatus === 'PENDING') {
          router.push('/subscription/pending');
          return;
        }

        // Sem assinatura ativa
        if (auth.subscriptionStatus !== 'ACTIVE') {
          router.push('/onboarding/quiz-plano');
          return;
        }
      }

      // Verificação de tipos permitidos (roles)
      if (allowedUserTypes && auth.user && !allowedUserTypes.includes(auth.user.userType)) {
        // Redirecionar para dashboard apropriado baseado no tipo de usuário
        switch (auth.user.userType) {
          case 'FITNESS_STUDENT':
            router.push('/dashboard/aluno');
            break;
          case 'COACH':
            router.push('/dashboard/coach');
            break;
          case 'ADMIN':
            router.push('/dashboard/admin');
            break;
          default:
            router.push('/dashboard');
        }
        return;
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user, auth.subscriptionStatus, allowedUserTypes, router]);

  if (auth.isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: theme.colors.gradient.primary,
          color: 'white',
        }}
      >
        <CircularProgress color="inherit" size={64} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Carregando...
        </Typography>
      </Box>
    );
  }

  if (!auth.isAuthenticated) {
    return null; // Não renderiza nada enquanto redireciona
  }

  if (allowedUserTypes && auth.user && !allowedUserTypes.includes(auth.user.userType)) {
    return null; // Não renderiza nada enquanto redireciona
  }

  return <>{children}</>;
}

// Higher-order component for page-level protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  const ProtectedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  ProtectedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return ProtectedComponent;
}

// Specific guards for common use cases
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedUserTypes={['ADMIN']}>{children}</ProtectedRoute>
);

export const CoachRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedUserTypes={['COACH']}>{children}</ProtectedRoute>
);

export const StudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>{children}</ProtectedRoute>
);

export const AdminOrCoachRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedUserTypes={['ADMIN', 'COACH']}>{children}</ProtectedRoute>
); 