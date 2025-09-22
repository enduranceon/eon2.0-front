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
import { useWebSocket } from '@/contexts/WebSocketContext';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Student {
  id: string;
  name: string;
  email: string;
  image?: string;
  gender: 'MALE' | 'FEMALE' | 'MASCULINO' | 'FEMININO' | string;
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    gender: '',
    birthDate: '',
    isActive: true
  });
  const { user, logout } = useAuth();
  const router = useRouter();
  const { lastPhotoUpdate } = useWebSocket();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Escutar atualizações de foto via WebSocket
  useEffect(() => {
    if (lastPhotoUpdate && lastPhotoUpdate.userId && lastPhotoUpdate.receivedAt) {
      // Verificar se já processamos este evento para evitar loops
      const eventId = `${lastPhotoUpdate.userId}-${lastPhotoUpdate.receivedAt}`;
      const processedEvents = sessionStorage.getItem('processedPhotoEventsStudents');
      const processedList = processedEvents ? JSON.parse(processedEvents) : [];
      
      if (processedList.includes(eventId)) {
        return; // Já processamos este evento
      }
      
      // Marcar como processado
      processedList.push(eventId);
      // Manter apenas os últimos 10 eventos para evitar memory leak
      if (processedList.length > 10) {
        processedList.shift();
      }
      sessionStorage.setItem('processedPhotoEventsStudents', JSON.stringify(processedList));
      
      // Atualizar a imagem do aluno na lista local
      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.id === lastPhotoUpdate.userId 
            ? { ...student, image: lastPhotoUpdate.imageUrl }
            : student
        )
      );

      console.log('📸 Lista de alunos atualizada via WebSocket:', {
        studentId: lastPhotoUpdate.userId,
        newImageUrl: lastPhotoUpdate.imageUrl,
        eventId
      });
    }
  }, [lastPhotoUpdate]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await enduranceApi.getCoachStudents();
      
      // Processar dados reais da API
      const studentsData = response?.students || response?.data || [];
      const processedStudents: Student[] = studentsData.map((student: any) => {
        // Processar imagem - a API retorna caminhos como "/api/uploads/general/..."
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const imageUrl = student.image || student.user?.image ? 
          (student.image || student.user?.image).startsWith('http') ? 
            student.image || student.user?.image : 
            `${apiUrl.replace('/api', '')}${student.image || student.user?.image}`
          : undefined;
        
        return {
          id: student.id,
          name: student.name || student.user?.name || 'Nome não disponível',
          email: student.email || student.user?.email || 'Email não disponível',
          image: imageUrl,
          gender: student.gender || student.user?.gender || '',
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
        };
      });
      
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

  const handleEditStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setEditingStudent(student);
      setEditFormData({
        name: student.name,
        email: student.email,
        gender: student.gender,
        birthDate: student.birthDate,
        isActive: student.isActive
      });
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleViewDetails = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      setEditingStudent(student);
      setDetailsDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;

    try {
      // Aqui você pode implementar a chamada para a API de atualização
      // await enduranceApi.updateStudent(editingStudent.id, editFormData);
      
      // Por enquanto, vamos apenas atualizar o estado local
      setStudents(prev => prev.map(s => 
        s.id === editingStudent.id 
          ? { ...s, ...editFormData }
          : s
      ));
      
      setSuccess('Aluno atualizado com sucesso!');
      setEditDialogOpen(false);
      setEditingStudent(null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao atualizar aluno:', error);
      setError('Erro ao atualizar dados do aluno');
      setTimeout(() => setError(null), 3000);
    }
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
    switch (gender?.toUpperCase()) {
      case 'MALE':
      case 'MASCULINO':
        return <MaleIcon fontSize="small" color="primary" />;
      case 'FEMALE':
      case 'FEMININO':
        return <FemaleIcon fontSize="small" color="secondary" />;
      default:
        return <GenderIcon fontSize="small" color="action" />;
    }
  };

  const getGenderLabel = (gender: string) => {
    switch (gender?.toUpperCase()) {
      case 'MALE':
      case 'MASCULINO':
        return 'Masculino';
      case 'FEMALE':
      case 'FEMININO':
        return 'Feminino';
      default:
        return 'Não informado';
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
                      <MenuItem value="MALE">Masculino</MenuItem>
                      <MenuItem value="FEMALE">Feminino</MenuItem>
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
                            <Avatar 
                              src={student.image} 
                              alt={student.name}
                              sx={{ width: 40, height: 40 }}
                            >
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
            <MenuItem onClick={() => menuStudentId && handleEditStudent(menuStudentId)}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Editar Aluno
            </MenuItem>
            <MenuItem onClick={() => menuStudentId && handleViewDetails(menuStudentId)}>
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

          {/* Modal de Edição de Aluno */}
          <Dialog 
            open={editDialogOpen} 
            onClose={() => setEditDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Editar Aluno
            </DialogTitle>
            <DialogContent>
              {editingStudent && (
                <Box sx={{ pt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nome"
                        value={editFormData.name}
                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={editFormData.email}
                        onChange={(e) => handleEditFormChange('email', e.target.value)}
                        variant="outlined"
                        type="email"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Gênero</InputLabel>
                        <Select
                          value={editFormData.gender}
                          label="Gênero"
                          onChange={(e) => handleEditFormChange('gender', e.target.value)}
                        >
                          <MenuItem value="MALE">Masculino</MenuItem>
                          <MenuItem value="FEMALE">Feminino</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Data de Nascimento"
                        type="date"
                        value={editFormData.birthDate}
                        onChange={(e) => handleEditFormChange('birthDate', e.target.value)}
                        variant="outlined"
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={editFormData.isActive}
                            onChange={(e) => handleEditFormChange('isActive', e.target.checked)}
                            color="primary"
                          />
                        }
                        label="Aluno Ativo"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveStudent}
                variant="contained"
                color="primary"
              >
                Salvar Alterações
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal de Visualização de Detalhes */}
          <Dialog 
            open={detailsDialogOpen} 
            onClose={() => setDetailsDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Detalhes do Aluno
            </DialogTitle>
            <DialogContent>
              {editingStudent && (
                <Box sx={{ pt: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Avatar 
                          src={editingStudent.image} 
                          alt={editingStudent.name}
                          sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                        >
                          <PersonIcon sx={{ fontSize: 60 }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold">
                          {editingStudent.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {editingStudent.email}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Informações Pessoais
                          </Typography>
                          <Divider sx={{ mb: 1 }} />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            {getGenderIcon(editingStudent.gender)}
                            <Typography variant="body2">
                              <strong>Gênero:</strong> {getGenderLabel(editingStudent.gender)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Idade:</strong> {editingStudent.birthDate ? getAge(editingStudent.birthDate) : 'N/A'} anos
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Data de Nascimento:</strong> {editingStudent.birthDate ? format(new Date(editingStudent.birthDate), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Informações da Conta
                          </Typography>
                          <Divider sx={{ mb: 1 }} />
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Status:</strong> 
                            <Chip 
                              label={editingStudent.isActive ? 'Ativo' : 'Inativo'}
                              color={editingStudent.isActive ? 'success' : 'error'}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Data de Ingresso:</strong> {format(new Date(editingStudent.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </Typography>
                        </Box>

                        {editingStudent.plan && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Plano Atual
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Nome do Plano:</strong> {editingStudent.plan.name}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Valor:</strong> R$ {editingStudent.plan.price.toFixed(2)}
                            </Typography>
                          </Box>
                        )}

                        {editingStudent.modalidade && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Modalidade
                            </Typography>
                            <Divider sx={{ mb: 1 }} />
                            <Typography variant="body2">
                              <strong>Modalidade:</strong> {editingStudent.modalidade.name}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setDetailsDialogOpen(false);
                  if (editingStudent) {
                    handleEditStudent(editingStudent.id);
                  }
                }}
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
              >
                Editar Aluno
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 