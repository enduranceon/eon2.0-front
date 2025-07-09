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
  Avatar,
  Box,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  Alert,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
  Link as LinkIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';
import { enduranceApi } from '../../../../services/enduranceApi';
import { User, UserType, Modalidade, Plan, PaginatedResponse } from '../../../../types/api';
import { useDebounce } from '../../../../hooks/useDebounce';
import CoachForm from '../../../../components/Dashboard/Admin/CoachForm';
import LinkManager from '../../../../components/Dashboard/Admin/LinkManager';

export default function AdminCoachesPage() {
  const { user, logout } = useAuth();
  const [coaches, setCoaches] = useState<User[]>([]);
  const [modalities, setModalities] = useState<Modalidade[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse<any>['pagination'], 'data'>>();

  const [loading, setLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<User | null>(null);
  const [deletingCoach, setDeletingCoach] = useState<User | null>(null);
  const [linkingCoach, setLinkingCoach] = useState<User | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModality, setSelectedModality] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const loadCoaches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = { page: page + 1, limit: rowsPerPage };
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
      if (selectedModality) filters.modalidadeId = selectedModality;
      if (selectedPlan) filters.planId = selectedPlan;
      
      const response = await enduranceApi.getCoaches(filters);
      setCoaches(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erro ao carregar treinadores:', err);
      setError('Não foi possível carregar os dados dos treinadores.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm, selectedModality, selectedPlan]);

  const loadAuxiliaryData = async () => {
    try {
      const [modalitiesRes, plansRes] = await Promise.all([
        enduranceApi.getModalidades(),
        enduranceApi.getPlans(),
      ]);
      setModalities(Array.isArray(modalitiesRes) ? modalitiesRes : modalitiesRes.data || []);
      setPlans(Array.isArray(plansRes) ? plansRes : plansRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados auxiliares:', err);
      setError('Não foi possível carregar os filtros.');
    }
  };

  useEffect(() => { loadAuxiliaryData(); }, []);
  useEffect(() => { loadCoaches(); }, [loadCoaches]);

  const handleOpenModal = (coach: User | null = null) => {
    setEditingCoach(coach);
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoach(null);
  };

  const handleFormSubmit = async (data: any) => {
    setFormLoading(true);
    setFormError(null);
    try {
      const payload = {
        ...data,
        certifications: data.certifications ? data.certifications.split(',').map((c: string) => c.trim()) : [],
      };

      if (editingCoach) {
        await enduranceApi.updateUser(editingCoach.id, payload);
      } else {
        await enduranceApi.createUser({ ...payload, userType: UserType.COACH });
      }
      handleCloseModal();
      loadCoaches();
    } catch (err: any) {
      console.error('Erro ao salvar treinador:', err);
      setFormError(err.response?.data?.message || 'Não foi possível salvar os dados.');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteRequest = (coach: User) => {
    setDeletingCoach(coach);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCoach) return;
    setRowLoading(prev => ({ ...prev, [deletingCoach.id]: true }));
    try {
      await enduranceApi.deleteUser(deletingCoach.id);
      setDeletingCoach(null);
      loadCoaches();
    } catch (err) {
      console.error('Erro ao deletar treinador:', err);
      setError('Não foi possível deletar o treinador.');
    } finally {
      setRowLoading(prev => ({ ...prev, [deletingCoach.id]: false }));
    }
  };

  const handleToggleStatus = async (coachId: string, currentStatus: boolean) => {
    setRowLoading(prev => ({ ...prev, [coachId]: true }));
    try {
      await enduranceApi.updateUserStatus(coachId, !currentStatus);
      setCoaches(prev => prev.map(c => c.id === coachId ? { ...c, isActive: !currentStatus } : c));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Não foi possível atualizar o status.');
    } finally {
      setRowLoading(prev => ({ ...prev, [coachId]: false }));
    }
  };
  
  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user!} onLogout={logout}>
        <Container maxWidth="xl">
          <PageHeader
            title="Gerenciar Treinadores"
            description="Visualize, adicione, edite e gerencie os treinadores da plataforma."
            actionComponent={
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                Novo Treinador
              </Button>
            }
          />

          <Paper sx={{ p: 3, mt: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por nome ou email..."
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
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Modalidade</InputLabel>
                  <Select value={selectedModality} label="Modalidade" onChange={(e) => setSelectedModality(e.target.value)}>
                    <MenuItem value=""><em>Todas</em></MenuItem>
                    {modalities.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                  </Select>
                  {selectedModality && (
                    <IconButton
                      onClick={() => setSelectedModality('')}
                      size="small"
                      sx={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Plano</InputLabel>
                  <Select value={selectedPlan} label="Plano" onChange={(e) => setSelectedPlan(e.target.value)}>
                    <MenuItem value=""><em>Todos</em></MenuItem>
                    {plans.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                  {selectedPlan && (
                    <IconButton
                      onClick={() => setSelectedPlan('')}
                      size="small"
                      sx={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                </FormControl>
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
                        <TableCell>Email</TableCell>
                        <TableCell>Nível</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {coaches.map((coach) => (
                        <TableRow key={coach.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={coach.image} sx={{ width: 32, height: 32 }}>
                                {coach.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2">{coach.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{coach.email}</TableCell>
                          <TableCell>{coach.coachLevel || 'N/A'}</TableCell>
                          <TableCell align="center">
                            {rowLoading[coach.id] ? (
                              <CircularProgress size={24} />
                            ) : (
                              <Switch
                                checked={coach.isActive}
                                onChange={() => handleToggleStatus(coach.id, coach.isActive)}
                                color="success"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => setLinkingCoach(coach)} title="Gerenciar Vínculos">
                              <LinkIcon />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleOpenModal(coach)}><EditIcon /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteRequest(coach)}><DeleteIcon /></IconButton>
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
          
          <CoachForm
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleFormSubmit}
            coach={editingCoach}
            loading={formLoading}
            error={formError}
            onDataChange={loadCoaches}
          />
          
          <Dialog open={!!deletingCoach} onClose={() => setDeletingCoach(null)}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Você tem certeza que deseja excluir o treinador <strong>{deletingCoach?.name}</strong>? Esta ação não pode ser desfeita.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeletingCoach(null)}>Cancelar</Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained">Excluir</Button>
            </DialogActions>
          </Dialog>

          {linkingCoach && (
            <LinkManager
              open={!!linkingCoach}
              onClose={() => setLinkingCoach(null)}
              coach={linkingCoach}
              onDataChange={loadCoaches}
            />
          )}

        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 