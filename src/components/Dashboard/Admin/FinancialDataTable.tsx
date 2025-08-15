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
  Typography
} from '@mui/material';
import { Refresh as RefreshIcon, PictureAsPdf as PdfIcon, TableChart as CsvIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

import { enduranceApi } from '../../../services/enduranceApi';
import { FinancialRecord, PaginatedResponse, PaymentStatus, Plan, User } from '../../../types/api';
import { useDebounce } from '../../../hooks/useDebounce';
import toast from 'react-hot-toast';

interface FinancialDataTableProps {
  endpoint: string;
  tableTitle: string;
}

const paymentStatusOptions = Object.values(PaymentStatus);
const paymentMethodOptions = ['CREDIT_CARD', 'BOLETO', 'PIX']; // Adicionando os métodos de pagamento

export default function FinancialDataTable({ endpoint, tableTitle }: FinancialDataTableProps) {
  const [data, setData] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  
  const [filters, setFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);

  const debouncedSearch = useDebounce(searchTerm, 500);

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
      };
      
      // Timeout para evitar loading infinito
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao carregar dados')), 10000)
      );
      
      const response = await Promise.race([
        enduranceApi.getFinancialRecords(endpoint, params),
        timeoutPromise
      ]) as PaginatedResponse<FinancialRecord>;
      
      setData(response.data || []);
      setTotalRows(response.pagination?.total || 0);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
      setError('Erro ao carregar dados financeiros.');
      toast.error('Erro ao carregar dados financeiros.');
      setData([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, endpoint, filters, debouncedSearch]);

  useEffect(() => {
    // Carrega dados imediatamente quando o componente é montado
    loadData();
  }, [loadData]);

  useEffect(() => {
    async function fetchFilterData() {
      try {
        const [plansRes, coachesRes] = await Promise.all([
          enduranceApi.getPlans({ limit: 100 }),
          enduranceApi.getCoaches({ limit: 100 })
        ]);
        setPlans(plansRes.data || []);
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
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(0);
  };

  const handleExportPdf = async () => {
    try {
      const params = {
        ...filters,
        search: debouncedSearch || undefined,
        startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
        endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined,
      };
      await enduranceApi.exportFinancialsToPdf(params);
      toast.success('Seu download começará em breve.');
    } catch (err) {
      toast.error('Erro ao exportar o relatório PDF.');
    }
  };

  const handleExportCsv = async () => {
    try {
      toast.loading('Preparando exportação...', { id: 'export-csv' });
      
      // Buscar todos os dados em lotes para exportação
      const allData: FinancialRecord[] = [];
      let currentPage = 1;
      const limit = 100; // Limite máximo permitido pelo backend
      let hasMoreData = true;
      
      while (hasMoreData) {
        const params = {
          ...filters,
          search: debouncedSearch || undefined,
          startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined,
          endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined,
          limit,
          page: currentPage,
        };
        
        const response = await enduranceApi.getFinancialRecords(endpoint, params);
        const pageData = response.data || [];
        
        if (pageData.length === 0) {
          hasMoreData = false;
        } else {
          allData.push(...pageData);
          currentPage++;
          
          // Verificar se há mais páginas
          if (response.pagination && currentPage > response.pagination.totalPages) {
            hasMoreData = false;
          }
          
          // Limite de segurança para evitar loops infinitos
          if (currentPage > 100) {
            hasMoreData = false;
          }
        }
      }
      
      if (allData.length === 0) {
        toast.error('Nenhum dado encontrado para exportar.', { id: 'export-csv' });
        return;
      }

      // Gerar CSV
      const headers = [
        'Aluno',
        'Email do Aluno',
        'Treinador',
        'Email do Treinador',
        'Plano',
        'Valor (R$)',
        'Split Treinador (R$)',
        'Split Plataforma (R$)',
        'Método de Pagamento',
        'Próximo Pagamento',
        'Status do Pagamento',
        'Período'
      ];

      const csvContent = [
        headers.join(','),
        ...allData.map((row: FinancialRecord) => [
          `"${row.student?.name || 'N/A'}"`,
          `"${row.student?.email || 'N/A'}"`,
          `"${row.coach?.name || 'N/A'}"`,
          `"${row.coach?.email || 'N/A'}"`,
          `"${row.plan?.name || 'N/A'}"`,
          Number(row.amount || 0).toFixed(2),
          Number(row.coachEarnings || 0).toFixed(2),
          Number(row.platformEarnings || 0).toFixed(2),
          `"${row.paymentMethod || 'N/A'}"`,
          `"${row.nextPaymentDate ? format(new Date(row.nextPaymentDate), 'dd/MM/yyyy') : 'N/A'}"`,
          `"${row.paymentStatus || 'N/A'}"`,
          `"${row.period || 'N/A'}"`
        ].join(','))
      ].join('\n');

      // Criar e baixar o arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-financeiro-${tableTitle.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Relatório CSV exportado com sucesso! ${allData.length} registros exportados.`, { id: 'export-csv' });
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
      toast.error('Erro ao exportar o relatório CSV.', { id: 'export-csv' });
    }
  };

  const areFiltersActive = Object.values(filters).some(v => v) || searchTerm;

  const getInstallmentPosition = (row: FinancialRecord, rows: FinancialRecord[]): number | null => {
    const totalInstallments = row.installments;
    const studentId = row.student?.id;
    const coachId = row.coach?.id;
    const planId = row.plan?.id;
    if (!studentId || !planId || !coachId || !totalInstallments || totalInstallments <= 1) return null;

    const sameSubscription = (rows || []).filter(r => (
      r?.student?.id === studentId &&
      r?.coach?.id === coachId &&
      r?.plan?.id === planId &&
      (r?.installments || 0) === totalInstallments
    ));

    const getSortTime = (r: FinancialRecord): number => {
      const dateStr = (r.receiptDate || r.dueDate || r.nextPaymentDate);
      return dateStr ? new Date(dateStr).getTime() : 0;
    };

    const sorted = [...sameSubscription].sort((a, b) => getSortTime(a) - getSortTime(b));
    const index = sorted.findIndex(r => r.paymentId === row.paymentId);
    return index >= 0 ? index + 1 : null;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Paper>
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{tableTitle}</Typography>
          <Box>
            <Tooltip title="Exportar para CSV">
              <IconButton onClick={handleExportCsv}><CsvIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Exportar para PDF">
              <IconButton onClick={handleExportPdf}><PdfIcon /></IconButton>
            </Tooltip>
            <Tooltip title="Recarregar dados">
              <IconButton onClick={loadData}><RefreshIcon /></IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Grid container spacing={2} p={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField 
              fullWidth 
              label="Buscar por nome/email" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker 
              label="Data de Início" 
              value={filters.startDate || null} 
              onChange={date => handleFilterChange('startDate', date)} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker 
              label="Data de Fim" 
              value={filters.endDate || null} 
              onChange={date => handleFilterChange('endDate', date)} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField 
              select 
              fullWidth 
              label="Treinador" 
              value={filters.coachId || ''} 
              onChange={e => handleFilterChange('coachId', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {coaches.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField 
              select 
              fullWidth 
              label="Plano" 
              value={filters.planId || ''} 
              onChange={e => handleFilterChange('planId', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {plans.map(p => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField 
              select 
              fullWidth 
              label="Status do Pagamento" 
              value={filters.paymentStatus || ''} 
              onChange={e => handleFilterChange('paymentStatus', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {paymentStatusOptions.map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField 
              select 
              fullWidth 
              label="Método de Pagamento" 
              value={filters.paymentMethod || ''} 
              onChange={e => handleFilterChange('paymentMethod', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {paymentMethodOptions.map(m => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {areFiltersActive && (
            <Grid item xs={12} sm={6} md={3} display="flex" alignItems="center">
              <Button onClick={handleClearFilters}>Limpar Filtros</Button>
            </Grid>
          )}
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Aluno</TableCell>
                <TableCell>Treinador</TableCell>
                <TableCell>Plano</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Split Treinador</TableCell>
                <TableCell>Split Plataforma</TableCell>
                <TableCell>Método de Pgto.</TableCell>
                <TableCell>Parcelamento</TableCell>
                <TableCell>Recebimento</TableCell>
                <TableCell>Próx. Pgto.</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={11} align="center"><CircularProgress /></TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={11} align="center"><Alert severity="error">{error}</Alert></TableCell></TableRow>
              ) : (Array.isArray(data) && data.length > 0) ? (
                data.map((row) => (
                  <TableRow key={row.paymentId}>
                    <TableCell>{row.student?.name || 'N/A'}</TableCell>
                    <TableCell>{row.coach?.name || 'N/A'}</TableCell>
                    <TableCell>{row.plan?.name || 'N/A'}</TableCell>
                    <TableCell>R$ {Number(row.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>R$ {Number(row.coachEarnings || 0).toFixed(2)}</TableCell>
                    <TableCell>R$ {Number(row.platformEarnings || 0).toFixed(2)}</TableCell>
                    <TableCell>{row.paymentMethod || 'N/A'}</TableCell>
                    <TableCell>
                      {row.installments && row.installments > 1 ? (
                        <Chip 
                          label={`${getInstallmentPosition(row, data) || 1} de ${row.installments} parcelas`} 
                          size="small" 
                          color="info" 
                        />
                      ) : (
                        <Chip label="À vista" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {row.receiptDate ? format(new Date(row.receiptDate), 'dd/MM/yyyy') : '—'}
                    </TableCell>
                    <TableCell>{row.nextPaymentDate ? format(new Date(row.nextPaymentDate), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={row.paymentStatus || 'N/A'} 
                        color={row.paymentStatus === 'CONFIRMED' ? 'success' : row.paymentStatus === 'OVERDUE' ? 'error' : 'warning'} 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Nenhum registro encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>
    </LocalizationProvider>
  );
} 