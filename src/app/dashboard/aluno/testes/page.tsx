'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container, Typography, Box, Paper, Card, CardContent, Button, Grid,
  CircularProgress, Alert, TextField, List, ListItem, ListItemIcon,
  ListItemText, Avatar, Divider, Tabs, Tab, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { enduranceApi } from '@/services/enduranceApi';
import { AvailableTest, UserTest, TestType } from '@/types/api';
import ScienceIcon from '@mui/icons-material/Science';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import DescriptionIcon from '@mui/icons-material/Description';
import PageHeader from '@/components/Dashboard/PageHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';

const getTestIcon = (type: TestType) => {
  switch (type) {
    case TestType.CARDIO: return <MonitorHeartIcon color="action"/>;
    case TestType.PERFORMANCE: return <FitnessCenterIcon color="action"/>;
    case TestType.STRENGTH: return <FitnessCenterIcon color="action"/>;
    case TestType.TECHNICAL: return <ScienceIcon color="action" />;
    default: return <ScienceIcon color="action" />;
  }
};

// Component for Available Tests Tab
const AvailableTests = ({ availableTests, userTestIds, onOpenModal, loading, error }: any) => {
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (availableTests.length === 0) {
    return <Alert severity="info" sx={{ mt: 2 }}>Nenhum teste disponível para solicitação no momento.</Alert>;
  }
  
  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {availableTests.map((test: AvailableTest) => {
        const isRequested = userTestIds.has(test.id);
        return (
          <Grid item xs={12} md={6} lg={4} key={test.id}>
            <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
              <Card sx={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                     <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>{getTestIcon(test.type)}</Avatar>
                     <Typography variant="h6" fontWeight="bold" component="div" sx={{ flexGrow: 1 }}>{test.name}</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }}/>
                  <Box sx={{ flexGrow: 1 }}>
                    <List dense>
                      <ListItem>
                         <ListItemIcon sx={{minWidth: 40}}><DescriptionIcon color="action"/></ListItemIcon>
                         <ListItemText primary="Descrição" secondary={test.description} />
                      </ListItem>
                      <ListItem>
                         <ListItemIcon sx={{minWidth: 40}}>{getTestIcon(test.type)}</ListItemIcon>
                         <ListItemText primary="Tipo" secondary={test.type} />
                      </ListItem>
                    </List>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      onClick={() => onOpenModal(test)}
                      disabled={isRequested}
                    >
                      {isRequested ? 'Solicitação Enviada' : 'Solicitar Teste'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Paper>
          </Grid>
        )
      })}
    </Grid>
  );
};

// Component for Test History Tab
const TestHistory = ({ history, loading, error }: { history: UserTest[], loading: boolean, error: string | null }) => {
  const [filters, setFilters] = useState({
    search: '',
    startDate: null,
    endDate: null,
    type: 'ALL',
  });

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const test = item.test;
      if (!test) return false;

      // Mostrar todos os testes (SCHEDULED, COMPLETED, PENDING, CANCELLED)
      // Removi o filtro que só mostrava COMPLETED
      
      // Filter by search term
      const searchMatch = filters.search.toLowerCase() 
        ? test.name.toLowerCase().includes(filters.search.toLowerCase()) || 
          (test.description && test.description.toLowerCase().includes(filters.search.toLowerCase()))
        : true;

      // Filter by date - usar scheduledAt em vez de date
      const testDate = item.scheduledAt ? new Date(item.scheduledAt) : new Date(item.createdAt);
      const startDateMatch = filters.startDate ? testDate >= filters.startDate : true;
      const endDateMatch = filters.endDate ? testDate <= filters.endDate : true;

      // Filter by type
      const typeMatch = filters.type === 'ALL' || test.type === filters.type;

      return searchMatch && startDateMatch && endDateMatch && typeMatch;
    });
  }, [history, filters]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3, mt: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Buscar por nome ou descrição"
              variant="outlined"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
             <TextField
              select
              fullWidth
              label="Tipo de Teste"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="ALL">Todos</option>
              {Object.values(TestType).map(type => <option key={type} value={type}>{type}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Data de Início"
              value={filters.startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Data de Fim"
              value={filters.endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {filteredHistory.length > 0 ? (
        <List>
          {filteredHistory.map(item => (
            <React.Fragment key={item.id}>
              <ListItem>
                <ListItemIcon>
                  {getTestIcon(item.test?.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {item.test?.name}
                      </Typography>
                      <Chip 
                        label={item.status} 
                        size="small" 
                        color={
                          item.status === 'COMPLETED' ? 'success' : 
                          item.status === 'SCHEDULED' ? 'primary' : 
                          item.status === 'PENDING' ? 'warning' : 'default'
                        }
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {item.scheduledAt 
                          ? `Agendado para: ${new Date(item.scheduledAt).toLocaleDateString('pt-BR')} às ${new Date(item.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                          : `Criado em: ${new Date(item.createdAt).toLocaleDateString('pt-BR')}`
                        }
                      </Typography>
                      <br />
                      {item.location && (
                        <>
                          <Typography component="span" variant="body2">
                            Local: {item.location}
                          </Typography>
                          <br />
                        </>
                      )}
                      {(item as any).coach && (
                        <>
                          <Typography component="span" variant="body2">
                            Treinador: {(item as any).coach.name}
                          </Typography>
                          <br />
                        </>
                      )}
                      {item.status === 'COMPLETED' && (() => {
                        const hasResults = item.testResult || item.results;

                        return (
                          <>
                            {hasResults ? (
                              <Box sx={{ my: 1, p: 2, backgroundColor: 'success.50', borderLeft: 3, borderColor: 'success.main', borderRadius: 1 }}>
                                <Typography component="div" variant="body2" color="success.main" fontWeight="bold" sx={{ mb: 1 }}>
                                  📊 Resultado do Teste:
                                </Typography>
                                
                                {/* Resultado detalhado estruturado */}
                                {item.testResult && (
                                  <Box sx={{ ml: 2 }}>
                                    <Typography component="span" variant="body2" fontWeight="medium">
                                      Valor: {item.testResult.value} {item.testResult.unit}
                                    </Typography>
                                    <br />
                                    {item.testResult.recorder && (
                                      <>
                                        <Typography component="span" variant="caption" color="text.secondary">
                                          Registrado por: {item.testResult.recorder.name}
                                        </Typography>
                                        <br />
                                      </>
                                    )}
                                    {item.testResult.recordedAt && (
                                      <>
                                        <Typography component="span" variant="caption" color="text.secondary">
                                          Em: {new Date(item.testResult.recordedAt).toLocaleDateString('pt-BR')}
                                        </Typography>
                                        <br />
                                      </>
                                    )}
                                    {item.testResult.notes && (
                                      <Typography component="span" variant="body2" color="text.secondary" fontStyle="italic">
                                        Observações: {item.testResult.notes}
                                      </Typography>
                                    )}
                                  </Box>
                                )}

                                {/* Resultado básico (fallback) */}
                                {!item.testResult && item.results && (
                                  <Typography component="span" variant="body2" sx={{ ml: 2 }}>
                                    {item.results}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography component="span" variant="body2" color="warning.main" fontStyle="italic">
                                ⏳ Resultado ainda não registrado pelo treinador
                              </Typography>
                            )}
                          </>
                        );
                      })()}
                      {item.status === 'SCHEDULED' && (
                        <>
                          <Typography component="span" variant="body2" color="info.main">
                            📅 Teste agendado - aguardando realização
                          </Typography>
                          <br />
                        </>
                      )}
                      {item.status === 'PENDING' && (
                        <>
                          <Typography component="span" variant="body2" color="warning.main">
                            ⏰ Aguardando agendamento pelo treinador
                          </Typography>
                          <br />
                        </>
                      )}
                      {item.notes && (
                        <Typography component="span" variant="body2" fontStyle="italic">
                          Observações: {item.notes}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Alert severity="info">Nenhum histórico de teste encontrado para os filtros selecionados.</Alert>
      )}
    </Box>
  );
};

export default function StudentTestsPage() {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([]);
  const [userAppointments, setUserAppointments] = useState<UserTest[]>([]);
  const [userTestIds, setUserTestIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<AvailableTest | null>(null);
  const [requestNotes, setRequestNotes] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const loadData = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const [availableTestsResponse, userAppointmentsResponse] = await Promise.all([
        enduranceApi.getAvailableTests(),
        enduranceApi.getTestAppointments(userId)
      ]);

      const availableTestData = Array.isArray(availableTestsResponse) ? availableTestsResponse : availableTestsResponse.data;
      setAvailableTests(availableTestData || []);
      
      const userAppointmentsData = Array.isArray(userAppointmentsResponse) ? userAppointmentsResponse : userAppointmentsResponse.data;
      setUserAppointments(userAppointmentsData || []);
      
      // Filtra para incluir apenas solicitações ativas (pendentes ou agendadas)
      const activeRequests = (userAppointmentsData || []).filter(
        (test: UserTest) => test.status === 'PENDING' || test.status === 'SCHEDULED'
      );

      const requestedIds = new Set(activeRequests.map((userTest: UserTest) => userTest.testId || userTest.test?.id).filter(Boolean));
      setUserTestIds(requestedIds);
      
    } catch (err) {
      setError('Erro ao carregar os dados dos testes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth.user) {
      loadData(auth.user.id);
    }
  }, [auth.user, loadData]);

  const handleOpenModal = (test: AvailableTest) => {
    setSelectedTest(test);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTest(null);
    setRequestNotes('');
  };

  const handleApiError = (err: any) => {
    const message = err.response?.data?.message || 'Ocorreu um erro desconhecido.';
    toast.error(`Falha na solicitação: ${message}`);
    console.error(err);
  };

  const handleRequestSubmit = () => {
    if (!selectedTest) return;

    setIsRequesting(true);
    toast.promise(enduranceApi.requestTest(selectedTest.id, requestNotes), {
      loading: 'Enviando sua solicitação...',
      success: () => {
        if (auth.user) {
          loadData(auth.user.id);
        }
        setIsRequesting(false);
        handleCloseModal();
        return 'Solicitação de teste enviada com sucesso!';
      },
      error: (err) => {
        handleApiError(err);
        setIsRequesting(false);
        handleCloseModal();
        return 'Falha ao solicitar o teste.';
      },
    });
  };

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
            title="Testes e Avaliações"
            description="Consulte os testes disponíveis, solicite agendamentos e veja seu histórico."
          />
          
          <Box sx={{ width: '100%', mt: 4 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} aria-label="abas de testes">
                  <Tab label="Testes Disponíveis" id="tab-available" aria-controls="tabpanel-available" />
                  <Tab label="Histórico de Testes" id="tab-history" aria-controls="tabpanel-history" />
                </Tabs>
              </Box>

              <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-available" aria-labelledby="tab-available">
                {activeTab === 0 && (
                  <AvailableTests 
                    availableTests={availableTests}
                    userTestIds={userTestIds}
                    onOpenModal={handleOpenModal}
                    loading={loading}
                    error={error}
                  />
                )}
              </Box>

              <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-history" aria-labelledby="tab-history">
                {activeTab === 1 && (
                  <TestHistory 
                    history={userAppointments}
                    loading={loading}
                    error={error}
                  />
                )}
              </Box>
            </LocalizationProvider>
          </Box>

          {/* Request Modal */}
          <Dialog
            open={isModalOpen}
            onClose={handleCloseModal}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              Solicitar {selectedTest?.name}
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{mb: 2}}>
                Você pode adicionar uma nota para a sua solicitação, se desejar (opcional).
              </DialogContentText>
              <TextField
                fullWidth
                multiline
                rows={4}
                margin="normal"
                label="Notas Adicionais"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                autoFocus
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button variant="contained" onClick={handleRequestSubmit} disabled={isRequesting}>
                {isRequesting ? <CircularProgress size={24} /> : 'Confirmar Solicitação'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 