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
  Badge,
} from '@mui/material';
import {
  Person as PersonIcon,
  Star as StarIcon,
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
  Event as EventIcon,
  Assessment as TestIcon,
  School as CoachIcon,
  CalendarToday as CalendarIcon,
  EmojiEvents as TrophyIcon,
  Speed as PerformanceIcon,
  Notifications as NotificationIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  FitnessCenter as TrainingIcon,
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
  
  // Estados para dados do dashboard
  const [subscription, setSubscription] = useState<any>(null);
  const [userTests, setUserTests] = useState<any>(null);
  const [userExams, setUserExams] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [userCoach, setUserCoach] = useState<any>(null);

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

      // Carregar todos os dados relevantes para o aluno
      const [
        activeSubscription,
        userTestsData,
        userExamsData,
        userProfileData,
        walletBalanceData,
        eventsData
      ] = await Promise.all([
        enduranceApi.getActiveSubscription().catch(err => {
          console.warn('Erro ao carregar assinatura:', err);
          return null;
        }),
        enduranceApi.getUserTests().catch(err => {
          console.warn('Erro ao carregar testes do usuário:', err);
          return { data: [], summary: { total: 0, completed: 0, pending: 0 } };
        }),
        enduranceApi.getUserExams(auth.user.id).catch(err => {
          console.warn('Erro ao carregar provas do usuário:', err);
          return { data: [], pagination: { total: 0 } };
        }),
        enduranceApi.getProfile().catch(err => {
          console.warn('Erro ao carregar perfil do usuário:', err);
          return auth.user;
        }),
        enduranceApi.getWalletBalance().catch(err => {
          console.warn('Erro ao carregar saldo da carteira:', err);
          return { balance: 0, currency: 'BRL' };
        }),
        enduranceApi.getExams({ status: 'ACTIVE', limit: 5 }).catch(err => {
          console.warn('Erro ao carregar eventos:', err);
          return { data: [] };
        })
      ]);

      // Buscar informações do treinador se a assinatura tiver coachId
      let coachData = null;
      if (activeSubscription?.coachId) {
        try {
          coachData = await enduranceApi.getCoach(activeSubscription.coachId);
        } catch (err) {
          console.warn('Erro ao carregar dados do treinador:', err);
        }
      }

      setSubscription(activeSubscription);
      setUserTests(userTestsData);
      setUserExams(userExamsData);
      setUserProfile(userProfileData);
      setWalletBalance(walletBalanceData);
      setUpcomingEvents(eventsData.data || []);
      setUserCoach(coachData);

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

  const getTestCompletionRate = () => {
    if (!userTests?.summary) return 0;
    const { total, completed } = userTests.summary;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getUpcomingExamsCount = () => {
    if (!userExams?.data) return 0;
    const now = new Date();
    return userExams.data.filter((exam: any) => 
      new Date(exam.examDate) > now && exam.status === 'REGISTERED'
    ).length;
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
            <Button 
              variant="outlined" 
              sx={{ ml: 2 }}
              onClick={() => router.push('/onboarding')}
            >
              Ver Planos
            </Button>
          </Alert>
        )}

        {/* Cards de Estatísticas Principais */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Plano Atual"
              value={subscription?.plan?.name || 'N/A'}
              subtitle="Seu plano de treinamento"
              icon={<PlanIcon />}
              color="primary"
              action={
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => router.push('/dashboard/aluno/meu-plano')}
                >
                  Ver Detalhes
                </Button>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Status da Assinatura"
              value={subscription?.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
              subtitle={subscription?.status === 'ACTIVE' ? 'Treinamento ativo' : 'Assinatura pausada'}
              icon={<CheckIcon />}
              color={subscription?.status === 'ACTIVE' ? 'success' : 'warning'}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Testes Realizados"
              value={`${userTests?.summary?.completed || 0} de ${userTests?.summary?.total || 0}`}
              subtitle={`Taxa de conclusão: ${getTestCompletionRate()}%`}
              icon={<TestIcon />}
              color="info"
              action={
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => router.push('/dashboard/aluno/testes')}
                >
                  Ver Testes
                </Button>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Provas Inscritas"
              value={getUpcomingExamsCount()}
              subtitle="Competições no calendário"
              icon={<EventIcon />}
              color="warning"
              action={
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => router.push('/dashboard/aluno/eventos')}
                >
                  Ver Eventos
                </Button>
              }
            />
          </Grid>
        </Grid>

        {/* Segunda Linha de Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Saldo da Carteira"
              value={formatCurrency(walletBalance?.balance || 0)}
              subtitle="Moedas disponíveis"
              icon={<CoinIcon />}
              color="success"
              action={
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => router.push('/dashboard/aluno/moedas')}
                >
                  Ver Histórico
                </Button>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Meu Treinador"
              value={subscription?.coach?.name || userCoach?.name || 'Não atribuído'}
              subtitle="Treinador responsável"
              icon={<CoachIcon />}
              color="secondary"
              action={
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => router.push('/dashboard/aluno/treinador')}
                >
                  Ver Perfil
                </Button>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Próximo Pagamento"
              value={subscription?.nextBillingDate ? formatDate(subscription.nextBillingDate) : 'N/A'}
              subtitle={subscription?.nextBillingDate ? 'Data do próximo débito' : 'Sem assinatura ativa'}
              icon={<PaymentIcon />}
              color="info"
              action={
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => router.push('/dashboard/aluno/pagamentos')}
                >
                  Ver Pagamentos
                </Button>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Progresso Geral"
              value={`${getTestCompletionRate()}%`}
              subtitle="Taxa de conclusão geral"
              icon={<PerformanceIcon />}
              color="primary"
              action={
                <Button 
                  size="small" 
                  variant="outlined"
                  onClick={() => router.push('/dashboard/aluno/testes')}
                >
                  Ver Detalhes
                </Button>
              }
            />
          </Grid>

        </Grid>

        {/* Seção de Ações Rápidas */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Ações Rápidas
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TestIcon />}
                  onClick={() => router.push('/dashboard/aluno/testes')}
                  sx={{ py: 2 }}
                >
                  Solicitar Teste
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EventIcon />}
                  onClick={() => router.push('/dashboard/aluno/eventos')}
                  sx={{ py: 2 }}
                >
                  Ver Eventos
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ChatIcon />}
                  onClick={() => router.push('/dashboard/aluno/treinador')}
                  sx={{ py: 2 }}
                >
                  Falar com Treinador
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => router.push('/dashboard/aluno/perfil')}
                  sx={{ py: 2 }}
                >
                  Editar Perfil
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Seção de Próximos Eventos */}
        {upcomingEvents.length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Próximos Eventos
              </Typography>
              <List>
                {upcomingEvents.slice(0, 3).map((event: any, index: number) => (
                  <ListItem key={event.id} divider={index < 2}>
                    <ListItemIcon>
                      <EventIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={event.name}
                      secondary={`${formatDate(event.examDate)} • ${event.location}`}
                    />
                    <Chip 
                      label={event.status} 
                      color={event.status === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="outlined"
                  onClick={() => router.push('/dashboard/aluno/eventos')}
                >
                  Ver Todos os Eventos
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        
      </Container>
    </DashboardLayout>
  );
} 