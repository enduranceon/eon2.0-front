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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Tooltip,
  CircularProgress,
  Divider,
  InputAdornment,
  Container,
  Pagination,
  IconButton,
  Collapse,
  TablePagination,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  CalendarToday as CalendarTodayIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  GetApp as GetAppIcon,
} from '@mui/icons-material';
import { enduranceApi } from '@/services/enduranceApi';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  FinancialTransaction, 
  FinancialEarningsList, 
  CoachFinancialSummary, 
  PeriodTotals,
  PaymentStatus,
  FinancialFilters 
} from '@/types/api';

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
  const [earnings, setEarnings] = useState<FinancialEarningsList | null>(null);
  const [summary, setSummary] = useState<CoachFinancialSummary | null>(null);
  const [periodTotals, setPeriodTotals] = useState<PeriodTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const router = useRouter();

  // Estados dos filtros
  const [filters, setFilters] = useState<FinancialFilters>({
    page: 1,
    limit: 10,
    startDate: '',
    endDate: '',
    studentId: '',
    planId: '',
    modalidadeId: '',
    paymentStatus: undefined,
    subscriptionStatus: undefined,
  });

  // Estados para busca de período
  const [periodSearch, setPeriodSearch] = useState({
    startDate: '',
    endDate: '',
    modalidadeId: '',
    planId: '',
    paymentStatus: '',
  });

  // Estados para opções de filtro
  const [students, setStudents] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [modalidades, setModalidades] = useState<any[]>([]);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Skip the initial load since loadInitialData already fetches earnings
    if (earnings !== null) {
      fetchEarnings();
    }
  }, [filters]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar dados iniciais
      const [summaryResponse, earningsResponse, studentsResponse, plansResponse, modalidadesResponse] = await Promise.all([
        enduranceApi.getCoachFinancialSummary().catch(err => {
          console.warn('Erro ao carregar resumo financeiro:', err);
          return null;
        }),
        enduranceApi.getCoachFinancialEarnings({ page: 1, limit: 10 }).catch(err => {
          console.warn('Erro ao carregar ganhos:', err);
          return null;
        }),
        enduranceApi.getCoachStudents().catch(err => {
          console.warn('Erro ao carregar alunos:', err);
          return { students: [] };
        }),
        enduranceApi.getCoachPlans().catch(err => {
          console.warn('Erro ao carregar planos:', err);
          return { plans: [] };
        }),
        enduranceApi.getModalidades().catch(err => {
          console.warn('Erro ao carregar modalidades:', err);
          return { modalidades: [] };
        })
      ]);
      
      setSummary(summaryResponse);
      setEarnings(earningsResponse);
      setStudents(studentsResponse?.students || []);
      setPlans(plansResponse?.plans || []);
      setModalidades((modalidadesResponse as any)?.data || (modalidadesResponse as any)?.modalidades || []);
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      setError('Erro ao carregar dados financeiros. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await enduranceApi.getCoachFinancialEarnings(filters);
      setEarnings(response);
      
    } catch (error) {
      console.error('Erro ao buscar ganhos:', error);
      setError('Erro ao buscar ganhos financeiros.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodTotals = async () => {
    if (!periodSearch.startDate || !periodSearch.endDate) {
      setError('Por favor, selecione as datas de início e fim.');
      return;
    }

    try {
      setLoadingPeriod(true);
      setError(null);
      
      // Prepare the request data, filtering out empty values
      const requestData = {
        startDate: periodSearch.startDate,
        endDate: periodSearch.endDate,
        ...(periodSearch.modalidadeId && { modalidadeId: periodSearch.modalidadeId }),
        ...(periodSearch.planId && { planId: periodSearch.planId }),
        ...(periodSearch.paymentStatus && periodSearch.paymentStatus !== '' && { paymentStatus: periodSearch.paymentStatus }),
      };
      
      const response = await enduranceApi.getCoachFinancialPeriodTotals(requestData);
      setPeriodTotals(response);
      setSuccess('Totais do período calculados com sucesso!');
      
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Erro ao buscar totais do período:', error);
      setError('Erro ao calcular totais do período.');
    } finally {
      setLoadingPeriod(false);
    }
  };

  const handleFilterChange = (field: keyof FinancialFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : value // Reset para página 1 quando outros filtros mudam
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      startDate: '',
      endDate: '',
      studentId: '',
      planId: '',
      modalidadeId: '',
      paymentStatus: undefined,
      subscriptionStatus: undefined,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'error';
      case 'OVERDUE': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmado';
      case 'PENDING': return 'Pendente';
      case 'CANCELLED': return 'Cancelado';
      case 'OVERDUE': return 'Atrasado';
      default: return status;
    }
  };

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'SUSPENDED': return 'warning';
      case 'CANCELLED': return 'error';
      case 'PENDING': return 'info';
      default: return 'default';
    }
  };

  const getSubscriptionStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativa';
      case 'SUSPENDED': return 'Suspensa';
      case 'CANCELLED': return 'Cancelada';
      case 'PENDING': return 'Pendente';
      default: return status;
    }
  };

  if (loading && !earnings) {
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
            Financeiro 💰
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Acompanhe seus ganhos, margens e performance financeira
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Cards de Resumo */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Ganhos Totais
                      </Typography>
                      <Typography variant="h4" sx={{ color: 'white' }}>
                        {formatCurrency(summary?.totalEarnings || 0)}
                      </Typography>
                    </Box>
                    <MoneyIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Ganhos Mensais
                      </Typography>
                      <Typography variant="h4" sx={{ color: 'white' }}>
                        {formatCurrency(summary?.monthlyEarnings || 0)}
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Pagamentos Pendentes
                      </Typography>
                      <Typography variant="h4" sx={{ color: 'white' }}>
                        {formatCurrency(summary?.pendingPayments || 0)}
                      </Typography>
                    </Box>
                    <ReceiptIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Transações
                      </Typography>
                      <Typography variant="h4" sx={{ color: 'white' }}>
                        {earnings?.summary?.transactionCount || 0}
                      </Typography>
                    </Box>
                    <AccountBalanceIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Ações */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setFiltersOpen(!filtersOpen)}
                fullWidth
              >
                {filtersOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                startIcon={<AssessmentIcon />}
                onClick={() => setPeriodDialogOpen(true)}
                fullWidth
              >
                Calcular Totais por Período
              </Button>
            </Grid>
          </Grid>

          {/* Filtros */}
          <Collapse in={filtersOpen}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Filtros
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Data Inicial"
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Data Final"
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Aluno</InputLabel>
                      <Select
                        value={filters.studentId}
                        onChange={(e) => handleFilterChange('studentId', e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {students.map((student) => (
                          <MenuItem key={student.id} value={student.id}>
                            {student.user?.name || student.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Plano</InputLabel>
                      <Select
                        value={filters.planId}
                        onChange={(e) => handleFilterChange('planId', e.target.value)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {plans.map((plan) => (
                          <MenuItem key={plan.id} value={plan.id}>
                            {plan.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Modalidade</InputLabel>
                      <Select
                        value={filters.modalidadeId}
                        onChange={(e) => handleFilterChange('modalidadeId', e.target.value)}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {modalidades.map((modalidade) => (
                          <MenuItem key={modalidade.id} value={modalidade.id}>
                            {modalidade.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Status Pagamento</InputLabel>
                      <Select
                        value={filters.paymentStatus || ''}
                        onChange={(e) => handleFilterChange('paymentStatus', e.target.value || undefined)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="CONFIRMED">Confirmado</MenuItem>
                        <MenuItem value="PENDING">Pendente</MenuItem>
                        <MenuItem value="CANCELLED">Cancelado</MenuItem>
                        <MenuItem value="OVERDUE">Atrasado</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Status Assinatura</InputLabel>
                      <Select
                        value={filters.subscriptionStatus || ''}
                        onChange={(e) => handleFilterChange('subscriptionStatus', e.target.value || undefined)}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="ACTIVE">Ativa</MenuItem>
                        <MenuItem value="SUSPENDED">Suspensa</MenuItem>
                        <MenuItem value="CANCELLED">Cancelada</MenuItem>
                        <MenuItem value="PENDING">Pendente</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={clearFilters}
                      fullWidth
                    >
                      Limpar Filtros
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Collapse>

          {/* Resumo dos Filtros Aplicados */}
          {earnings?.summary && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumo dos Resultados
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total de Ganhos
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(earnings.summary.totalCoachEarnings)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Margem Média
                    </Typography>
                    <Typography variant="h6">
                      {earnings.summary.overallMarginPercentage.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Transações
                    </Typography>
                    <Typography variant="h6">
                      {earnings.summary.transactionCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Valor Total
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(earnings.summary.totalAmount)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Ganhos */}
          {earnings && (
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
                        <TableCell>Plano / Modalidade</TableCell>
                        <TableCell>Valor Total</TableCell>
                        <TableCell>Seus Ganhos</TableCell>
                        <TableCell>Margem</TableCell>
                        <TableCell>Status Pagamento</TableCell>
                        <TableCell>Status Assinatura</TableCell>
                        <TableCell>Data</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {earnings?.data && earnings.data.length > 0 ? earnings.data.map((transaction) => transaction && (
                        <TableRow key={transaction?.id || 'unknown'} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar src={getAbsoluteImageUrl(transaction.payment?.user?.image)}>
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {transaction.payment?.user?.name || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {transaction.payment?.user?.email || 'N/A'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {transaction.payment?.subscription?.plan?.name || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {transaction.payment?.subscription?.modalidade?.name || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(transaction.totalAmount || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              {formatCurrency(transaction.coachAmount || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${(transaction.marginPercentage || 0).toFixed(1)}%`}
                              color={(transaction.marginPercentage || 0) >= 70 ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(transaction.payment?.status || 'UNKNOWN')}
                              color={getStatusColor(transaction.payment?.status || 'UNKNOWN')}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getSubscriptionStatusLabel(transaction.payment?.subscription?.status || 'UNKNOWN')}
                              color={getSubscriptionStatusColor(transaction.payment?.subscription?.status || 'UNKNOWN')}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {transaction.createdAt ? format(new Date(transaction.createdAt), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Carregando dados...
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Paginação */}
                {earnings?.pagination && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <TablePagination
                      component="div"
                      count={earnings.pagination.total}
                      page={earnings.pagination.page - 1}
                      onPageChange={(_, newPage) => handleFilterChange('page', newPage + 1)}
                      rowsPerPage={earnings.pagination.limit}
                      onRowsPerPageChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Itens por página"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dialog de Totais por Período */}
          <Dialog 
            open={periodDialogOpen} 
            onClose={() => setPeriodDialogOpen(false)} 
            maxWidth="md" 
            fullWidth
            disableAutoFocus
            disableEnforceFocus
            disableRestoreFocus
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon />
                Calcular Totais por Período
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Inicial"
                    type="date"
                    value={periodSearch.startDate}
                    onChange={(e) => setPeriodSearch(prev => ({ ...prev, startDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Final"
                    type="date"
                    value={periodSearch.endDate}
                    onChange={(e) => setPeriodSearch(prev => ({ ...prev, endDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Modalidade (Opcional)</InputLabel>
                    <Select
                      value={periodSearch.modalidadeId}
                      onChange={(e) => setPeriodSearch(prev => ({ ...prev, modalidadeId: e.target.value }))}
                    >
                      <MenuItem value="">Todas</MenuItem>
                      {modalidades.map((modalidade) => (
                        <MenuItem key={modalidade.id} value={modalidade.id}>
                          {modalidade.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                                 <Grid item xs={12} md={6}>
                   <FormControl fullWidth>
                     <InputLabel>Plano (Opcional)</InputLabel>
                     <Select
                       value={periodSearch.planId}
                       onChange={(e) => setPeriodSearch(prev => ({ ...prev, planId: e.target.value }))}
                     >
                       <MenuItem value="">Todos</MenuItem>
                       {plans.map((plan) => (
                         <MenuItem key={plan.id} value={plan.id}>
                           {plan.name}
                         </MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                 </Grid>
                 <Grid item xs={12} md={6}>
                   <FormControl fullWidth>
                     <InputLabel>Status Pagamento (Opcional)</InputLabel>
                     <Select
                       value={periodSearch.paymentStatus}
                       onChange={(e) => setPeriodSearch(prev => ({ ...prev, paymentStatus: e.target.value }))}
                     >
                       <MenuItem value="">Todos</MenuItem>
                       <MenuItem value="PENDING">Pendente</MenuItem>
                       <MenuItem value="CONFIRMED">Confirmado</MenuItem>
                       <MenuItem value="CANCELLED">Cancelado</MenuItem>
                       <MenuItem value="OVERDUE">Atrasado</MenuItem>
                     </Select>
                   </FormControl>
                 </Grid>
              </Grid>

              {/* Resultados dos Totais */}
              {periodTotals && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Resultados do Período
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" color="success.main">
                            {formatCurrency(periodTotals.totals.coachEarnings)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Seus Ganhos
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">
                            {formatCurrency(periodTotals.totals.totalAmount)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Valor Total
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6">
                            {periodTotals.totals.transactionCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Transações
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Breakdown por Plano */}
                  {periodTotals.breakdown.byPlan.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Por Plano
                      </Typography>
                      <Grid container spacing={2}>
                        {periodTotals.breakdown.byPlan.map((item, index) => (
                          <Grid item xs={12} md={6} key={index}>
                            <Card>
                              <CardContent>
                                <Typography variant="body2" fontWeight="bold">
                                  {item.planName}
                                </Typography>
                                <Typography variant="h6" color="success.main">
                                  {formatCurrency(item.totalAmount)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.transactionCount} transações
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Breakdown por Modalidade */}
                  {periodTotals.breakdown.byModalidade.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Por Modalidade
                      </Typography>
                      <Grid container spacing={2}>
                        {periodTotals.breakdown.byModalidade.map((item, index) => (
                          <Grid item xs={12} md={6} key={index}>
                            <Card>
                              <CardContent>
                                <Typography variant="body2" fontWeight="bold">
                                  {item.modalidadeName}
                                </Typography>
                                <Typography variant="h6" color="success.main">
                                  {formatCurrency(item.totalAmount)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.transactionCount} transações
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPeriodDialogOpen(false)}>
                Fechar
              </Button>
              <Button 
                onClick={fetchPeriodTotals} 
                variant="contained" 
                disabled={loadingPeriod}
              >
                {loadingPeriod ? <CircularProgress size={24} /> : 'Calcular'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 