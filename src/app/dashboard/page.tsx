'use client';

import React, { useState, useEffect } from 'react';
import { useTheme, Box, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';
import DashboardOverview from '../../components/Dashboard/DashboardOverview';
import { User, UserType } from '../../types/api';
import { enduranceApi } from '../../services/enduranceApi';
import PageHeader from '@/components/Dashboard/PageHeader';
import { checkUserHasPendingPayment } from '../../utils/paymentUtils';

export default function DashboardPage() {
  const router = useRouter();
  const theme = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = enduranceApi.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const userProfile = await enduranceApi.getProfile();
      setUser(userProfile);

      // Verificar se há pagamento pendente
      try {
        const hasPendingPayment = await checkUserHasPendingPayment(userProfile, enduranceApi);
        if (hasPendingPayment) {
          router.push('/payment-pending');
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento pendente:', error);
      }
      
      // Redirecionar para dashboard específico baseado no tipo de usuário
      if (userProfile.userType === UserType.ADMIN) {
        router.push('/dashboard/admin');
        return;
      } else if (userProfile.userType === UserType.COACH) {
        router.push('/dashboard/coach');
        return;
      } else if (userProfile.userType === UserType.FITNESS_STUDENT) {
        // Verificar assinatura para alunos
        try {
          const subscription = await enduranceApi.getActiveSubscription();
          if (!subscription?.isActive) {
            // Sem assinatura ativa - redirecionar para onboarding
            router.push('/onboarding/quiz-plano');
            return;
          }
          // Com assinatura ativa - redirecionar para dashboard do aluno
          router.push('/dashboard/aluno');
          return;
        } catch {
          // Erro ao verificar assinatura - redirecionar para onboarding
          router.push('/onboarding/quiz-plano');
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      toast.error('Erro ao carregar perfil do usuário');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await enduranceApi.logout();
      toast.success('Logout realizado com sucesso');
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: theme.palette.background.default,
        }}
      >
        <CircularProgress color="primary" size={60} />
        <Typography variant="h6" sx={{ mt: 3, color: 'text.primary' }}>
          Carregando Endurance On...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <DashboardLayout user={user} onLogout={handleLogout}>
        <PageHeader 
          title="Visão Geral" 
          description={`Bem-vindo de volta, ${user.name}! Aqui está um resumo da sua atividade.`} 
        />
        <DashboardOverview user={user} />
      </DashboardLayout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 8,
            boxShadow: theme.shadows[4],
          },
          success: {
            iconTheme: {
              primary: theme.palette.success.main,
              secondary: theme.palette.success.contrastText,
            },
          },
          error: {
            iconTheme: {
              primary: theme.palette.error.main,
              secondary: theme.palette.error.contrastText,
            },
          },
        }}
      />
    </>
  );
} 