'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Paper,
  TextField,
  MenuItem,
  Button,
  Grid,
  Chip,
  Tooltip,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  PictureAsPdf as PdfIcon, 
  TableChart as CsvIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

import { enduranceApi } from '../../../services/enduranceApi';
import { CoachEarning, CoachEarningStatus, PaginatedResponse, CoachLevel, PlanPeriod } from '../../../types/api';
import { useDebounce } from '../../../hooks/useDebounce';
import toast from 'react-hot-toast';

interface CoachEarningsTableProps {
  coachId?: string;
}

const statusOptions = Object.values(CoachEarningStatus);
const coachLevelOptions = Object.values(CoachLevel);
const periodOptions = Object.values(PlanPeriod);

export default function CoachEarningsTable({ coachId }: CoachEarningsTableProps) {
  const [data, setData] = useState<CoachEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [summary, setSummary] = useState<{
    totalAmount: number;
    pendingAmount: number;
    paidAmount: number;
    cancelledAmount: number;
    count: number;
  }>({
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
    cancelledAmount: 0,
    count: 0
  });
  
  const [filters, setFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [coaches, setCoaches] = useState<any[]>([]);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEarning, setSelectedEarning] = useState<CoachEarning | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    invoiceUrl: '',
    notes: ''
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  const loadSummary = useCallback(async () => {
    try {
      // Preparar filtros para a API
      const apiFilters: any = { includeTotals: true };
      
      if (filters.coachId) apiFilters.coachId = filters.coachId;
      if (filters.status) apiFilters.status = filters.status;
      if (filters.startDate) apiFilters.paymentDateFrom = format(filters.startDate, 'yyyy-MM-dd');
      if (filters.endDate) apiFilters.paymentDateTo = format(filters.endDate, 'yyyy-MM-dd');
      if (debouncedSearch) apiFilters.search = debouncedSearch;

      let response;
      if (coachId) {
        // Se tem coachId específico, usa endpoint específico
        response = await enduranceApi.getCoachEarningsDashboardByCoach(coachId, apiFilters);
      } else {
        // Usa endpoint geral de resumo financeiro
        response = await enduranceApi.getCoachEarningsFinancialSummary(apiFilters);
      }

      if (response && response.summary) {
        setSummary({
          totalAmount: response.summary.totalAmount || 0,
          pendingAmount: response.summary.pendingAmount || 0,
          paidAmount: response.summary.paidAmount || 0,
          cancelledAmount: response.summary.cancelledAmount || 0,
          count: response.summary.count || 0
        });
      }
    } catch (err) {
      console.error('Erro ao carregar resumo financeiro:', err);
      // Em caso de erro, manter valores padrão
    }
  }, [coachId, filters, debouncedSearch]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
        search: debouncedSearch || undefined,
        startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
        endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined,
        coachId: coachId || filters.coachId,
      };
      
      // Timeout para evitar loading infinito
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao carregar dados')), 10000)
      );
      
      let response;
      if (coachId) {
        // Se tem coachId específico, usa endpoint específico
        response = await Promise.race([
          enduranceApi.getCoachEarningsByCoach(coachId, params),
          timeoutPromise
        ]) as any;
      } else {
        // Usa endpoint geral com filtros
        response = await Promise.race([
          enduranceApi.getCoachEarnings(params),
          timeoutPromise
        ]) as any;
      }
      
      // Extrair dados da resposta da API
      let actualData = [];
      let actualPagination = {};
      
      if (response && typeof response === 'object') {
        // Se response tem a estrutura aninhada: { success: true, data: { data: [], pagination: {} } }
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          actualData = response.data.data;
          actualPagination = response.data.pagination;
        }
        // Se response tem estrutura mais aninhada: { success: true, data: { success: true, data: { data: [], pagination: {} } } }
        else if (response.data && response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          actualData = response.data.data.data;
          actualPagination = response.data.data.pagination;
        }
        // Se response já é a estrutura interna
        else if (response.data && Array.isArray(response.data)) {
          actualData = response.data;
          actualPagination = response.pagination;
        }
        // Fallback para outras estruturas
        else {
          actualData = response.data || [];
          actualPagination = response.pagination || {};
        }
      }
      
      // Garantir que data seja sempre um array
      const responseData = Array.isArray(actualData) ? actualData : [];
      
      setData(responseData);
      setTotalRows((actualPagination as any)?.total || responseData.length);
    } catch (err) {
      console.error('Erro ao carregar ganhos dos treinadores:', err);
      
      // Se o endpoint não estiver disponível, usar dados mockados temporariamente
      const errorMessage = err.message || err.toString() || '';
      if (errorMessage.includes('404') || errorMessage.includes('Not Found') || errorMessage.includes('timeout')) {
        console.log('Endpoint de coach earnings não disponível, usando dados mockados');
        setData([]);
        setTotalRows(0);
        setError(null);
      } else {
        setError('Erro ao carregar ganhos dos treinadores.');
        toast.error('Erro ao carregar ganhos dos treinadores.');
        setData([]);
        setTotalRows(0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, coachId, filters, debouncedSearch]);

  useEffect(() => {
    // Carrega dados imediatamente quando o componente é montado
    loadData();
    loadSummary();
  }, [loadData, loadSummary]);

  useEffect(() => {
    async function fetchFilterData() {
      try {
        const coachesRes = await enduranceApi.getCoaches({ limit: 100 });
        setCoaches(coachesRes.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados para filtros:', err);
        toast.error('Erro ao carregar dados para filtros.');
      }
    }
    // Carrega dados dos filtros imediatamente
    fetchFilterData();
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0); // Reset page when filters change
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset page when search changes
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleEditEarning = (earning: CoachEarning) => {
    setSelectedEarning(earning);
    setEditForm({
      status: earning.status,
      invoiceUrl: earning.invoiceUrl || '',
      notes: earning.notes || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEarning) return;

    try {
      setLoading(true);
      await enduranceApi.updateCoachEarning(selectedEarning.id, editForm);
      toast.success('Ganho atualizado com sucesso!');
      setEditDialogOpen(false);
      setSelectedEarning(null);
      loadData(); // Reload data
    } catch (error) {
      console.error('Erro ao atualizar ganho:', error);
      toast.error('Erro ao atualizar ganho.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (earning: CoachEarning) => {
    try {
      setLoading(true);
      await enduranceApi.markCoachEarningAsPaid(earning.id, {
        invoiceUrl: earning.invoiceUrl
      });
      toast.success('Ganho marcado como pago!');
      loadData(); // Reload data
    } catch (error) {
      console.error('Erro ao marcar ganho como pago:', error);
      toast.error('Erro ao marcar ganho como pago.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEarning = async (earning: CoachEarning) => {
    if (!window.confirm('Tem certeza que deseja cancelar este ganho?')) {
      return;
    }

    try {
      setLoading(true);
      await enduranceApi.cancelCoachEarning(earning.id, {
        reason: 'Cancelado pelo administrador'
      });
      toast.success('Ganho cancelado com sucesso!');
      loadData(); // Reload data
    } catch (error) {
      console.error('Erro ao cancelar ganho:', error);
      toast.error('Erro ao cancelar ganho.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: CoachEarningStatus) => {
    switch (status) {
      case CoachEarningStatus.PENDING:
        return 'warning';
      case CoachEarningStatus.PAID:
        return 'success';
      case CoachEarningStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: CoachEarningStatus) => {
    switch (status) {
      case CoachEarningStatus.PENDING:
        return 'Pendente';
      case CoachEarningStatus.PAID:
        return 'Pago';
      case CoachEarningStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'MONTHLY':
        return 'Mensal';
      case 'QUARTERLY':
        return 'Trimestral';
      case 'SEMIANNUAL':
        return 'Semestral';
      case 'ANNUAL':
        return 'Anual';
      default:
        return period;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box>
        {/* Cards de Resumo Financeiro */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center', 
              bgcolor: '#1976d2', 
              color: 'white',
              height: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h6" component="div">
                Total Geral
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(summary.totalAmount)}
              </Typography>
              <Typography variant="body2">
                {summary.count} registros
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center', 
              bgcolor: 'warning.main', 
              color: 'white',
              height: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h6" component="div">
                Pendentes
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(summary.pendingAmount)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center', 
              bgcolor: 'success.main', 
              color: 'white',
              height: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h6" component="div">
                Pagos
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(summary.paidAmount)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ 
              p: 2, 
              textAlign: 'center', 
              bgcolor: 'error.main', 
              color: 'white',
              height: '140px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h6" component="div">
                Cancelados
              </Typography>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(summary.cancelledAmount)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Buscar"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar por treinador, aluno ou plano..."
                size="small"
              />
            </Grid>
            
            {!coachId && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Treinador</InputLabel>
                  <Select
                    value={filters.coachId || ''}
                    onChange={(e) => handleFilterChange('coachId', e.target.value)}
                    label="Treinador"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {coaches.map((coach) => (
                      <MenuItem key={coach.id} value={coach.id}>
                        {coach.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Data Inicial"
                value={filters.startDate || null}
                onChange={(date) => handleFilterChange('startDate', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <DatePicker
                label="Data Final"
                value={filters.endDate || null}
                onChange={(date) => handleFilterChange('endDate', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Atualizar
              </Button>
            </Grid>
          </Grid>
        </Paper>



        {/* Tabela */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Treinador</TableCell>
                <TableCell>Aluno</TableCell>
                <TableCell>Plano</TableCell>
                <TableCell>Período</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Data Pagamento</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notas</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Alert severity="error">{error}</Alert>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Nenhum ganho encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(data) ? data : []).map((earning) => (
                  <TableRow key={earning.id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {earning.coach?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {earning.coach?.email || 'N/A'}
                        </Typography>
                        {earning.coach?.coachLevel && (
                          <Chip 
                            label={earning.coach.coachLevel} 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {earning.subscription?.user?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {earning.subscription?.user?.email || 'N/A'}
                        </Typography>
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
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(earning.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(earning.paymentDate)}
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
                      <Typography variant="body2" noWrap>
                        {earning.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Editar">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditEarning(earning)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {earning.status === CoachEarningStatus.PENDING && (
                          <Tooltip title="Marcar como Pago">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleMarkAsPaid(earning)}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {earning.status !== CoachEarningStatus.CANCELLED && (
                          <Tooltip title="Cancelar">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleCancelEarning(earning)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
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
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />

        {/* Dialog de Edição */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Editar Ganho</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    label="Status"
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL da Nota Fiscal"
                  value={editForm.invoiceUrl}
                  onChange={(e) => setEditForm(prev => ({ ...prev, invoiceUrl: e.target.value }))}
                  placeholder="https://example.com/invoice.pdf"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notas"
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  multiline
                  rows={3}
                  placeholder="Observações sobre este ganho..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : 'Salvar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
