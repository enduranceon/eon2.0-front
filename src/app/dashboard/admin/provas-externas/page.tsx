'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  Tooltip,
  Tabs,
  Tab,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  DirectionsRun as RunIcon,
  CalendarToday as CalendarIcon,
  AdminPanelSettings as AdminIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../../contexts/AuthContext';
import { UserType, ExternalExam, ExternalExamFilters, User } from '../../../../types/api';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { enduranceApi } from '../../../../services/enduranceApi';

interface ExternalExamWithActions extends ExternalExam {
  actions?: {
    canEdit: boolean;
    canDelete: boolean;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AdminProvasExternasPage() {
  const auth = useAuth();
  const router = useRouter();
  
  // Estados
  const [externalExams, setExternalExams] = useState<ExternalExamWithActions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedModalidade, setSelectedModalidade] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExam, setSelectedExam] = useState<ExternalExamWithActions | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Estados para filtros
  const [students, setStudents] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [modalidades, setModalidades] = useState<Array<{ id: string; name: string }>>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Carregar dados iniciais
  useEffect(() => {
    loadExternalExams();
    loadAllUsers();
    loadModalidades();
  }, []);

  // Carregar provas externas
  const loadExternalExams = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: ExternalExamFilters = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        userId: selectedStudent || undefined,
        modalidadeId: selectedModalidade || undefined,
      };

      const response = await enduranceApi.getExternalExams(filters);
      
      // Adicionar informações de ações para cada prova
      const examsWithActions = response.data.map(exam => ({
        ...exam,
        actions: {
          canEdit: true, // Admin pode editar qualquer prova
          canDelete: true, // Admin pode deletar qualquer prova
        }
      }));

      setExternalExams(examsWithActions);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error('Erro ao carregar provas externas:', err);
      setError(err.response?.data?.message || 'Erro ao carregar provas externas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar todos os usuários (alunos)
  const loadAllUsers = async () => {
    try {
      const response = await enduranceApi.getUsers({ userType: UserType.FITNESS_STUDENT });
      const users = response.data || [];
      setAllUsers(users);
      setStudents(users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email
      })));
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  // Carregar modalidades
  const loadModalidades = async () => {
    try {
      const response = await enduranceApi.getModalidades();
      setModalidades(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar modalidades:', err);
    }
  };

  // Aplicar filtros
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadExternalExams();
  };

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStudent('');
    setSelectedModalidade('');
    setPagination(prev => ({ ...prev, page: 1 }));
    loadExternalExams();
  };

  // Abrir menu de ações
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, exam: ExternalExamWithActions) => {
    setAnchorEl(event.currentTarget);
    setSelectedExam(exam);
  };

  // Fechar menu de ações
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExam(null);
  };

  // Visualizar prova
  const handleViewExam = () => {
    setViewDialogOpen(true);
    setAnchorEl(null); // Fechar apenas o menu, manter selectedExam
  };

  // Fechar modal de visualização
  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedExam(null); // Limpar selectedExam quando fechar o modal
  };

  // Editar prova - Removido pois edição é feita pelo aluno
  // const handleEditExam = () => {
  //   setEditDialogOpen(true);
  //   handleMenuClose();
  // };

  // Deletar prova
  const handleDeleteExam = async () => {
    if (!selectedExam) return;

    if (window.confirm('Tem certeza que deseja excluir esta prova externa?')) {
      try {
        await enduranceApi.deleteExternalExam(selectedExam.id);
        await loadExternalExams();
        handleMenuClose();
      } catch (err: any) {
        console.error('Erro ao deletar prova:', err);
        setError(err.response?.data?.message || 'Erro ao deletar prova');
      }
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Formatar data e hora
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Calcular estatísticas
  const getStatistics = () => {
    const totalExams = pagination.total;
    const activeExams = externalExams.filter(exam => exam.isActive).length;
    const uniqueStudents = new Set(externalExams.map(exam => exam.userId)).size;
    const uniqueModalidades = new Set(externalExams.map(exam => exam.modalidadeId)).size;
    
    // Provas deste mês
    const thisMonth = new Date();
    const thisMonthExams = externalExams.filter(exam => {
      const examDate = new Date(exam.examDate);
      return examDate.getMonth() === thisMonth.getMonth() && 
             examDate.getFullYear() === thisMonth.getFullYear();
    }).length;

    // Provas por modalidade
    const examsByModalidade = externalExams.reduce((acc, exam) => {
      const modalidade = exam.modalidade.name;
      acc[modalidade] = (acc[modalidade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExams,
      activeExams,
      uniqueStudents,
      uniqueModalidades,
      thisMonthExams,
      examsByModalidade
    };
  };

  const stats = getStatistics();

  const handleLogout = () => auth.logout();

  if (!auth.user) return null;

  if (loading && externalExams.length === 0) {
    return (
      <ProtectedRoute allowedUserTypes={['ADMIN']}>
        <DashboardLayout user={auth.user} onLogout={handleLogout}>
          <Container maxWidth="xl">
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="400px"
            >
              <CircularProgress />
            </Box>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={auth.user} onLogout={handleLogout}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Provas Externas - Administração
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gerencie todas as provas externas cadastradas na plataforma
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {/* Estatísticas Globais */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EventIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Total</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {stats.totalExams}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Provas cadastradas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Ativas</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.activeExams}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Provas ativas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6">Alunos</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {stats.uniqueStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Com provas cadastradas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <RunIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Modalidades</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.uniqueModalidades}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Diferentes modalidades
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CalendarIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Este Mês</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="secondary.main">
                    {stats.thisMonthExams}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Provas agendadas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs */}
          <Card sx={{ mb: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="Lista de Provas" />
                <Tab label="Estatísticas por Modalidade" />
                <Tab label="Relatórios" />
              </Tabs>
            </Box>

            {/* Tab 1: Lista de Provas */}
            <TabPanel value={tabValue} index={0}>
              {/* Filtros */}
              <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Buscar por nome da prova"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Autocomplete
                    options={students}
                    getOptionLabel={(option) => `${option.name} (${option.email})`}
                    value={students.find(s => s.id === selectedStudent) || null}
                    onChange={(event, newValue) => {
                      setSelectedStudent(newValue?.id || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Filtrar por Aluno"
                        placeholder="Selecione um aluno"
                      />
                    )}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Modalidade</InputLabel>
                    <Select
                      value={selectedModalidade}
                      onChange={(e: SelectChangeEvent) => setSelectedModalidade(e.target.value)}
                      label="Modalidade"
                    >
                      <MenuItem value="">Todas as modalidades</MenuItem>
                      {modalidades.map((modalidade) => (
                        <MenuItem key={modalidade.id} value={modalidade.id}>
                          {modalidade.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                      startIcon={<FilterIcon />}
                      fullWidth
                    >
                      Filtrar
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={clearFilters}
                      fullWidth
                    >
                      Limpar
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {/* Tabela de Provas */}
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Prova</TableCell>
                      <TableCell>Aluno</TableCell>
                      <TableCell>Modalidade</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Local</TableCell>
                      <TableCell>Distância</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : externalExams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Nenhuma prova externa encontrada
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      externalExams.map((exam) => (
                        <TableRow key={exam.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {exam.name}
                              </Typography>
                              {exam.description && (
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {exam.description}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                {exam.user.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {exam.user.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {exam.user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={exam.modalidade.name}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarIcon sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {formatDate(exam.examDate)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {exam.location ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationIcon sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" noWrap>
                                  {exam.location}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {exam.distance ? (
                              <Chip
                                label={exam.distance}
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={exam.isActive ? 'Ativa' : 'Inativa'}
                              size="small"
                              color={exam.isActive ? 'success' : 'default'}
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              onClick={(e) => handleMenuOpen(e, exam)}
                              size="small"
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                      loadExternalExams();
                    }}
                    disabled={!pagination.hasPrev || loading}
                    sx={{ mr: 1 }}
                  >
                    Anterior
                  </Button>
                  <Typography variant="body2" sx={{ alignSelf: 'center', mx: 2 }}>
                    Página {pagination.page} de {pagination.totalPages}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                      loadExternalExams();
                    }}
                    disabled={!pagination.hasNext || loading}
                    sx={{ ml: 1 }}
                  >
                    Próxima
                  </Button>
                </Box>
              )}
            </TabPanel>

            {/* Tab 2: Estatísticas por Modalidade */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                {Object.entries(stats.examsByModalidade).map(([modalidade, count]) => (
                  <Grid item xs={12} sm={6} md={4} key={modalidade}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <RunIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">{modalidade}</Typography>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                          {count}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          provas cadastradas
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>

            {/* Tab 3: Relatórios */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Relatórios Avançados
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Funcionalidade em desenvolvimento
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  disabled
                >
                  Exportar Relatório
                </Button>
              </Box>
            </TabPanel>
          </Card>

          {/* Menu de Ações */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleViewExam}>
              <ViewIcon sx={{ mr: 1 }} />
              Visualizar
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDeleteExam} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Excluir
            </MenuItem>
          </Menu>

          {/* Dialog de Visualização */}
          <Dialog
            open={viewDialogOpen}
            onClose={() => setViewDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon sx={{ mr: 1, color: 'primary.main' }} />
                Detalhes da Prova Externa
              </Box>
            </DialogTitle>
            <DialogContent>
              {selectedExam ? (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {selectedExam.name}
                      </Typography>
                      {selectedExam.description && (
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                          {selectedExam.description}
                        </Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Modalidade
                      </Typography>
                      <Chip
                        label={selectedExam.modalidade.name}
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Status
                      </Typography>
                      <Chip
                        label={selectedExam.isActive ? 'Ativa' : 'Inativa'}
                        color={selectedExam.isActive ? 'success' : 'default'}
                        variant="filled"
                        sx={{ mb: 1 }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Data da Prova
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1" fontWeight="medium">
                          {formatDateTime(selectedExam.examDate)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Distância
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedExam.distance || 'Não informado'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Local
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body1" fontWeight="medium">
                          {selectedExam.location || 'Não informado'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Aluno Responsável
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                          {selectedExam.user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {selectedExam.user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedExam.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Data de Cadastro
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(selectedExam.createdAt)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Última Atualização
                      </Typography>
                      <Typography variant="body2">
                        {formatDateTime(selectedExam.updatedAt)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Carregando detalhes...
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseViewDialog} variant="outlined">
                Fechar
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
