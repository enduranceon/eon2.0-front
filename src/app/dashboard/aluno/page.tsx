'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  LinearProgress,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Person as PersonIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Payment as PaymentIcon,
  AccountBalance as CoinIcon,
  Subscriptions as PlanIcon,
  CreditCard as CardIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  DirectionsRun as RunIcon,
  ChatBubble as ChatIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import StatsCard from '../../../components/Dashboard/StatsCard';
import { enduranceApi } from '../../../services/enduranceApi';


interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function StudentDashboard() {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Redirecionar para login se usuário não estiver autenticado
  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.push('/login');
    }
  }, [auth.isLoading, auth.user, router]);

  useEffect(() => {
    loadDashboardData();
  }, [auth.user]);

  const loadDashboardData = async () => {
    if (!auth.user) return;

    try {
      setLoading(true);
      setError(null);

      const [
        activeSubscription,
      ] = await Promise.all([
        enduranceApi.getActiveSubscription(),
      ]);

      // Dados básicos para o dashboard do aluno (não precisamos dos stats de admin)
      const studentStats = {
        tests: {
          completed: 0,
          total: 0,
          completionRate: 0
        },
        events: {
          upcoming: 0
        }
      };

      setStats(studentStats);
      setSubscription(activeSubscription);

    } catch (err) {
      console.error('Erro ao carregar dados do aluno:', err);
      if (err instanceof Error && (err as any).response?.status !== 404) {
        setError('Erro ao carregar dados do dashboard. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Verificação simples de autenticação (substitui ProtectedRoute)
  if (auth.isLoading || !auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (auth.user.userType !== 'FITNESS_STUDENT') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Acesso não autorizado</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <DashboardLayout user={auth.user!} onLogout={auth.logout}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={auth.user!} onLogout={auth.logout}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={loadDashboardData}>
            Tentar Novamente
          </Button>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={auth.user!} onLogout={auth.logout}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Meu Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bem-vindo(a) {auth.user?.name}! Aqui você encontra tudo sobre seu treinamento, provas, testes e muito mais.
          </Typography>
        </Box>

        

        {/* Status da Assinatura */}
        {!subscription && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Você não possui uma assinatura ativa. Escolha um plano para começar seu treinamento.
            <Button variant="outlined" sx={{ ml: 2 }}>
              Ver Planos
            </Button>
          </Alert>
        )}

        {/* Cards de Estatísticas - Resumo */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Plano Atual"
              value={subscription?.plan?.name || 'N/A'}
              subtitle="Seu plano de treinamento"
              icon={<PlanIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Status"
              value={subscription?.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
              subtitle="Situação da conta"
              icon={<CheckIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Testes Realizados"
              value={`${stats?.tests?.completed || 0} de ${stats?.tests?.total || 0}`}
              subtitle={`Conclusão: ${stats?.tests?.completionRate || 0}%`}
              icon={<TrendingUpIcon />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Provas Futuras"
              value={stats?.events?.upcoming || 0}
              subtitle="Competições no calendário"
              icon={<StarIcon />}
              color="warning"
            />
          </Grid>
        </Grid>

        {/* (Seções detalhadas migradas para páginas específicas) */}
      </Container>
    </DashboardLayout>
  );
} 