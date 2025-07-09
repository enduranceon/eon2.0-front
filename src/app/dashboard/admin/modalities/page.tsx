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
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';
import { enduranceApi } from '../../../../services/enduranceApi';
import { Modalidade, PaginatedResponse } from '../../../../types/api';
import { useDebounce } from '../../../../hooks/useDebounce';
import ModalityForm from '../../../../components/Dashboard/Admin/ModalityForm';

export default function AdminModalitiesPage() {
  const { user, logout } = useAuth();
  const [modalities, setModalities] = useState<Modalidade[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse<any>['pagination'], 'data'>>();

  const [loading, setLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModality, setEditingModality] = useState<Modalidade | null>(null);
  const [deletingModality, setDeletingModality] = useState<Modalidade | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const loadModalities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = { 
        page: page + 1, 
        limit: rowsPerPage,
        search: debouncedSearchTerm || undefined,
      };
      
      const response = await enduranceApi.getModalidades(filters);
      setModalities(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erro ao carregar modalidades:', err);
      setError('Não foi possível carregar os dados das modalidades.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm]);

  useEffect(() => { loadModalities(); }, [loadModalities]);

  const handleOpenModal = (modality: Modalidade | null = null) => {
    setEditingModality(modality);
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingModality(null);
  };

  const handleFormSubmit = async (data: any) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingModality) {
        await enduranceApi.updateModalidade(editingModality.id, data);
      } else {
        await enduranceApi.createModalidade(data);
      }
      handleCloseModal();
      loadModalities();
    } catch (err: any) {
      console.error('Erro ao salvar modalidade:', err);
      setFormError(err.response?.data?.message || 'Não foi possível salvar os dados.');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteRequest = (modality: Modalidade) => {
    setDeletingModality(modality);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingModality) return;
    setRowLoading(prev => ({ ...prev, [deletingModality.id]: true }));
    try {
      await enduranceApi.deleteModalidade(deletingModality.id);
      setDeletingModality(null);
      loadModalities();
    } catch (err) {
      console.error('Erro ao deletar modalidade:', err);
      setError('Não foi possível deletar a modalidade.');
    } finally {
      if(deletingModality) {
        setRowLoading(prev => ({ ...prev, [deletingModality.id]: false }));
      }
    }
  };

  const handleToggleStatus = async (modalityId: string, currentStatus: boolean) => {
    setRowLoading(prev => ({ ...prev, [modalityId]: true }));
    try {
      await enduranceApi.updateModalidade(modalityId, { isActive: !currentStatus });
      setModalities(prev => prev.map(m => m.id === modalityId ? { ...m, isActive: !currentStatus } : m));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Não foi possível atualizar o status da modalidade.');
    } finally {
      setRowLoading(prev => ({ ...prev, [modalityId]: false }));
    }
  };
  
  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user!} onLogout={logout}>
        <Container maxWidth="xl">
          <PageHeader
            title="Gerenciar Modalidades"
            description="Adicione, edite e gerencie as modalidades de treino da plataforma."
            actionComponent={
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                Nova Modalidade
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
                        <TableCell>Nome</TableCell>
                        <TableCell sx={{ width: '50%' }}>Descrição</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modalities.map((modality) => (
                        <TableRow key={modality.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{modality.name}</Typography>
                          </TableCell>
                          <TableCell>{modality.description}</TableCell>
                          <TableCell align="center">
                            {rowLoading[modality.id] ? (
                              <CircularProgress size={24} />
                            ) : (
                              <Switch
                                checked={modality.isActive}
                                onChange={() => handleToggleStatus(modality.id, modality.isActive)}
                                color="success"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleOpenModal(modality)}><EditIcon /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteRequest(modality)}><DeleteIcon /></IconButton>
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
          
          <ModalityForm
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleFormSubmit}
            modality={editingModality}
            loading={formLoading}
            error={formError}
          />
          
          <Dialog open={!!deletingModality} onClose={() => setDeletingModality(null)}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Você tem certeza que deseja excluir a modalidade <strong>{deletingModality?.name}</strong>? Esta ação não pode ser desfeita.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeletingModality(null)}>Cancelar</Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained">Excluir</Button>
            </DialogActions>
          </Dialog>

        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 