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
  Visibility as VisibilityIcon,
  CloudUpload as UploadIcon,
  Description as ReportIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enduranceApi } from '@/services/enduranceApi';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/Dashboard/PageHeader';
import { AvailableTest, TestType } from '@/types/api';
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
    
    return undefined;
  }
};



interface AllStudentTest {
  id: string;
  testId: string;
  userId: string;
  // Novo padrão de resultados (preferencial)
  timeSeconds?: number;
  generalRank?: number;
  categoryRank?: number;
  // Legado
  value?: string;
  unit?: string;
  notes?: string;
  recordedAt?: string;
  recordedBy?: string;
  reportUrl?: string | null;
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

// Conversão de tempo "mm:ss.sss" para segundos (decimal)
const parseTimeToSeconds = (input: string): number | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  const match = trimmed.match(/^(\d+):(\d{1,2})(?:\.(\d{1,3}))?$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  const millis = match[3] ? Number('0.' + match[3]) : 0;
  return minutes * 60 + seconds + millis;
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
  const { registerUpdateCallback, unregisterUpdateCallback } = useRealtimeUpdates();
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
  // Campos do novo padrão
  // Removidos campos padrão: agora apenas resultados dinâmicos
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
  // Modo e campos para resultados dinâmicos (diálogo geral)
  const [dynamicFieldsLoading, setDynamicFieldsLoading] = useState<boolean>(false);
  const [dynamicResults, setDynamicResults] = useState<Array<{ fieldName: string; unit?: string; value: string }>>([]);

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
  // removido fluxo dinâmico legado
  const [studentTestDate, setStudentTestDate] = useState<Date | null>(new Date());
  const [studentTestLocation, setStudentTestLocation] = useState('');
  const [studentTestNotes, setStudentTestNotes] = useState('');
  const [studentTestSelectedTest, setStudentTestSelectedTest] = useState<string>('');
  const [isSubmittingStudentTest, setIsSubmittingStudentTest] = useState(false);
  // Modo e campos para resultados dinâmicos (diálogo do aluno específico)
  const [studentResultMode, setStudentResultMode] = useState<'STANDARD' | 'DYNAMIC'>('STANDARD');
  const [studentDynamicFieldsLoading, setStudentDynamicFieldsLoading] = useState<boolean>(false);
  const [studentDynamicResults, setStudentDynamicResults] = useState<Array<{ fieldName: string; unit?: string; value: string }>>([]);

  // Estados para modal de detalhes do teste
  const [testDetailsDialogOpen, setTestDetailsDialogOpen] = useState(false);
  const [selectedTestForDetails, setSelectedTestForDetails] = useState<AllStudentTest | null>(null);

  // Estados para upload de relatório no modal de detalhes
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);



  // Validação para campos dinâmicos: pelo menos um valor preenchido
  const isDynamicFormValid = useCallback(() => {
    return dynamicResults.some(r => String(r.value || '').trim() !== '');
  }, [dynamicResults]);

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

  // Registrar callback para atualizações em tempo real
  useEffect(() => {
    const reloadTests = () => {
      if (currentTab === 1) {
        fetchAllStudentTests(1, false);
      }
      loadData(); // Recarregar testes disponíveis também
    };
    
    registerUpdateCallback('tests', reloadTests);
    
    return () => {
      unregisterUpdateCallback('tests');
    };
  }, [registerUpdateCallback, unregisterUpdateCallback, currentTab]);

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
    // Preparar campos dinâmicos para o teste selecionado
    setDynamicResults([]);
    if (selectedTest) {
      setDynamicFieldsLoading(true);
      enduranceApi.getTestDynamicFields(selectedTest)
        .then(fields => {
          const mapped = (fields || []).map(f => ({ fieldName: f.fieldName, unit: f.metric, value: '' }));
          setDynamicResults(mapped);
        })
        .finally(() => setDynamicFieldsLoading(false));
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTestDate(new Date());
    setLocation('');
    setNotes('');
    // Limpar resultados dinâmicos
    setDynamicResults([]);
  };

  const getSelectedTest = () => {
    return availableTests.find(test => test.id === selectedTest);
  };

  const renderDynamicResultForm = () => (
    <Grid container spacing={2}>
      {dynamicResults.map((r, idx) => (
        <Grid item xs={12} md={4} key={`${r.fieldName}-${idx}`}>
          <TextField
            fullWidth
            label={`${r.fieldName}${r.unit ? ` (${r.unit})` : ''}`}
            value={r.value}
            onChange={(e) => {
              const v = e.target.value;
              setDynamicResults(prev => prev.map((it, i) => i === idx ? { ...it, value: v } : it));
            }}
          />
        </Grid>
      ))}
      {dynamicResults.length === 0 && (
        <Grid item xs={12}>
          <Alert severity="info">Nenhum campo dinâmico configurado para este teste.</Alert>
        </Grid>
      )}
    </Grid>
  );

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

    const anyFilled = dynamicResults.some(r => String(r.value || '').trim() !== '');
    if (!anyFilled) {
      toast.error('Informe pelo menos um valor de campo dinâmico.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const student = students.find(s => s.user.id === selectedStudent);
      
      if (!student) {
        toast.error('Aluno não encontrado.');
        return;
      }

      const multipleResults = dynamicResults
        .filter(r => String(r.value || '').trim() !== '')
        .map(r => ({ fieldName: r.fieldName, unit: r.unit, value: r.value }));
      await enduranceApi.recordCoachDynamicTestResult({
        testId: selectedTest,
        userId: selectedStudent,
        resultType: 'MULTIPLE',
        multipleResults,
        notes
      });
      
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
    setStudentTestDate(new Date());
    setStudentTestLocation('');
    setStudentTestNotes('');
    setStudentTestSelectedTest('');
    setStudentResultMode('DYNAMIC');
    setStudentDynamicResults([]);
  };

  // Função para fechar modal de registro de teste para aluno específico
  const closeStudentTestDialog = () => {
    setStudentTestDialogOpen(false);
    setSelectedStudentForTest(null);
    setStudentTestDate(new Date());
    setStudentTestLocation('');
    setStudentTestNotes('');
    setStudentTestSelectedTest('');
    setStudentResultMode('DYNAMIC');
    setStudentDynamicResults([]);
  };

  // Função para obter teste selecionado para aluno específico
  const getSelectedStudentTest = () => {
    return availableTests.find(test => test.id === studentTestSelectedTest);
  };

  // Quando escolher um teste no diálogo do aluno, carregar os campos dinâmicos
  useEffect(() => {
    if (studentTestSelectedTest) {
      setStudentDynamicFieldsLoading(true);
      enduranceApi.getTestDynamicFields(studentTestSelectedTest)
        .then(fields => {
          const mapped = (fields || []).map(f => ({ fieldName: f.fieldName, unit: f.metric, value: '' }));
          setStudentDynamicResults(mapped);
        })
        .finally(() => setStudentDynamicFieldsLoading(false));
    } else {
      setStudentDynamicResults([]);
    }
  }, [studentTestSelectedTest]);

  // Estados e validação do formulário do aluno específico
  // Validação dinâmica no diálogo do aluno específico
  const isStudentFormValid = useCallback(() => {
    return studentDynamicResults.some(r => String(r.value || '').trim() !== '');
  }, [studentDynamicResults]);

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

      const multipleResults = studentDynamicResults
        .filter(r => String(r.value || '').trim() !== '')
        .map(r => ({ fieldName: r.fieldName, unit: r.unit, value: r.value }));
      if (multipleResults.length === 0) {
        toast.error('Informe pelo menos um valor de campo dinâmico.');
        return;
      }
      await enduranceApi.recordCoachDynamicTestResult({
        userId: selectedStudentForTest.user.id,
        testId: studentTestSelectedTest,
        resultType: 'MULTIPLE',
        multipleResults,
        notes: studentTestNotes,
      });

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
    
    // Limpar estados anteriores do upload
    setReportFile(null);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadingReport(false);
    
    // Usar o reportUrl que já vem na resposta da API
    setReportUrl(test.reportUrl || null);
  };

  // Função para fechar modal de detalhes do teste
  const closeTestDetailsDialog = () => {
    setTestDetailsDialogOpen(false);
    setSelectedTestForDetails(null);
    
    // Limpar estados do upload
    setReportFile(null);
    setReportUrl(null);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadingReport(false);
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

  // Helpers para extrair/exibir resultados no novo padrão e fallback
  const extractStandardResults = (t: any) => {
    const toNumber = (v: any): number | undefined => {
      if (v === null || v === undefined) return undefined;
      if (typeof v === 'number') return isNaN(v) ? undefined : v;
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    };
    const src = t || {};
    const rootHasTime = toNumber(src.timeSeconds) !== undefined;
    const candidate = rootHasTime ? src : (src.testResult || src.result || {});
    const timeSeconds = toNumber(candidate.timeSeconds);
    const generalRank = toNumber(candidate.generalRank);
    const categoryRank = toNumber(candidate.categoryRank);
    const notes = src.notes ?? candidate.notes;
    return { timeSeconds, generalRank, categoryRank, notes };
  };

  const formatTime = (seconds?: number) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) return undefined;
    const minutes = Math.floor(seconds / 60);
    const rem = seconds - minutes * 60;
    const secFixed = rem.toFixed(3);
    const secStr = rem < 10 ? `0${secFixed}` : secFixed;
    return `${minutes}:${secStr}`; // mm:ss.sss
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

  // Funções para upload de relatório
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo (apenas PDF)
      if (file.type !== 'application/pdf') {
        setUploadError('Apenas arquivos PDF são permitidos');
        return;
      }
      
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('O arquivo deve ter no máximo 10MB');
        return;
      }
      
      setReportFile(file);
      setUploadError(null);
    }
  };

  const handleUploadReport = async () => {
    if (!reportFile || !selectedTestForDetails) return;

    setUploadingReport(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Fazer upload do arquivo
      const uploadResponse = await enduranceApi.uploadTestReport(selectedTestForDetails.id, reportFile);
      
      // Atualizar URL do relatório no resultado
      await enduranceApi.updateTestResultReport(selectedTestForDetails.id, uploadResponse.url);
      
      setReportUrl(uploadResponse.url);
      setUploadSuccess('Relatório enviado com sucesso!');
      setReportFile(null);
      
      // Recarregar a lista de testes para atualizar os dados
      if (currentTab === 1) {
        fetchAllStudentTests(1, false);
      }
    } catch (err: any) {
      console.error('Erro ao fazer upload do relatório:', err);
      setUploadError(err.response?.data?.message || 'Erro ao fazer upload do relatório');
    } finally {
      setUploadingReport(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedTestForDetails) return;

    try {
      await enduranceApi.deleteTestReport(selectedTestForDetails.id);
      setReportUrl(null);
      setUploadSuccess('Relatório removido com sucesso!');
      
      // Recarregar a lista de testes
      if (currentTab === 1) {
        fetchAllStudentTests(1, false);
      }
    } catch (err: any) {
      console.error('Erro ao remover relatório:', err);
      setUploadError(err.response?.data?.message || 'Erro ao remover relatório');
    }
  };

  const handleDownloadReport = () => {
    if (reportUrl) {
      window.open(reportUrl, '_blank');
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
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          Preencha os campos dinâmicos definidos para este teste.
                        </Typography>
                      </Alert>
                    </Grid>

                    <Grid item xs={12}>
                      {dynamicFieldsLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={20} />
                          <Typography variant="body2">Carregando campos...</Typography>
                        </Box>
                      ) : (
                        renderDynamicResultForm()
                      )}
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
                    disabled={isSubmitting || !isDynamicFormValid()}
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
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              Preencha os campos dinâmicos definidos para este teste.
                            </Typography>
                          </Alert>
                        </Grid>

                        <Grid item xs={12}>
                          {studentDynamicFieldsLoading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={20} />
                              <Typography variant="body2">Carregando campos...</Typography>
                            </Box>
                          ) : (
                            <Grid container spacing={2}>
                              {studentDynamicResults.map((r, idx) => (
                                <Grid item xs={12} md={4} key={`${r.fieldName}-${idx}`}>
                                  <TextField
                                    fullWidth
                                    label={`${r.fieldName}${r.unit ? ` (${r.unit})` : ''}`}
                                    value={r.value}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      setStudentDynamicResults(prev => prev.map((it, i) => i === idx ? { ...it, value: v } : it));
                                    }}
                                  />
                                </Grid>
                              ))}
                              {studentDynamicResults.length === 0 && (
                                <Grid item xs={12}>
                                  <Alert severity="info">Nenhum campo dinâmico configurado para este teste.</Alert>
                                </Grid>
                              )}
                            </Grid>
                          )}
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
                    disabled={isSubmittingStudentTest || !studentTestSelectedTest || !isStudentFormValid()}
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
                                  {(() => {
                                    // 1) Preferir resultados dinâmicos quando existirem
                                    if (test.dynamicResults) {
                                      const dr: any = test.dynamicResults;
                                      const list = Array.isArray(dr?.multipleResults)
                                        ? dr.multipleResults
                                        : (Array.isArray(dr) ? dr : []);
                                      if (Array.isArray(list) && list.length > 0) {
                                        return (
                                          <Box>
                                            {list.map((result: any, index: number) => (
                                              <Typography key={index} variant="body2">
                                                {result.fieldName}: {result.value} {result.unit}
                                              </Typography>
                                            ))}
                                          </Box>
                                        );
                                      }
                                    }
                                    // 2) Fallback para padrão tempo/classificações
                                    const std = extractStandardResults(test);
                                    if (typeof std.timeSeconds === 'number') {
                                      return (
                                        <Box>
                                          <Typography variant="body2">Tempo: {formatTime(std.timeSeconds)}</Typography>
                                          {typeof std.generalRank === 'number' && (
                                            <Typography variant="body2">Geral: {std.generalRank}</Typography>
                                          )}
                                          {typeof std.categoryRank === 'number' && (
                                            <Typography variant="body2">Categoria: {std.categoryRank}</Typography>
                                          )}
                                        </Box>
                                      );
                                    }
                                    // 3) Fallback legado simples
                                    if (test.value) {
                                      return (
                                        <Typography variant="body2">{test.value} {test.unit}</Typography>
                                      );
                                    }
                                    return (
                                      <Typography variant="body2" color="text.secondary">Sem resultado</Typography>
                                    );
                                  })()}
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

                  {(() => {
                    // 1) Preferir exibição dos resultados dinâmicos
                    const dr: any = selectedTestForDetails.dynamicResults;
                    const list = Array.isArray(dr?.multipleResults)
                      ? dr.multipleResults
                      : (Array.isArray(dr) ? dr : []);
                    if (Array.isArray(list) && list.length > 0) {
                      return (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Resultados</Typography>
                          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                            {list.map((result: any, index: number) => (
                              <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                                <strong>{result.fieldName}:</strong> {result.value} {result.unit}
                              </Typography>
                            ))}
                          </Box>
                        </Grid>
                      );
                    }
                    // 2) Fallback para padrão tempo/classificações
                    const std = extractStandardResults(selectedTestForDetails);
                    if (typeof std.timeSeconds === 'number') {
                      return (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Resultados</Typography>
                          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Tempo:</strong> {formatTime(std.timeSeconds)}
                            </Typography>
                            {typeof std.generalRank === 'number' && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Classificação Geral:</strong> {std.generalRank}
                              </Typography>
                            )}
                            {typeof std.categoryRank === 'number' && (
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Classificação na Categoria:</strong> {std.categoryRank}
                              </Typography>
                            )}
                          </Box>
                        </Grid>
                      );
                    }
                    // 3) Fallback legado
                    if (selectedTestForDetails.value) {
                      return (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Resultado</Typography>
                          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                            <Typography variant="body2">{selectedTestForDetails.value} {selectedTestForDetails.unit}</Typography>
                          </Box>
                        </Grid>
                      );
                    }
                    return null;
                  })()}

                  {/* Seção de Relatório */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReportIcon />
                        Relatório do Teste
                      </Box>
                    </Typography>
                    
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      {reportUrl ? (
                        // Relatório existente
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <ReportIcon color="primary" />
                            <Typography variant="body1" fontWeight="bold">
                              Relatório disponível
                            </Typography>
                          </Box>
                          
                          {/* Link do relatório */}
                          <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Link do relatório:
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                wordBreak: 'break-all',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                color: 'primary.main',
                                cursor: 'pointer',
                                '&:hover': {
                                  textDecoration: 'underline'
                                }
                              }}
                              onClick={handleDownloadReport}
                              title="Clique para abrir o relatório"
                            >
                              {reportUrl}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              startIcon={<DownloadIcon />}
                              onClick={handleDownloadReport}
                              size="small"
                            >
                              Baixar Relatório
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={handleDeleteReport}
                              size="small"
                            >
                              Remover
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        // Upload de novo relatório
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Faça upload de um relatório em PDF para este teste
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <input
                              accept=".pdf"
                              style={{ display: 'none' }}
                              id="report-upload-coach"
                              type="file"
                              onChange={handleFileSelect}
                            />
                            <label htmlFor="report-upload-coach">
                              <Button
                                variant="outlined"
                                component="span"
                                startIcon={<UploadIcon />}
                                size="small"
                              >
                                Selecionar Arquivo
                              </Button>
                            </label>
                            
                            {reportFile && (
                              <Typography variant="body2" color="primary">
                                {reportFile.name}
                              </Typography>
                            )}
                          </Box>
                          
                          {reportFile && (
                            <Button
                              variant="contained"
                              startIcon={<UploadIcon />}
                              onClick={handleUploadReport}
                              disabled={uploadingReport}
                              size="small"
                              sx={{ mb: 2 }}
                            >
                              {uploadingReport ? 'Enviando...' : 'Enviar Relatório'}
                            </Button>
                          )}
                        </Box>
                      )}
                      
                      {/* Mensagens de feedback */}
                      {uploadError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          {uploadError}
                        </Alert>
                      )}
                      
                      {uploadSuccess && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          {uploadSuccess}
                        </Alert>
                      )}
                      
                      {uploadingReport && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                          <CircularProgress size={20} />
                          <Typography variant="body2" color="text.secondary">
                            Enviando relatório...
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
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