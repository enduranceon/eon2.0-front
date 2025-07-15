'use client';

/*
 * Página de Eventos do Aluno
 * 
 * Funcionalidade de verificação de inscrições:
 * - Busca todos os exames disponíveis via GET /exams
 * - Busca exames em que o usuário está inscrito via GET /exams/user/:userId
 * - Combina os dados para verificar status: INSCRITO, DISPONÍVEL, ENCERRADA, PARTICIPOU
 * - Impede inscrições duplicadas verificando se o exame já está na lista do usuário
 */

import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  ListItemIcon,
  ListItemText,
  ListItem,
  List,
  Avatar,
  Modal,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tabs,
  Tab,
  TextField
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { 
  Event as EventIcon, 
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Place as PlaceIcon,
  Info as InfoIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { enduranceApi } from '../../../../services/enduranceApi';
import { handleApiError } from '../../../../utils/errors';
// import { enduranceApi } from '../../../../services/enduranceApi';
// import dayjs from 'dayjs';

const formatDate = (d: string) => {
  return new Date(d).toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

const getStatusChip = (status: string) => {
  switch(status) {
    case 'DISPONÍVEL':
      return <Chip label="Inscrições Abertas" color="success" variant="filled" size="small" icon={<CheckCircleIcon />} />;
    case 'INSCRITO':
      return <Chip label="Inscrito" color="primary" variant="filled" size="small" icon={<CheckCircleIcon />} />;
    case 'ENCERRADA':
      return <Chip label="Encerrada" color="default" variant="outlined" size="small" />;
    case 'PARTICIPOU':
        return <Chip label="Participou" color="info" variant="filled" size="small" icon={<CheckCircleIcon />} />;
    default:
      return <Chip label={status} color="default" size="small" />;
  }
};

const AvailableExams = ({ exams, userId, onRegister, onOpenDetails, processingId }: any) => {
  const getExamStatusForUser = (exam: any): 'INSCRITO' | 'DISPONÍVEL' | 'ENCERRADA' | 'PARTICIPOU' => {
    // Verifica se o usuário está inscrito baseado na presença de registrations
    const isRegistered = exam.registrations && exam.registrations.length > 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(exam.date);

    console.log(`DEBUG: Status do evento "${exam.name}" para usuário ${userId}:`, {
      examId: exam.id,
      isRegistered,
      registrations: exam.registrations,
      examDate: exam.date,
      today: today.toISOString(),
      isPastEvent: examDate < today,
      isActive: exam.isActive
    });

    // Se o usuário está inscrito
    if (isRegistered) {
      return examDate < today ? 'PARTICIPOU' : 'INSCRITO';
    }

    // Se o exame já passou
    if (examDate < today) {
      return 'ENCERRADA';
    }
    
    // Se o exame está ativo e no futuro
    if (exam.isActive !== false) { 
      return 'DISPONÍVEL';
    }

    // Fallback para eventos inativos futuros
    return 'ENCERRADA';
  };

  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {exams.map((exam: any) => {
        const status = getExamStatusForUser(exam);
        const isProcessing = processingId === exam.id;
        const isInactive = status === 'ENCERRADA' || status === 'PARTICIPOU';

        return (
          <Grid item xs={12} md={6} lg={4} key={exam.id}>
            <Paper 
              elevation={isInactive ? 1 : 3} 
              sx={{ 
                p: 2, 
                height: '100%', 
                background: (theme) => isInactive ? theme.palette.action.disabledBackground : undefined,
                opacity: isInactive ? 0.7 : 1,
              }}
            >
              <Card sx={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}><EventIcon /></Avatar>
                    <Typography variant="h6" fontWeight="bold" component="div" sx={{ flexGrow: 1 }}>{exam.name}</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }}/>
                  <Box sx={{ flexGrow: 1 }}>
                    <List dense>
                      <ListItem><ListItemIcon sx={{minWidth: 40}}><CategoryIcon color="action"/></ListItemIcon><ListItemText primary="Modalidade" secondary={exam.modalidade?.name || 'Não especificada'} /></ListItem>
                      <ListItem><ListItemIcon sx={{minWidth: 40}}><CalendarIcon color="action"/></ListItemIcon><ListItemText primary="Data" secondary={formatDate(exam.date)} /></ListItem>
                    </List>
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {getStatusChip(status)}
                    <Button 
                      variant={status === 'INSCRITO' ? 'outlined' : 'contained'}
                      disabled={isInactive || isProcessing}
                      onClick={() => {
                        if (status === 'DISPONÍVEL') onRegister(exam.id);
                        if (status === 'INSCRITO') onOpenDetails(exam);
                      }}
                      startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : null}
                    >
                      {isProcessing ? 'Processando...' 
                       : status === 'INSCRITO' ? 'Ver Detalhes' 
                       : status === 'DISPONÍVEL' ? 'Inscrever-se' 
                       : 'Encerrada'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

const PastExams = ({ userExams }: any) => {
  const [filters, setFilters] = useState({ search: '', startDate: null, endDate: null });

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredHistory = useMemo(() => {
    // Filtra apenas os exames do usuário que já passaram
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return userExams.filter((exam: any) => {
      const examDate = new Date(exam.date);
      const isPastEvent = examDate < today;
      
      if (!isPastEvent) return false; // Só mostra eventos passados

      const searchMatch = filters.search ? exam.name.toLowerCase().includes(filters.search.toLowerCase()) : true;
      const startDateMatch = filters.startDate ? examDate >= filters.startDate : true;
      const endDateMatch = filters.endDate ? examDate <= filters.endDate : true;

      return searchMatch && startDateMatch && endDateMatch;
    });
  }, [userExams, filters]);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3, mt: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}><TextField fullWidth label="Buscar por nome" variant="outlined" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)}/></Grid>
          <Grid item xs={12} sm={6} md={3}><DatePicker label="Data de Início" value={filters.startDate} onChange={(date) => handleFilterChange('startDate', date)}/></Grid>
          <Grid item xs={12} sm={6} md={3}><DatePicker label="Data de Fim" value={filters.endDate} onChange={(date) => handleFilterChange('endDate', date)}/></Grid>
        </Grid>
      </Paper>
      {filteredHistory.length > 0 ? (
        <List>
          {filteredHistory.map((exam: any) => {
            // Buscar informações de inscrição do usuário para esta prova
            const userRegistration = exam.registrations?.[0];
            
            return (
              <React.Fragment key={exam.id}>
                <ListItem>
                  <ListItemIcon>
                    <EventIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {exam.name}
                        </Typography>
                        {userRegistration && (
                          <Chip 
                            label={userRegistration.attended ? 'Participou' : 'Inscrito'} 
                            size="small" 
                            color={userRegistration.attended ? 'success' : 'primary'}
                            icon={userRegistration.attended ? <CheckCircleIcon /> : <EventIcon />}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography component="span" variant="body2" color="text.primary">
                          📅 Data: {formatDate(exam.date)}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          📍 Local: {exam.location}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          🏃 Modalidade: {exam.modalidade?.name}
                        </Typography>
                        
                        {/* Informações de participação */}
                        {userRegistration && (
                          <Box sx={{ mt: 1, p: 2, backgroundColor: userRegistration.attended ? 'success.50' : 'info.50', borderRadius: 1, borderLeft: 3, borderColor: userRegistration.attended ? 'success.main' : 'info.main' }}>
                            <Typography variant="body2" fontWeight="bold" color={userRegistration.attended ? 'success.main' : 'info.main'}>
                              {userRegistration.attended ? '✅ Participação Confirmada' : '📝 Inscrição Realizada'}
                            </Typography>
                            
                            {userRegistration.attended && userRegistration.attendanceConfirmedAt && (
                              <>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Presença confirmada em: {new Date(userRegistration.attendanceConfirmedAt).toLocaleDateString('pt-BR')} às {new Date(userRegistration.attendanceConfirmedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                                {userRegistration.attendanceConfirmedBy && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Confirmado pelo treinador
                                  </Typography>
                                )}
                              </>
                            )}
                            
                            {!userRegistration.attended && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                Inscrito em: {new Date(userRegistration.createdAt).toLocaleDateString('pt-BR')}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>
      ) : (
        <Alert severity="info">Nenhum histórico de prova encontrado.</Alert>
      )}
    </Box>
  );
};

export default function EventsPage() {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Todos os hooks devem ser chamados antes de qualquer return condicional
  const loadExams = useCallback(async () => {
    if (!auth.user?.id) {
      setError('Usuário não autenticado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Buscar todos os eventos e os eventos em que o usuário está inscrito
      const [allExamsResponse, userExamsResponse] = await Promise.all([
        enduranceApi.getExams({ page: 1, limit: 100 }),
        enduranceApi.getUserExams(auth.user.id)
      ]);

      const allExamsData = Array.isArray(allExamsResponse) ? allExamsResponse : allExamsResponse.data;
      
      // Processar userExamsResponse que pode ter estrutura aninhada
      let userExamsData;
      if (Array.isArray(userExamsResponse)) {
        userExamsData = userExamsResponse;
      } else if ((userExamsResponse as any)?.data?.data) {
        // Estrutura: { data: { data: [...], pagination: {...} } }
        userExamsData = (userExamsResponse as any).data.data;
      } else if ((userExamsResponse as any)?.data) {
        userExamsData = (userExamsResponse as any).data;
      } else {
        userExamsData = [];
      }
      
      console.log('📋 Dados dos exames do usuário processados:', userExamsData);
      
      // Criar um mapa de exames em que o usuário está inscrito
      const userExamIds = new Set(userExamsData?.map((exam: any) => exam.id) || []);
      
      setUserRegistrations(userExamsData || []);
      
      // Combinar dados de eventos com informações de inscrição
      const examsWithRegistrations = allExamsData?.map((exam: any) => ({
        ...exam,
        registrations: userExamIds.has(exam.id) ? [{
          id: `registration-${exam.id}`,
          userId: auth.user.id,
          examId: exam.id,
          status: 'registered',
          createdAt: new Date().toISOString()
        }] : []
      })) || [];

      setAllExams(examsWithRegistrations);
      console.log('DEBUG: Todos os exames disponíveis:', allExamsData);
      console.log('DEBUG: Exames em que o usuário está inscrito:', userExamsData);
      console.log('DEBUG: Exames com informações de inscrição:', examsWithRegistrations);
    } catch (err) {
      console.error('Erro ao carregar provas:', err);
      setError('Erro ao carregar provas.');
    } finally {
      setLoading(false);
    }
  }, [auth.user?.id]);

  React.useEffect(() => {
    if (auth.user?.id) {
      loadExams();
    }
  }, [auth.user?.id, loadExams]);
  
  // PastExams component now handles filtering internally using userRegistrations

  // Redirecionar para login se usuário não estiver autenticado
  React.useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.push('/login');
    }
  }, [auth.isLoading, auth.user, router]);

  // Verificação simples de autenticação (substitui ProtectedRoute)
  if (auth.isLoading || !auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (auth.user.userType !== 'FITNESS_STUDENT') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Acesso não autorizado</Typography>
      </Box>
    );
  }

  const handleRegister = async (examId: string) => {
    if (!auth.user) return;
    
    setProcessingId(examId);
    toast.promise(enduranceApi.registerForExam(examId), {
      loading: 'Realizando inscrição...',
      success: () => { 
        loadExams(); // Recarrega eventos e inscrições
        return 'Inscrição realizada com sucesso!'; 
      },
      error: (err) => handleApiError(err),
    }).finally(() => setProcessingId(null));
  };

  const handleCancelRegistration = async () => {
    if (!selectedExam || !auth.user) return;
    
    setProcessingId(selectedExam.id);
    setIsCancelConfirmOpen(false);
    toast.promise(enduranceApi.cancelExamRegistration(selectedExam.id), {
      loading: 'Cancelando inscrição...',
      success: () => { 
        loadExams(); // Recarrega eventos e inscrições
        setIsDetailsModalOpen(false); 
        return 'Inscrição cancelada com sucesso!'; 
      },
      error: (err) => handleApiError(err),
    }).finally(() => setProcessingId(null));
  };
  
  const handleOpenDetailsModal = (exam: any) => {
    setSelectedExam(exam);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedExam(null);
  };
  
  return (
    <DashboardLayout user={auth.user} onLogout={auth.logout}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Provas & Competições</Typography>
        
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} aria-label="abas de eventos">
              <Tab label="Provas Disponíveis" id="tab-available" aria-controls="tabpanel-available" />
              <Tab label="Histórico de Provas" id="tab-history" aria-controls="tabpanel-history" />
            </Tabs>
          </Box>

          <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-available" aria-labelledby="tab-available">
            {activeTab === 0 && (loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : 
              allExams.length > 0 ?
              <AvailableExams
                exams={allExams}
                userId={auth.user.id}
                onRegister={handleRegister}
                onOpenDetails={handleOpenDetailsModal}
                processingId={processingId}
              /> : <Alert severity="info">Nenhuma prova disponível no momento.</Alert>
            )}
          </Box>

          <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-history" aria-labelledby="tab-history">
            {activeTab === 1 && (loading ? <CircularProgress /> : error ? <Alert severity="error">{error}</Alert> : 
              <PastExams userExams={userRegistrations} />
            )}
          </Box>
        </LocalizationProvider>
      </Container>
      
      <Modal open={isDetailsModalOpen} onClose={handleCloseDetailsModal}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 450, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2 }}>
          <Typography variant="h6" component="h2" fontWeight="bold" color="text.primary">{selectedExam?.name}</Typography>
          <Divider sx={{my: 2}} />
          <List>
            <ListItem><ListItemIcon><CalendarIcon/></ListItemIcon><ListItemText primary="Data" secondary={selectedExam ? formatDate(selectedExam.date) : ''} primaryTypographyProps={{ color: 'text.primary' }} secondaryTypographyProps={{ color: 'text.secondary' }} /></ListItem>
            <ListItem><ListItemIcon><PlaceIcon/></ListItemIcon><ListItemText primary="Local" secondary={selectedExam?.location || 'A definir'} primaryTypographyProps={{ color: 'text.primary' }} secondaryTypographyProps={{ color: 'text.secondary' }}/></ListItem>
            <ListItem>
              <ListItemIcon><InfoIcon/></ListItemIcon>
              <ListItemText 
                primary="Status" 
                secondary={<Chip label="Inscrição Confirmada" color="success" size="small" />}
                primaryTypographyProps={{ color: 'text.primary' }} 
                secondaryTypographyProps={{ component: 'div' }} 
              />
            </ListItem>
          </List>
          <DialogActions sx={{ pt: 2, px: 0 }}>
              <Button 
                  variant="outlined"
                  color="error"
                  startIcon={processingId === selectedExam?.id ? <CircularProgress size={16} /> : <CancelIcon />}
                  onClick={() => setIsCancelConfirmOpen(true)}
                  disabled={processingId === selectedExam?.id}
              >
                  Cancelar Inscrição
              </Button>
          </DialogActions>
        </Box>
      </Modal>

      <Dialog open={isCancelConfirmOpen} onClose={() => setIsCancelConfirmOpen(false)}>
        <DialogTitle>Confirmar Cancelamento</DialogTitle>
        <DialogContent><DialogContentText>Tem certeza que deseja cancelar sua inscrição nesta prova? Esta ação não poderá ser desfeita.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCancelConfirmOpen(false)}>Não, voltar</Button>
          <Button onClick={handleCancelRegistration} color="error" autoFocus>Sim, cancelar</Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
} 