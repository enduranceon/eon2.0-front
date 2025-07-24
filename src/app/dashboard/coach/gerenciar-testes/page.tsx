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
  Divider,
  InputAdornment,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  Tabs,
  Tab,
  IconButton,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Today as TodayIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Check as CheckIcon,
  Pending as PendingIcon,
  Assignment as AssignmentIcon,
  Science as ScienceIcon,
  History as HistoryIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enduranceApi } from '@/services/enduranceApi';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/Dashboard/PageHeader';
import { AvailableTest, UserTest, TestType } from '@/types/api';
import toast, { Toaster } from 'react-hot-toast';

// Função para obter URL absoluta da imagem
const getAbsoluteImageUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('blob:')) {
    return url;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const origin = new URL(apiUrl).origin;
  const path = url.startsWith('/api') ? url.substring(4) : url;
  return `${origin}/api${path.startsWith('/') ? '' : '/'}${path}`;
};

interface TestRequest {
  id: string;
  test: {
    id: string;
    name: string;
    description: string;
    type: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  requestedAt: string;
  scheduledAt?: string;
  location?: string;
  notes?: string;
  results?: string;
}

const getTestIcon = (type: TestType) => {
  switch (type) {
    case TestType.PERFORMANCE:
      return <AssessmentIcon />;
    case TestType.FLEXIBILIDADE:
      return <AssignmentIcon />;
    case TestType.STRENGTH:
      return <AssignmentIcon />;
    default:
      return <ScienceIcon />;
  }
};

const Test3Plus9Form = ({ testData, setTestData }: { testData: any, setTestData: (data: any) => void }) => {
  const [distance3min, setDistance3min] = useState('');
  const [distance9min, setDistance9min] = useState('');

  useEffect(() => {
    if (distance3min && distance9min) {
      const result = (parseFloat(distance9min) - parseFloat(distance3min)) / 6;
      setTestData({
        ...testData,
        distance3min: parseFloat(distance3min),
        distance9min: parseFloat(distance9min),
        value: result,
        unit: 'ml/kg/min'
      });
    }
  }, [distance3min, distance9min, setTestData, testData]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Distância 3 minutos (metros)"
          type="number"
          value={distance3min}
          onChange={(e) => setDistance3min(e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Distância 9 minutos (metros)"
          type="number"
          value={distance9min}
          onChange={(e) => setDistance9min(e.target.value)}
        />
      </Grid>
      {testData.value && (
        <Grid item xs={12}>
          <Alert severity="info">
            Resultado calculado: {testData.value.toFixed(2)} ml/kg/min
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};

const GenericTestForm = ({ testData, setTestData }: { testData: any, setTestData: (data: any) => void }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Valor do teste"
          type="number"
          value={testData.value || ''}
          onChange={(e) => setTestData({ ...testData, value: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Unidade"
          value={testData.unit || ''}
          onChange={(e) => setTestData({ ...testData, unit: e.target.value })}
          placeholder="ex: metros, segundos, repetições"
        />
      </Grid>
    </Grid>
  );
};

export default function GerenciarTestesPage() {
  const auth = useAuth();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState(0);
  
  // Estados para registro de testes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [testDate, setTestDate] = useState<Date | null>(new Date());
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testData, setTestData] = useState<any>({});
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  // Estados para resultados de testes
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TestRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<TestRequest | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [resultData, setResultData] = useState({
    results: '',
    notes: ''
  });
  const [scheduleData, setScheduleData] = useState({
    scheduledAt: new Date(),
    location: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      
      const [testsResponse, studentsResponse] = await Promise.all([
        enduranceApi.getAvailableTests(),
        enduranceApi.getCoachStudents()
      ]);
      
      const testsData = Array.isArray(testsResponse) ? testsResponse : testsResponse.data;
      const studentsData = Array.isArray(studentsResponse) ? studentsResponse : studentsResponse.students;
      
      
      
      setAvailableTests(testsData || []);
      setStudents(studentsData || []);
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados para gerenciamento de testes.');
    } finally {
      setLoading(false);
    }
  };

  // Funções para registro de testes
  const handleOpenDialog = () => {
    if (!selectedStudent || !selectedTest) {
      toast.error('Selecione um aluno e um teste para continuar.');
      return;
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTestData({});
    setTestDate(new Date());
    setLocation('');
    setNotes('');
  };

  const getSelectedTest = () => {
    return availableTests.find(test => test.id === selectedTest);
  };

  const renderTestForm = () => {
    const test = getSelectedTest();
    if (!test) return null;

    if (test.name.toLowerCase().includes('3') && test.name.toLowerCase().includes('9')) {
      return <Test3Plus9Form testData={testData} setTestData={setTestData} />;
    }

    return <GenericTestForm testData={testData} setTestData={setTestData} />;
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedTest || !testData.value) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const test = getSelectedTest();
      const student = students.find(s => s.user.id === selectedStudent);
      
      if (!test || !student) {
        toast.error('Dados inválidos.');
        return;
      }

      const resultData = {
        testId: selectedTest,
        userId: selectedStudent,
        value: parseFloat(testData.value),
        unit: testData.unit || '',
        notes: notes,
        date: testDate?.toISOString() || new Date().toISOString(),
        location: location
      };

      await enduranceApi.recordTestResult(resultData);
      
      toast.success('Teste registrado com sucesso!');
      handleCloseDialog();
      
      // Recarregar dados
      loadData();
      
    } catch (error) {
      console.error('Erro ao registrar teste:', error);
      toast.error('Erro ao registrar teste. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funções para resultados de testes
  const fetchTestRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await enduranceApi.getCoachTestRequests();
      setTestRequests(response.data || []);
      setFilteredRequests(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar solicitações de teste:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchTestRequests();
  }, []);

  useEffect(() => {
    let filtered = testRequests;
    
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.test.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }
    
    setFilteredRequests(filtered);
  }, [testRequests, searchTerm, statusFilter]);

  const handleAddResult = async () => {
    if (!selectedRequest || !resultData.results) {
      toast.error('Preencha os resultados.');
      return;
    }

    try {
      await enduranceApi.addTestRequestResults(selectedRequest.id, {
        results: resultData.results,
        notes: resultData.notes
      });

      await enduranceApi.updateTestRequestStatus(selectedRequest.id, {
        status: 'COMPLETED'
      });

      toast.success('Resultado adicionado com sucesso!');
      setResultDialogOpen(false);
      setResultData({ results: '', notes: '' });
      fetchTestRequests();
    } catch (error) {
      console.error('Erro ao adicionar resultado:', error);
      toast.error('Erro ao adicionar resultado.');
    }
  };

  const handleScheduleTest = async () => {
    if (!selectedRequest || !scheduleData.location) {
      toast.error('Preencha a localização.');
      return;
    }

    try {
      await enduranceApi.updateTestRequestStatus(selectedRequest.id, {
        status: 'SCHEDULED',
        scheduledAt: scheduleData.scheduledAt.toISOString(),
        location: scheduleData.location,
        notes: scheduleData.notes
      });

      toast.success('Teste agendado com sucesso!');
      setScheduleDialogOpen(false);
      setScheduleData({
        scheduledAt: new Date(),
        location: '',
        notes: ''
      });
      fetchTestRequests();
    } catch (error) {
      console.error('Erro ao agendar teste:', error);
      toast.error('Erro ao agendar teste.');
    }
  };

  const openResultDialog = (request: TestRequest) => {
    setSelectedRequest(request);
    setResultDialogOpen(true);
  };

  const openScheduleDialog = (request: TestRequest) => {
    setSelectedRequest(request);
    setScheduleDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'SCHEDULED': return 'info';
      case 'COMPLETED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'SCHEDULED': return 'Agendado';
      case 'COMPLETED': return 'Concluído';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  if (!auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['COACH']}>
      <DashboardLayout user={auth.user} onLogout={auth.logout}>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
          <PageHeader
            title="Gerenciar Testes"
            description="Registre novos testes e gerencie resultados dos seus alunos."
          />
          
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
            <Tab 
              icon={<AddIcon />} 
              label="Registrar Teste" 
              iconPosition="start"
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Histórico de Testes" 
              iconPosition="start"
            />
          </Tabs>

          {currentTab === 0 && (
            // Aba de Registrar Teste
            <>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
              ) : (
                <Grid container spacing={3}>
                  {/* Seleção de Aluno */}
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1 }} />
                          Selecionar Aluno
                        </Typography>
                        
                        {students.length === 0 ? (
                          <Alert severity="info">
                            Nenhum aluno encontrado. Os alunos aparecerão aqui quando se inscreverem em seus planos.
                          </Alert>
                        ) : (
                          <Autocomplete
                            fullWidth
                            options={students}
                            getOptionLabel={(option) => `${option.user.name} (${option.user.email})`}
                            value={students.find(student => student.user.id === selectedStudent) || null}
                            onChange={(event, newValue) => {
                              setSelectedStudent(newValue ? newValue.user.id : '');
                            }}
                            inputValue={studentSearchTerm}
                            onInputChange={(event, newInputValue) => {
                              setStudentSearchTerm(newInputValue);
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Buscar aluno por nome ou email"
                                placeholder="Digite o nome ou email do aluno..."
                                InputProps={{
                                  ...params.InputProps,
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <SearchIcon />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            )}
                            renderOption={(props, option) => (
                              <Box component="li" {...props}>
                                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                  <Avatar src={option.user.image} sx={{ mr: 2, width: 32, height: 32 }}>
                                    <PersonIcon />
                                  </Avatar>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2">{option.user.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {option.user.email}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            )}
                            filterOptions={(options, { inputValue }) => {
                              const searchTerm = inputValue.toLowerCase();
                              return options.filter(option =>
                                option.user.name.toLowerCase().includes(searchTerm) ||
                                option.user.email.toLowerCase().includes(searchTerm)
                              );
                            }}
                            noOptionsText="Nenhum aluno encontrado"
                            loading={loading}
                            loadingText="Carregando alunos..."
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Seleção de Teste */}
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                          <ScienceIcon sx={{ mr: 1 }} />
                          Selecionar Teste
                        </Typography>
                        
                        {availableTests.length === 0 ? (
                          <Alert severity="info">
                            Nenhum teste disponível no momento.
                          </Alert>
                        ) : (
                          <FormControl fullWidth>
                            <InputLabel>Teste</InputLabel>
                            <Select
                              value={selectedTest}
                              onChange={(e) => setSelectedTest(e.target.value)}
                              label="Teste"
                            >
                              {availableTests.map((test) => (
                                <MenuItem key={test.id} value={test.id}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                                      {getTestIcon(test.type)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2">{test.name}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {test.type}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Botão de Registro */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={handleOpenDialog}
                        disabled={!selectedStudent || !selectedTest}
                      >
                        Registrar Teste
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Dialog de Registro */}
              <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScienceIcon sx={{ mr: 1 }} />
                    Registrar Teste
                  </Box>
                </DialogTitle>
                <DialogContent>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        {getSelectedTest()?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {getSelectedTest()?.description}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      {renderTestForm()}
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                        <DatePicker
                          label="Data do Teste"
                          value={testDate}
                          onChange={(newValue) => setTestDate(newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Local"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="ex: Academia, Parque, Pista"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Observações"
                        multiline
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Observações adicionais sobre o teste..."
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDialog} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    disabled={isSubmitting || !testData.value}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {isSubmitting ? 'Registrando...' : 'Registrar Teste'}
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}

          {currentTab === 1 && (
            // Aba de Histórico de Testes
            <>
              {/* Filtros */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        placeholder="Buscar por aluno ou teste..."
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
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          label="Status"
                        >
                          <MenuItem value="ALL">Todos</MenuItem>
                          <MenuItem value="PENDING">Pendente</MenuItem>
                          <MenuItem value="SCHEDULED">Agendado</MenuItem>
                          <MenuItem value="COMPLETED">Concluído</MenuItem>
                          <MenuItem value="CANCELLED">Cancelado</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Button
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('ALL');
                        }}
                      >
                        Limpar Filtros
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Lista de Testes */}
              {loadingRequests ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Histórico de Testes ({filteredRequests.length})
                    </Typography>
                    
                    {filteredRequests.length === 0 ? (
                      <Alert severity="info">
                        Nenhum teste encontrado com os filtros aplicados.
                      </Alert>
                    ) : (
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Aluno</TableCell>
                              <TableCell>Teste</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Data</TableCell>
                              <TableCell>Local</TableCell>
                              <TableCell>Ações</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredRequests.map((request) => (
                              <TableRow key={request.id}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar 
                                      src={getAbsoluteImageUrl(request.user.image)} 
                                      sx={{ mr: 2, width: 32, height: 32 }}
                                    >
                                      <PersonIcon />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body2">{request.user.name}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {request.user.email}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2">{request.test.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {request.test.type}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={getStatusLabel(request.status)}
                                    color={getStatusColor(request.status) as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {request.requestedAt ? 
                                      format(new Date(request.requestedAt), 'dd/MM/yyyy', { locale: ptBR }) : 
                                      'Data não informada'
                                    }
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {request.requestedAt ? 
                                      format(new Date(request.requestedAt), 'HH:mm', { locale: ptBR }) : 
                                      ''
                                    }
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {request.location || '-'}
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    {request.status === 'PENDING' && (
                                      <>
                                        <Tooltip title="Agendar">
                                          <IconButton
                                            size="small"
                                            onClick={() => openScheduleDialog(request)}
                                            color="primary"
                                          >
                                            <ScheduleIcon />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Adicionar Resultado">
                                          <IconButton
                                            size="small"
                                            onClick={() => openResultDialog(request)}
                                            color="success"
                                          >
                                            <CheckIcon />
                                          </IconButton>
                                        </Tooltip>
                                      </>
                                    )}
                                    {request.status === 'SCHEDULED' && (
                                      <Tooltip title="Adicionar Resultado">
                                        <IconButton
                                          size="small"
                                          onClick={() => openResultDialog(request)}
                                          color="success"
                                        >
                                          <CheckIcon />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                    {request.status === 'COMPLETED' && (
                                      <Tooltip title="Ver Resultado">
                                        <IconButton
                                          size="small"
                                          onClick={() => openResultDialog(request)}
                                          color="info"
                                        >
                                          <AssessmentIcon />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Dialog de Resultado */}
              <Dialog open={resultDialogOpen} onClose={() => setResultDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssessmentIcon sx={{ mr: 1 }} />
                    {selectedRequest?.status === 'COMPLETED' ? 'Ver Resultado' : 'Adicionar Resultado'}
                  </Box>
                </DialogTitle>
                <DialogContent>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        {selectedRequest?.test.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Aluno: {selectedRequest?.user.name}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Resultados"
                        multiline
                        rows={4}
                        value={resultData.results}
                        onChange={(e) => setResultData({ ...resultData, results: e.target.value })}
                        placeholder="Descreva os resultados do teste..."
                        disabled={selectedRequest?.status === 'COMPLETED'}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Observações"
                        multiline
                        rows={3}
                        value={resultData.notes}
                        onChange={(e) => setResultData({ ...resultData, notes: e.target.value })}
                        placeholder="Observações adicionais..."
                        disabled={selectedRequest?.status === 'COMPLETED'}
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setResultDialogOpen(false)}>
                    Fechar
                  </Button>
                  {selectedRequest?.status !== 'COMPLETED' && (
                    <Button 
                      onClick={handleAddResult} 
                      variant="contained"
                      disabled={!resultData.results}
                    >
                      Adicionar Resultado
                    </Button>
                  )}
                </DialogActions>
              </Dialog>

              {/* Dialog de Agendamento */}
              <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon sx={{ mr: 1 }} />
                    Agendar Teste
                  </Box>
                </DialogTitle>
                <DialogContent>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        {selectedRequest?.test.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Aluno: {selectedRequest?.user.name}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                        <DatePicker
                          label="Data e Hora"
                          value={scheduleData.scheduledAt}
                          onChange={(newValue) => setScheduleData({ ...scheduleData, scheduledAt: newValue || new Date() })}
                          slotProps={{
                            textField: {
                              fullWidth: true
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Local"
                        value={scheduleData.location}
                        onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
                        placeholder="ex: Academia, Parque, Pista"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Observações"
                        multiline
                        rows={3}
                        value={scheduleData.notes}
                        onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                        placeholder="Observações sobre o agendamento..."
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setScheduleDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleScheduleTest} 
                    variant="contained"
                    disabled={!scheduleData.location}
                  >
                    Agendar Teste
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
        </Container>
        <Toaster position="top-right" />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 