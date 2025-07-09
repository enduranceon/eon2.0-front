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
} from '@mui/icons-material';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';
import { enduranceApi } from '../../../../services/enduranceApi';
import { Exam, Modalidade, PaginatedResponse } from '../../../../types/api';
import { useDebounce } from '../../../../hooks/useDebounce';
import ExamForm from '../../../../components/Dashboard/Admin/ExamForm';

export default function AdminExamsPage() {
  const { user, logout } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [modalities, setModalities] = useState<Modalidade[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse<any>['pagination'], 'data'>>();

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = { 
        page: page + 1, 
        limit: rowsPerPage,
        search: debouncedSearchTerm || undefined,
        modalidadeId: modalityFilter || undefined,
      };
      
      const response = await enduranceApi.getExams(filters);
      setExams(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
      setError('Não foi possível carregar os dados dos eventos.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm, modalityFilter]);
  
  const loadModalities = useCallback(async () => {
    try {
      const response = await enduranceApi.getModalidades({ limit: 100 });
      setModalities(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      console.error('Erro ao carregar modalidades:', err);
    }
  }, []);

  useEffect(() => { 
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    loadModalities();
  }, [loadModalities]);

  const handleOpenModal = (exam: Exam | null = null) => {
    setEditingExam(exam);
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleFormSubmit = async (data: any) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingExam) {
        await enduranceApi.updateExam(editingExam.id, data);
      } else {
        await enduranceApi.createExam(data);
      }
      handleCloseModal();
      loadExams();
    } catch (err: any) {
      console.error('Erro ao salvar evento:', err);
      setFormError(err.response?.data?.message || 'Não foi possível salvar os dados.');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteRequest = (exam: Exam) => {
    setDeletingExam(exam);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExam) return;
    try {
      await enduranceApi.deleteExam(deletingExam.id);
      setDeletingExam(null);
      loadExams();
    } catch (err) {
      console.error('Erro ao deletar evento:', err);
      setError('Não foi possível deletar o evento.');
    }
  };

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN', 'COACH']}>
      <DashboardLayout user={user!} onLogout={logout}>
        <Container maxWidth="xl">
          <PageHeader
            title="Gerenciar Eventos (Provas)"
            description="Crie, edite e gerencie os eventos e provas da plataforma."
            actionComponent={
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                Novo Evento
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
                  <InputLabel>Modalidade</InputLabel>
                  <Select
                    value={modalityFilter}
                    label="Modalidade"
                    onChange={(e) => setModalityFilter(e.target.value)}
                  >
                    <MenuItem value=""><em>Todas</em></MenuItem>
                    {modalities.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {modalityFilter && (
                <Grid item xs="auto">
                  <Button onClick={() => setModalityFilter('')} startIcon={<ClearIcon />}>Limpar</Button>
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
                        <TableCell>Nome do Evento</TableCell>
                        <TableCell>Modalidade</TableCell>
                        <TableCell>Data</TableCell>
                        <TableCell>Local</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exams.map((exam) => (
                        <TableRow key={exam.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{exam.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={exam.modalidade.name} size="small" />
                          </TableCell>
                          <TableCell>{new Date(exam.date).toLocaleString('pt-BR')}</TableCell>
                          <TableCell>{exam.location}</TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleOpenModal(exam)}><EditIcon /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteRequest(exam)}><DeleteIcon /></IconButton>
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
          
          <ExamForm
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleFormSubmit}
            exam={editingExam}
            loading={formLoading}
            error={formError}
          />
          
          <Dialog open={!!deletingExam} onClose={() => setDeletingExam(null)}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Você tem certeza que deseja excluir o evento <strong>{deletingExam?.name}</strong>?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeletingExam(null)}>Cancelar</Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained">Excluir</Button>
            </DialogActions>
          </Dialog>

        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 