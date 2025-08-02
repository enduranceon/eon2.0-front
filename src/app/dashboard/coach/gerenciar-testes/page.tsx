'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Edit as EditIcon,
  Visibility as VisibilityIcon
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
import { AvailableTest, UserTest, TestType, DynamicTestResult, RecordDynamicTestResultRequest, TestDynamicField } from '@/types/api';
import toast, { Toaster } from 'react-hot-toast';

// Função para obter URL absoluta da imagem
const getAbsoluteImageUrl = (url: string | undefined | null): string | undefined => {
  if (!url || url.trim() === '') return undefined;
  
  try {
  if (url.startsWith('http') || url.startsWith('blob:')) {
    return url;
  }
    
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const origin = new URL(apiUrl).origin;
  const path = url.startsWith('/api') ? url.substring(4) : url;
  return `${origin}/api${path.startsWith('/') ? '' : '/'}${path}`;
  } catch (error) {
    console.warn('Erro ao processar URL da imagem:', url, error);
    return undefined;
  }
};



interface AllStudentTest {
  id: string;
  testId: string;
  userId: string;
  value?: string;
  unit?: string;
  notes?: string;
  recordedAt?: string;
  recordedBy?: string;
  dynamicResults?: {
    date: string;
    type: string;
    notes?: string;
    location?: string;
    multipleResults?: Array<{
      unit: string;
      value: string;
      fieldName: string;
      description: string;
    }>;
  };
  resultType?: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    birthDate?: string;
    gender?: string;
    age: number;
  };
  test: {
    id: string;
    name: string;
    type: string;
    description?: string;
    supportsDynamicResults?: boolean;
    defaultResultFields?: any;
  };
  recorder: {
    id: string;
    name: string;
    image?: string;
  };
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

// Função para calcular idade
const calculateAge = (birthDate: string | Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Função para formatar gênero
const formatGender = (gender: string): string => {
  switch (gender?.toUpperCase()) {
    case 'MALE':
    case 'M':
      return 'Masculino';
    case 'FEMALE':
    case 'F':
      return 'Feminino';
    case 'OTHER':
    case 'O':
      return 'Outro';
    default:
      return 'Não informado';
  }
};

const DynamicTestForm = ({ testData, setTestData, selectedTest }: { 
  testData: any, 
  setTestData: (data: any) => void,
  selectedTest?: AvailableTest
}) => {
  const [dynamicFields, setDynamicFields] = useState<TestDynamicField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Carregar campos dinâmicos do teste selecionado
  useEffect(() => {
    if (selectedTest?.id) {
      loadDynamicFields();
    }
  }, [selectedTest?.id]);

  const loadDynamicFields = async () => {
    if (!selectedTest?.id) return;
    
    setLoadingFields(true);
    try {
      const fields = await enduranceApi.getTestDynamicFields(selectedTest.id);
      setDynamicFields(fields);
      
      // Inicializar testData com os campos dinâmicos
      const initialData = fields.map(field => ({
        fieldName: field.fieldName,
        value: '',
        unit: field.metric || '',
        description: ''
      }));
      setTestData({ dynamicResults: initialData });
    } catch (error) {
      console.error('Erro ao carregar campos dinâmicos:', error);
      toast.error('Erro ao carregar campos do teste');
    } finally {
      setLoadingFields(false);
    }
  };

  const updateField = (index: number, field: keyof DynamicTestResult, value: string) => {
    setTestData((prevData: any) => {
      const newDynamicResults = [...(prevData.dynamicResults || [])];
      newDynamicResults[index] = { ...newDynamicResults[index], [field]: value };
      return { ...prevData, dynamicResults: newDynamicResults };
    });
  };

  const isValidField = (result: DynamicTestResult) => {
    return result.fieldName && result.value && result.value.toString().trim() !== '';
  };

  const isValidForm = () => {
    const results = testData.dynamicResults || [];
    return results.length > 0 && results.every(isValidField);
  };

  if (loadingFields) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Campos de Resultado
      </Typography>
      
      {dynamicFields.length === 0 ? (
        <Alert severity="info">
          Este teste não possui campos dinâmicos configurados.
        </Alert>
      ) : (
        <Box sx={{ mt: 2 }}>
          {(testData.dynamicResults || []).map((result: DynamicTestResult, index: number) => (
            <Card key={index} sx={{ mb: 2, p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
                    label="Campo"
                    value={result.fieldName || ''}
                    disabled
                    variant="outlined"
                    size="small"
        />
      </Grid>
                <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
                    label="Valor"
                    value={result.value || ''}
                    onChange={(e) => updateField(index, 'value', e.target.value)}
                    variant="outlined"
                    size="small"
                    required
                    error={!result.value || result.value.toString().trim() === ''}
                    helperText={!result.value || result.value.toString().trim() === '' ? 'Campo obrigatório' : ''}
        />
      </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Unidade"
                    value={result.unit || ''}
                    disabled
                    variant="outlined"
                    size="small"
                  />
        </Grid>
                <Grid item xs={12} sm={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    {isValidField(result) && (
                      <CheckIcon color="success" />
      )}
                  </Box>
    </Grid>
              </Grid>
            </Card>
          ))}
          
          <Alert severity={isValidForm() ? "success" : "warning"} sx={{ mt: 2 }}>
            {isValidForm() 
              ? "Todos os campos obrigatórios foram preenchidos corretamente."
              : "Preencha todos os campos obrigatórios para continuar."
            }
          </Alert>
        </Box>
      )}
    </Box>
  );
};



// Componente Avatar seguro que trata erros de carregamento
const SafeAvatar = ({ src, children, ...props }: { src?: string; children?: React.ReactNode; [key: string]: any }) => {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <Avatar 
      src={!imageError && src ? src : undefined} 
      onError={handleImageError}
      {...props}
    >
      {children}
    </Avatar>
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

  // Estados para infinity scroll dos testes
  const [testsLoading, setTestsLoading] = useState(false);
  const [testsPage, setTestsPage] = useState(1);
  const [testsHasMore, setTestsHasMore] = useState(true);
  const [testsTotal, setTestsTotal] = useState(0);



  // Estados para todos os testes dos alunos (nova funcionalidade)
  const [allStudentTests, setAllStudentTests] = useState<any[]>([]);
  const [loadingAllTests, setLoadingAllTests] = useState(false);
  const [allTestsPage, setAllTestsPage] = useState(1);
  const [allTestsHasMore, setAllTestsHasMore] = useState(true);
  const [allTestsTotal, setAllTestsTotal] = useState(0);
  const [allTestsSummary, setAllTestsSummary] = useState({
    total: 0,
    appointments: 0,
    results: 0,
    pending: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0
  });
  const [allTestsSearchTerm, setAllTestsSearchTerm] = useState('');
  const [allTestsStatusFilter, setAllTestsStatusFilter] = useState<string>('ALL');
  const [allTestsStartDate, setAllTestsStartDate] = useState<Date | null>(null);
  const [allTestsEndDate, setAllTestsEndDate] = useState<Date | null>(null);
  const [allTestsTestIdFilter, setAllTestsTestIdFilter] = useState<string>('');
  const [allTestsUserIdFilter, setAllTestsUserIdFilter] = useState<string>('');

  // Estados para modal de registro de teste para aluno específico
  const [selectedStudentForTest, setSelectedStudentForTest] = useState<any>(null);
  const [studentTestDialogOpen, setStudentTestDialogOpen] = useState(false);
  const [studentTestData, setStudentTestData] = useState<any>({});
  const [studentTestDate, setStudentTestDate] = useState<Date | null>(new Date());
  const [studentTestLocation, setStudentTestLocation] = useState('');
  const [studentTestNotes, setStudentTestNotes] = useState('');
  const [studentTestSelectedTest, setStudentTestSelectedTest] = useState<string>('');
  const [isSubmittingStudentTest, setIsSubmittingStudentTest] = useState(false);

  // Estados para modal de detalhes do teste
  const [testDetailsDialogOpen, setTestDetailsDialogOpen] = useState(false);
  const [selectedTestForDetails, setSelectedTestForDetails] = useState<AllStudentTest | null>(null);



  // Função estabilizada para setTestData
  const handleSetTestData = useCallback((data: any) => {
    setTestData(data);
  }, []);

  // Função estabilizada para setStudentTestData
  const handleSetStudentTestData = useCallback((data: any) => {
    setStudentTestData(data);
  }, []);

  // Função para carregar testes com paginação
  const loadTests = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setTestsLoading(true);
      const response = await enduranceApi.getAvailableTests({ 
        page, 
        limit: 10 
      });
      
      const testsData = response.data || [];
      
      if (append) {
        setAvailableTests(prev => [...prev, ...testsData]);
      } else {
        setAvailableTests(testsData);
      }
      
      setTestsHasMore(response.pagination.hasNext);
      setTestsTotal(response.pagination.total);
      setTestsPage(page);
    } catch (err) {
      console.error('Erro ao carregar testes:', err);
      setError('Erro ao carregar testes disponíveis.');
    } finally {
      setTestsLoading(false);
    }
  }, []);

  // Função para carregar mais testes (infinity scroll)
  const loadMoreTests = useCallback(() => {
    if (!testsLoading && testsHasMore) {
      loadTests(testsPage + 1, true);
    }
  }, [testsLoading, testsHasMore, testsPage, loadTests]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentTab === 1) {
      fetchAllStudentTests(1, false);
    }
  }, [currentTab]);



  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [studentsResponse] = await Promise.all([
        enduranceApi.getCoachStudents()
      ]);
      
      const studentsData = Array.isArray(studentsResponse) ? studentsResponse : studentsResponse.students;
      
      // Remover duplicatas baseado em ID e email
      const uniqueStudents = studentsData ? studentsData.filter((student, index, self) => 
        index === self.findIndex(s => 
          s.user.id === student.user.id && s.user.email === student.user.email
        )
      ) : [];
      
      setStudents(uniqueStudents || []);
      
      // Carregar primeira página de testes
      await loadTests(1, false);
      
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

    // Usar sempre o DynamicTestForm conforme a nova estrutura
    return (
      <DynamicTestForm 
        testData={testData} 
        setTestData={handleSetTestData}
        selectedTest={test}
      />
    );
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !selectedTest) {
      toast.error('Selecione um aluno e um teste para continuar.');
      return;
    }

    const test = getSelectedTest();
    if (!test) {
      toast.error('Teste não encontrado.');
      return;
    }

    // Sempre usar resultados dinâmicos conforme a nova estrutura
    if (!testData.dynamicResults || testData.dynamicResults.length === 0) {
      toast.error('Adicione pelo menos um campo de resultado.');
      return;
    }

    // Validar se todos os campos obrigatórios estão preenchidos
    const hasInvalidFields = testData.dynamicResults.some(
      (result: DynamicTestResult) => !result.fieldName || !result.value
    );
    
    if (hasInvalidFields) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const student = students.find(s => s.user.id === selectedStudent);
      
      if (!student) {
        toast.error('Aluno não encontrado.');
        return;
      }

      const dynamicResultData: RecordDynamicTestResultRequest = {
        testId: selectedTest,
        userId: selectedStudent,
        resultType: 'MULTIPLE',
        multipleResults: testData.dynamicResults,
        notes: notes
      };

      await enduranceApi.recordCoachDynamicTestResult(dynamicResultData);
      
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





  // Função para buscar todos os testes dos alunos
  const fetchAllStudentTests = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      setLoadingAllTests(true);
      
      const params: any = {
        page,
        limit: 10
      };
      
      if (allTestsStatusFilter !== 'ALL') {
        params.status = allTestsStatusFilter;
      }
      
      if (allTestsSearchTerm) {
        params.search = allTestsSearchTerm;
      }
      
      if (allTestsStartDate) {
        params.startDate = allTestsStartDate.toISOString();
      }
      
      if (allTestsEndDate) {
        params.endDate = allTestsEndDate.toISOString();
      }
      
      if (allTestsTestIdFilter) {
        params.testId = allTestsTestIdFilter;
      }
      
      if (allTestsUserIdFilter) {
        params.userId = allTestsUserIdFilter;
      }
      
      const response = await enduranceApi.getAllStudentTests(params);
      
      if (append) {
        setAllStudentTests(prev => [...prev, ...(response.data || [])]);
      } else {
        setAllStudentTests(response.data || []);
      }
      
      setAllTestsHasMore(response.pagination?.hasNext || false);
      setAllTestsTotal(response.pagination?.total || 0);
      setAllTestsPage(page);
      
      if (response.summary) {
        setAllTestsSummary(response.summary);
      }
      
    } catch (error) {
      console.error('Erro ao carregar todos os testes dos alunos:', error);
      toast.error('Erro ao carregar todos os testes dos alunos.');
    } finally {
      setLoadingAllTests(false);
    }
  }, [
    allTestsStatusFilter,
    allTestsSearchTerm,
    allTestsStartDate,
    allTestsEndDate,
    allTestsTestIdFilter,
    allTestsUserIdFilter
  ]);

  // useEffect para carregar dados iniciais quando as dependências mudarem
  useEffect(() => {
    fetchAllStudentTests(1, false);
  }, [fetchAllStudentTests]);

  // Função para carregar mais testes dos alunos
  const loadMoreAllTests = useCallback(() => {
    if (!loadingAllTests && allTestsHasMore) {
      fetchAllStudentTests(allTestsPage + 1, true);
    }
  }, [loadingAllTests, allTestsHasMore, allTestsPage, fetchAllStudentTests]);

  // Removido: filtro agora é feito no servidor



  // Função para abrir modal de registro de teste para aluno específico
  const openStudentTestDialog = (student: any) => {
    setSelectedStudentForTest(student);
    setStudentTestDialogOpen(true);
    setStudentTestData({});
    setStudentTestDate(new Date());
    setStudentTestLocation('');
    setStudentTestNotes('');
    setStudentTestSelectedTest('');
  };

  // Função para fechar modal de registro de teste para aluno específico
  const closeStudentTestDialog = () => {
    setStudentTestDialogOpen(false);
    setSelectedStudentForTest(null);
    setStudentTestData({});
    setStudentTestDate(new Date());
    setStudentTestLocation('');
    setStudentTestNotes('');
    setStudentTestSelectedTest('');
  };

  // Função para obter teste selecionado para aluno específico
  const getSelectedStudentTest = () => {
    return availableTests.find(test => test.id === studentTestSelectedTest);
  };

  // Função para renderizar formulário de teste para aluno específico
  const renderStudentTestForm = () => {
    const selectedTest = getSelectedStudentTest();
    
    if (!selectedTest) return null;

    // Usar sempre o DynamicTestForm conforme a nova estrutura
    return (
      <DynamicTestForm
        testData={studentTestData}
        setTestData={handleSetStudentTestData}
        selectedTest={selectedTest}
      />
    );
  };

  // Função para submeter teste de aluno específico
  const handleSubmitStudentTest = async () => {
    if (!selectedStudentForTest || !studentTestSelectedTest) {
      toast.error('Selecione um aluno e um teste');
      return;
    }

    setIsSubmittingStudentTest(true);
    try {
      const selectedTest = getSelectedStudentTest();
      
      if (!selectedTest) {
        toast.error('Teste não encontrado');
        return;
      }

      const testData = {
        userId: selectedStudentForTest.user.id,
        testId: studentTestSelectedTest,
        date: studentTestDate,
        location: studentTestLocation,
        notes: studentTestNotes,
        ...studentTestData
      };

      // Sempre usar resultados dinâmicos conforme a nova estrutura
      await enduranceApi.recordCoachDynamicTestResult(testData as RecordDynamicTestResultRequest);

      toast.success('Teste registrado com sucesso!');
      closeStudentTestDialog();
      
      // Recarregar dados se necessário
      if (currentTab === 1) {
        fetchAllStudentTests(1, false);
      }
    } catch (error) {
      console.error('Erro ao registrar teste:', error);
      toast.error('Erro ao registrar teste. Tente novamente.');
    } finally {
      setIsSubmittingStudentTest(false);
    }
  };

  // Função para abrir modal de detalhes do teste
  const openTestDetailsDialog = (test: AllStudentTest) => {
    setSelectedTestForDetails(test);
    setTestDetailsDialogOpen(true);
  };

  // Função para fechar modal de detalhes do teste
  const closeTestDetailsDialog = () => {
    setTestDetailsDialogOpen(false);
    setSelectedTestForDetails(null);
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

  const getTestTypeLabel = (type: string) => {
    switch (type) {
      case 'APPOINTMENT': return 'Agendamento';
      case 'RESULT': return 'Resultado';
      default: return type;
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'APPOINTMENT': return 'primary';
      case 'RESULT': return 'success';
      default: return 'default';
    }
  };

  const clearAllTestsFilters = () => {
    setAllTestsSearchTerm('');
    setAllTestsStatusFilter('ALL');
    setAllTestsStartDate(null);
    setAllTestsEndDate(null);
    setAllTestsTestIdFilter('');
    setAllTestsUserIdFilter('');
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
            description="Gerencie seus alunos e visualize o histórico de testes realizados."
          />
          
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
            <Tab 
              icon={<PersonIcon />} 
              label="Meus Alunos" 
              iconPosition="start"
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Histórico de Testes" 
              iconPosition="start"
            />
          </Tabs>

          {currentTab === 0 && (
            // Aba de Meus Alunos
            <>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
              ) : (
                <>
                  {/* Filtro de busca */}
                  <Card sx={{ mb: 3 }}>
                      <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={4}>
                              <TextField
                            fullWidth
                            placeholder="Buscar aluno por nome ou email..."
                            value={studentSearchTerm}
                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <SearchIcon />
                                    </InputAdornment>
                                  ),
                                }}
                              />
                        </Grid>
                      </Grid>
                      </CardContent>
                    </Card>

                  {/* Lista de Alunos */}
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Aluno</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Gênero</TableCell>
                          <TableCell>Idade</TableCell>
                          <TableCell align="center">Ações</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students
                          .filter(student => 
                            student && 
                            student.user && 
                            student.user.id && 
                            student.user.name && 
                            student.user.email
                          )
                          .filter(student => {
                            if (!studentSearchTerm) return true;
                            const searchTerm = studentSearchTerm.toLowerCase();
                            return (
                              student.user.name.toLowerCase().includes(searchTerm) ||
                              student.user.email.toLowerCase().includes(searchTerm)
                            );
                          })
                          .map((student) => (
                            <TableRow key={student.user.id} hover>
                              <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <SafeAvatar 
                                    src={student.user.image ? getAbsoluteImageUrl(student.user.image) : undefined} 
                                    sx={{ mr: 2, width: 40, height: 40 }}
                                  >
                                    <PersonIcon />
                                  </SafeAvatar>
                                  <Typography variant="body1" fontWeight="medium">
                                    {student.user.name}
                                      </Typography>
                                    </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {student.user.email}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={formatGender(student.user.gender || '')} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {calculateAge(student.user.birthDate || new Date())} anos
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                      <Button
                        variant="contained"
                                  size="small"
                        startIcon={<AddIcon />}
                                  onClick={() => openStudentTestDialog(student)}
                      >
                        Registrar Teste
                      </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {students.filter(student => 
                    student && 
                    student.user && 
                    student.user.id && 
                    student.user.name && 
                    student.user.email
                  ).length === 0 && (
                    <Card>
                      <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <PersonIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Nenhum aluno encontrado
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Os alunos aparecerão aqui quando se inscreverem em seus planos.
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                </>
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
                      {getSelectedTest()?.supportsDynamicResults && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            Este teste suporta múltiplos campos de resultado. 
                            Adicione os campos específicos necessários para este teste.
                          </Typography>
                        </Alert>
                      )}
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
                    disabled={isSubmitting || (!testData.dynamicResults || testData.dynamicResults.length === 0)}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {isSubmitting ? 'Registrando...' : 'Registrar Teste'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Dialog de Registro de Teste para Aluno Específico */}
              <Dialog open={studentTestDialogOpen} onClose={closeStudentTestDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScienceIcon sx={{ mr: 1 }} />
                    Registrar Teste para {selectedStudentForTest?.user?.name}
                  </Box>
                </DialogTitle>
                <DialogContent>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <SafeAvatar 
                          src={selectedStudentForTest?.user?.image ? getAbsoluteImageUrl(selectedStudentForTest.user.image) : undefined} 
                          sx={{ mr: 2, width: 48, height: 48 }}
                        >
                          <PersonIcon />
                        </SafeAvatar>
                        <Box>
                          <Typography variant="h6">{selectedStudentForTest?.user?.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedStudentForTest?.user?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Selecionar Teste</InputLabel>
                        <Select
                          value={studentTestSelectedTest}
                          onChange={(e) => setStudentTestSelectedTest(e.target.value)}
                          label="Selecionar Teste"
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 300,
                              },
                              onScroll: (event) => {
                                const target = event.target as HTMLDivElement;
                                if (target.scrollTop + target.clientHeight >= target.scrollHeight - 20) {
                                  loadMoreTests();
                                }
                              },
                            },
                          }}
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
                          {testsLoading && (
                            <MenuItem disabled>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                <CircularProgress size={20} sx={{ mr: 1 }} />
                                <Typography variant="body2">Carregando mais testes...</Typography>
                              </Box>
                            </MenuItem>
                          )}
                          {!testsHasMore && availableTests.length > 0 && (
                            <MenuItem disabled>
                              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', width: '100%' }}>
                                Todos os {testsTotal} testes carregados
                              </Typography>
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </Grid>

                    {studentTestSelectedTest && (
                      <>
                        <Grid item xs={12}>
                          <Typography variant="h6" gutterBottom>
                            {getSelectedStudentTest()?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {getSelectedStudentTest()?.description}
                          </Typography>
                          {getSelectedStudentTest()?.supportsDynamicResults && (
                            <Alert severity="info" sx={{ mt: 1 }}>
                              <Typography variant="body2">
                                Este teste suporta múltiplos campos de resultado. 
                                Adicione os campos específicos necessários para este teste.
                              </Typography>
                            </Alert>
                          )}
                        </Grid>

                        <Grid item xs={12}>
                          {renderStudentTestForm()}
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                            <DatePicker
                              label="Data do Teste"
                              value={studentTestDate}
                              onChange={(newValue) => setStudentTestDate(newValue)}
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
                            value={studentTestLocation}
                            onChange={(e) => setStudentTestLocation(e.target.value)}
                            placeholder="ex: Academia, Parque, Pista"
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Observações"
                            multiline
                            rows={3}
                            value={studentTestNotes}
                            onChange={(e) => setStudentTestNotes(e.target.value)}
                            placeholder="Observações adicionais sobre o teste..."
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={closeStudentTestDialog} disabled={isSubmittingStudentTest}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmitStudentTest} 
                    variant="contained" 
                                          disabled={isSubmittingStudentTest || !studentTestSelectedTest || (!studentTestData.dynamicResults || studentTestData.dynamicResults.length === 0)}
                    startIcon={isSubmittingStudentTest ? <CircularProgress size={20} /> : <SaveIcon />}
                  >
                    {isSubmittingStudentTest ? 'Registrando...' : 'Registrar Teste'}
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}

          {currentTab === 1 && (
            // Aba de Histórico de Testes dos Alunos
            <>
              {/* Estatísticas */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={2}>
                  <Card sx={{ textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{allTestsSummary.total}</Typography>
                      <Typography variant="body2">Total</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card sx={{ textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{allTestsSummary.pending}</Typography>
                      <Typography variant="body2">Pendentes</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card sx={{ textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{allTestsSummary.scheduled}</Typography>
                      <Typography variant="body2">Agendados</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card sx={{ textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{allTestsSummary.completed}</Typography>
                      <Typography variant="body2">Concluídos</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Card sx={{ textAlign: 'center', bgcolor: 'error.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{allTestsSummary.cancelled}</Typography>
                      <Typography variant="body2">Cancelados</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Filtros */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        placeholder="Buscar por aluno ou teste..."
                        value={allTestsSearchTerm}
                        onChange={(e) => setAllTestsSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={allTestsStatusFilter}
                          onChange={(e) => setAllTestsStatusFilter(e.target.value)}
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
                    <Grid item xs={12} sm={6} md={2}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                        <DatePicker
                          label="Data Inicial"
                          value={allTestsStartDate}
                          onChange={(newValue) => setAllTestsStartDate(newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small"
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                        <DatePicker
                          label="Data Final"
                          value={allTestsEndDate}
                          onChange={(newValue) => setAllTestsEndDate(newValue)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small"
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Teste</InputLabel>
                        <Select
                          value={allTestsTestIdFilter}
                          onChange={(e) => setAllTestsTestIdFilter(e.target.value)}
                          label="Teste"
                        >
                          <MenuItem value="">Todos os testes</MenuItem>
                          {availableTests.map((test) => (
                            <MenuItem key={test.id} value={test.id}>
                              {test.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={1}>
                      <Button
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        onClick={clearAllTestsFilters}
                        fullWidth
                      >
                        Limpar
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Lista de Testes */}
              {loadingAllTests && allStudentTests.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Histórico de Testes ({allStudentTests.length})
                    </Typography>
                    
                    {allStudentTests.length === 0 ? (
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
                              <TableCell>Data de Realização</TableCell>
                              <TableCell>Resultados</TableCell>
                              <TableCell>Ações</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {allStudentTests.map((test) => (
                              <TableRow key={test.id}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <SafeAvatar 
                                      src={test.user.image ? getAbsoluteImageUrl(test.user.image) : undefined} 
                                      sx={{ mr: 2, width: 32, height: 32 }}
                                    >
                                      <PersonIcon />
                                    </SafeAvatar>
                                    <Box>
                                      <Typography variant="body2">{test.user.name}</Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {test.user.email}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2">{test.test.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {test.test.type}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={getStatusLabel(test.status)}
                                    color={getStatusColor(test.status) as any}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {test.recordedAt ? 
                                      format(new Date(test.recordedAt), 'dd/MM/yyyy', { locale: ptBR }) : 
                                      'Data não informada'
                                    }
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {test.recordedAt ? 
                                      format(new Date(test.recordedAt), 'HH:mm', { locale: ptBR }) : 
                                      ''
                                    }
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {test.dynamicResults ? (
                                    <Box>
                                      {test.dynamicResults.multipleResults?.map((result, index) => (
                                        <Typography key={index} variant="body2">
                                          {result.fieldName}: {result.value} {result.unit}
                                        </Typography>
                                      ))}
                                    </Box>
                                  ) : test.value ? (
                                    <Typography variant="body2">
                                      {test.value} {test.unit}
                                    </Typography>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      Sem resultado
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title="Ver Detalhes">
                                          <IconButton
                                            size="small"
                                        onClick={() => openTestDetailsDialog(test)}
                                          color="info"
                                        >
                                        <VisibilityIcon />
                                        </IconButton>
                                      </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                            {loadingAllTests && allStudentTests.length > 0 && (
                              <TableRow>
                                <TableCell colSpan={6} align="center">
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    <Typography variant="body2">Carregando testes...</Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            )}
                            {allTestsHasMore && !loadingAllTests && (
                              <TableRow>
                                <TableCell colSpan={6} align="center">
                                  <Button
                                    variant="outlined"
                                    onClick={loadMoreAllTests}
                                    sx={{ mt: 2 }}
                                  >
                                    Carregar Mais Testes
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )}
                            {!allTestsHasMore && allStudentTests.length > 0 && (
                              <TableRow>
                                <TableCell colSpan={6} align="center">
                                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    Todas as {allTestsTotal} solicitações foram carregadas
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              )}


            </>
          )}



          {/* Modal de Detalhes do Teste */}
          <Dialog open={testDetailsDialogOpen} onClose={closeTestDetailsDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssessmentIcon sx={{ mr: 1 }} />
                Detalhes do Teste
                  </Box>
                </DialogTitle>
                <DialogContent>
              {selectedTestForDetails && (
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SafeAvatar 
                        src={selectedTestForDetails.user?.image ? getAbsoluteImageUrl(selectedTestForDetails.user.image) : undefined} 
                        sx={{ mr: 2, width: 48, height: 48 }}
                      >
                        <PersonIcon />
                      </SafeAvatar>
                      <Box>
                        <Typography variant="h6">{selectedTestForDetails.user?.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedTestForDetails.user?.email}
                      </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Teste</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedTestForDetails.test?.name}
                      </Typography>
                    </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Tipo</Typography>
                    <Chip 
                      label={getTestTypeLabel(selectedTestForDetails.test?.type || '')} 
                      color={getTestTypeColor(selectedTestForDetails.test?.type || '') as any} 
                      size="small"
                      />
                    </Grid>

                  {selectedTestForDetails.recordedAt && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">Data de Realização</Typography>
                      <Typography variant="body2">
                        {format(new Date(selectedTestForDetails.recordedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </Typography>
                    </Grid>
                  )}

                  {selectedTestForDetails.dynamicResults?.location && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Local</Typography>
                      <Typography variant="body2" gutterBottom>
                        {selectedTestForDetails.dynamicResults.location}
                      </Typography>
                    </Grid>
                  )}

                  {selectedTestForDetails.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Observações</Typography>
                      <Typography variant="body2" gutterBottom>
                        {selectedTestForDetails.notes}
                      </Typography>
                    </Grid>
                  )}

                  {selectedTestForDetails.dynamicResults?.multipleResults && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Resultados</Typography>
                      <Box sx={{ 
                        bgcolor: 'grey.50', 
                        p: 2, 
                        borderRadius: 1, 
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}>
                        {selectedTestForDetails.dynamicResults.multipleResults.map((result, index) => (
                          <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                            <strong>{result.fieldName}:</strong> {result.value} {result.unit}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                  )}

                  {selectedTestForDetails.value && !selectedTestForDetails.dynamicResults && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Resultado</Typography>
                      <Box sx={{ 
                        bgcolor: 'grey.50', 
                        p: 2, 
                        borderRadius: 1, 
                        border: '1px solid',
                        borderColor: 'grey.200'
                      }}>
                        <Typography variant="body2">
                          {selectedTestForDetails.value} {selectedTestForDetails.unit}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  </Grid>
              )}
                </DialogContent>
                <DialogActions>
              <Button onClick={closeTestDetailsDialog}>
                Fechar
                  </Button>
                </DialogActions>
              </Dialog>
        </Container>
        <Toaster position="top-right" />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 