'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Avatar,
  Tooltip,
  CircularProgress,
  Switch,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Menu,
  Pagination,
  Stack,
  Divider,
  SelectChangeEvent,
  Container
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  PersonOff as PersonOffIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Wc as GenderIcon,
  Today as TodayIcon,
  CalendarToday as CalendarIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { enduranceApi } from '@/services/enduranceApi';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Student {
  id: string;
  name: string;
  email: string;
  image?: string;
  gender: 'MASCULINO' | 'FEMININO' | 'OUTRO';
  birthDate: string;
  isActive: boolean;
  createdAt: string;
  plan?: {
    id: string;
    name: string;
    price: number;
  };
  modalidade?: {
    id: string;
    name: string;
  };
}

export default function MeusAlunosPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuStudentId, setMenuStudentId] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await enduranceApi.getCoachStudents();
      
      // Processar dados reais da API
      const studentsData = response?.students || response?.data || [];
      const processedStudents: Student[] = studentsData.map((student: any) => ({
        id: student.id,
        name: student.name || student.user?.name || 'Nome não disponível',
        email: student.email || student.user?.email || 'Email não disponível',
        image: student.image || student.user?.image,
        gender: student.gender || student.user?.gender || 'OUTRO',
        birthDate: student.birthDate || student.user?.birthDate || '1990-01-01',
        isActive: student.isActive || student.status === 'ACTIVE',
        createdAt: student.createdAt || student.user?.createdAt || new Date().toISOString(),
        plan: student.plan ? {
          id: student.plan.id,
          name: student.plan.name,
          price: student.plan.price || 0
        } : undefined,
        modalidade: student.modalidade ? {
          id: student.modalidade.id,
          name: student.modalidade.name
        } : undefined
      }));
      
      setStudents(processedStudents);
      setError(null);
      
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      setError('Erro ao carregar lista de alunos');
      
      // Em caso de erro, manter lista vazia
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (studentId: string) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const newStatus = !student.isActive;
      
      await enduranceApi.updateCoachStudentStatus(studentId, { isActive: newStatus });
      
      setStudents(prev => prev.map(s => 
        s.id === studentId ? { ...s, isActive: newStatus } : s
      ));
      
      setSuccess(`Aluno ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      setConfirmDialogOpen(false);
      setSelectedStudent(null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      setError('Erro ao alterar status do aluno');
      setTimeout(() => setError(null), 3000);
    }
  };

  const openStatusDialog = (student: Student) => {
    setSelectedStudent(student);
    setConfirmDialogOpen(true);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, studentId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuStudentId(studentId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuStudentId(null);
  };

  const getAge = (birthDate: string): number => {
    return differenceInYears(new Date(), new Date(birthDate));
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGender = genderFilter === 'all' || student.gender === genderFilter;
    
    const age = student.birthDate ? getAge(student.birthDate) : 0;
    const matchesAge = ageFilter === 'all' || 
                      (ageFilter === 'young' && age > 0 && age < 25) ||
                      (ageFilter === 'adult' && age >= 25 && age < 35) ||
                      (ageFilter === 'middle' && age >= 35 && age < 50) ||
                      (ageFilter === 'senior' && age >= 50);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && student.isActive) ||
                         (statusFilter === 'inactive' && !student.isActive);
    
    let matchesDate = dateFilter === 'all';
    
    if (dateFilter !== 'all') {
      try {
        const createdDate = new Date(student.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        matchesDate = (dateFilter === 'today' && diffDays === 0) ||
                     (dateFilter === 'week' && diffDays <= 7) ||
                     (dateFilter === 'month' && diffDays <= 30) ||
                     (dateFilter === 'year' && diffDays <= 365);
      } catch (error) {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesGender && matchesAge && matchesStatus && matchesDate;
  });

  const paginatedStudents = filteredStudents.slice(
    (page - 1) * studentsPerPage,
    page * studentsPerPage
  );

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const stats = {
    total: students.length,
    active: students.filter(s => s.isActive).length,
    inactive: students.filter(s => !s.isActive).length,
    new: students.filter(s => {
      try {
        const diffDays = Math.floor((new Date().getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      } catch (error) {
        return false;
      }
    }).length
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'MASCULINO': return <MaleIcon fontSize="small" />;
      case 'FEMININO': return <FemaleIcon fontSize="small" />;
      default: return <GenderIcon fontSize="small" />;
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'MASCULINO': return 'Masculino';
      case 'FEMININO': return 'Feminino';
      default: return 'Outro';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ProtectedRoute>
              <DashboardLayout user={user} onLogout={handleLogout}>
          <Container maxWidth="xl" sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            Meus Alunos
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Cards de Estatísticas */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Total de Alunos
                      </Typography>
                      <Typography variant="h3" sx={{ color: 'white' }}>
                        {stats.total}
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Alunos Ativos
                      </Typography>
                      <Typography variant="h3" sx={{ color: 'white' }}>
                        {stats.active}
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Alunos Inativos
                      </Typography>
                      <Typography variant="h3" sx={{ color: 'white' }}>
                        {stats.inactive}
                      </Typography>
                    </Box>
                    <BlockIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                        Novos Alunos
                      </Typography>
                      <Typography variant="h3" sx={{ color: 'white' }}>
                        {stats.new}
                      </Typography>
                    </Box>
                    <PersonAddIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filtros */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Buscar aluno"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Gênero</InputLabel>
                    <Select
                      value={genderFilter}
                      label="Gênero"
                      onChange={(e: SelectChangeEvent) => setGenderFilter(e.target.value)}
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      <MenuItem value="MASCULINO">Masculino</MenuItem>
                      <MenuItem value="FEMININO">Feminino</MenuItem>
                      <MenuItem value="OUTRO">Outro</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Idade</InputLabel>
                    <Select
                      value={ageFilter}
                      label="Idade"
                      onChange={(e: SelectChangeEvent) => setAgeFilter(e.target.value)}
                    >
                      <MenuItem value="all">Todas</MenuItem>
                      <MenuItem value="young">Até 25 anos</MenuItem>
                      <MenuItem value="adult">25-35 anos</MenuItem>
                      <MenuItem value="middle">35-50 anos</MenuItem>
                      <MenuItem value="senior">50+ anos</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      <MenuItem value="active">Ativos</MenuItem>
                      <MenuItem value="inactive">Inativos</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Período</InputLabel>
                    <Select
                      value={dateFilter}
                      label="Período"
                      onChange={(e: SelectChangeEvent) => setDateFilter(e.target.value)}
                    >
                      <MenuItem value="all">Todos</MenuItem>
                      <MenuItem value="today">Hoje</MenuItem>
                      <MenuItem value="week">Esta semana</MenuItem>
                      <MenuItem value="month">Este mês</MenuItem>
                      <MenuItem value="year">Este ano</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={1}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<FilterListIcon />}
                    onClick={() => {
                      setSearchTerm('');
                      setGenderFilter('all');
                      setAgeFilter('all');
                      setStatusFilter('all');
                      setDateFilter('all');
                    }}
                  >
                    Limpar
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabela de Alunos */}
          <Card>
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Aluno</TableCell>
                      <TableCell>Gênero</TableCell>
                      <TableCell>Idade</TableCell>
                      <TableCell>Plano</TableCell>
                      <TableCell>Modalidade</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Data de Ingresso</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={student.image}>
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {student.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {student.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getGenderIcon(student.gender)}
                            <Typography variant="body2">
                              {getGenderLabel(student.gender)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {student.birthDate ? getAge(student.birthDate) : 'N/A'} anos
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {student.plan ? (
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {student.plan.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                R$ {student.plan.price.toFixed(2)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Sem plano
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {student.modalidade ? (
                            <Chip 
                              label={student.modalidade.name} 
                              variant="outlined" 
                              size="small"
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Sem modalidade
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={student.isActive ? 'Ativo' : 'Inativo'}
                            color={student.isActive ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {(() => {
                              try {
                                return format(new Date(student.createdAt), 'dd/MM/yyyy', { locale: ptBR });
                              } catch (error) {
                                return 'Data inválida';
                              }
                            })()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Switch
                              checked={student.isActive}
                              onChange={() => openStatusDialog(student)}
                              color="primary"
                              size="small"
                            />
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, student.id)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredStudents.length === 0 && !loading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    {students.length === 0 ? 'Nenhum aluno cadastrado' : 'Nenhum aluno encontrado'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {students.length === 0 
                      ? 'Você ainda não possui alunos cadastrados.' 
                      : 'Não há alunos que correspondam aos filtros aplicados.'
                    }
                  </Typography>
                </Box>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(event, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Menu de Ações */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar Aluno
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              Ver Detalhes
            </MenuItem>
          </Menu>

          {/* Dialog de Confirmação */}
          <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
            <DialogTitle>
              {selectedStudent?.isActive ? 'Desativar Aluno' : 'Ativar Aluno'}
            </DialogTitle>
            <DialogContent>
              {selectedStudent && (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    Tem certeza que deseja {selectedStudent.isActive ? 'desativar' : 'ativar'} o aluno:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 2 }}>
                    {selectedStudent.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedStudent.isActive 
                      ? 'O aluno será desativado e não terá mais acesso à plataforma.'
                      : 'O aluno será ativado e poderá acessar novamente a plataforma.'
                    }
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => selectedStudent && handleToggleStatus(selectedStudent.id)}
                variant="contained"
                color={selectedStudent?.isActive ? 'error' : 'success'}
              >
                {selectedStudent?.isActive ? 'Desativar' : 'Ativar'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 