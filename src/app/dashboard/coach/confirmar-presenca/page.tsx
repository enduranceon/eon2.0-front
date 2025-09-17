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
  IconButton,
  InputAdornment,
  Container
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Today as TodayIcon,
  EmojiEvents as EmojiEventsIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Clear as ClearIcon,
  Category as CategoryIcon,
  Straighten as DistanceIcon
} from '@mui/icons-material';
import { enduranceApi } from '@/services/enduranceApi';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

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

// Função para validar UUID ou CUID
const isValidId = (id: string): boolean => {
  // UUID padrão: 8-4-4-4-12 caracteres com hífens
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  // CUID: formato como 'cmd3wjy060001yg8ub7nbmrxb' (21-25 caracteres alfanuméricos)
  const cuidRegex = /^[a-z0-9]{20,30}$/i;
  
  // NanoID: formato similar ao CUID mas pode ter diferentes tamanhos
  const nanoidRegex = /^[a-zA-Z0-9_-]{10,30}$/;
  
  return uuidRegex.test(id) || cuidRegex.test(id) || nanoidRegex.test(id);
};

interface ExamRegistration {
  id: string;
  exam: {
    id: string;
    name: string;
    date: string;
    location: string;
    modalidade: {
      name: string;
    };
  };
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  registeredAt: string;
  attendanceConfirmed?: boolean;
  result?: string;
  timeSeconds?: number;
  generalRank?: number;
  categoryRank?: number;
  distance?: {
    id: string;
    distance: string;
    unit: string;
  } | null;
  category?: {
    id: string;
    name: string;
  } | null;
}

export default function ConfirmarPresencaPage() {
  const [registrations, setRegistrations] = useState<ExamRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<ExamRegistration | null>(null);
  
  // Novos estados para filtros adicionais
  const [examFilter, setExamFilter] = useState<string>('');
  const [modalidadeFilter, setModalidadeFilter] = useState<string>('');
  const [attendedFilter, setAttendedFilter] = useState<string>('');
  const [exams, setExams] = useState<any[]>([]);
  const [modalidades, setModalidades] = useState<any[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [timeSecondsInput, setTimeSecondsInput] = useState('');
  const [generalRankInput, setGeneralRankInput] = useState('');
  const [categoryRankInput, setCategoryRankInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    fetchRegistrations();
  }, [examFilter, modalidadeFilter, attendedFilter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar dados em paralelo
      const [registrationsResponse, examsResponse] = await Promise.all([
        enduranceApi.getCoachExamRegistrations({
          page: 1,
          limit: 100, // Buscar todas as inscrições
          examId: examFilter || undefined,
          modalidadeId: modalidadeFilter || undefined,
          attended: attendedFilter === 'true' ? true : attendedFilter === 'false' ? false : undefined,
        }),
        fetch('/api/exams').then(res => {
          if (!res.ok) {
            throw new Error(`Erro ao buscar provas: ${res.status}`);
          }
          return res.json();
        }).catch(error => {
          console.error('Erro ao buscar provas:', error);
          return {
            success: false,
            data: [],
            total: 0,
            message: 'Erro ao carregar provas'
          };
        }),
      ]);
      
      // Carregar modalidades separadamente para melhor tratamento de erro
      let modalidadesResponse;
      try {
        modalidadesResponse = await enduranceApi.getModalidades();
      } catch (modalidadesError) {
        console.error('Erro ao carregar modalidades:', modalidadesError);
        modalidadesResponse = null;
      }
      
      
      
      // Mapear os dados para o formato esperado pelo componente
      const mappedRegistrations: ExamRegistration[] = registrationsResponse.data.map((registration: any, index: number) => {
        
        
        // Verificar se o ID é válido (UUID, CUID ou NanoID)
        let validId = registration.id;
        if (!isValidId(registration.id)) {
          validId = `temp-${Date.now()}-${index}`; // ID temporário para desenvolvimento
        }
        
        return {
          id: validId,
          exam: {
            id: registration.exam.id,
            name: registration.exam.name,
            date: registration.exam.date,
            location: registration.exam.location,
            modalidade: {
              name: registration.exam.modalidade.name
            }
          },
          user: {
            id: registration.user.id,
            name: registration.user.name,
            email: registration.user.email,
            image: registration.user.image
          },
          status: 'CONFIRMED', // Inscrições confirmadas
          registeredAt: registration.createdAt,
          attendanceConfirmed: registration.attended,
          result: registration.result || undefined,
          timeSeconds: registration.timeSeconds !== undefined && registration.timeSeconds !== null ? Number(registration.timeSeconds) : undefined,
          generalRank: registration.generalRank ?? undefined,
          categoryRank: registration.categoryRank ?? undefined,
          distance: registration.distance || null,
          category: registration.category || null
        };
      });
      
      setRegistrations(mappedRegistrations);
      
      // Configurar dados de provas
      if (examsResponse.success && Array.isArray(examsResponse.data)) {
        setExams(examsResponse.data);
      } else {
        setExams([]);
      }
      
      // Configurar modalidades
      let modalidadesData = modalidadesResponse?.data || modalidadesResponse;
      
      if (!Array.isArray(modalidadesData)) {
        if (modalidadesData && typeof modalidadesData === 'object') {
          modalidadesData = modalidadesData.modalidades || modalidadesData.data || modalidadesData.items || [];
        } else {
          modalidadesData = [];
        }
      }
      
      if (!Array.isArray(modalidadesData)) {
        modalidadesData = [];
      }
      
      const modalidadesArray = Array.isArray(modalidadesData) ? modalidadesData : [];
      setModalidades(modalidadesArray);
      
      // Se não há modalidades, usar dados dos participantes para extrair modalidades únicas
      if (modalidadesArray.length === 0 && registrationsResponse.data?.length > 0) {
        const uniqueModalidades = registrationsResponse.data
          .map(p => p.exam?.modalidade)
          .filter((modalidade, index, self) => 
            modalidade && modalidade.id && modalidade.name && 
            self.findIndex(m => m?.id === modalidade.id) === index
          );
        setModalidades(uniqueModalidades);
      }
      
    } catch (error) {
      console.error('Erro ao buscar inscrições:', error);
      setError('Erro ao carregar inscrições em provas. Verifique se você tem permissão para acessar esses dados.');
      setRegistrations([]); // Limpar dados em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttendance = async (registrationId: string) => {
    try {
      
      
      // Verificar se o registrationId é válido
      if (!registrationId || registrationId.trim() === '') {
        setError('ID da inscrição inválido');
        return;
      }
      
      // Verificar se o registrationId é um ID válido ou um ID temporário
      if (!isValidId(registrationId)) {
        console.error('❌ ID da inscrição não é válido:', registrationId);
        
        // Verificar se é um ID temporário ou se estamos em desenvolvimento
        if (registrationId.startsWith('temp-') || process.env.NODE_ENV === 'development') {

          setRegistrations(prev => prev.map(reg => 
            reg.id === registrationId 
              ? { ...reg, attendanceConfirmed: true }
              : reg
          ));
          setSuccess('Presença confirmada com sucesso! (Modo desenvolvimento)');
          setConfirmDialogOpen(false);
          setSelectedRegistration(null);
          setTimeout(() => setSuccess(null), 3000);
          return;
        }
        
        setError('ID da inscrição inválido. Verifique se o backend está configurado corretamente.');
        return;
      }
      
      await enduranceApi.confirmExamAttendance(registrationId);
      
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, attendanceConfirmed: true }
          : reg
      ));
      
      setSuccess('Presença confirmada com sucesso!');
      setConfirmDialogOpen(false);
      setSelectedRegistration(null);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Erro ao confirmar presença:', error);
      console.error('Detalhes do erro:', error);
      
      // Verificar se é um erro específico de ID
      if (error?.response?.data?.message?.includes('must be a UUID') || error?.response?.data?.message?.includes('must be a valid')) {
        setError('Erro: ID da inscrição deve ser válido. Verifique se o backend está configurado corretamente.');
      } else if (error?.response?.status === 400) {
        setError('Erro: Dados inválidos enviados para o servidor.');
      } else if (error?.response?.status === 404) {
        setError('Erro: Inscrição não encontrada.');
      } else if (error?.response?.status === 403) {
        setError('Erro: Você não tem permissão para confirmar esta presença.');
      } else {
        setError('Erro ao confirmar presença. Tente novamente.');
      }
      
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRegisterResult = async (registrationId: string) => {
    try {
      const timeSeconds = timeSecondsInput.trim() !== '' ? Number(timeSecondsInput) : undefined;
      const generalRank = generalRankInput.trim() !== '' ? parseInt(generalRankInput, 10) : undefined;
      const categoryRank = categoryRankInput.trim() !== '' ? parseInt(categoryRankInput, 10) : undefined;

      if (timeSecondsInput.trim() === '' && generalRankInput.trim() === '' && categoryRankInput.trim() === '') {
        setError('Informe pelo menos um dos campos: Tempo (segundos), Classificação Geral ou Classificação na Categoria.');
        return;
      }

      if (timeSecondsInput.trim() !== '' && (Number.isNaN(timeSeconds) || timeSeconds! < 0)) {
        setError('Tempo (segundos) deve ser um número válido maior ou igual a 0.');
        return;
      }
      if (generalRankInput.trim() !== '' && (Number.isNaN(generalRank) || generalRank! < 1)) {
        setError('Classificação Geral deve ser um inteiro válido (≥ 1).');
        return;
      }
      if (categoryRankInput.trim() !== '' && (Number.isNaN(categoryRank) || categoryRank! < 1)) {
        setError('Classificação na Categoria deve ser um inteiro válido (≥ 1).');
        return;
      }

      // Verificar se o registrationId é válido
      if (!registrationId || registrationId.trim() === '') {
        setError('ID da inscrição inválido');
        return;
      }
      
      // Verificar se o registrationId é um ID válido ou um ID temporário
      if (!isValidId(registrationId)) {
        console.error('❌ ID da inscrição não é válido:', registrationId);
        
        // Verificar se é um ID temporário ou se estamos em desenvolvimento
        if (registrationId.startsWith('temp-') || process.env.NODE_ENV === 'development') {
          setRegistrations(prev => prev.map(reg => 
            reg.id === registrationId 
              ? { 
                  ...reg, 
                  timeSeconds: timeSeconds !== undefined ? timeSeconds : reg.timeSeconds,
                  generalRank: generalRank !== undefined ? generalRank : reg.generalRank,
                  categoryRank: categoryRank !== undefined ? categoryRank : reg.categoryRank,
                  attendanceConfirmed: true
                }
              : reg
          ));
          setSuccess('Resultado registrado com sucesso! (Modo desenvolvimento)');
          setResultDialogOpen(false);
          setSelectedRegistration(null);
          setTimeSecondsInput('');
          setGeneralRankInput('');
          setCategoryRankInput('');
          setTimeout(() => setSuccess(null), 3000);
          return;
        }
        
        setError('ID da inscrição inválido. Verifique se o backend está configurado corretamente.');
        return;
      }
      
      // Chamar a API para registrar o resultado
      await enduranceApi.updateExamRegistration(registrationId, {
        attended: true,
        ...(timeSeconds !== undefined ? { timeSeconds } : {}),
        ...(generalRank !== undefined ? { generalRank } : {}),
        ...(categoryRank !== undefined ? { categoryRank } : {}),
      });
      
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { 
              ...reg, 
              timeSeconds: timeSeconds !== undefined ? timeSeconds : reg.timeSeconds,
              generalRank: generalRank !== undefined ? generalRank : reg.generalRank,
              categoryRank: categoryRank !== undefined ? categoryRank : reg.categoryRank,
              attendanceConfirmed: true
            }
          : reg
      ));
      
      setSuccess('Resultado registrado com sucesso!');
      setResultDialogOpen(false);
      setSelectedRegistration(null);
      setTimeSecondsInput('');
      setGeneralRankInput('');
      setCategoryRankInput('');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Erro ao registrar resultado:', error);
      
      // Tratamento específico de erros
      if (error?.response?.status === 400) {
        setError('Erro: Dados inválidos enviados para o servidor.');
      } else if (error?.response?.status === 404) {
        setError('Erro: Inscrição não encontrada.');
      } else if (error?.response?.status === 403) {
        setError('Erro: Você não tem permissão para registrar este resultado.');
      } else {
        setError('Erro ao registrar resultado. Tente novamente.');
      }
      
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setExamFilter('');
    setModalidadeFilter('');
    setAttendedFilter('');
  };
  
  const handleExportCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'confirmar_presenca_provas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleCopyList = () => {
    const csvContent = generateCSV();
    navigator.clipboard.writeText(csvContent).then(() => {
      setSuccess('Lista copiada para a área de transferência!');
      setTimeout(() => setSuccess(null), 3000);
    }).catch(() => {
      setError('Erro ao copiar lista');
      setTimeout(() => setError(null), 5000);
    });
  };
  
  const generateCSV = () => {
    const headers = ['Nome', 'Email', 'Prova', 'Modalidade', 'Distância/Categoria', 'Data da Prova', 'Local', 'Status', 'Tempo', 'Classificação Geral', 'Classificação Categoria', 'Data da Inscrição'];
    const rows = filteredRegistrations.map(reg => [
      reg.user.name,
      reg.user.email,
      reg.exam.name,
      reg.exam.modalidade.name,
      reg.distance ? `${reg.distance.distance}${reg.distance.unit}` : reg.category ? reg.category.name : 'N/A',
      (() => {
        try {
          return format(new Date(reg.exam.date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } catch (error) {
          return 'Data inválida';
        }
      })(),
      reg.exam.location,
      reg.attendanceConfirmed ? 'Confirmado' : 'Pendente',
      reg.timeSeconds !== undefined && reg.timeSeconds !== null ? (() => {
        const total = Number(reg.timeSeconds);
        const abs = Math.abs(total);
        const hours = Math.floor(abs / 3600);
        const minutes = Math.floor((abs % 3600) / 60);
        const secondsFloat = abs % 60;
        const secondsInt = Math.floor(secondsFloat);
        const fraction = Number((secondsFloat - secondsInt).toFixed(1));
        const secondsStr = fraction > 0 ? (secondsInt + fraction).toFixed(1) : secondsInt.toString();
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secondsStr).padStart(2, '0')}`;
      })() : 'N/A',
      reg.generalRank !== undefined && reg.generalRank !== null ? String(reg.generalRank) : 'N/A',
      reg.categoryRank !== undefined && reg.categoryRank !== null ? String(reg.categoryRank) : 'N/A',
      (() => {
        try {
          return format(new Date(reg.registeredAt), 'dd/MM/yyyy HH:mm', { locale: ptBR });
        } catch (error) {
          return 'Data inválida';
        }
      })()
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = !searchTerm || 
      reg.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter(r => r.attendanceConfirmed).length,
    pending: registrations.filter(r => !r.attendanceConfirmed).length
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
            Confirmar Presença em Provas
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
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Total de Inscrições
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white' }}>
                    {stats.total}
                  </Typography>
                </Box>
                <EventIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Presenças Confirmadas
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white' }}>
                    {stats.confirmed}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Aguardando Confirmação
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white' }}>
                    {stats.pending}
                  </Typography>
                </Box>
                <TodayIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nome, email ou prova..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Prova</InputLabel>
              <Select
                value={examFilter}
                label="Prova"
                onChange={(e) => setExamFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {exams.map(exam => (
                  <MenuItem key={exam.id} value={exam.id}>{exam.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Modalidade</InputLabel>
              <Select
                value={modalidadeFilter}
                label="Modalidade"
                onChange={(e) => setModalidadeFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {Array.isArray(modalidades) && modalidades
                  .filter(modalidade => modalidade && modalidade.id && modalidade.name)
                  .map(modalidade => (
                    <MenuItem key={modalidade.id} value={modalidade.id}>{modalidade.name}</MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Presença</InputLabel>
              <Select
                value={attendedFilter}
                label="Presença"
                onChange={(e) => setAttendedFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="true">Confirmada</MenuItem>
                <MenuItem value="false">Pendente</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1}>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              size="small"
              color="secondary"
              disabled={!examFilter && !modalidadeFilter && !attendedFilter && !searchTerm}
              fullWidth
            >
              Limpar
            </Button>
          </Grid>
        </Grid>
        
        {/* Botões de Ação */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopyList}
            size="small"
          >
            Copiar Lista
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            size="small"
          >
            Exportar CSV
          </Button>
        </Box>
      </Paper>

      {/* Tabela de Inscrições */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Aluno</TableCell>
                  <TableCell>Prova</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Local</TableCell>
                  <TableCell>Modalidade</TableCell>
                  <TableCell>Distância/Categoria</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Resultado</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={getAbsoluteImageUrl(registration.user.image)}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {registration.user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {registration.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {registration.exam.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {(() => {
                          try {
                            return format(new Date(registration.exam.date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
                          } catch (error) {
                            return 'Data inválida';
                          }
                        })()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {registration.exam.location}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={registration.exam.modalidade.name} 
                        variant="outlined" 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {registration.distance ? (
                        <Chip 
                          label={`${registration.distance.distance}${registration.distance.unit}`}
                          size="small"
                          icon={<DistanceIcon />}
                        />
                      ) : registration.category ? (
                        <Chip 
                          label={registration.category.name}
                          size="small"
                          icon={<CategoryIcon />}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={registration.attendanceConfirmed ? 'Confirmado' : 'Pendente'}
                        color={registration.attendanceConfirmed ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const parts: string[] = [];
                        if (registration.timeSeconds !== undefined && registration.timeSeconds !== null) {
                          const total = Number(registration.timeSeconds);
                          const abs = Math.abs(total);
                          const hours = Math.floor(abs / 3600);
                          const minutes = Math.floor((abs % 3600) / 60);
                          const secondsFloat = abs % 60;
                          const secondsInt = Math.floor(secondsFloat);
                          const fraction = Number((secondsFloat - secondsInt).toFixed(1));
                          const secondsStr = fraction > 0 ? (secondsInt + fraction).toFixed(1) : secondsInt.toString();
                          const timeStr = `${hours}:${String(minutes).padStart(2, '0')}:${String(secondsStr).padStart(2, '0')}`;
                          parts.push(`Tempo: ${timeStr}`);
                        }
                        if (registration.generalRank !== undefined && registration.generalRank !== null) {
                          parts.push(`Geral: ${registration.generalRank}`);
                        }
                        if (registration.categoryRank !== undefined && registration.categoryRank !== null) {
                          parts.push(`Categoria: ${registration.categoryRank}`);
                        }
                        const display = parts.length > 0 ? parts.join(' • ') : (registration.result || 'Não registrado');
                        return (
                          <Typography variant="body2" fontWeight={parts.length > 0 ? 'bold' : undefined} color={parts.length > 0 ? 'success.main' : 'text.secondary'}>
                            {display}
                          </Typography>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                        {!registration.attendanceConfirmed ? (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => {
                              setSelectedRegistration(registration);
                              setConfirmDialogOpen(true);
                            }}
                          >
                            Confirmar
                          </Button>
                        ) : (
                          <Tooltip title="Presença já confirmada">
                            <Chip 
                              label="Confirmado" 
                              color="success" 
                              size="small"
                              icon={<CheckCircleIcon />}
                            />
                          </Tooltip>
                        )}
                        
                        {registration.attendanceConfirmed && (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<EmojiEventsIcon />}
                            onClick={() => {
                              setSelectedRegistration(registration);
                              setTimeSecondsInput(registration.timeSeconds !== undefined && registration.timeSeconds !== null ? String(registration.timeSeconds) : '');
                              setGeneralRankInput(registration.generalRank !== undefined && registration.generalRank !== null ? String(registration.generalRank) : '');
                              setCategoryRankInput(registration.categoryRank !== undefined && registration.categoryRank !== null ? String(registration.categoryRank) : '');
                              setResultDialogOpen(true);
                            }}
                          >
                            {(registration.timeSeconds !== undefined && registration.timeSeconds !== null) ||
                             (registration.generalRank !== undefined && registration.generalRank !== null) ||
                             (registration.categoryRank !== undefined && registration.categoryRank !== null) ||
                             registration.result ? 'Editar Resultado' : 'Registrar Resultado'}
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredRegistrations.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {registrations.length === 0 ? 'Nenhuma inscrição disponível' : 'Nenhuma inscrição encontrada'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {registrations.length === 0 
                  ? 'Não há inscrições em provas para confirmar presença no momento.'
                  : 'Não há inscrições em provas que correspondam aos filtros aplicados.'
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>
          Confirmar Presença
        </DialogTitle>
        <DialogContent>
          {selectedRegistration && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Confirmar presença do aluno <strong>{selectedRegistration.user.name}</strong> na prova:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>{selectedRegistration.exam.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Data: {(() => {
                  try {
                    return format(new Date(selectedRegistration.exam.date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
                  } catch (error) {
                    return 'Data inválida';
                  }
                })()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Local: {selectedRegistration.exam.location}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => selectedRegistration && handleConfirmAttendance(selectedRegistration.id)}
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
          >
            Confirmar Presença
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Registro de Resultado */}
      <Dialog open={resultDialogOpen} onClose={() => setResultDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {(selectedRegistration?.timeSeconds !== undefined && selectedRegistration?.timeSeconds !== null) ||
           (selectedRegistration?.generalRank !== undefined && selectedRegistration?.generalRank !== null) ||
           (selectedRegistration?.categoryRank !== undefined && selectedRegistration?.categoryRank !== null) ||
           selectedRegistration?.result ? 'Editar Resultado' : 'Registrar Resultado'}
        </DialogTitle>
        <DialogContent>
          {selectedRegistration && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Registrar resultado do aluno <strong>{selectedRegistration.user.name}</strong> na prova:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>{selectedRegistration.exam.name}</strong>
              </Typography>
              
              {/* Mostrar Distância ou Categoria */}
              {selectedRegistration.distance && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Distância:</strong> {selectedRegistration.distance.distance}{selectedRegistration.distance.unit}
                </Typography>
              )}
              
              {selectedRegistration.category && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>Categoria:</strong> {selectedRegistration.category.name}
                </Typography>
              )}
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Tempo (segundos)"
                    variant="outlined"
                    type="number"
                    inputProps={{ step: '0.1', min: '0' }}
                    value={timeSecondsInput}
                    onChange={(e) => setTimeSecondsInput(e.target.value)}
                    placeholder="Ex: 5130.5"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Classificação Geral"
                    variant="outlined"
                    type="number"
                    inputProps={{ step: '1', min: '1' }}
                    value={generalRankInput}
                    onChange={(e) => setGeneralRankInput(e.target.value)}
                    placeholder="Ex: 42"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Classificação na Categoria"
                    variant="outlined"
                    type="number"
                    inputProps={{ step: '1', min: '1' }}
                    value={categoryRankInput}
                    onChange={(e) => setCategoryRankInput(e.target.value)}
                    placeholder="Ex: 5"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setResultDialogOpen(false);
            setTimeSecondsInput('');
            setGeneralRankInput('');
            setCategoryRankInput('');
          }}>
            Cancelar
          </Button>
          <Button 
            onClick={() => selectedRegistration && handleRegisterResult(selectedRegistration.id)}
            variant="contained"
            color="primary"
          >
            {(selectedRegistration?.timeSeconds !== undefined && selectedRegistration?.timeSeconds !== null) ||
             (selectedRegistration?.generalRank !== undefined && selectedRegistration?.generalRank !== null) ||
             (selectedRegistration?.categoryRank !== undefined && selectedRegistration?.categoryRank !== null) ||
             selectedRegistration?.result ? 'Atualizar Resultado' : 'Registrar Resultado'}
          </Button>
        </DialogActions>
      </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 