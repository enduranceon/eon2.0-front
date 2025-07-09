'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Alert,
  Grid,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  TablePagination,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSnackbar } from 'notistack';

import ProtectedRoute from '../../../../components/ProtectedRoute';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';
import { useDebounce } from '../../../../hooks/useDebounce';
import { enduranceApi } from '../../../../services/enduranceApi';
import { Margin, Plan, CoachLevel, SplitResult } from '../../../../types/api';
import MarginForm from '../../../../components/Dashboard/Admin/MarginForm';

const coachLevels = Object.values(CoachLevel);

const splitSchema = z.object({
  planId: z.string().min(1, 'Selecione um plano'),
  coachLevel: z.nativeEnum(CoachLevel, { errorMap: () => ({ message: "Selecione um nível" }) }),
  amount: z.number().positive('O valor deve ser positivo'),
});

type SplitFormData = z.infer<typeof splitSchema>;

function MarginsPageContent() {
  const [margins, setMargins] = useState<Margin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [filters, setFilters] = useState<{ planId?: string; coachLevel?: string }>({});
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMargin, setSelectedMargin] = useState<Margin | null>(null);

  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const { control: splitControl, handleSubmit: handleSplitSubmit, reset: resetSplitForm } = useForm<SplitFormData>({
    resolver: zodResolver(splitSchema),
    defaultValues: {
      planId: '',
      amount: 0.0,
    },
  });

  const loadMargins = useCallback(async () => {
    setLoading(true);
    try {
      const response = await enduranceApi.getMargins({
        page: page + 1,
        limit: rowsPerPage,
        planId: filters.planId || undefined,
        coachLevel: filters.coachLevel || undefined,
      });
      setMargins(response.data);
      setTotalRows(response.pagination.total);
    } catch (err) {
      setError('Erro ao carregar as margens.');
      enqueueSnackbar('Erro ao carregar as margens.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters, enqueueSnackbar]);

  useEffect(() => {
    loadMargins();
  }, [loadMargins]);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await enduranceApi.getPlans({ limit: 100 }); // Pega todos os planos
        setPlans(response.data);
      } catch (err) {
        enqueueSnackbar('Erro ao carregar planos para os filtros.', { variant: 'warning' });
      }
    }
    fetchPlans();
  }, [enqueueSnackbar]);

  const handleFilterChange = (key: 'planId' | 'coachLevel', value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };
  
  const handleOpenModal = (margin: Margin | null = null) => {
    setSelectedMargin(margin);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMargin(null);
    loadMargins();
  };

  const handleClearFilters = () => {
    setFilters({});
    setPage(0);
  };

  const handleClearSplit = () => {
    setSplitResult(null);
    resetSplitForm();
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta margem?')) {
      try {
        await enduranceApi.deleteMargin(id);
        enqueueSnackbar('Margem removida com sucesso!', { variant: 'success' });
        loadMargins();
      } catch (error) {
        enqueueSnackbar('Erro ao remover a margem.', { variant: 'error' });
      }
    }
  };

  const handleCalculateSplit = async (data: SplitFormData) => {
    setCalculating(true);
    setSplitResult(null);
    try {
      const params = {
        planId: data.planId,
        coachLevel: data.coachLevel,
        amount: Number(data.amount)
      };
      const result = await enduranceApi.calculateSplit(params);
      setSplitResult(result);
    } catch (error) {
      enqueueSnackbar('Erro ao calcular o split. Verifique se existe uma margem para a combinação selecionada.', { variant: 'error' });
    } finally {
      setCalculating(false);
    }
  };

  const areFiltersActive = !!filters.planId || !!filters.coachLevel;

  return (
    <Box>
      <PageHeader
        title="Gestão de Margens e Comissões"
        description="Defina e simule as margens de lucro para cada plano e nível de treinador."
        actionComponent={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
          >
            Nova Margem
          </Button>
        }
      />

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Card>
            <form onSubmit={handleSplitSubmit(handleCalculateSplit)}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Calculadora de Split
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="planId"
                      control={splitControl}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          label="Plano"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        >
                          {plans.map((plan) => (
                            <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="coachLevel"
                      control={splitControl}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          label="Nível do Treinador"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        >
                          {coachLevels.map((level) => (
                            <MenuItem key={level} value={String(level)}>{level}</MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="amount"
                      control={splitControl}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Valor do Pagamento (R$)"
                          type="number"
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, gap: 1 }}>
                {splitResult && (
                  <Button onClick={handleClearSplit} color="secondary">
                    Limpar Resultado
                  </Button>
                )}
                <Button type="submit" variant="contained" disabled={calculating}>
                  {calculating ? <CircularProgress size={24} /> : 'Calcular'}
                </Button>
              </CardActions>
            </form>
            {splitResult && (
              <Box p={2} borderTop={1} borderColor="divider">
                <Typography variant="h6" gutterBottom>Resultado</Typography>
                <Typography>Valor Total: <strong>R$ {splitResult.totalAmount.toFixed(2)}</strong></Typography>
                <Typography>Comissão Treinador ({splitResult.coachPercentage}%): <strong>R$ {splitResult.coachAmount.toFixed(2)}</strong></Typography>
                <Typography color="primary.main">Valor Plataforma: <strong>R$ {splitResult.platformAmount.toFixed(2)}</strong></Typography>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper>
            <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Margens Configuradas</Typography>
              <Tooltip title="Recarregar dados">
                <IconButton onClick={loadMargins}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Box p={2} display="flex" gap={2} alignItems="center">
              <TextField
                  select
                  label="Filtrar por Plano"
                  value={filters.planId || ''}
                  onChange={(e) => handleFilterChange('planId', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">Todos os Planos</MenuItem>
                  {plans.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Filtrar por Nível"
                  value={filters.coachLevel || ''}
                  onChange={(e) => handleFilterChange('coachLevel', e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">Todos os Níveis</MenuItem>
                  {coachLevels.map((level) => (
                    <MenuItem key={level} value={String(level)}>{level}</MenuItem>
                  ))}
                </TextField>
                {areFiltersActive && (
                  <Button 
                    onClick={handleClearFilters}
                    variant="outlined"
                  >
                    Limpar Filtros
                  </Button>
                )}
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Plano</TableCell>
                    <TableCell>Nível do Treinador</TableCell>
                    <TableCell align="right">Margem (%)</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center"><CircularProgress /></TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center"><Alert severity="error">{error}</Alert></TableCell>
                    </TableRow>
                  ) : margins.map((margin) => (
                    <TableRow key={margin.id}>
                      <TableCell>{margin.plan?.name || 'N/A'}</TableCell>
                      <TableCell>{margin.coachLevel}</TableCell>
                      <TableCell align="right">{Number(margin.percentage).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="body2"
                          sx={{
                            color: margin.isActive ? 'success.main' : 'error.main',
                            fontWeight: 'bold',
                          }}
                        >
                          {margin.isActive ? 'Ativa' : 'Inativa'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton onClick={() => handleOpenModal(margin)}><EditIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Remover">
                          <IconButton onClick={() => handleDelete(margin.id)}><DeleteIcon /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
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
              rowsPerPageOptions={[5, 10, 25]}
            />
          </Paper>
        </Grid>
      </Grid>
      
      <MarginForm
        open={isModalOpen}
        onClose={handleCloseModal}
        margin={selectedMargin}
      />
    </Box>
  );
}

export default function MarginsPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return <CircularProgress />;
  }
  
  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user} onLogout={logout}>
        <MarginsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
} 