'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  useTheme,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  DirectionsRun as RunIcon,
  Sports as SportsIcon,
  Payment as PaymentIcon,
  Analytics as AnalyticsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import StatsCard from './StatsCard';
import { DashboardStats, User, UserType, PaymentStatus, RevenueReport, PerformanceMetrics } from '../../types/api';
import { enduranceApi } from '../../services/enduranceApi';

interface DashboardOverviewProps {
  user: User;
}

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

export default function DashboardOverview({ user }: DashboardOverviewProps) {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Função auxiliar para criar dados mock
      const getMockDashboardStats = () => ({
        totalUsers: 1247,
        activeSubscriptions: 892,
        monthlyRevenue: 48750.50,
        activeCoaches: 23,
        totalRevenue: 125000.00,
        conversionRate: 15.2,
        averageTicket: 129.90
      });

      const getMockRevenueReport = () => ({
        period: 'monthly',
        totalRevenue: 48750.50,
        planRevenue: [
          { planName: 'Essencial', revenue: 18500.00, count: 245 },
          { planName: 'Premium', revenue: 30250.50, count: 128 }
        ],
        paymentMethodRevenue: [
          { method: 'Cartão de Crédito', revenue: 35000.00, count: 280 },
          { method: 'PIX', revenue: 13750.50, count: 93 }
        ],
        monthlyData: [
          { month: 'Jan', revenue: 42000 },
          { month: 'Fev', revenue: 45000 },
          { month: 'Mar', revenue: 48750 }
        ]
      });

      const getMockPerformanceMetrics = () => ({
        monthlyGrowthRate: 8.5,
        activeUserRate: 78.2,
        conversionRate: 15.2,
        retentionRate: 85.6,
        averageSessionDuration: 45.2,
        customerSatisfaction: 4.6
      });

      // Verificar se o usuário é admin antes de fazer chamadas
      let dashboardStatsResponse, revenueReportResponse, performanceMetricsResponse;

      if (user.userType === UserType.ADMIN) {
        try {
          // Carrega dados em paralelo apenas para admin
          [dashboardStatsResponse, revenueReportResponse, performanceMetricsResponse] = await Promise.all([
            enduranceApi.getDashboardStats(),
            enduranceApi.getRevenueReport('monthly'),
            enduranceApi.getPerformanceMetrics()
          ]);
        } catch (apiError) {
          // Usar dados mock quando as rotas não existem
          dashboardStatsResponse = getMockDashboardStats();
          revenueReportResponse = getMockRevenueReport();
          performanceMetricsResponse = getMockPerformanceMetrics();
        }
      } else {
        // Para usuários não-admin, usar dados mock diretamente
        dashboardStatsResponse = getMockDashboardStats();
        revenueReportResponse = getMockRevenueReport();
        performanceMetricsResponse = getMockPerformanceMetrics();
      }

      setStats(dashboardStatsResponse);
      setRevenueReport(revenueReportResponse);
      setPerformanceMetrics(performanceMetricsResponse);
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getStatsForUserType = () => {
    if (!stats) return [];

    if (user.userType === UserType.ADMIN) {
      return [
        {
          title: 'Total de Usuários',
          value: stats.totalUsers,
          change: performanceMetrics?.monthlyGrowthRate || 0,
          changeLabel: 'vs mês anterior',
          icon: <PeopleIcon />,
          color: 'primary' as const,
        },
        {
          title: 'Assinaturas Ativas',
          value: stats.activeSubscriptions,
          change: performanceMetrics?.activeUserRate || 0,
          changeLabel: 'taxa de atividade',
          icon: <TrendingUpIcon />,
          color: 'success' as const,
        },
        {
          title: 'Receita Mensal',
          value: `R$ ${(stats.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          change: performanceMetrics?.conversionRate || 0,
          changeLabel: 'taxa de conversão',
          icon: <MoneyIcon />,
          color: 'warning' as const,
        },
        {
          title: 'Treinadores Ativos',
          value: stats.activeCoaches,
          change: 0,
          changeLabel: 'estável',
          icon: <SportsIcon />,
          color: 'secondary' as const,
        },
      ];
    }

    if (user.userType === UserType.COACH) {
      return [
        {
          title: 'Meus Clientes',
          value: stats.totalUsers, // Será específico do coach na API
          change: 4.2,
          changeLabel: 'novos este mês',
          icon: <PeopleIcon />,
          color: 'primary' as const,
        },
        {
          title: 'Ganhos Mensais',
          value: `R$ ${(stats.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          change: 12.1,
          changeLabel: 'vs mês anterior',
          icon: <MoneyIcon />,
          color: 'success' as const,
        },
        {
          title: 'Treinos Ativos',
          value: stats.activeSubscriptions,
          change: 2.1,
          changeLabel: 'programados',
          icon: <RunIcon />,
          color: 'warning' as const,
        },
        {
          title: 'Avaliações',
          value: 4.8,
          change: 0.2,
          changeLabel: 'média geral',
          icon: <AnalyticsIcon />,
          color: 'info' as const,
        },
      ];
    }

    // Para FITNESS_STUDENT
    return [
      {
        title: 'Meu Plano',
        value: 'Premium',
        change: 0,
        changeLabel: 'ativo',
        icon: <TrendingUpIcon />,
        color: 'primary' as const,
      },
      {
        title: 'Próximo Pagamento',
        value: 'R$ 129,90',
        change: 15,
        changeLabel: 'em 15 dias',
        icon: <PaymentIcon />,
        color: 'warning' as const,
      },
      {
        title: 'Treinos Concluídos',
        value: 24,
        change: 12.5,
        changeLabel: 'este mês',
        icon: <RunIcon />,
        color: 'success' as const,
      },
      {
        title: 'Meu Treinador',
        value: 'João Silva',
        change: 4.9,
        changeLabel: 'avaliação',
        icon: <SportsIcon />,
        color: 'secondary' as const,
      },
    ];
  };

  // Processa dados de receita para gráficos
  const getRevenueChartData = () => {
    if (!revenueReport || !revenueReport.planRevenue) return [];
    
    return revenueReport.planRevenue.map((plan, index) => ({
      month: `Plan ${index + 1}`,
      revenue: plan.revenue,
      subscriptions: plan.count,
    }));
  };

  // Processa dados de distribuição de planos
  const getPlanDistributionData = () => {
    if (!revenueReport || !revenueReport.planRevenue) return [];
    
    const colors = ['#1976d2', '#2e7d32', '#f57c00', '#d32f2f'];
    
    return revenueReport.planRevenue.map((plan, index) => ({
      name: plan.planName,
      value: plan.count,
      color: colors[index % colors.length],
    }));
  };

  // Processa dados de métodos de pagamento
  const getPaymentMethodData = () => {
    if (!revenueReport || !revenueReport.paymentMethodRevenue) return [];
    
    const colors = ['#f57c00', '#1976d2', '#2e7d32'];
    
    return revenueReport.paymentMethodRevenue.map((method, index) => ({
      name: method.method,
      value: method.count,
      color: colors[index % colors.length],
    }));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          {getWelcomeMessage()}, {user.name}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Aqui está um resumo das atividades da sua plataforma Endurance On
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {getStatsForUserType().map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatsCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              changeLabel={stat.changeLabel}
              icon={stat.icon}
              color={stat.color}
            />
          </Grid>
        ))}
      </Grid>

      {/* Tabs - Só para ADMIN e COACH */}
      {(user.userType === UserType.ADMIN || user.userType === UserType.COACH) && (
        <Paper sx={{ mb: 4 }}>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Visão Geral" />
            <Tab label="Receita" />
            <Tab label="Usuários" />
            <Tab label="Análises" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Gráfico de Receita */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Receita e Assinaturas
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getRevenueChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'revenue' ? `R$ ${value}` : value,
                        name === 'revenue' ? 'Receita' : 'Assinaturas'
                      ]} />
                      <Line type="monotone" dataKey="revenue" stroke={theme.palette.primary.main} strokeWidth={3} />
                      <Line type="monotone" dataKey="subscriptions" stroke={theme.palette.secondary.main} strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Distribuição de Planos */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Distribuição de Planos
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPlanDistributionData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getPlanDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}`, 'Assinantes']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Pagamentos Recentes */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Pagamentos Recentes
                  </Typography>
                  {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                    <Box>
                      {stats.recentPayments.map((payment, index) => (
                        <Box key={payment.id} sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          py: 2,
                          borderBottom: index < stats.recentPayments.length - 1 ? 1 : 0,
                          borderColor: 'divider'
                        }}>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {payment.userName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(payment.date).toLocaleDateString('pt-BR')}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6">
                              R$ {payment.amount.toFixed(2)}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color={payment.status === PaymentStatus.CONFIRMED ? 'success.main' : 'warning.main'}
                            >
                              {payment.status === PaymentStatus.CONFIRMED ? 'Confirmado' : 'Pendente'}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Nenhum pagamento recente encontrado
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Evolução da Receita
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getRevenueChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`R$ ${value}`, 'Receita']} />
                      <Line type="monotone" dataKey="revenue" stroke={theme.palette.primary.main} strokeWidth={4} />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Métodos de Pagamento
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPaymentMethodData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getPaymentMethodData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}`, 'Transações']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Métricas de Usuários
                  </Typography>
                  {performanceMetrics && (
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.main">
                            {((performanceMetrics.conversionRate || 0) * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Taxa de Conversão
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {((performanceMetrics.churnRate || 0) * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Taxa de Churn
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main">
                            R$ {(performanceMetrics.averageRevenuePerUser || 0).toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ARPU
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="secondary.main">
                            R$ {(performanceMetrics.lifetimeValue || 0).toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            LTV
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Performance Mensal
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getRevenueChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="subscriptions" stroke={theme.palette.secondary.main} strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Métricas Avançadas
                  </Typography>
                  {performanceMetrics && (
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body1" gutterBottom>
                          Taxa de Crescimento Mensal
                        </Typography>
                        <Typography variant="h5" color="primary.main">
                          {((performanceMetrics.monthlyGrowthRate || 0) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body1" gutterBottom>
                          Taxa de Usuários Ativos
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          {((performanceMetrics.activeUserRate || 0) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      )}
    </Box>
  );
} 