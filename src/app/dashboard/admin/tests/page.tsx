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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';
import { enduranceApi } from '../../../../services/enduranceApi';
import { AvailableTest, TestType, PaginatedResponse } from '../../../../types/api';
import { useDebounce } from '../../../../hooks/useDebounce';
import TestForm from '../../../../components/Dashboard/Admin/TestForm';
import TestResultsViewer from '../../../../components/Dashboard/Admin/TestResultsViewer';

export default function AdminTestsPage() {
  const { user, logout } = useAuth();
  const [tests, setTests] = useState<AvailableTest[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse<any>['pagination'], 'data'>>();

  const [loading, setLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<AvailableTest | null>(null);
  const [deletingTest, setDeletingTest] = useState<AvailableTest | null>(null);
  const [viewingResults, setViewingResults] = useState<AvailableTest | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = { 
        page: page + 1, 
        limit: rowsPerPage,
        search: debouncedSearchTerm || undefined,
        testType: testTypeFilter || undefined,
      };
      
      const response = await enduranceApi.getAvailableTests(filters);
      setTests(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erro ao carregar testes:', err);
      setError('Não foi possível carregar os dados dos testes.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm, testTypeFilter]);

  useEffect(() => { 
    loadTests();
  }, [loadTests]);

  const handleOpenModal = (test: AvailableTest | null = null) => {
    setEditingTest(test);
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTest(null);
  };

  const handleFormSubmit = async (data: any) => {
    setFormLoading(true);
    setFormError(null);
    try {
      // Processar dados antes de enviar
      const processedData = {
        name: data.name,
        description: data.description,
        testType: String(data.type), // Converter para string
        isActive: data.isActive
      };

     

      if (editingTest) {
        await enduranceApi.updateTest(editingTest.id, processedData);
      } else {
        await enduranceApi.createTest(processedData);
      }
      handleCloseModal();
      loadTests();
    } catch (err: any) {
      console.error('Erro ao salvar teste:', err);
      setFormError(err.response?.data?.message || 'Não foi possível salvar os dados.');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteRequest = (test: AvailableTest) => {
    setDeletingTest(test);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTest) return;
    setRowLoading(prev => ({ ...prev, [deletingTest.id]: true }));
    try {
      await enduranceApi.deleteTest(deletingTest.id);
      setDeletingTest(null);
      loadTests();
    } catch (err) {
      console.error('Erro ao deletar teste:', err);
      setError('Não foi possível deletar o teste.');
    } finally {
      if(deletingTest) {
        setRowLoading(prev => ({ ...prev, [deletingTest.id]: false }));
      }
    }
  };

  const handleToggleStatus = async (testId: string, currentStatus: boolean) => {
    setRowLoading(prev => ({ ...prev, [testId]: true }));
    try {
      await enduranceApi.updateTest(testId, { isActive: !currentStatus });
      setTests(prev => prev.map(t => t.id === testId ? { ...t, isActive: !currentStatus } : t));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Não foi possível atualizar o status do teste.');
    } finally {
      setRowLoading(prev => ({ ...prev, [testId]: false }));
    }
  };

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN', 'COACH']}>
      <DashboardLayout user={user!} onLogout={logout}>
        <Container maxWidth="xl">
          <PageHeader
            title="Gerenciar Testes"
            description="Crie, edite e gerencie os testes físicos e de performance da plataforma."
            actionComponent={
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                Novo Teste
              </Button>
            }
          />

          <Paper sx={{ p: 3, mt: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>),
                    endAdornment: searchTerm && ( <IconButton onClick={() => setSearchTerm('')}><ClearIcon /></IconButton> )
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Teste</InputLabel>
                  <Select
                    value={testTypeFilter}
                    label="Tipo de Teste"
                    onChange={(e) => setTestTypeFilter(e.target.value)}
                  >
                    <MenuItem value=""><em>Todos</em></MenuItem>
                    {Object.values(TestType).map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {(searchTerm || testTypeFilter) && (
                 <Grid item xs="auto">
                    <Button onClick={() => { setSearchTerm(''); setTestTypeFilter(''); }} startIcon={<ClearIcon />}>Limpar Filtros</Button>
                </Grid>
              )}
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
                        <TableCell>Nome do Teste</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tests.map((test) => (
                        <TableRow key={test.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{test.name}</Typography>
                            {test.description && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {test.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip label={test.type} size="small" />
                          </TableCell>
                          <TableCell align="center">
                            {rowLoading[test.id] ? (
                              <CircularProgress size={24} />
                            ) : (
                              <Switch
                                checked={test.isActive}
                                onChange={() => handleToggleStatus(test.id, test.isActive)}
                                color="success"
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleOpenModal(test)}><EditIcon /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteRequest(test)}><DeleteIcon /></IconButton>
                            <IconButton size="small" color="info" onClick={() => setViewingResults(test)}><VisibilityIcon /></IconButton>
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
          
          <TestForm
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleFormSubmit}
            test={editingTest}
            loading={formLoading}
            error={formError}
          />
          
          <TestResultsViewer
            open={!!viewingResults}
            onClose={() => setViewingResults(null)}
            test={viewingResults}
          />
          
          <Dialog open={!!deletingTest} onClose={() => setDeletingTest(null)}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Você tem certeza que deseja excluir o teste <strong>{deletingTest?.name}</strong>?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeletingTest(null)}>Cancelar</Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained">Excluir</Button>
            </DialogActions>
          </Dialog>

        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 