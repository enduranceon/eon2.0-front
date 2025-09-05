'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  Alert,
  Grid,
  TablePagination,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { Snackbar } from '@mui/material';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';
import { enduranceApi } from '../../../../services/enduranceApi';
import { Plan, PaginatedResponse } from '../../../../types/api';
import { useDebounce } from '../../../../hooks/useDebounce';
import PlanForm from '../../../../components/Dashboard/Admin/PlanForm';

export default function AdminPlansPage() {
  const { user, logout } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse<any>['pagination'], 'data'>>();

  const [loading, setLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = { 
        page: page + 1, 
        limit: rowsPerPage,
        search: debouncedSearchTerm || undefined,
      };
      
      const response = await enduranceApi.getPlans(filters);
      setPlans(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
      setError('Não foi possível carregar os dados dos planos.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  const handleOpenModal = (plan: Plan | null = null) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleFormSubmit = async (data: any) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingPlan) {
        await enduranceApi.updatePlan(editingPlan.id, data);
      } else {
        await enduranceApi.createPlan(data);
      }
      handleCloseModal();
      loadPlans();
    } catch (err: any) {
      console.error('Erro ao salvar plano:', err);
      setFormError(err.response?.data?.message || 'Não foi possível salvar os dados.');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteRequest = (plan: Plan) => {
    setDeletingPlan(plan);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlan) return;
    setRowLoading(prev => ({ ...prev, [deletingPlan.id]: true }));
    try {
      await enduranceApi.deletePlan(deletingPlan.id);
      setDeletingPlan(null);
      loadPlans();
    } catch (err) {
      console.error('Erro ao deletar plano:', err);
      setError('Não foi possível deletar o plano.');
    } finally {
      if(deletingPlan) {
        setRowLoading(prev => ({ ...prev, [deletingPlan.id]: false }));
      }
    }
  };

  const handleToggleStatus = async (planId: string, currentStatus: boolean) => {
    setRowLoading(prev => ({ ...prev, [planId]: true }));
    try {
      await enduranceApi.updatePlan(planId, { isActive: !currentStatus });
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, isActive: !currentStatus } : p));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Não foi possível atualizar o status do plano.');
    } finally {
      setRowLoading(prev => ({ ...prev, [planId]: false }));
    }
  };

  const handleToggleForSale = async (planId: string, currentForSale: boolean) => {
    setRowLoading(prev => ({ ...prev, [planId]: true }));
    try {
      await enduranceApi.updatePlan(planId, { forSale: !currentForSale });
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, forSale: !currentForSale } : p));
    } catch (err) {
      console.error('Erro ao atualizar disponibilidade para venda:', err);
      setError('Não foi possível atualizar a disponibilidade para venda do plano.');
    } finally {
      setRowLoading(prev => ({ ...prev, [planId]: false }));
    }
  };

  const generateShareLink = (planId: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareLink = `${baseUrl}/plano/${planId}`;
    
    // Copiar para a área de transferência
    navigator.clipboard.writeText(shareLink).then(() => {
      setSnackbarMessage('Link copiado para a área de transferência!');
      setSnackbarOpen(true);
    }).catch(err => {
      console.error('Erro ao copiar link:', err);
      setSnackbarMessage('Erro ao copiar link');
      setSnackbarOpen(true);
    });
  };
  
  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user!} onLogout={logout}>
        <Container maxWidth="xl">
          <PageHeader
            title="Gerenciar Planos"
            description="Crie, edite e gerencie os planos de assinatura da plataforma."
            actionComponent={
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                Novo Plano
              </Button>
            }
          />

          <Paper sx={{ p: 3, mt: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setSearchTerm('')} edge="end" size="small">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nome do Plano</TableCell>
                        <TableCell>Modalidades</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Disponível para Venda</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {plans.map((plan) => (
                        <TableRow key={plan.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{plan.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {plan.modalidades.map(({ modalidade }) => (
                                <Chip key={modalidade.id} label={modalidade.name} size="small" />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            {rowLoading[plan.id] ? (
                              <CircularProgress size={24} />
                            ) : (
                              <Switch
                                checked={plan.isActive}
                                onChange={() => handleToggleStatus(plan.id, plan.isActive)}
                                color="success"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {rowLoading[plan.id] ? (
                              <CircularProgress size={24} />
                            ) : (
                              <Switch
                                checked={plan.forSale}
                                onChange={() => handleToggleForSale(plan.id, plan.forSale)}
                                color="primary"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleOpenModal(plan)}><EditIcon /></IconButton>
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={() => generateShareLink(plan.id)}
                              title="Gerar link de compartilhamento"
                            >
                              <ShareIcon />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteRequest(plan)}><DeleteIcon /></IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={pagination?.total || 0}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50]}
                />
              </>
            )}
          </Paper>
          
          <PlanForm
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleFormSubmit}
            plan={editingPlan}
            loading={formLoading}
            error={formError}
          />
          
          <Dialog open={!!deletingPlan} onClose={() => setDeletingPlan(null)}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Você tem certeza que deseja excluir o plano <strong>{deletingPlan?.name}</strong>? Esta ação não pode ser desfeita.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeletingPlan(null)}>Cancelar</Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained">Excluir</Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
          />

        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 