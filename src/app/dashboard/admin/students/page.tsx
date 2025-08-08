'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  DialogActions,
  Checkbox,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';
import { enduranceApi } from '../../../../services/enduranceApi';
import { User, UserType, Modalidade, PaginatedResponse, Plan } from '../../../../types/api';
import StudentForm from '../../../../components/Dashboard/Admin/StudentForm';
import { useDebounce } from '../../../../hooks/useDebounce'; // Assuming a debounce hook exists

const calculateAge = (birthDate: string | null) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export default function AdminStudentsPage() {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
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
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<User | null>(null);
  // Change coach modal
  const [isChangeCoachOpen, setIsChangeCoachOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<User | null>(null);
  const [selectedNewCoachId, setSelectedNewCoachId] = useState<string>('');
  const [applyToAllSubscriptions, setApplyToAllSubscriptions] = useState<boolean>(true);
  const [changeCoachLoading, setChangeCoachLoading] = useState<boolean>(false);
  const [changeCoachError, setChangeCoachError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [age, setAge] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('');
  const [selectedModality, setSelectedModality] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = { 
        userType: UserType.FITNESS_STUDENT, 
        page: page + 1, 
        limit: rowsPerPage 
      };
      if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
      if (age) filters.age = parseInt(age, 10);
      if (selectedCoach) filters.coachId = selectedCoach;
      if (selectedModality) filters.modalidadeId = selectedModality;
      if (selectedPlan) filters.planId = selectedPlan;
      
      const response = await enduranceApi.getUsers(filters);
      setStudents(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Erro ao carregar alunos:', err);
      setError('Não foi possível carregar os dados dos alunos.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearchTerm, age, selectedCoach, selectedModality, selectedPlan]);

  const loadAuxiliaryData = async () => {
    try {
      const [coachesRes, modalitiesRes, plansRes] = await Promise.all([
        enduranceApi.getCoaches({ limit: 100 }),
        enduranceApi.getModalidades(),
        enduranceApi.getPlans(),
      ]);
      setCoaches(coachesRes.data);
      setModalities(Array.isArray(modalitiesRes) ? modalitiesRes : modalitiesRes.data || []);
      setPlans(Array.isArray(plansRes) ? plansRes : plansRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados auxiliares:', err);
      setError('Não foi possível carregar os filtros.');
    }
  };

  useEffect(() => {
    loadAuxiliaryData();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleOpenModal = (student: User | null = null) => {
    setEditingStudent(student);
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleOpenChangeCoach = (student: User) => {
    setTargetStudent(student);
    setSelectedNewCoachId('');
    setApplyToAllSubscriptions(true);
    setChangeCoachError(null);
    setIsChangeCoachOpen(true);
  };

  const handleCloseChangeCoach = () => {
    setIsChangeCoachOpen(false);
    setTargetStudent(null);
    setSelectedNewCoachId('');
    setApplyToAllSubscriptions(true);
    setChangeCoachError(null);
  };

  const handleConfirmChangeCoach = async () => {
    if (!targetStudent || !selectedNewCoachId) return;
    setChangeCoachLoading(true);
    setChangeCoachError(null);
    try {
      const updatedCount = await enduranceApi.changeStudentCoach(
        targetStudent.id,
        selectedNewCoachId,
        applyToAllSubscriptions,
      );
      setSuccessMessage(`Treinador alterado com sucesso em ${updatedCount} assinatura(s).`);
      handleCloseChangeCoach();
      await loadStudents();
    } catch (err: any) {
      console.error('Erro ao alterar treinador:', err);
      setChangeCoachError(err?.response?.data?.message || 'Não foi possível alterar o treinador.');
    } finally {
      setChangeCoachLoading(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    setFormLoading(true);
    setFormError(null);
    try {
      if (editingStudent) {
        await enduranceApi.updateUser(editingStudent.id, {
          name: data.name,
          phone: data.phone,
          cpfCnpj: data.cpfCnpj,
          birthDate: data.birthDate || null,
        });
      } else {
        await enduranceApi.createUser({
          ...data,
          userType: UserType.FITNESS_STUDENT,
        });
      }
      handleCloseModal();
      loadStudents(); // Recarrega os dados para mostrar as mudanças
    } catch (err: any) {
      console.error('Erro ao salvar aluno:', err);
      setFormError(err.response?.data?.message || 'Não foi possível salvar os dados.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRequest = (student: User) => {
    setDeletingStudent(student);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    setRowLoading(prev => ({ ...prev, [deletingStudent.id]: true }));
    try {
      await enduranceApi.deleteUser(deletingStudent.id);
      setDeletingStudent(null);
      loadStudents();
    } catch (err) {
      console.error('Erro ao deletar aluno:', err);
      setError('Não foi possível deletar o aluno.');
    } finally {
      setRowLoading(prev => ({ ...prev, [deletingStudent.id]: false }));
    }
  };

  const handleToggleStatus = async (studentId: string, currentStatus: boolean) => {
    setRowLoading(prev => ({ ...prev, [studentId]: true }));
    try {
      await enduranceApi.updateUserStatus(studentId, !currentStatus);
      setStudents(prev => 
        prev.map(s => s.id === studentId ? { ...s, isActive: !currentStatus } : s)
      );
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Não foi possível atualizar o status.');
    } finally {
      setRowLoading(prev => ({ ...prev, [studentId]: false }));
    }
  };
  
  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user!} onLogout={logout}>
        <Container maxWidth="xl">
          <PageHeader
            title="Gerenciar Alunos"
            description="Visualize, adicione, edite ou remova alunos da plataforma."
            actionComponent={
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
                Novo Aluno
              </Button>
            }
          />

          <Paper sx={{ p: 3, mt: 3 }}>
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
                {successMessage}
              </Alert>
            )}
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
              <Grid item xs={12} md={2}>
                 <TextField
                    fullWidth
                    size="small"
                    label="Idade"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    InputProps={{
                      endAdornment: age && (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setAge('')} edge="end" size="small">
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                 />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Plano</InputLabel>
                  <Select value={selectedPlan} label="Plano" onChange={(e) => setSelectedPlan(e.target.value)}>
                    <MenuItem value=""><em>Todos</em></MenuItem>
                    {plans.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                  {selectedPlan && (
                    <IconButton
                      aria-label="Limpar filtro de plano"
                      onClick={() => setSelectedPlan('')}
                      size="small"
                      sx={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Treinador</InputLabel>
                  <Select value={selectedCoach} label="Treinador" onChange={(e) => setSelectedCoach(e.target.value)}>
                    <MenuItem value=""><em>Todos</em></MenuItem>
                    {coaches.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                   {selectedCoach && (
                    <IconButton
                      aria-label="Limpar filtro de treinador"
                      onClick={() => setSelectedCoach('')}
                      size="small"
                      sx={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)' }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                 <FormControl fullWidth size="small">
                  <InputLabel>Modalidade</InputLabel>
                  <Select value={selectedModality} label="Modalidade" onChange={(e) => setSelectedModality(e.target.value)}>
                    <MenuItem value=""><em>Todas</em></MenuItem>
                    {modalities.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                  </Select>
                  {selectedModality && (
                    <IconButton
                      aria-label="Limpar filtro de modalidade"
                      onClick={() => setSelectedModality('')}
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
                        <TableCell>Idade</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell>Plano</TableCell>
                        <TableCell>Modalidade</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>{student.name.charAt(0).toUpperCase()}</Avatar>
                              <Typography variant="body2">{student.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{calculateAge(student.birthDate)}</TableCell>
                          <TableCell align="center">
                            {rowLoading[student.id] ? (
                              <CircularProgress size={24} />
                            ) : (
                              <Switch
                                checked={student.isActive}
                                onChange={() => handleToggleStatus(student.id, student.isActive)}
                                color="success"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {student.subscriptions && student.subscriptions.length > 0
                                ? student.subscriptions[0].plan.name
                                : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {student.subscriptions && student.subscriptions.length > 0
                                ? student.subscriptions[0].modalidade.name
                                : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Alterar Treinador">
                              <IconButton size="small" color="primary" onClick={() => handleOpenChangeCoach(student)}>
                                <SwapHorizIcon />
                              </IconButton>
                            </Tooltip>
                            <IconButton size="small" onClick={() => handleOpenModal(student)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteRequest(student)}>
                              <DeleteIcon />
                            </IconButton>
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
                  onPageChange={handlePageChange}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleRowsPerPageChange}
                  rowsPerPageOptions={[10, 25, 50]}
                />
              </>
            )}
          </Paper>

          <StudentForm
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleFormSubmit}
            student={editingStudent}
            loading={formLoading}
            error={formError}
          />

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={!!deletingStudent}
            onClose={() => setDeletingStudent(null)}
          >
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Você tem certeza que deseja excluir o aluno <strong>{deletingStudent?.name}</strong>? Esta ação não pode ser desfeita.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeletingStudent(null)}>Cancelar</Button>
              <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={rowLoading[deletingStudent?.id || '']}>
                 {rowLoading[deletingStudent?.id || ''] ? <CircularProgress size={24} /> : 'Excluir'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Change Coach Dialog */}
          <Dialog open={isChangeCoachOpen} onClose={handleCloseChangeCoach} fullWidth maxWidth="sm">
            <DialogTitle>Alterar Treinador</DialogTitle>
            <DialogContent>
              {changeCoachError && (
                <Alert severity="error" sx={{ mb: 2 }}>{changeCoachError}</Alert>
              )}
              <Typography variant="body2" sx={{ mb: 2 }}>
                Selecione o novo treinador para o aluno {targetStudent?.name}.
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Novo Treinador</InputLabel>
                <Select
                  label="Novo Treinador"
                  value={selectedNewCoachId}
                  onChange={(e) => setSelectedNewCoachId(String(e.target.value))}
                >
                  {coaches.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={applyToAllSubscriptions}
                    onChange={(e) => setApplyToAllSubscriptions(e.target.checked)}
                  />
                }
                label="Aplicar a todas as assinaturas ativas"
              />
              <Typography variant="caption" color="text.secondary" display="block">
                Quando desmarcado, a alteração será aplicada apenas à assinatura ativa mais recente.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseChangeCoach} disabled={changeCoachLoading}>Cancelar</Button>
              <Button
                variant="contained"
                onClick={handleConfirmChangeCoach}
                disabled={!selectedNewCoachId || changeCoachLoading}
              >
                {changeCoachLoading ? <CircularProgress size={20} /> : 'Confirmar'}
              </Button>
            </DialogActions>
          </Dialog>

        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 