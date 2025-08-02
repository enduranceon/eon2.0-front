'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { checkUserHasPendingPayment } from '../utils/paymentUtils';
import { enduranceApi } from '../services/enduranceApi';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes?: string[];
}

export default function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const auth = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [accessGranted, setAccessGranted] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    const performAllChecks = async () => {
      // Reset states
      setAccessGranted(false);
      setCheckingPayment(false);

      // Wait for auth to load
      if (auth.isLoading) {
        return;
      }

      // Not authenticated - mas só redirecionar se não estiver em rota de auth
      if (!auth.isAuthenticated) {
        const isAuthRoute = window.location.pathname.includes('/login') || 
                           window.location.pathname.includes('/register') || 
                           window.location.pathname.includes('/forgot-password') ||
                           window.location.pathname.includes('/reset-password') ||
                           window.location.pathname.includes('/verify-email') ||
                           window.location.pathname.includes('/2fa');
        
        if (!isAuthRoute) {
          router.push('/login');
        }
        return;
      }

      // Only check payment for students
      if (auth.user?.userType === 'FITNESS_STUDENT') {
        setCheckingPayment(true);
        
        try {
          // Check subscription status first (faster)
          if (auth.subscriptionStatus === 'PENDING') {
            router.push('/payment-pending');
            return;
          }

          // Check for ON_LEAVE status - mas não redirecionar se já estiver na página de licença
          if (auth.subscriptionStatus === 'ON_LEAVE') {
            // Verificar se já está na página de licença para evitar loop
            const currentPath = window.location.pathname;
            if (currentPath !== '/licenca-status') {
              router.push('/licenca-status');
              return;
            }
            // Se já está na página de licença, permitir acesso
            setAccessGranted(true);
            return;
          }

          // If no active subscription, redirect to onboarding
          if (auth.subscriptionStatus !== 'ACTIVE') {
            // But first check if they have pending payments
            const hasPendingPayment = await checkUserHasPendingPayment(auth.user, enduranceApi);
            if (hasPendingPayment) {
              router.push('/payment-pending');
              return;
            }
            router.push('/onboarding/quiz-plano');
            return;
          }
        } catch (error) {
          console.error('Erro ao verificar pagamento pendente:', error);
        } finally {
          setCheckingPayment(false);
        }
      }

      // Role-based access control
      if (allowedUserTypes && auth.user && !allowedUserTypes.includes(auth.user.userType)) {
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
            router.push('/login');
        }
        return;
      }

      // All checks passed
      setAccessGranted(true);
    };

    performAllChecks();
  }, [auth.isLoading, auth.isAuthenticated, auth.user?.id, auth.subscriptionStatus, allowedUserTypes, router]);

  if (auth.isLoading || checkingPayment) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          {checkingPayment ? 'Verificando status do pagamento...' : 'Carregando...'}
        </Typography>
      </Box>
    );
  }

  if (!auth.isAuthenticated || !accessGranted) {
    return null; // Não renderiza nada enquanto redireciona ou verifica
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