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
        enduranceApi.getActiveSubscription().catch(() => null),
        enduranceApi.getUserTests().catch(() => ({ data: [], summary: { total: 0, completed: 0, pending: 0 } })),
        enduranceApi.getUserExams(auth.user.id, { page: 1, limit: 50 }).catch(() => ({ data: [], pagination: { total: 0 } })),
        Promise.resolve(auth.user),
        enduranceApi.getWalletBalance().catch(() => ({ balance: 0, currency: 'BRL' })),
        enduranceApi.getExams({ status: 'ACTIVE', limit: 5 }).catch(() => ({ data: [] }))
      ]);

      // Buscar informações do treinador se a assinatura tiver coachId
      let coachData = null;
      if (activeSubscription?.coachId) {
        try {
          coachData = await enduranceApi.getCoach(activeSubscription.coachId);
        } catch (err) {
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getEventStatus = (event: any) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Realizada', color: 'default' as const };
    if (diffDays === 0) return { label: 'Hoje', color: 'warning' as const };
    if (diffDays <= 7) return { label: 'Esta semana', color: 'error' as const };
    if (diffDays <= 30) return { label: 'Este mês', color: 'info' as const };
    return { label: 'Futuro', color: 'success' as const };
  };

  const getDistanceInfo = (event: any) => {
    if (event.distances && event.distances.length > 0) {
      const distances = event.distances.map((d: any) => `${d.distance}${d.unit}`).join(', ');
      return distances;
    }
    return 'Distância não informada';
  };

  const getUserRegistrationStatus = (event: any) => {
    if (!event.registrations || event.registrations.length === 0) return null;
    
    const userRegistration = event.registrations.find((reg: any) => 
      reg.userId === auth.user?.id
    );
    
    if (!userRegistration) return null;
    
    if (userRegistration.attended) {
      return { 
        label: 'Participou', 
        color: 'success' as const,
        result: userRegistration.result 
      };
    }
    
    return { 
      label: 'Inscrito', 
      color: 'primary' as const 
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getTestCounts = () => {
    const summary = userTests?.summary || {};
    const total = summary.total ?? userTests?.pagination?.total ?? (Array.isArray(userTests?.data) ? userTests.data.length : 0);
    // completed pode vir como resultsCount (novo), results (API client), ou completed (legado)
    let completed = summary.resultsCount ?? summary.results ?? summary.completed;
    if (completed === undefined && Array.isArray(userTests?.data)) {
      // fallback: contar itens do tipo RESULT
      completed = userTests.data.filter((t: any) => t?.type === 'RESULT').length;
    }
    completed = typeof completed === 'number' ? completed : 0;
    return { total: typeof total === 'number' ? total : 0, completed };
  };

  const getTestCompletionRate = () => {
    const { total, completed } = getTestCounts();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getUpcomingExamsCount = () => {
    if (!Array.isArray(userExams?.data)) return 0;
    const now = new Date();
    return userExams.data.filter((exam: any) => {
      const dateValue = exam?.date || exam?.examDate;
      const d = dateValue ? new Date(dateValue) : null;
      return d instanceof Date && !isNaN(d.getTime()) && d > now;
    }).length;
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
      <DashboardLayout user={auth.user!} onLogout={auth.logout} overdueInfo={auth.overdueInfo}>
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
      <DashboardLayout user={auth.user!} onLogout={auth.logout} overdueInfo={auth.overdueInfo}>
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
    <DashboardLayout user={auth.user!} onLogout={auth.logout} overdueInfo={auth.overdueInfo}>
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
        {auth.subscriptionStatus !== 'ACTIVE' && !subscription && (
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
              value={`${getTestCounts().completed} de ${getTestCounts().total}`}
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
              value={(subscription?.nextPaymentDate || subscription?.nextBillingDate) ? formatDate(subscription.nextPaymentDate || subscription.nextBillingDate) : 'N/A'}
              subtitle={(subscription?.status === 'ACTIVE') ? 'Assinatura ativa' : (subscription ? 'Assinatura inativa' : 'Sem assinatura ativa')}
              icon={<PaymentIcon />}
              color={(subscription?.status === 'ACTIVE') ? 'info' : 'warning'}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Próximos Eventos
                </Typography>
                <Button 
                  variant="outlined"
                  size="small"
                  onClick={() => router.push('/dashboard/aluno/eventos')}
                >
                  Ver Todos
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                {upcomingEvents.slice(0, 3).map((event: any, index: number) => {
                  const dateTime = formatDateTime(event.date);
                  const eventStatus = getEventStatus(event);
                  const userStatus = getUserRegistrationStatus(event);
                  const distanceInfo = getDistanceInfo(event);
                  
                  return (
                    <Grid item xs={12} md={4} key={event.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          border: '1px solid',
                          borderColor: eventStatus.color === 'error' ? 'error.main' : 
                                     eventStatus.color === 'warning' ? 'warning.main' : 'divider',
                          '&:hover': {
                            boxShadow: 2,
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          {/* Header com status e modalidade */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Chip 
                              label={eventStatus.label}
                              color={eventStatus.color}
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                            <Chip 
                              label={event.modalidade?.name || 'N/A'}
                              variant="outlined"
                              size="small"
                              color="primary"
                            />
                          </Box>

                          {/* Nome do evento */}
                          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, lineHeight: 1.2 }}>
                            {event.name}
                          </Typography>

                          {/* Data e hora */}
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {dateTime.full}
                            </Typography>
                          </Box>

                          {/* Localização */}
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <EventIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {event.location}
                            </Typography>
                          </Box>

                          {/* Distância */}
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <RunIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              {distanceInfo}
                            </Typography>
                          </Box>

                          {/* Status do usuário */}
                          {userStatus && (
                            <Box sx={{ mt: 'auto', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                  Seu status:
                                </Typography>
                                <Chip 
                                  label={userStatus.label}
                                  color={userStatus.color}
                                  size="small"
                                  sx={{ fontWeight: 'bold' }}
                                />
                              </Box>
                              {userStatus.result && (
                                <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block' }}>
                                  Resultado: {userStatus.result}
                                </Typography>
                              )}
                            </Box>
                          )}

                          {/* Descrição */}
                          {event.description && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.4,
                                mt: 1
                              }}
                            >
                              {event.description}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        )}

        
      </Container>
    </DashboardLayout>
  );
} 