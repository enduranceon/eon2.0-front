'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Rating,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  School as StudentsIcon,
  AttachMoney as EarningsIcon,
  Star as RatingIcon,
  TrendingUp as GrowthIcon,
  Message as MessageIcon,
  Schedule as ScheduleIcon,
  Assessment as AnalyticsIcon,
  EmojiEvents as EventsIcon,
  Quiz as TestIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  NotificationImportant as AlertIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { UserType } from '../../../types/api';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { messageService } from '../../../services/messageService';
import { scheduleService } from '../../../services/scheduleService';
import { analyticsService } from '../../../services/analyticsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function CoachDashboard() {
  const auth = useAuth();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para dados da API
  const [coachStats, setCoachStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Verificar se é coach
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      router.push('/login');
      return;
    }

    if (auth.user.userType !== UserType.COACH) {
      router.push('/dashboard');
      return;
    }

    // Carregar dados
    loadDashboardData();
  }, [auth.isAuthenticated, auth.user, router]);

  const loadDashboardData = async () => {
    if (!auth.user) return;

    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];

      const earningsPromise = enduranceApi.getCoachEarnings(auth.user.id, startDate, endDate);
      const statsPromise = enduranceApi.getDashboardStats();

      const [earningsData, statsData] = await Promise.all([
        earningsPromise.catch(err => {
          // Se a rota de ganhos não existir, não bloquear o dashboard
          if (err.response && err.response.status === 404) {
            console.warn('Rota de ganhos não encontrada (404), usando dados mock.');
            return { monthly: [], total: 0, average: 0 }; // Retorna um valor padrão
          }
          throw err; // Lança outros erros
        }),
        statsPromise.catch(err => {
          if (err.response && err.response.status === 404) {
            console.warn('Rota de estatísticas não encontrada (404), usando dados mock.');
            return { clients: 0, activePlans: 0, conversionRate: 0, upcomingTests: 0 }; // Retorna valor padrão
          }
          throw err;
        })
      ]);

      setEarnings(earningsData);
      setCoachStats(statsData);

      // (Manter o restante da lógica ou remover se os mocks não forem mais necessários)
      setStudents([]);
      setUpcomingSessions([]);
      setAnalyticsData(statsData);

      // Carregar conversas usando service existente
      const userConversations = messageService.getConversations(auth.user.id);
      setConversations(userConversations);

    } catch (err) {
      console.error('Erro ao carregar dados do coach:', err);
      setError('Falha ao carregar os dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!auth.user) {
    return null;
  }

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={['COACH']}>
        <DashboardLayout user={auth.user} onLogout={handleLogout}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <CircularProgress size={60} />
            </Box>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedUserTypes={['COACH']}>
        <DashboardLayout user={auth.user} onLogout={handleLogout}>
          <Container maxWidth="xl">
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
            <Button variant="contained" onClick={loadDashboardData}>
              Tentar Novamente
            </Button>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['COACH']}>
      <DashboardLayout user={auth.user} onLogout={handleLogout}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Painel do Treinador
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Bem-vindo(a) {auth.user?.name}! Gerencie seus alunos, acompanhe ganhos e monitore seu desempenho.
          </Typography>
        </Box>

        {/* Stats Cards - Resumo */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StudentsIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Alunos Ativos</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {coachStats?.activeStudents || 0}/{coachStats?.totalStudents || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de alunos registrados
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EarningsIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Ganhos do Mês</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {formatCurrency(earnings?.monthlyTotal || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Receita mensal atual
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <RatingIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Avaliação</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {coachStats?.averageRating || 0}
                </Typography>
                <Rating value={coachStats?.averageRating || 0} precision={0.1} readOnly size="small" />
                <Typography variant="body2" color="text.secondary">
                  ({coachStats?.totalReviews || 0} avaliações)
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TestIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Sessões</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {coachStats?.completedSessions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sessões realizadas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Alertas e Ações Rápidas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ações Necessárias
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><AlertIcon color="warning" /></ListItemIcon>
                    <ListItemText 
                      primary={`${upcomingSessions.length} sessões agendadas esta semana`}
                      secondary="Verifique sua agenda"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><MessageIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary={`${conversations.filter(c => c.unreadCount > 0).length} mensagens não lidas`}
                      secondary="Responda seus alunos"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><EarningsIcon color="success" /></ListItemIcon>
                    <ListItemText 
                      primary={`Faturamento: ${formatCurrency(earnings?.monthlyTotal || 0)}`}
                      secondary="Meta mensal em andamento"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Perfil do Treinador
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, mr: 2, bgcolor: 'primary.main' }}>
                    {auth.user?.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{auth.user?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Nível {auth.user?.coachLevel || 'Coach'}
                    </Typography>
                    <Rating value={coachStats?.averageRating || 0} precision={0.1} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary">
                      ({coachStats?.averageRating || 0})
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" paragraph>
                  <strong>Experiência:</strong> {coachStats?.experience || 'Não informado'}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Total de Alunos:</strong> {coachStats?.totalStudents || 0}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Sessões Realizadas:</strong> {coachStats?.completedSessions || 0}
                </Typography>
                <Button variant="outlined" fullWidth startIcon={<EditIcon />}>
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs de Navegação */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              <Tab icon={<StudentsIcon />} label="Meus Alunos" />
              <Tab icon={<EarningsIcon />} label="Ganhos" />
              <Tab icon={<EventsIcon />} label="Eventos" />
              <Tab icon={<AnalyticsIcon />} label="Analytics" />
            </Tabs>
          </Box>

          {/* Tab Panel - Meus Alunos */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Gerenciamento de Alunos
            </Typography>
            
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Aluno</TableCell>
                    <TableCell>Plano</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Última Sessão</TableCell>
                    <TableCell>Progresso</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {student.name.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{student.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={student.subscription?.plan?.name || 'Sem plano'} 
                          color="primary" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.isActive ? 'Ativo' : 'Inativo'}
                          color={student.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {student.lastSession ? new Date(student.lastSession).toLocaleDateString('pt-BR') : 'Nunca'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={student.progress || 0} 
                            sx={{ width: 60, mr: 1 }} 
                          />
                          <Typography variant="caption">{student.progress || 0}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary">
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small">
                          <MessageIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Tab Panel - Ganhos */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Relatório de Ganhos
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" gutterBottom>
                    {formatCurrency(earnings?.monthlyTotal || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ganhos Mensais
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" gutterBottom>
                    {formatCurrency(earnings?.annualTotal || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ganhos Anuais
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" gutterBottom>
                    {formatCurrency(earnings?.pendingPayments || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pagamentos Pendentes
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {earnings?.breakdown && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Evolução Mensal
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={earnings.breakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Ganhos']} />
                    <Bar dataKey="amount" fill="#2e7d32" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            )}
          </TabPanel>

          {/* Tab Panel - Eventos */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Eventos e Competições
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Gerencie a participação dos seus alunos em eventos
            </Typography>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Funcionalidade de eventos em desenvolvimento. Em breve você poderá inscrever seus alunos em competições.
            </Alert>
          </TabPanel>

          {/* Tab Panel - Analytics */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Analytics e Performance
            </Typography>
            
            {analyticsData && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: 400 }}>
                    <Typography variant="h6" gutterBottom>
                      Performance Mensal
                    </Typography>
                    {analyticsData.sessions && (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.sessions}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="sessions" stroke="#1976d2" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: 400 }}>
                    <Typography variant="h6" gutterBottom>
                      Métricas Principais
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h4" color="primary.main">
                        {coachStats?.totalStudents || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total de Alunos
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h4" color="success.main">
                        {coachStats?.completedSessions || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Sessões Completadas
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h4" color="warning.main">
                        {coachStats?.averageRating || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avaliação Média
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </TabPanel>
        </Card>
      </Container>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
