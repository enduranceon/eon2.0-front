'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import DashboardLayout from '../../components/Dashboard/DashboardLayout';
import DashboardOverview from '../../components/Dashboard/DashboardOverview';
import { enduranceTheme } from '../../theme/enduranceTheme';
import { User, UserType } from '../../types/api';
import { enduranceApi } from '../../services/enduranceApi';

export default function DashboardPage() {
  const router = useRouter();
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
      <ThemeProvider theme={enduranceTheme}>
        <CssBaseline />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: enduranceTheme.colors.gradient.primary 
        }}>
          <div style={{ 
            color: 'white', 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '20px' }}>🏃‍♂️</div>
            Carregando Endurance On...
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ThemeProvider theme={enduranceTheme}>
      <CssBaseline />
      <DashboardLayout user={user} onLogout={handleLogout}>
        <DashboardOverview user={user} />
      </DashboardLayout>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: enduranceTheme.colors.background.paper,
            color: enduranceTheme.colors.text.primary,
            border: `1px solid ${enduranceTheme.colors.surface.tertiary}`,
            borderRadius: '12px',
            boxShadow: enduranceTheme.colors.shadow.primary,
          },
          success: {
            iconTheme: {
              primary: enduranceTheme.palette.success.main,
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: enduranceTheme.palette.error.main,
              secondary: 'white',
            },
          },
        }}
      />
    </ThemeProvider>
  );
} 