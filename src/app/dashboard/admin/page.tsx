'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  InputAdornment,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Group as StudentsIcon,
  EmojiEvents as CoachIcon,
  AdminPanelSettings as AdminIcon,
  Subscriptions as PlansIcon,
  DirectionsRun as ModalitiesIcon,
  EmojiEvents as TrophyIcon,
  Quiz as TestIcon,
  Percent as MarginIcon,
  AccountBalance as FinanceIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import StatsCard from '../../../components/Dashboard/StatsCard';
import { colors } from '../../../theme/enduranceTheme';
import { analyticsService } from '../../../services/analyticsService';
import {
  KPICard,
  LineChartComponent,
  PieChartComponent,
  BarChartComponent,
  InsightsWidget,
  PerformanceTable,
} from '../../../components/Analytics/ChartComponents';
import { enduranceApi } from '../../../services/enduranceApi';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { DashboardStats } from '../../../types/api';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminDashboard() {
  const auth = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [revenueReport, setRevenueReport] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [modalidades, setModalidades] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState({
    students: '',
    coaches: '',
    admins: '',
  });

  // Carregar dados do dashboard
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carrega dados em paralelo
      const [
        dashboardStatsData,
        revenueReportData,
        usersData,
        coachesData,
        plansData,
        modalidadesData
      ] = await Promise.all([
        enduranceApi.getDashboardStats(),
        enduranceApi.getRevenueReport('monthly'),
        enduranceApi.getUsers({ limit: 100 }),
        enduranceApi.getCoaches({ limit: 50 }),
        enduranceApi.getPlans(),
        enduranceApi.getModalidades()
      ]);

      setDashboardStats(dashboardStatsData);
      setRevenueReport(revenueReportData);
      setUsers(usersData.data);
      setCoaches(coachesData.data);
      setPlans(Array.isArray(plansData) ? plansData : plansData?.data || []);
      setModalidades(Array.isArray(modalidadesData) ? modalidadesData : modalidadesData?.data || []);

      // Processar dados para analytics
      const analyticsData = {
        metrics: {
          totalUsers: dashboardStatsData.totalUsers,
          activeSubscriptions: dashboardStatsData.activeSubscriptions,
          monthlyRevenue: dashboardStatsData.monthlyRevenue,
          totalRevenue: dashboardStatsData.totalRevenue,
        },
        revenue: revenueReportData,
        planDistribution: revenueReportData?.planRevenue?.map((plan: any, index: number) => ({
          name: plan.planName,
          value: plan.count,
          color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'][index % 4],
        })) || [],
      };

      setAnalyticsData(analyticsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do dashboard. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSearchChange = (category: string, value: string) => {
    setSearchTerms(prev => ({ ...prev, [category]: value }));
  };

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={['ADMIN']}>
        <DashboardLayout user={auth.user!} onLogout={auth.logout}>
          <Container maxWidth="xl" sx={{ py: 4 }}>
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
      <ProtectedRoute allowedUserTypes={['ADMIN']}>
        <DashboardLayout user={auth.user!} onLogout={auth.logout}>
          <Container maxWidth="xl" sx={{ py: 4 }}>
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
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={auth.user!} onLogout={auth.logout}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Painel Administrativo
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bem-vindo(a) {auth.user?.name}! Gerencie toda a plataforma Endurance On.
            </Typography>
          </Box>

          {/* Stats Cards - Resumo */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Total de Usuários"
                value={dashboardStats?.totalUsers.toLocaleString() || '0'}
                subtitle="+12% este mês"
                icon={<StudentsIcon />}
                gradient
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Receita Mensal"
                value={formatCurrency(dashboardStats?.monthlyRevenue || 0)}
                subtitle="+8.5% vs mês anterior"
                icon={<FinanceIcon />}
                gradient
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Coaches Ativos"
                value={dashboardStats?.activeCoaches?.toString() || '0'}
                subtitle={`${coaches.length} total`}
                icon={<CoachIcon />}
                gradient
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Assinaturas Ativas"
                value={dashboardStats?.activeSubscriptions?.toString() || '0'}
                subtitle={`${plans.length} planos disponíveis`}
                icon={<PlansIcon />}
                gradient
              />
            </Grid>
          </Grid>

          {/* Resumo Executivo */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumo Executivo da Plataforma
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Métricas Principais
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><TrendingUpIcon color="success" /></ListItemIcon>
                      <ListItemText 
                        primary={`Receita mensal: ${formatCurrency(dashboardStats?.monthlyRevenue || 0)}`}
                        secondary="Acompanhe o crescimento da plataforma"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><StudentsIcon color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary={`${dashboardStats?.totalUsers || 0} usuários ativos na plataforma`}
                        secondary={`${dashboardStats?.activeSubscriptions || 0} assinaturas ativas`}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Status da Plataforma
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary={`${dashboardStats?.pendingPayments || 0} pagamentos pendentes`}
                        secondary="Acompanhe os pagamentos em processamento"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary={`${coaches.length} treinadores cadastrados`}
                        secondary={`${dashboardStats?.activeCoaches || 0} ativos no momento`}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabs de Navegação */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                variant="scrollable"
                scrollButtons="auto"
                aria-label="admin dashboard tabs"
              >
                <Tab icon={<StudentsIcon />} label="Alunos" />
                <Tab icon={<CoachIcon />} label="Treinadores" />
                <Tab icon={<AdminIcon />} label="Administradores" />
                <Tab icon={<PlansIcon />} label="Planos" />
                <Tab icon={<ModalitiesIcon />} label="Modalidades" />
                <Tab icon={<TrophyIcon />} label="Análises" />
                <Tab icon={<FinanceIcon />} label="Financeiro" />
                <Tab icon={<SettingsIcon />} label="Configurações" />
              </Tabs>
            </Box>

            {/* Tab Panel - Gerenciamento de Alunos */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Gerenciamento de Alunos</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Buscar alunos..."
                    value={searchTerms.students}
                    onChange={(e) => handleSearchChange('students', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Novo Aluno
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Data de Cadastro</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Plano</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users
                      .filter(user => user.userType === 'FITNESS_STUDENT')
                      .filter(user => 
                        !searchTerms.students || 
                        user.name.toLowerCase().includes(searchTerms.students.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchTerms.students.toLowerCase())
                      )
                      .map((student) => (
                        <TableRow key={student.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {student.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2">{student.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            {new Date(student.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={student.isActive ? 'Ativo' : 'Inativo'}
                              color={student.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {student.subscription?.plan?.name || 'Sem plano'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Tab Panel - Gerenciamento de Treinadores */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Gerenciamento de Treinadores</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Buscar treinadores..."
                    value={searchTerms.coaches}
                    onChange={(e) => handleSearchChange('coaches', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Novo Treinador
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Nível</TableCell>
                      <TableCell>Subconta</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {coaches
                      .filter(coach => 
                        !searchTerms.coaches || 
                        coach.name.toLowerCase().includes(searchTerms.coaches.toLowerCase()) ||
                        coach.email.toLowerCase().includes(searchTerms.coaches.toLowerCase())
                      )
                      .map((coach) => (
                        <TableRow key={coach.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                {coach.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2">{coach.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{coach.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={coach.coachLevel || 'N/A'}
                              color="primary"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={coach.walletId ? 'Ativa' : 'Inativa'}
                              color={coach.walletId ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={coach.isActive ? 'Ativo' : 'Inativo'}
                              color={coach.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* Tab Panel - Planos */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Gerenciamento de Planos</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Novo Plano
                </Button>
              </Box>

              <Grid container spacing={3}>
                {plans.map((plan) => (
                  <Grid item xs={12} md={6} lg={4} key={plan.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {plan.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {plan.description}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Preços:
                          </Typography>
                          <Typography variant="body2">
                            Mensal: {formatCurrency(plan.prices.monthly)}
                          </Typography>
                          <Typography variant="body2">
                            Anual: {formatCurrency(plan.prices.annual)}
                          </Typography>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                          <Chip
                            label={plan.isActive ? 'Ativo' : 'Inativo'}
                            color={plan.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                        <Button size="small" startIcon={<EditIcon />}>
                          Editar
                        </Button>
                        <Button size="small" color="error" startIcon={<DeleteIcon />}>
                          Excluir
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            {/* Tab Panel - Modalidades */}
            <TabPanel value={tabValue} index={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Gerenciamento de Modalidades</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Nova Modalidade
                </Button>
              </Box>

              <Grid container spacing={3}>
                {modalidades.map((modalidade) => (
                  <Grid item xs={12} sm={6} md={4} key={modalidade.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {modalidade.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {modalidade.description}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            label={modalidade.isActive ? 'Ativa' : 'Inativa'}
                            color={modalidade.isActive ? 'success' : 'default'}
                            size="small"
                          />
                          <Box>
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            {/* Tab Panel - Análises */}
            <TabPanel value={tabValue} index={5}>
              <Typography variant="h6" gutterBottom>
                Análises e Relatórios
              </Typography>
              
              {analyticsData && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>
                        Distribuição de Planos
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analyticsData.planDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsData.planDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: 400 }}>
                      <Typography variant="h6" gutterBottom>
                        Métricas Principais
                      </Typography>
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h4" color="primary.main">
                          {formatCurrency(analyticsData.metrics.monthlyRevenue)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Receita Mensal
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h4" color="success.main">
                          {analyticsData.metrics.totalUsers}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total de Usuários
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h4" color="warning.main">
                          {analyticsData.metrics.activeSubscriptions}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Assinaturas Ativas
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </TabPanel>

            {/* Tab Panel - Financeiro */}
            <TabPanel value={tabValue} index={6}>
              <Typography variant="h6" gutterBottom>
                Relatórios Financeiros
              </Typography>
              
              {dashboardStats && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main">
                        {formatCurrency(dashboardStats.monthlyRevenue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Receita Mensal
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {formatCurrency(dashboardStats.totalRevenue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Receita Total
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {dashboardStats.pendingPayments}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pagamentos Pendentes
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </TabPanel>

            {/* Tab Panel - Configurações */}
            <TabPanel value={tabValue} index={7}>
              <Typography variant="h6" gutterBottom>
                Configurações da Plataforma
              </Typography>
              <Alert severity="info">
                Funcionalidades de configuração em desenvolvimento.
              </Alert>
            </TabPanel>
          </Card>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 