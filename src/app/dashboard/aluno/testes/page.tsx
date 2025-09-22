'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Card, CardContent, Grid,
  CircularProgress, Alert, Chip, Avatar, Divider, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Accordion, AccordionSummary, AccordionDetails, TextField,
  Button, Select, MenuItem, FormControl, InputLabel, Tabs, Tab
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { enduranceApi } from '@/services/enduranceApi';
import { UserTest, TestType, TestReportRequest } from '@/types/api';
import { useNotificationHighlight } from '@/hooks/useNotificationHighlight';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import ScienceIcon from '@mui/icons-material/Science';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import GetAppIcon from '@mui/icons-material/GetApp';
import PageHeader from '@/components/Dashboard/PageHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TestReportRequestModal from '@/components/TestReportRequestModal';
import MyTestReportRequests from '@/components/MyTestReportRequests';

const getTestIcon = (type: TestType) => {
  switch (type) {
    case TestType.CARDIO: return <MonitorHeartIcon color="action"/>;
    case TestType.PERFORMANCE: return <FitnessCenterIcon color="action"/>;
    case TestType.STRENGTH: return <FitnessCenterIcon color="action"/>;
    case TestType.TECHNICAL: return <ScienceIcon color="action" />;
    default: return <ScienceIcon color="action" />;
  }
};

// Componente para exibir histórico de testes
const TestHistory = ({ 
  history, 
  loading, 
  error, 
  filters, 
  setFilters, 
  onClearFilters,
  onApplyFilters,
  appliedFilters,
  onRequestReport,
  canRequestReport,
  onDownloadReport,
  shouldHighlight
}: { 
  history: any[], 
  loading: boolean, 
  error: string | null,
  filters: any,
  setFilters: (filters: any) => void,
  onClearFilters: () => void,
  onApplyFilters: () => void,
  appliedFilters: any,
  onRequestReport: (test: any) => void,
  canRequestReport: (test: any) => boolean,
  onDownloadReport: (reportUrl: string, testName: string) => void,
  shouldHighlight: (itemId: string, itemType?: string) => boolean
}) => {

  const handleFilterChange = (field: string, value: any) => {
    // Garantir que os valores sejam definidos corretamente
    let cleanValue = value;
    if (field === 'testName') {
      cleanValue = value || '';
    } else if (field === 'testType' || field === 'status') {
      cleanValue = value || 'all';
    }
    setFilters(prev => ({ ...prev, [field]: cleanValue }));
  };

  const clearFilters = () => {
    onClearFilters();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevenir comportamento padrão
      onApplyFilters();
    }
  };

  // Usar diretamente os dados da API (já filtrados)
  const filteredHistory = history;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'SCHEDULED': return 'info';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Concluído';
      case 'SCHEDULED': return 'Agendado';
      case 'PENDING': return 'Pendente';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const parseTestResults = (results: string) => {
    try {
      return JSON.parse(results);
    } catch {
      return null;
    }
  };

  const renderTestResults = (test: any) => {
    const toNumber = (v: any): number | undefined => {
      if (v === null || v === undefined) return undefined;
      if (typeof v === 'number') return isNaN(v) ? undefined : v;
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    };
    const formatTime = (seconds?: number) => {
      if (typeof seconds !== 'number' || isNaN(seconds)) return undefined;
      const minutes = Math.floor(seconds / 60);
      const rem = seconds - minutes * 60;
      const secFixed = rem.toFixed(3);
      const secStr = rem < 10 ? `0${secFixed}` : secFixed;
      return `${minutes}:${secStr}`;
    };
    // Preferir resultados dinâmicos
    const dr = test.dynamicResults;
    const dynamicList = Array.isArray(dr?.multipleResults)
      ? dr.multipleResults
      : (Array.isArray(dr) ? dr : []);
    const hasDynamic = Array.isArray(dynamicList) && dynamicList.length > 0;
    const hasStandard = toNumber(test.timeSeconds) !== undefined;

    if (!hasDynamic && !hasStandard && !test.value) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {test.type === 'APPOINTMENT' ? 'Teste agendado - aguardando realização.' : 'Nenhum resultado registrado ainda.'}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
          📊 Resultados do Teste:
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
            🏆 Resultado
          </Typography>
          <Box sx={{ p: 2, border: '2px solid', borderColor: 'primary.main', borderRadius: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                {hasDynamic ? (
                  <Box>
                    {dynamicList.map((result: any, index: number) => (
                      <Typography key={index} variant="body2">
                        {result.fieldName}: {result.value} {result.unit}
                      </Typography>
                    ))}
                  </Box>
                ) : hasStandard ? (
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Tempo: {formatTime(toNumber(test.timeSeconds))}</Typography>
                    {toNumber(test.generalRank) !== undefined && (
                      <Typography variant="body1">Classificação Geral: {toNumber(test.generalRank)}</Typography>
                    )}
                    {toNumber(test.categoryRank) !== undefined && (
                      <Typography variant="body1">Classificação na Categoria: {toNumber(test.categoryRank)}</Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2">{test.value} {test.unit}</Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">📅 {formatDate(test.executionDate || test.recordedAt || test.createdAt)}</Typography>
                {test.notes && <Typography variant="body2">📝 {test.notes}</Typography>}
                {test.recorder && <Typography variant="body2">👨‍🏫 Registrado por: {test.recorder.name}</Typography>}
                {test.reportUrl && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      variant="text"
                      color="primary"
                      size="small"
                      startIcon={<GetAppIcon />}
                      onClick={() => onDownloadReport(test.reportUrl, test.test?.name || test.name || 'Teste')}
                      sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                    >
                      📄 Baixar Relatório
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  // Função utilitária para verificar se há filtros ativos
  const hasActiveFilters = (filters: any) => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'startDate' || key === 'endDate') {
        return value !== null;
      }
      return value !== '' && value !== null && value !== 'all';
    });
  };

  // Verificar se há filtros ativos
  const hasFiltersActive = hasActiveFilters(appliedFilters);

  // Renderizar sempre os filtros, independente do resultado
  return (
    <Box sx={{ mt: 3 }}>
      {/* Filtros - Sempre visíveis */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          🔍 Filtros
        </Typography>
        <Grid container spacing={2}>
          {/* Primeira linha de filtros */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Nome do teste"
              value={filters.testName}
              onChange={(e) => handleFilterChange('testName', e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ex: Cooper, Resistência..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de teste</InputLabel>
              <Select
                value={filters.testType}
                label="Tipo de teste"
                onChange={(e) => handleFilterChange('testType', e.target.value)}
              >
                <MenuItem value="all">Todos os tipos</MenuItem>
                <MenuItem value="CARDIO">Cardio</MenuItem>
                <MenuItem value="PERFORMANCE">Performance</MenuItem>
                <MenuItem value="STRENGTH">Força</MenuItem>
                <MenuItem value="TECHNICAL">Técnico</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">Todos os status</MenuItem>
                <MenuItem value="COMPLETED">Concluído</MenuItem>
                <MenuItem value="SCHEDULED">Agendado</MenuItem>
                <MenuItem value="PENDING">Pendente</MenuItem>
                <MenuItem value="CANCELLED">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Segunda linha de filtros */}
          <Grid item xs={12} sm={6} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data inicial"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data final"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
        
        {/* Botões de Ação */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Filtros ativos: {
                hasActiveFilters(appliedFilters) ? 
                  Object.entries(appliedFilters).filter(([key, value]) => {
                    if (key === 'startDate' || key === 'endDate') {
                      return value !== null;
                    }
                    return value !== '' && value !== null && value !== 'all';
                  }).length : 0
              }
            </Typography>
            {loading && (
              <CircularProgress size={16} sx={{ ml: 1 }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={onApplyFilters}
              startIcon={<SearchIcon />}
              size="small"
            >
              Buscar
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearFilters}
              startIcon={<RemoveIcon />}
              size="small"
              disabled={!hasActiveFilters(appliedFilters)}
            >
              Limpar Filtros
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Lista de Testes ou Mensagem de Nenhum Resultado */}
      {filteredHistory.length === 0 ? (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Alert severity="info">
            {!hasFiltersActive && history.length === 0
              ? 'Nenhum teste registrado ainda. Seus treinadores registrarão os testes realizados aqui.'
              : hasFiltersActive
              ? 'Nenhum registro encontrado.'
              : 'Nenhum teste disponível.'
            }
          </Alert>
          {hasFiltersActive && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Filtros ativos:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {Object.entries(appliedFilters).map(([key, value]) => {
                  if (key === 'startDate' && value) {
                    return (
                      <Chip 
                        key={key} 
                        label={`Data inicial: ${new Date(value as string | number | Date).toLocaleDateString('pt-BR')}`} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                      />
                    );
                  }
                  if (key === 'endDate' && value) {
                    return (
                      <Chip 
                        key={key} 
                        label={`Data final: ${new Date(value as string | number | Date).toLocaleDateString('pt-BR')}`} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                      />
                    );
                  }
                  if (value && value !== '' && value !== 'all') {
                    const labelMap: { [key: string]: string } = {
                      testName: 'Nome',
                      testType: 'Tipo',
                      status: 'Status'
                    };
                    return (
                      <Chip 
                        key={key} 
                        label={`${labelMap[key] || key}: ${value}`} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                      />
                    );
                  }
                  return null;
                })}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Tente ajustar os critérios de busca ou limpar os filtros aplicados.
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredHistory.map((test: any) => (
            <Accordion 
              key={test.id} 
              sx={{ 
                boxShadow: 2,
                ...(shouldHighlight(test.id, 'test') ? {
                  backgroundColor: 'rgba(255, 128, 18, 0.1)',
                  border: '2px solid #FF8012',
                  borderRadius: '8px',
                  boxShadow: '0 0 20px rgba(255, 128, 18, 0.3)',
                  animation: 'highlight-pulse 2s ease-in-out 3',
                } : {})
              }}
              {...(shouldHighlight(test.id, 'test') ? { 'data-highlighted': 'true' } : {})}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    {getTestIcon(test.test?.type || test.type || TestType.TECHNICAL)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {test.test?.name || test.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(test.executionDate || test.recordedAt || test.createdAt)}
                    </Typography>
                  </Box>
                  <Chip 
                    label={typeof test.timeSeconds === 'number' || test.type === 'RESULT' ? 'Concluído' : 'Agendado'} 
                    color={typeof test.timeSeconds === 'number' || test.type === 'RESULT' ? 'success' : 'info'}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {test.test?.description || test.description}
                  </Typography>
                  
                  {test.dynamicResults?.location && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      📍 Local: {test.dynamicResults.location}
                    </Typography>
                  )}
                  
                  {test.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      📝 Observações: {test.notes}
                    </Typography>
                  )}

                  {test.type === 'RESULT' && renderTestResults(test)}
                  
                  {/* Botão de solicitar relatório */}
                  {test.type === 'RESULT' && canRequestReport(test) && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<RequestQuoteIcon />}
                        onClick={() => onRequestReport(test)}
                        size="small"
                      >
                        Solicitar Relatório
                      </Button>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        Solicite um relatório detalhado deste teste
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Indicador de relatório já disponível */}
                  {test.type === 'RESULT' && test.reportUrl && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DescriptionIcon sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                Relatório disponível
                              </Typography>
                              <Typography variant="caption">
                                Este teste já possui um relatório anexado
                              </Typography>
                            </Box>
                          </Box>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<GetAppIcon />}
                            onClick={() => onDownloadReport(test.reportUrl, test.test?.name || test.name || 'Teste')}
                            sx={{ ml: 2 }}
                          >
                            Baixar Relatório
                          </Button>
                        </Box>
                      </Alert>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default function StudentTestsPage() {
  const auth = useAuth();
  const { highlightInfo, shouldHighlight, shouldHighlightTestByTime, getHighlightProps, clearHighlight } = useNotificationHighlight();
  const { registerUpdateCallback, unregisterUpdateCallback } = useRealtimeUpdates();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTests, setUserTests] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    testName: '',
    startDate: null,
    endDate: null,
    testType: 'all',
    status: 'all'
  });
  const [appliedFilters, setAppliedFilters] = useState({
    testName: '',
    startDate: null,
    endDate: null,
    testType: 'all',
    status: 'all'
  });

  // Estados para solicitação de relatório
  const [currentTab, setCurrentTab] = useState(0);
  const [reportRequestModalOpen, setReportRequestModalOpen] = useState(false);
  const [selectedTestForReport, setSelectedTestForReport] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<string>('');

  // Função utilitária para verificar se há filtros ativos
  const hasActiveFilters = (filters: any) => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'startDate' || key === 'endDate') {
        return value !== null;
      }
      return value !== '' && value !== null && value !== 'all';
    });
  };

  const loadData = useCallback(async (userId: string, customFilters?: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar filtros customizados se fornecidos, senão usar appliedFilters
      const filtersToUse = customFilters || appliedFilters;
      
      // Preparar parâmetros de filtro para a API
      const apiFilters: any = {
        limit: 100 // Buscar todos os testes do aluno
      };
      
      // Adicionar filtros apenas se estiverem preenchidos
      if (filtersToUse.testName && filtersToUse.testName.trim() !== '') {
        apiFilters.testName = filtersToUse.testName.trim();
      }
      if (filtersToUse.testType && filtersToUse.testType !== 'all') {
        apiFilters.testType = filtersToUse.testType;
      }
      if (filtersToUse.status && filtersToUse.status !== 'all') {
        apiFilters.status = filtersToUse.status;
      }
      if (filtersToUse.startDate) {
        apiFilters.startDate = filtersToUse.startDate.toISOString();
      }
      if (filtersToUse.endDate) {
        apiFilters.endDate = filtersToUse.endDate.toISOString();
      }
      
      // Usar o novo endpoint específico para alunos com filtros
      const response = await enduranceApi.getUserTests(apiFilters);
      
      // Processar a resposta da API
      let testData = [];
      
      if (response && response.data) {
        testData = response.data;
      }
      
      setUserTests(testData || []);
      
    } catch (err) {
      setError('Erro ao carregar histórico de testes.');
      setUserTests([]);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]); // Incluir appliedFilters nas dependências

  const clearFilters = () => {
    const emptyFilters = {
      testName: '',
      startDate: null,
      endDate: null,
      testType: 'all',
      status: 'all'
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    
    // Recarregar dados sem filtros imediatamente
    if (auth.user) {
      loadData(auth.user.id, emptyFilters);
    }
  };

  const applyFilters = () => {
    // Garantir que os filtros sejam aplicados corretamente
    const cleanFilters = {
      testName: filters.testName || '',
      startDate: filters.startDate,
      endDate: filters.endDate,
      testType: filters.testType || 'all',
      status: filters.status || 'all'
    };
    setAppliedFilters(cleanFilters);
    
    // Recarregar dados com os novos filtros imediatamente
    if (auth.user) {
      loadData(auth.user.id, cleanFilters);
    }
  };

  // Funções para solicitação de relatório
  const handleRequestReport = (test: any) => {
    setSelectedTestForReport(test);
    setReportRequestModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setReportRequestModalOpen(false);
    setSelectedTestForReport(null);
  };

  const handleReportRequestSuccess = (request: TestReportRequest) => {
    // Mudar para a aba de solicitações após sucesso
    setCurrentTab(1);
  };

  const canRequestReport = (test: any) => {
    // Verificar se o teste está concluído e não tem relatório já anexado
    const isCompleted = typeof test.timeSeconds === 'number' || test.type === 'RESULT';
    const hasReport = test.reportUrl;
    return isCompleted && !hasReport;
  };

  const handleDownloadReport = (reportUrl: string, testName: string) => {
    // Abrir o relatório em nova aba para download
    window.open(reportUrl, '_blank');
  };

  useEffect(() => {
    if (auth.user) {
      // Carregar dados iniciais sem filtros
      loadData(auth.user.id, {
        testName: '',
        startDate: null,
        endDate: null,
        testType: 'all',
        status: 'all'
      });
      
      // Carregar plano do usuário
      const userPlan = auth.user.subscriptions?.[0]?.plan?.name || '';
      setUserPlan(userPlan);
    }
  }, [auth.user]);

  // Registrar callback para atualizações em tempo real
  useEffect(() => {
    const reloadTests = () => {
      if (auth.user) {
        loadData(auth.user.id, appliedFilters);
      }
    };
    
    registerUpdateCallback('tests', reloadTests);
    
    return () => {
      unregisterUpdateCallback('tests');
    };
  }, [registerUpdateCallback, unregisterUpdateCallback, auth.user, appliedFilters]); // Carregar apenas quando o usuário mudar

  if (!auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>
      <DashboardLayout user={auth.user} onLogout={auth.logout} overdueInfo={auth.overdueInfo}>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
          <PageHeader
            title="Histórico de Testes"
            description="Visualize todos os testes realizados pelos seus treinadores e acompanhe sua evolução."
          />
          
          {/* Alerta de destaque por notificação */}
          {highlightInfo.isActive && highlightInfo.type === 'test' && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 2,
                backgroundColor: 'rgba(255, 128, 18, 0.1)',
                borderColor: '#FF8012',
                '& .MuiAlert-icon': { color: '#FF8012' }
              }}
              onClose={clearHighlight}
            >
              <Typography variant="body2">
                🎯 <strong>Destacando teste:</strong> {highlightInfo.name || `ID: ${highlightInfo.id}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Você foi redirecionado aqui através de uma notificação. O teste está destacado abaixo.
              </Typography>
            </Alert>
          )}
          
          
          <Box sx={{ mt: 4 }}>
            <Paper sx={{ mb: 3 }}>
              <Tabs 
                value={currentTab} 
                onChange={(e, newValue) => setCurrentTab(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Histórico de Testes" />
                <Tab label="Solicitações de Relatório" />
              </Tabs>
            </Paper>

            {currentTab === 0 && (
              <TestHistory 
                history={userTests}
                loading={loading}
                error={error}
                filters={filters}
                setFilters={setFilters}
                onClearFilters={clearFilters}
                onApplyFilters={applyFilters}
                appliedFilters={appliedFilters}
                onRequestReport={handleRequestReport}
                canRequestReport={canRequestReport}
                onDownloadReport={handleDownloadReport}
                shouldHighlight={shouldHighlight}
              />
            )}

            {currentTab === 1 && (
              <MyTestReportRequests 
                onRequestClick={(request) => {
                  // Aqui você pode implementar uma ação quando clicar em uma solicitação
                }}
              />
            )}
          </Box>

          {/* Modal de Solicitação de Relatório */}
          {selectedTestForReport && (
            <TestReportRequestModal
              open={reportRequestModalOpen}
              onClose={handleCloseReportModal}
              testResultId={selectedTestForReport.id}
              testName={selectedTestForReport.test?.name || selectedTestForReport.name || 'Teste'}
              userPlan={userPlan}
              onSuccess={handleReportRequestSuccess}
            />
          )}
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 