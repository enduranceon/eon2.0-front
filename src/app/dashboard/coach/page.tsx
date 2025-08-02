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
      // Redirecionar para dashboard específico baseado no tipo de usuário
      if (auth.user.userType === UserType.ADMIN) {
        router.push('/dashboard/admin');
      } else if (auth.user.userType === UserType.FITNESS_STUDENT) {
        router.push('/dashboard/aluno');
      } else {
        router.push('/login');
      }
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
      // Carregar dados do dashboard do coach usando os endpoints corretos
      const [
        coachProfile,
        coachStudents,
        coachExams,
        coachFinancialSummary,
        coachAnalytics
      ] = await Promise.all([
        enduranceApi.getCoachProfile().catch(err => {
          console.warn('Erro ao carregar perfil do coach:', err);
          return null;
        }),
        enduranceApi.getCoachStudents().catch(err => {
          console.warn('Erro ao carregar alunos do coach:', err);
          return { students: [], total: 0 };
        }),
        enduranceApi.getCoachExams().catch(err => {
          console.warn('Erro ao carregar provas do coach:', err);
          return { pagination: { total: 0 } };
        }),
        enduranceApi.getCoachFinancialSummary().catch(err => {
          console.warn('Erro ao carregar resumo financeiro do coach:', err);
          return { 
            totalEarnings: 0, 
            monthlyEarnings: 0, 
            yearlyEarnings: 0, 
            pendingPayments: 0,
            currentMonth: 0,
            currentYear: 0
          };
        }),
        enduranceApi.getCoachAnalytics().catch(err => {
          console.warn('Erro ao carregar analytics do coach:', err);
          return {
            totalStudents: 0,
            activeSubscriptions: 0,
            examParticipations: 0,
            testResults: 0,
            modalidadeStats: {},
            recentActivities: []
          };
        })
      ]);

      // Definir os dados do coach baseados na resposta da API
      const coachStats = {
        // Dados do perfil
        profile: coachProfile || {
          name: auth.user.name,
          email: auth.user.email,
          bio: "Treinador especializado",
          experience: "Experiência profissional",
          coachLevel: "PLENO",
          coachModalidades: [],
          coachPlans: []
        },
        
        // Dados dos alunos - usar dados reais da API
        totalStudents: coachStudents?.total || coachStudents?.pagination?.total || 0,
        activeStudents: coachStudents?.students?.filter(s => s.status === 'ACTIVE').length || 
                       coachStudents?.data?.filter(s => s.status === 'ACTIVE').length || 0,
        
        // Dados das provas
        totalExams: coachExams?.pagination?.total || 0,
        examParticipations: coachAnalytics?.examParticipations || 0,
        
        // Dados financeiros - usar getCoachFinancialSummary
        totalEarnings: coachFinancialSummary?.totalEarnings || 0,
        monthlyEarnings: coachFinancialSummary?.monthlyEarnings || 0,
        yearlyEarnings: coachFinancialSummary?.yearlyEarnings || 0,
        pendingPayments: coachFinancialSummary?.pendingPayments || 0,
        
        // Dados de analytics
        averageRating: 4.5, // Valor padrão até ter na API
        completedSessions: coachAnalytics?.testResults || 0,
        
        // Dados agregados
        recentActivities: coachAnalytics?.recentActivities || [],
        modalidadeStats: coachAnalytics?.modalidadeStats || {}
      };

      setCoachStats(coachStats);
      setEarnings({
        totalEarnings: coachFinancialSummary?.totalEarnings || 0,
        periodEarnings: coachFinancialSummary?.monthlyEarnings || 0,
        recentTransactions: [] // Será carregado separadamente se necessário
      });
      setStudents(coachStudents?.students || coachStudents?.data || []);
      setUpcomingSessions([]); // Será implementado quando houver endpoint específico
      setAnalyticsData(coachAnalytics);

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
                  Total de alunos vinculados
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
                  {formatCurrency(coachStats?.monthlyEarnings || 0)}
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
                  <EventsIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Provas Criadas</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {coachStats?.totalExams || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de provas cadastradas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TestIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Participações</Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {coachStats?.examParticipations || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de participações
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
                    <ListItemIcon><StudentsIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary={`${coachStats?.totalStudents || 0} alunos vinculados`}
                      secondary={`${coachStats?.activeStudents || 0} ativos`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><EventsIcon color="warning" /></ListItemIcon>
                    <ListItemText 
                      primary={`${coachStats?.totalExams || 0} provas cadastradas`}
                      secondary="Gerencie suas provas e eventos"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><EarningsIcon color="success" /></ListItemIcon>
                    <ListItemText 
                      primary={`Ganhos: ${formatCurrency(coachStats?.monthlyEarnings || 0)}`}
                      secondary={`Total: ${formatCurrency(coachStats?.totalEarnings || 0)} | Pendentes: ${coachStats?.pendingPayments || 0}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TestIcon color="info" /></ListItemIcon>
                    <ListItemText 
                      primary={`${coachStats?.examParticipations || 0} participações`}
                      secondary="Total de participações em provas"
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
                    {coachStats?.profile?.name?.charAt(0) || auth.user?.name?.charAt(0) || 'T'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{coachStats?.profile?.name || auth.user?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {coachStats?.profile?.coachLevel || 'Coach'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {coachStats?.profile?.experience || 'Experiência profissional'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" paragraph>
                  <strong>Bio:</strong> {coachStats?.profile?.bio || 'Treinador especializado'}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Modalidades:</strong> {coachStats?.profile?.coachModalidades?.length || 0} modalidades
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Planos:</strong> {coachStats?.profile?.coachPlans?.length || 0} planos disponíveis
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Total de Alunos:</strong> {coachStats?.totalStudents || 0}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Ganhos Totais:</strong> {formatCurrency(coachStats?.totalEarnings || 0)}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Ganhos Mensais:</strong> {formatCurrency(coachStats?.monthlyEarnings || 0)}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Ganhos Anuais:</strong> {formatCurrency(coachStats?.yearlyEarnings || 0)}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Pagamentos Pendentes:</strong> {coachStats?.pendingPayments || 0}
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  startIcon={<EditIcon />}
                  onClick={() => router.push('/dashboard/coach/perfil')}
                >
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
              Gerenciamento de Alunos ({students.length})
            </Typography>
            
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Aluno</TableCell>
                    <TableCell>Plano</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Modalidade</TableCell>
                    <TableCell>Início</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {student.user?.name?.charAt(0) || student.name?.charAt(0) || 'A'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {student.user?.name || student.name || 'Nome não disponível'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {student.user?.email || student.email || 'Email não disponível'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={student.plan?.name || student.planName || 'Sem plano'} 
                          color="primary" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                          color={student.status === 'ACTIVE' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.modalidade?.name || student.modalidadeName || 'Sem modalidade'}
                          color="secondary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {student.startDate ? new Date(student.startDate).toLocaleDateString('pt-BR') : 'Não definido'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="primary" title="Ver detalhes">
                          <ViewIcon />
                        </IconButton>
                        <IconButton size="small" title="Enviar mensagem">
                          <MessageIcon />
                        </IconButton>
                        <IconButton size="small" color="secondary" title="Editar status">
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Nenhum aluno encontrado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
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
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" gutterBottom>
                    {formatCurrency(earnings?.periodEarnings || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ganhos Mensais
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" gutterBottom>
                    {formatCurrency(earnings?.totalEarnings || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ganhos Totais
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" gutterBottom>
                    {formatCurrency(coachStats?.yearlyEarnings || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ganhos Anuais
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main" gutterBottom>
                    {coachStats?.pendingPayments || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pagamentos Pendentes
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Informações:</strong> Os dados financeiros são atualizados em tempo real. 
                Para visualizar transações detalhadas, acesse a seção financeira completa.
              </Typography>
            </Alert>
          </TabPanel>

          {/* Tab Panel - Eventos */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Gerenciamento de Provas
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Gerencie suas provas, inscrições e resultados
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={() => {
                  // Implementar modal de criação de prova
          
                }}
                sx={{ mr: 2 }}
              >
                Criar Nova Prova
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ViewIcon />}
                onClick={() => {
                  // Implementar navegação para lista completa
          
                }}
              >
                Ver Todas as Provas
              </Button>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" gutterBottom>
                    {coachStats?.totalExams || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Provas Cadastradas
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" gutterBottom>
                    {coachStats?.examParticipations || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Participações
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Próximas funcionalidades:</strong> Criação de provas, gerenciamento de inscrições, 
                confirmação de presença e adição de resultados. Use os botões acima para começar.
              </Typography>
            </Alert>
          </TabPanel>

          {/* Tab Panel - Analytics */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Analytics e Performance
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Estatísticas por Modalidade
                  </Typography>
                  {coachStats?.modalidadeStats && Object.keys(coachStats.modalidadeStats).length > 0 ? (
                    <Box sx={{ mt: 2 }}>
                      {Object.entries(coachStats.modalidadeStats).map(([modalidade, stats]) => (
                        <Box key={modalidade} sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {modalidade}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {(stats as any)?.students || 0} alunos • {(stats as any)?.activeSubscriptions || 0} assinaturas ativas
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma modalidade encontrada
                    </Typography>
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
                      {coachStats?.activeStudents || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alunos Ativos
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h4" color="warning.main">
                      {coachStats?.totalExams || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Provas Cadastradas
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h4" color="info.main">
                      {coachStats?.examParticipations || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total de Participações
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {coachStats?.recentActivities && coachStats.recentActivities.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Atividades Recentes
                    </Typography>
                    <List>
                      {coachStats.recentActivities.map((activity, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckIcon color="success" />
                          </ListItemIcon>
                          <ListItemText
                            primary={`${activity.type === 'new_student' ? 'Novo aluno' : 'Atividade'}: ${activity.student}`}
                            secondary={`${activity.plan} - ${new Date(activity.date).toLocaleDateString('pt-BR')}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        </Card>
      </Container>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
