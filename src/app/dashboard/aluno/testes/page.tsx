'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Card, CardContent, Grid,
  CircularProgress, Alert, Chip, Avatar, Divider, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Accordion, AccordionSummary, AccordionDetails, TextField
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { enduranceApi } from '@/services/enduranceApi';
import { UserTest, TestType } from '@/types/api';
import ScienceIcon from '@mui/icons-material/Science';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';
import PageHeader from '@/components/Dashboard/PageHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
const TestHistory = ({ history, loading, error }: { history: UserTest[], loading: boolean, error: string | null }) => {
  const [filters, setFilters] = useState({
    search: '',
    startDate: null,
    endDate: null,
    testType: 'all'
  });

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredHistory = history.filter((test: any) => {
    
    
    const matchesSearch = test.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                         test.description?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = filters.testType === 'all' || test.type === filters.testType;
    
    const testDate = new Date(test.createdAt);
    const matchesStartDate = !filters.startDate || testDate >= filters.startDate;
    const matchesEndDate = !filters.endDate || testDate <= filters.endDate;
    
    const shouldInclude = matchesSearch && matchesType && matchesStartDate && matchesEndDate;
    
    
    return shouldInclude;
  });

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
    if (!test.results || !Array.isArray(test.results) || test.results.length === 0) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Nenhum resultado registrado ainda.
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
          📊 Histórico de Resultados:
        </Typography>
        
        {/* Resultado mais recente */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
            🏆 Resultado Mais Recente
          </Typography>
          <Box sx={{ 
            p: 2, 
            border: '2px solid', 
            borderColor: 'primary.main', 
            borderRadius: 2,
            bgcolor: 'primary.light',
            color: 'primary.contrastText'
          }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {test.results[test.results.length - 1].value} {test.results[test.results.length - 1].unit}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  📅 {formatDate(test.results[test.results.length - 1].recordedAt)}
                </Typography>
                {test.results[test.results.length - 1].notes && (
                  <Typography variant="body2">
                    📝 {test.results[test.results.length - 1].notes}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* Histórico completo */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          📈 Evolução Completa
        </Typography>
        <Grid container spacing={2}>
          {test.results.map((result: any, index: number) => {
            const isLatest = index === test.results.length - 1;
            const isImprovement = index > 0 && 
              parseFloat(result.value) > parseFloat(test.results[index - 1].value);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={result.id}>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: isLatest ? 'primary.main' : 'divider', 
                  borderRadius: 2,
                  bgcolor: isLatest ? 'primary.light' : 'background.paper',
                  position: 'relative'
                }}>
                  {isLatest && (
                    <Chip 
                      label="Mais Recente" 
                      color="primary" 
                      size="small" 
                      sx={{ position: 'absolute', top: -8, right: 8 }}
                    />
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {isImprovement ? (
                      <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                    ) : index > 0 ? (
                      <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                    ) : (
                      <RemoveIcon color="action" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {result.value} {result.unit}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    📅 {formatDate(result.recordedAt)}
                  </Typography>
                  
                  {result.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      📝 {result.notes}
                    </Typography>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (filteredHistory.length === 0) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Alert severity="info">
          {history.length === 0 
            ? 'Nenhum teste registrado ainda. Seus treinadores registrarão os testes realizados aqui.'
            : 'Nenhum teste encontrado com os filtros aplicados.'
          }
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          🔍 Filtros
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Buscar teste"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data inicial"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data final"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Tipo de teste"
              value={filters.testType}
              onChange={(e) => handleFilterChange('testType', e.target.value)}
            >
              <option value="all">Todos os tipos</option>
              <option value="CARDIO">Cardio</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="STRENGTH">Força</option>
              <option value="TECHNICAL">Técnico</option>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de Testes */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredHistory.map((test: any) => (
          <Accordion key={test.id} sx={{ boxShadow: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  {getTestIcon(test.type || TestType.TECHNICAL)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {test.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(test.createdAt)}
                  </Typography>
                </Box>
                <Chip 
                  label={getStatusText(test.status)} 
                  color={getStatusColor(test.status) as any}
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {test.description}
                </Typography>
                
                {test.location && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    📍 Local: {test.location}
                  </Typography>
                )}
                
                {test.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    📝 Observações: {test.notes}
                  </Typography>
                )}

                {test.results && test.results.length > 0 && renderTestResults(test)}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default function StudentTestsPage() {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userTests, setUserTests] = useState<UserTest[]>([]);

  const loadData = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
  
      
      const response = await enduranceApi.getUserTests(userId);
      
      // Processar a nova estrutura da API
      let testData = [];
      
      
      if (response && typeof response === 'object' && 'success' in response && response.success && 'data' in response) {
        testData = (response as any).data.data || [];
        
      } else if (Array.isArray(response)) {
        testData = response;
        
      } else if (response && typeof response === 'object' && 'data' in response) {
        testData = Array.isArray((response as any).data) ? (response as any).data : [(response as any).data];
        
      }
      
      
      
      setUserTests(testData || []);
      
    } catch (err) {
      console.error('Erro ao carregar testes:', err);
      setError('Erro ao carregar histórico de testes.');
      setUserTests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth.user) {
      loadData(auth.user.id);
    }
  }, [auth.user, loadData]);

  if (!auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>
      <DashboardLayout user={auth.user} onLogout={auth.logout}>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
          <PageHeader
            title="Histórico de Testes"
            description="Visualize todos os testes realizados pelos seus treinadores e acompanhe sua evolução."
          />
          
          <Box sx={{ mt: 4 }}>
            <TestHistory 
              history={userTests}
              loading={loading}
              error={error}
            />
          </Box>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 