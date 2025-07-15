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
  Container
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
  Assignment as AssignmentIcon
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

interface TestResult {
  testId: string;
  results: string;
  notes: string;
  date: string;
  location: string;
  value?: number;
  unit?: string;
}

export default function ResultadosTestesPage() {
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<TestRequest | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const [testResult, setTestResult] = useState<TestResult>({
    testId: '',
    results: '',
    notes: '',
    date: '',
    location: '',
    value: 0,
    unit: ''
  });

  const [scheduleData, setScheduleData] = useState({
    scheduledAt: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    fetchTestRequests();
  }, []);

  const fetchTestRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Carregando solicitações de testes do coach...');
      
      // Buscar solicitações de testes do coach usando o novo endpoint
      const response = await enduranceApi.getCoachTestRequests({
        page: 1,
        limit: 50 // Carregar mais dados inicialmente
      });
      
      console.log('✅ Solicitações de testes carregadas:', response);
      
      // Mapear os dados para o formato esperado pelo componente
      const mappedRequests: TestRequest[] = response.data.map((request: any) => ({
        id: request.id,
        test: {
          id: request.test.id,
          name: request.test.name,
          description: request.test.description,
          type: request.test.type
        },
        user: {
          id: request.user.id,
          name: request.user.name,
          email: request.user.email,
          image: request.user.image
        },
        status: request.status,
        requestedAt: request.requestedAt,
        scheduledAt: request.scheduledAt,
        location: request.location,
        notes: request.notes,
        results: request.results
      }));
      
      setTestRequests(mappedRequests);
      
    } catch (error) {
      console.error('Erro ao buscar solicitações de testes:', error);
      setError('Erro ao carregar solicitações de testes. Verifique se você tem permissões adequadas.');
      setTestRequests([]); // Limpar dados em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const handleAddResult = async () => {
    if (!selectedRequest) return;

    try {
      setSaving(true);
      
      const resultData = {
        testId: selectedRequest.test.id,
        userId: selectedRequest.user.id,
        value: testResult.value || 0,
        unit: testResult.unit || '',
        notes: testResult.notes
      };

      console.log('🔄 Registrando resultado do teste:', {
        ...resultData,
        testName: selectedRequest.test.name,
        studentName: selectedRequest.user.name
      });
      
      // Usar o novo endpoint para registrar resultados de testes
      await enduranceApi.recordTestResult(resultData);
      
      console.log('✅ Resultado registrado com sucesso');
      
      // Atualizar o estado local
      setTestRequests(prev => prev.map(req => 
        req.id === selectedRequest.id 
          ? { 
              ...req, 
              status: 'COMPLETED' as const, 
              results: testResult.results,
              notes: testResult.notes 
            }
          : req
      ));
      
      setSuccess('Resultado registrado com sucesso!');
      setResultDialogOpen(false);
      setSelectedRequest(null);
      setTestResult({ testId: '', results: '', notes: '', date: '', location: '', value: 0, unit: '' });
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao registrar resultado:', error);
      setError('Erro ao registrar resultado do teste');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleTest = async () => {
    if (!selectedRequest) return;

    try {
      setSaving(true);
      
      const scheduleUpdateData = {
        status: 'SCHEDULED',
        scheduledAt: scheduleData.scheduledAt,
        location: scheduleData.location,
        notes: scheduleData.notes
      };

      console.log('🔄 Agendando teste:', selectedRequest.id, scheduleUpdateData);
      
      // Usar o novo endpoint para agendar teste
      await enduranceApi.updateTestRequestStatus(selectedRequest.id, scheduleUpdateData);
      
      console.log('✅ Teste agendado com sucesso');
      
      // Atualizar o estado local
      setTestRequests(prev => prev.map(req => 
        req.id === selectedRequest.id 
          ? { 
              ...req, 
              status: 'SCHEDULED' as const, 
              scheduledAt: scheduleData.scheduledAt,
              location: scheduleData.location,
              notes: scheduleData.notes 
            }
          : req
      ));
      
      setSuccess('Teste agendado com sucesso!');
      setScheduleDialogOpen(false);
      setSelectedRequest(null);
      setScheduleData({ scheduledAt: '', location: '', notes: '' });
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Erro ao agendar teste:', error);
      setError('Erro ao agendar teste');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const openResultDialog = (request: TestRequest) => {
    setSelectedRequest(request);
    setTestResult({
      testId: request.test.id,
      results: request.results || '',
      notes: request.notes || '',
      date: request.scheduledAt ? (() => {
        try {
          return format(new Date(request.scheduledAt), 'yyyy-MM-dd');
        } catch (error) {
          return '';
        }
      })() : '',
      location: request.location || ''
    });
    setResultDialogOpen(true);
  };

  const openScheduleDialog = (request: TestRequest) => {
    setSelectedRequest(request);
    setScheduleData({
      scheduledAt: request.scheduledAt ? (() => {
        try {
          return format(new Date(request.scheduledAt), 'yyyy-MM-dd\'T\'HH:mm');
        } catch (error) {
          return '';
        }
      })() : '',
      location: request.location || '',
      notes: request.notes || ''
    });
    setScheduleDialogOpen(true);
  };

  const filteredRequests = testRequests.filter(req => {
    const matchesSearch = req.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.test.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: testRequests.length,
    pending: testRequests.filter(r => r.status === 'PENDING').length,
    scheduled: testRequests.filter(r => r.status === 'SCHEDULED').length,
    completed: testRequests.filter(r => r.status === 'COMPLETED').length
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

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout user={user} onLogout={handleLogout}>
          <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <CircularProgress />
            </Box>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout user={user} onLogout={handleLogout}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">
              Resultados de Testes
            </Typography>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={fetchTestRequests}
              disabled={loading}
            >
              Atualizar
            </Button>
          </Box>

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
                    Total de Testes
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white' }}>
                    {stats.total}
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
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
                    Pendentes
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white' }}>
                    {stats.pending}
                  </Typography>
                </Box>
                <PendingIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
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
                    Agendados
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white' }}>
                    {stats.scheduled}
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
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
                    Concluídos
                  </Typography>
                  <Typography variant="h3" sx={{ color: 'white' }}>
                    {stats.completed}
                  </Typography>
                </Box>
                <CheckIcon sx={{ fontSize: 40, color: 'white', opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Buscar por aluno ou teste"
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
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filtrar por Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="pending">Pendentes</MenuItem>
                  <MenuItem value="scheduled">Agendados</MenuItem>
                  <MenuItem value="completed">Concluídos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Limpar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabela de Solicitações */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Aluno</TableCell>
                  <TableCell>Teste</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data Agendada</TableCell>
                  <TableCell>Local</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar src={getAbsoluteImageUrl(request.user.image)}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {request.user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {request.test.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {request.test.description}
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
                      {request.scheduledAt ? (
                        <Typography variant="body2">
                          {(() => {
                            try {
                              return format(new Date(request.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR });
                            } catch (error) {
                              return 'Data inválida';
                            }
                          })()}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Não agendado
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.location ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {request.location}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Não definido
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.status === 'COMPLETED' ? (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2">Ver Resultado</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Resultados:</strong>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 2 }}>
                                {request.results}
                              </Typography>
                              {request.notes && (
                                <>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Observações:</strong>
                                  </Typography>
                                  <Typography variant="body2">
                                    {request.notes}
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                          {request.status === 'PENDING' && (
                            <Button
                              variant="contained"
                              color="info"
                              size="small"
                              startIcon={<ScheduleIcon />}
                              onClick={() => openScheduleDialog(request)}
                            >
                              Agendar
                            </Button>
                          )}
                          {request.status === 'SCHEDULED' && (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={<AddIcon />}
                              onClick={() => openResultDialog(request)}
                            >
                              Adicionar Resultado
                            </Button>
                          )}
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredRequests.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Nenhuma solicitação de teste encontrada
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statusFilter === 'all' 
                  ? 'Você não possui solicitações de testes no momento.' 
                  : `Nenhuma solicitação de teste com status "${getStatusLabel(statusFilter)}" encontrada.`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                As solicitações aparecerão aqui quando os alunos requisitarem testes.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Adicionar Resultado */}
      <Dialog open={resultDialogOpen} onClose={() => setResultDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon />
            Adicionar Resultado do Teste
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedRequest.test.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Aluno: <strong>{selectedRequest.user.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRequest.test.description}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data do Teste"
                    type="date"
                    value={testResult.date}
                    onChange={(e) => setTestResult({ ...testResult, date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Local do Teste"
                    value={testResult.location}
                    onChange={(e) => setTestResult({ ...testResult, location: e.target.value })}
                    placeholder="Ex: Laboratório de Fisiologia"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Valor do Resultado"
                    type="number"
                    value={testResult.value || ''}
                    onChange={(e) => setTestResult({ ...testResult, value: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 15.5"
                    required
                    inputProps={{ step: 0.01, min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Unidade"
                    value={testResult.unit || ''}
                    onChange={(e) => setTestResult({ ...testResult, unit: e.target.value })}
                    placeholder="Ex: km, minutos, kg, metros"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descrição dos Resultados"
                    multiline
                    rows={3}
                    value={testResult.results}
                    onChange={(e) => setTestResult({ ...testResult, results: e.target.value })}
                    placeholder="Descreva detalhes qualitativos do teste (opcional)..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observações Adicionais"
                    multiline
                    rows={3}
                    value={testResult.notes}
                    onChange={(e) => setTestResult({ ...testResult, notes: e.target.value })}
                    placeholder="Observações, recomendações ou comentários sobre o teste..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAddResult}
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            disabled={saving || !testResult.value || !testResult.unit || !testResult.date || !testResult.location}
          >
            {saving ? 'Salvando...' : 'Salvar Resultado'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Agendar Teste */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon />
            Agendar Teste
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 2 }}>
              <Box sx={{ mb: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedRequest.test.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Aluno: <strong>{selectedRequest.user.name}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRequest.test.description}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data e Hora do Teste"
                    type="datetime-local"
                    value={scheduleData.scheduledAt}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Local do Teste"
                    value={scheduleData.location}
                    onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
                    placeholder="Ex: Laboratório de Fisiologia"
                    required
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
                    placeholder="Instruções especiais, preparação necessária, etc..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleScheduleTest}
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={16} /> : <ScheduleIcon />}
            disabled={saving || !scheduleData.scheduledAt || !scheduleData.location}
          >
            {saving ? 'Agendando...' : 'Agendar Teste'}
          </Button>
        </DialogActions>
      </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 