'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  useTheme,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '../../../components/Dashboard/StatsCard';
import { PaymentStatus } from '../../../types/api';
import { enduranceApi } from '../../../services/enduranceApi';
import { useAuth } from '../../../contexts/AuthContext';

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
      id={`earnings-tabpanel-${index}`}
      aria-labelledby={`earnings-tab-${index}`}
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

export default function PersonalEarningsPage() {
  const theme = useTheme();
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState('6months');
  
  // Estados para dados reais da API
  const [earningsData, setEarningsData] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    currentMonth: 0,
    average: 0,
    growth: 0,
    activeClients: 0,
    sessions: 0
  });

  useEffect(() => {
    loadEarningsData();
  }, [period, auth.user]);

  const loadEarningsData = async () => {
    if (!auth.user) return;

    try {
      setLoading(true);
      setError(null);

      // Calcula datas baseado no período
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (period === '3months' ? 3 : period === '6months' ? 6 : 12));
      const startDateStr = startDate.toISOString().split('T')[0];

      // Carrega dados em paralelo
      const [
        earningsResponse,
        paymentsData,
        coachData
      ] = await Promise.all([
        enduranceApi.getCoachEarnings(auth.user.id, startDateStr, endDate),
        enduranceApi.getPayments({ coachId: auth.user.id }),
        enduranceApi.getCoach(auth.user.id)
      ]);

      // Processa dados de ganhos para gráfico
      const monthlyData = [];
      const months = period === '3months' ? 3 : period === '6months' ? 6 : 12;
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
        
        monthlyData.push({
          month: monthName,
          earnings: Math.random() * 2000 + 1000, // Simulação - substituir por dados reais
          clients: Math.floor(Math.random() * 10) + 15,
          sessions: Math.floor(Math.random() * 20) + 50
        });
      }

      setEarningsData(monthlyData);

      // Processa pagamentos recentes
      const payments = paymentsData.data || [];
      const formattedPayments = payments.slice(0, 5).map((payment: any) => ({
        id: payment.id,
        clientName: payment.user?.name || 'Cliente',
        amount: payment.amount || 0,
        date: payment.createdAt,
        status: payment.status || PaymentStatus.PENDING,
        plan: payment.subscription?.plan?.name || 'Plano'
      }));

      setRecentPayments(formattedPayments);

      // Simula distribuição de planos
      setPlanDistribution([
        { name: 'Plano Premium', value: 65, color: '#1976d2', earnings: 2500 },
        { name: 'Plano Essencial', value: 35, color: '#2e7d32', earnings: 1350 },
      ]);

      // Calcula estatísticas
      const totalEarnings = earningsResponse.totalEarnings || 0;
      const currentMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];
      const growth = previousMonth ? ((currentMonth.earnings - previousMonth.earnings) / previousMonth.earnings) * 100 : 0;

      setStats({
        currentMonth: currentMonth.earnings,
        average: totalEarnings / monthlyData.length,
        growth,
        activeClients: 0, // TODO: implementar contagem de alunos quando disponível na API
        sessions: currentMonth.sessions
      });

    } catch (err) {
      console.error('Erro ao carregar dados de ganhos:', err);
      setError('Erro ao carregar dados de ganhos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.CONFIRMED:
        return 'success';
      case PaymentStatus.PENDING:
        return 'warning';
      case PaymentStatus.OVERDUE:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.CONFIRMED:
        return 'Confirmado';
      case PaymentStatus.PENDING:
        return 'Pendente';
      case PaymentStatus.OVERDUE:
        return 'Vencido';
      default:
        return 'Desconhecido';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
      <Box>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadEarningsData}>
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Meus Ganhos 💰
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Acompanhe seus ganhos, comissões e performance financeira
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Ganhos Este Mês"
            value={formatCurrency(stats.currentMonth)}
            change={stats.growth}
            changeLabel="vs mês anterior"
            icon={<MoneyIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Média Mensal"
            value={formatCurrency(stats.average)}
            change={12.5}
            changeLabel={`últimos ${period === '3months' ? '3' : period === '6months' ? '6' : '12'} meses`}
            icon={<TrendingUpIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Clientes Ativos"
            value={stats.activeClients}
            change={4.2}
            changeLabel="novos este mês"
            icon={<PeopleIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Sessões Realizadas"
            value={stats.sessions}
            change={8.1}
            changeLabel="este mês"
            icon={<ScheduleIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Controles */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={period}
            label="Período"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="3months">3 meses</MenuItem>
            <MenuItem value="6months">6 meses</MenuItem>
            <MenuItem value="12months">12 meses</MenuItem>
          </Select>
        </FormControl>
        <Button
          startIcon={<DownloadIcon />}
          variant="outlined"
          onClick={() => console.log('Download relatório')}
        >
          Baixar Relatório
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab icon={<TrendingUpIcon />} label="Evolução" />
            <Tab icon={<AssessmentIcon />} label="Distribuição" />
            <Tab icon={<MoneyIcon />} label="Pagamentos" />
          </Tabs>
        </Box>

        {/* Tab Panel - Evolução */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Evolução dos Ganhos
          </Typography>
          
          {earningsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Ganhos']} />
                <Line type="monotone" dataKey="earnings" stroke="#1976d2" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Alert severity="info">
              Nenhum dado de ganhos disponível para o período selecionado.
            </Alert>
          )}
        </TabPanel>

        {/* Tab Panel - Distribuição */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Distribuição por Tipo de Plano
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mt: 2 }}>
                {planDistribution.map((plan, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1">{plan.name}</Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(plan.earnings)}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={plan.value} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: plan.color
                        }
                      }} 
                    />
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab Panel - Pagamentos */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Pagamentos Recentes
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Plano</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment) => (
                    <TableRow key={payment.id} hover>
                      <TableCell>{payment.clientName}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>{payment.plan}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(payment.status)}
                          color={getStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Nenhum pagamento encontrado
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
} 