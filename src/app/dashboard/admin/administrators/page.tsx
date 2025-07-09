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
import { User, UserType, PaginatedResponse } from '../../../../types/api';
import { useDebounce } from '../../../../hooks/useDebounce';
import AdminForm from '../../../../components/Dashboard/Admin/AdminForm';

export default function AdminAdminsPage() {
  const { user, logout } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse<any>['pagination'], 'data'>>();

  const [loading, setLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [deletingAdmin, setDeletingAdmin] = useState<User | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = { 
        page: page + 1, 
        limit: rowsPerPage,
        userType: UserType.ADMIN,
        search: debouncedSearchTerm || undefined,
      };
      
      const response = await enduranceApi.getUsers(filters);
      setAdmins(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erro ao carregar administradores:', err);
      setError('Não foi possível carregar os dados dos administradores.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm]);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const handleOpenModal = (admin: User | null = null) => {
    setEditingAdmin(admin);
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
  };

  const handleFormSubmit = async (data: any) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingAdmin) {
        await enduranceApi.updateUser(editingAdmin.id, data);
      } else {
        await enduranceApi.createUser({ ...data, userType: UserType.ADMIN });
      }
      handleCloseModal();
      loadAdmins();
    } catch (err: any) {
      console.error('Erro ao salvar administrador:', err);
      setFormError(err.response?.data?.message || 'Não foi possível salvar os dados.');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteRequest = (admin: User) => {
    setDeletingAdmin(admin);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAdmin) return;
    setRowLoading(prev => ({ ...prev, [deletingAdmin.id]: true }));
    try {
      await enduranceApi.deleteUser(deletingAdmin.id);
      setDeletingAdmin(null);
      loadAdmins();
    } catch (err) {
      console.error('Erro ao deletar administrador:', err);
      setError('Não foi possível deletar o administrador.');
    } finally {
      setRowLoading(prev => ({ ...prev, [deletingAdmin.id]: false }));
    }
  };

  const handleToggleStatus = async (adminId: string, currentStatus: boolean) => {
    setRowLoading(prev => ({ ...prev, [adminId]: true }));
    try {
      await enduranceApi.updateUserStatus(adminId, !currentStatus);
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, isActive: !currentStatus } : a));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Não foi possível atualizar o status.');
    } finally {
      setRowLoading(prev => ({ ...prev, [adminId]: false }));
    }
  };
  
  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user!} onLogout={logout}>
        <Container maxWidth="xl">
          <PageHeader
            title="Gerenciar Administradores"
            description="Adicione, edite e gerencie os administradores da plataforma."
            actionComponent={
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                Novo Administrador
              </Button>
            }
          />

          <Paper sx={{ p: 3, mt: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={4}>
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
                        <TableCell>Data de Criação</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={admin.image} sx={{ width: 32, height: 32 }}>
                                {admin.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="body2">{admin.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell align="center">
                            {rowLoading[admin.id] ? (
                              <CircularProgress size={24} />
                            ) : (
                              <Switch
                                checked={admin.isActive}
                                onChange={() => handleToggleStatus(admin.id, admin.isActive)}
                                color="success"
                                disabled={user?.id === admin.id}
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleOpenModal(admin)}><EditIcon /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteRequest(admin)} disabled={user?.id === admin.id}><DeleteIcon /></IconButton>
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
          
          <AdminForm
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleFormSubmit}
            admin={editingAdmin}
            loading={formLoading}
            error={formError}
          />
          
          <Dialog open={!!deletingAdmin} onClose={() => setDeletingAdmin(null)}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Você tem certeza que deseja excluir o administrador <strong>{deletingAdmin?.name}</strong>? Esta ação não pode ser desfeita.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeletingAdmin(null)}>Cancelar</Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained">Excluir</Button>
            </DialogActions>
          </Dialog>

        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 