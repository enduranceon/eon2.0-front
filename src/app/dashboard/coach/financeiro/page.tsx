'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Container,
  TablePagination,
  Avatar,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  FilterList as FilterListIcon,
  Assessment as AssessmentIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import { enduranceApi } from '@/services/enduranceApi';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CoachEarning, CoachEarningStatus } from '@/types/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Função para obter URL absoluta da imagem
const getAbsoluteImageUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('blob:')) {
    return url;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const origin = new URL(apiUrl).origin;
  const path = url.startsWith('/api') ? url.substring(4) : url;
  return `${origin}/api${path.startsWith('/') ? '' : '/'}${path}`;
};

export default function FinanceiroPage() {
  const [earnings, setEarnings] = useState<CoachEarning[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  
  const { user, logout } = useAuth();
  const router = useRouter();

  // Estados dos filtros
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: '',
    status: '',
  });

  const handleLogout = () => {
    logout();
  };

  // Função para calcular estimativa do próximo mês
  const calculateNextMonthEstimate = (stats: any, chartData: any[]) => {
    if (stats.nextMonth && stats.nextMonth > 0) {
      return stats.nextMonth;
    }
    
    // Se não há dados suficientes, usar crescimento de 10% sobre este mês
    if (stats.thisMonth && stats.thisMonth > 0) {
      return stats.thisMonth * 1.1;
    }
    
    // Se há dados históricos, calcular média móvel
    if (chartData.length >= 2) {
      const lastMonths = chartData.slice(-3);
      const avgNextMonth = lastMonths.reduce((sum, month) => sum + month.total, 0) / lastMonths.length;
      return Math.round(avgNextMonth);
    }
    
    // Fallback: usar último mês se disponível
    if (stats.lastMonth && stats.lastMonth > 0) {
      return stats.lastMonth * 1.05; // 5% de crescimento
    }
    
    return 0;
  };

  // Função para processar dados do gráfico
  const processChartData = (earningsData: CoachEarning[]) => {
    const monthlyData: { [key: string]: { month: string; total: number; paid: number; pending: number; cancelled: number } } = {};
    
    earningsData.forEach(earning => {
      const date = new Date(earning.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          total: 0,
          paid: 0,
          pending: 0,
          cancelled: 0
        };
      }
      
      monthlyData[monthKey].total += earning.amount;
      
      switch (earning.status) {
        case CoachEarningStatus.PAID:
          monthlyData[monthKey].paid += earning.amount;
          break;
        case CoachEarningStatus.PENDING:
          monthlyData[monthKey].pending += earning.amount;
          break;
        case CoachEarningStatus.CANCELLED:
          monthlyData[monthKey].cancelled += earning.amount;
          break;
      }
    });
    
    // Converter para array e ordenar por data
    const chartDataArray = Object.values(monthlyData).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
    
    return chartDataArray;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(filters.year && { year: filters.year }),
        ...(filters.month && { month: filters.month }),
        ...(filters.status && { status: filters.status }),
      };

      const response = await enduranceApi.getCoachMyEarnings(params);
      
      // A API retorna { data: [...], stats: {...} }
      if (response && response.data) {
        const actualData = Array.isArray(response.data) ? response.data : [];
        setEarnings(actualData);
        setStats(response.stats || null);
        setTotalRows(response.stats?.count || actualData.length);
        
        // Processar dados para o gráfico
        const chartDataProcessed = processChartData(actualData);
        setChartData(chartDataProcessed);
      }
      
    } catch (error) {
      console.error('Erro ao carregar ganhos:', error);
      setError('Erro ao carregar dados financeiros. Verifique sua conexão.');
      setEarnings([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, rowsPerPage, filters]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setPage(0); // Reset para primeira página
  };

  const clearFilters = () => {
    setFilters({
      year: new Date().getFullYear(),
      month: '',
      status: '',
    });
    setPage(0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: CoachEarningStatus) => {
    switch (status) {
      case CoachEarningStatus.PAID: return 'success';
      case CoachEarningStatus.PENDING: return 'warning';
      case CoachEarningStatus.CANCELLED: return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: CoachEarningStatus) => {
    switch (status) {
      case CoachEarningStatus.PAID: return 'Pago';
      case CoachEarningStatus.PENDING: return 'Pendente';
      case CoachEarningStatus.CANCELLED: return 'Cancelado';
      default: return status;
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'MONTHLY': return 'Mensal';
      case 'QUARTERLY': return 'Trimestral';
      case 'SEMIANNUAL': return 'Semestral';
      case 'ANNUAL': return 'Anual';
      default: return period;
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && earnings.length === 0) {
    return (
      <ProtectedRoute>
        <DashboardLayout user={user} onLogout={handleLogout}>
          <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <CircularProgress size={60} />
            </Box>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout user={user} onLogout={handleLogout}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            Meus Ganhos 💰
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Acompanhe seus ganhos e performance financeira
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Cards de Resumo */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  color: 'white'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Total Geral
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(stats.totalEarnings || 0)}
                        </Typography>
                      </Box>
                      <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #f57c00 0%, #ffb74d 100%)',
                  color: 'white'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Pendentes
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(stats.pendingEarnings || 0)}
                        </Typography>
                      </Box>
                      <ReceiptIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
                  color: 'white'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Pagos
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(stats.paidEarnings || 0)}
                        </Typography>
                      </Box>
                      <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  background: 'linear-gradient(135deg, #d32f2f 0%, #ef5350 100%)',
                  color: 'white'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Cancelados
                        </Typography>
                        <Typography variant="h4">
                          {formatCurrency(stats.cancelledEarnings || 0)}
                        </Typography>
                      </Box>
                      <AccountBalanceIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Gráfico de Evolução Mensal */}
          {(chartData.length > 0 || loading) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Evolução Mensal dos Ganhos
                  {chartData.length === 0 && !loading && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      (Dados de exemplo - aguarde carregamento dos dados reais)
                    </Typography>
                  )}
                </Typography>
                <Box sx={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData.length > 0 ? chartData : [
                        { month: 'Jan 2024', total: 1500, paid: 1200, pending: 300, cancelled: 0 },
                        { month: 'Fev 2024', total: 2200, paid: 1800, pending: 400, cancelled: 0 },
                        { month: 'Mar 2024', total: 1800, paid: 1500, pending: 200, cancelled: 100 },
                        { month: 'Abr 2024', total: 2500, paid: 2000, pending: 500, cancelled: 0 },
                        { month: 'Mai 2024', total: 2100, paid: 1700, pending: 400, cancelled: 0 },
                        { month: 'Jun 2024', total: 2800, paid: 2300, pending: 500, cancelled: 0 }
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#666"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#666"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          if (value >= 1000000) {
                            return `R$ ${(value / 1000000).toFixed(1)}M`;
                          } else if (value >= 1000) {
                            return `R$ ${(value / 1000).toFixed(0)}k`;
                          } else {
                            return `R$ ${value.toFixed(0)}`;
                          }
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === 'total' ? 'Total' :
                          name === 'paid' ? 'Pagos' :
                          name === 'pending' ? 'Pendentes' : 'Cancelados'
                        ]}
                        labelFormatter={(label) => `Período: ${label}`}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => 
                          value === 'total' ? 'Total' :
                          value === 'paid' ? 'Pagos' :
                          value === 'pending' ? 'Pendentes' : 'Cancelados'
                        }
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#1976d2" 
                        strokeWidth={3}
                        dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#1976d2', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="paid" 
                        stroke="#388e3c" 
                        strokeWidth={2}
                        dot={{ fill: '#388e3c', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#388e3c', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pending" 
                        stroke="#f57c00" 
                        strokeWidth={2}
                        dot={{ fill: '#f57c00', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#f57c00', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cancelled" 
                        stroke="#d32f2f" 
                        strokeWidth={2}
                        dot={{ fill: '#d32f2f', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: '#d32f2f', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Filtros */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filtros
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Ano"
                    type="number"
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                    inputProps={{ min: 2020, max: 2030 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Mês</InputLabel>
                    <Select
                      value={filters.month}
                      onChange={(e) => handleFilterChange('month', e.target.value)}
                      label="Mês"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="1">Janeiro</MenuItem>
                      <MenuItem value="2">Fevereiro</MenuItem>
                      <MenuItem value="3">Março</MenuItem>
                      <MenuItem value="4">Abril</MenuItem>
                      <MenuItem value="5">Maio</MenuItem>
                      <MenuItem value="6">Junho</MenuItem>
                      <MenuItem value="7">Julho</MenuItem>
                      <MenuItem value="8">Agosto</MenuItem>
                      <MenuItem value="9">Setembro</MenuItem>
                      <MenuItem value="10">Outubro</MenuItem>
                      <MenuItem value="11">Novembro</MenuItem>
                      <MenuItem value="12">Dezembro</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="PAID">Pago</MenuItem>
                      <MenuItem value="PENDING">Pendente</MenuItem>
                      <MenuItem value="CANCELLED">Cancelado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    fullWidth
                    sx={{ height: '56px' }}
                  >
                    Limpar Filtros
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Estatísticas Mensais */}
          {stats && (stats.thisMonth || stats.lastMonth || stats.nextMonth) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estatísticas Mensais
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Mês Anterior
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        {formatCurrency(stats.lastMonth || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="primary.main">
                        Este Mês
                      </Typography>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(stats.thisMonth || 0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Próximo Mês
                        {stats.nextMonth === 0 && (
                          <Typography variant="caption" color="warning.main" sx={{ display: 'block', fontSize: '0.7rem' }}>
                            (Estimativa)
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="h6" color="text.secondary">
                        {formatCurrency(calculateNextMonthEstimate(stats, chartData))}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Ganhos */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Histórico de Ganhos
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<GetAppIcon />}
                  size="small"
                  disabled
                >
                  Exportar
                </Button>
              </Box>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Aluno</TableCell>
                      <TableCell>Plano</TableCell>
                      <TableCell>Período</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Data Pagamento</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : earnings.length > 0 ? (
                      earnings.map((earning) => (
                        <TableRow key={earning.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar 
                                src={getAbsoluteImageUrl(earning.subscription?.student?.image)} 
                                sx={{ width: 32, height: 32 }}
                              >
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {earning.subscription?.student?.name || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {earning.subscription?.student?.email || 'N/A'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {earning.subscription?.plan?.name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {earning.subscription?.period && (
                              <Chip 
                                label={getPeriodLabel(earning.subscription.period)} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              {formatCurrency(earning.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {format(new Date(earning.paymentDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(earning.status)}
                              color={getStatusColor(earning.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{
                              maxWidth: '200px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {earning.notes || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Nenhum ganho encontrado
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginação */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalRows}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Itens por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </CardContent>
          </Card>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
}