'use client';

/*
 * Página de Provas do Aluno
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
  TextField,
  CardMedia
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { useNotificationHighlight } from '../../../../hooks/useNotificationHighlight';
import { useRealtimeUpdates } from '../../../../hooks/useRealtimeUpdates';
import { 
  Event as EventIcon, 
  CheckCircle as CheckCircleIcon,
  Category as CategoryIcon,
  Place as PlaceIcon,
  Info as InfoIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { enduranceApi } from '../../../../services/enduranceApi';
import { handleApiError } from '../../../../utils/errors';
import DistanceSelectionModal from '../../../../components/Dashboard/Aluno/DistanceSelectionModal';
import ExternalExamsTab from '../../../../components/Dashboard/Aluno/ExternalExamsTab';
// import { enduranceApi } from '../../../../services/enduranceApi';
// import dayjs from 'dayjs';

const formatDate = (d: string) => {
  return new Date(d).toLocaleDateString('pt-BR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
};

// Função para normalizar caracteres especiais
const normalizeText = (text: string) => {
  if (!text) return text;
  
  // Corrigir caracteres específicos com problemas de encoding
  let normalizedText = text;
  
  // Correções específicas para palavras conhecidas
  normalizedText = normalizedText.replace(/Distncias/g, 'Distâncias');
  normalizedText = normalizedText.replace(/Distncias/g, 'Distâncias');
  normalizedText = normalizedText.replace(/Distâncias/g, 'Distâncias');
  
  // Correções para caracteres especiais individuais
  normalizedText = normalizedText.replace(/\u00e3/g, 'ã');
  normalizedText = normalizedText.replace(/\u00e9/g, 'é');
  normalizedText = normalizedText.replace(/\u00ed/g, 'í');
  normalizedText = normalizedText.replace(/\u00f3/g, 'ó');
  normalizedText = normalizedText.replace(/\u00fa/g, 'ú');
  normalizedText = normalizedText.replace(/\u00e7/g, 'ç');
  normalizedText = normalizedText.replace(/\u00e2/g, 'â');
  normalizedText = normalizedText.replace(/\u00ea/g, 'ê');
  normalizedText = normalizedText.replace(/\u00f4/g, 'ô');
  normalizedText = normalizedText.replace(/\u00e0/g, 'à');
  normalizedText = normalizedText.replace(/\u00e8/g, 'è');
  normalizedText = normalizedText.replace(/\u00ec/g, 'ì');
  normalizedText = normalizedText.replace(/\u00f2/g, 'ò');
  normalizedText = normalizedText.replace(/\u00f9/g, 'ù');
  
  return normalizedText;
};

// Função para obter a imagem da prova ou imagem padrão
const getExamImage = (exam: any) => {
  // Se a prova tem uma imagem, usar ela
  if (exam.imageUrl) {
    return exam.imageUrl;
  }
  
  // Usar uma imagem padrão simples que existe
  return '/images/default-exam.jpg';
};

const getStatusChip = (status: string) => {
  switch(status) {
    case 'DISPONÍVEL':
      return (
        <Chip 
          label="Inscrições Abertas" 
          color="success" 
          variant="filled" 
          size="small" 
          icon={<CheckCircleIcon />} 
          sx={{ 
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 1,
            '& .MuiChip-icon': { fontSize: '0.875rem' }
          }} 
        />
      );
    case 'INSCRITO':
      return (
        <Chip 
          label="Inscrito" 
          color="primary" 
          variant="filled" 
          size="small" 
          icon={<CheckCircleIcon />} 
          sx={{ 
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 1,
            '& .MuiChip-icon': { fontSize: '0.875rem' }
          }} 
        />
      );
    case 'ENCERRADA':
      return (
        <Chip 
          label="Encerrada" 
          color="default" 
          variant="outlined" 
          size="small" 
          sx={{ 
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 1,
            opacity: 0.7
          }} 
        />
      );
    case 'PARTICIPOU':
      return (
        <Chip 
          label="Participou" 
          color="info" 
          variant="filled" 
          size="small" 
          icon={<CheckCircleIcon />} 
          sx={{ 
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 1,
            '& .MuiChip-icon': { fontSize: '0.875rem' }
          }} 
        />
      );
    default:
      return (
        <Chip 
          label={status} 
          color="default" 
          size="small" 
          sx={{ 
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 1
          }} 
        />
      );
  }
};

const AvailableExams = ({ exams, userId, onRegister, onOpenDetails, processingId, shouldHighlight }: any) => {
  const getExamStatusForUser = (exam: any): 'INSCRITO' | 'DISPONÍVEL' | 'ENCERRADA' | 'PARTICIPOU' => {
    // Verifica se o usuário está inscrito baseado na presença de registrations
    // IMPORTANTE: Verificar se o usuário atual está inscrito, não apenas se há registrations
    const isRegistered = exam.registrations && exam.registrations.some((reg: any) => 
      reg.userId === userId && reg.deletedAt === null
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(exam.date);

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

    // Fallback para provas inativas futuras
    return 'ENCERRADA';
  };

  return (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {exams.map((exam: any) => {
        const status = getExamStatusForUser(exam);
        const isProcessing = processingId === exam.id;
        const isInactive = status === 'ENCERRADA' || status === 'PARTICIPOU';

        const isHighlighted = shouldHighlight(exam.id, 'exam');
        
        return (
          <Grid item xs={12} md={6} lg={4} key={exam.id}>
            <Paper 
              elevation={isInactive ? 1 : 3} 
              sx={{ 
                p: 2, 
                height: '100%', 
                background: (theme) => isInactive ? theme.palette.action.disabledBackground : undefined,
                opacity: isInactive ? 0.7 : 1,
                ...(isHighlighted ? {
                  backgroundColor: 'rgba(255, 128, 18, 0.1)',
                  border: '2px solid #FF8012',
                  borderRadius: '8px',
                  boxShadow: '0 0 20px rgba(255, 128, 18, 0.3)',
                  animation: 'highlight-pulse 2s ease-in-out 3',
                } : {})
              }}
              {...(isHighlighted ? { 'data-highlighted': 'true' } : {})}
            >
              <Card sx={{ 
              background: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(30, 30, 30, 0.98)' 
                : 'rgba(255, 255, 255, 0.98)', 
              backdropFilter: 'blur(10px)', 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column' 
            }}>
                {/* Imagem da prova */}
                <CardMedia
                  component="img"
                  height="140"
                  image={getExamImage(exam)}
                  alt={exam.name}
                  sx={{
                    objectFit: 'cover',
                    backgroundColor: 'grey.200'
                  }}
                  onError={(e) => {
                    // Se a imagem falhar ao carregar, usar um placeholder
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE0MCIgdmlld0JveD0iMCAwIDMwMCAxNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMTQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjcwIiByPSIyMCIgZmlsbD0iI0NDQ0NDQyIvPgo8cGF0aCBkPSJNMTQwIDYwTDE2MCA2MEwxNTAgODBMMTQwIDYwWiIgZmlsbD0iI0NDQ0NDQyIvPgo8dGV4dCB4PSIxNTAiIHk9IjEwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OTk5OSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0Ij5JbWFnZW0gZGEgUHJvdmE8L3RleHQ+Cjwvc3ZnPgo=';
                  }}
                />
                
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" component="div" sx={{ textAlign: 'center' }}>{normalizeText(exam.name)}</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }}/>
                  <Box sx={{ flexGrow: 1 }}>
                    <List dense>
                      <ListItem><ListItemIcon sx={{minWidth: 40}}><CategoryIcon color="action"/></ListItemIcon><ListItemText primary="Modalidade" secondary={normalizeText(exam.modalidade?.name) || 'Não especificada'} /></ListItem>
                      <ListItem><ListItemText primary="Data" secondary={formatDate(exam.date)} /></ListItem>
                      {exam.distances && exam.distances.length > 0 ? (
                        <ListItem>
                          <ListItemIcon sx={{minWidth: 40}}><PlaceIcon color="action"/></ListItemIcon>
                          <ListItemText 
                            primary="Distâncias" 
                            secondaryTypographyProps={{ component: 'div' }}
                            secondary={
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {exam.distances.map((distance: any, index: number) => (
                                  <Chip
                                    key={distance.id || index}
                                    label={`${distance.distance}${distance.unit}`}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                  />
                                ))}
                              </Box>
                            }
                          />
                        </ListItem>
                      ) : exam.categories && exam.categories.length > 0 ? (
                        <ListItem>
                          <ListItemIcon sx={{minWidth: 40}}><CategoryIcon color="action"/></ListItemIcon>
                          <ListItemText 
                            primary="Categorias" 
                            secondaryTypographyProps={{ component: 'div' }}
                            secondary={
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                {exam.categories.map((category: any, index: number) => (
                                  <Chip
                                    key={category.id || index}
                                    label={category.name}
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                  />
                                ))}
                              </Box>
                            }
                          />
                        </ListItem>
                      ) : null}
                    </List>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    {/* Chip de Status */}
                    <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'center' }}>
                      {getStatusChip(status)}
                    </Box>
                    
                    {/* Botão de Ação */}
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Button 
                        variant={status === 'INSCRITO' ? 'outlined' : 'contained'}
                        size="medium"
                        disabled={isInactive || isProcessing}
                        onClick={() => {
                          if (status === 'DISPONÍVEL') onRegister(exam.id);
                          if (status === 'INSCRITO') onOpenDetails(exam);
                        }}
                        startIcon={isProcessing ? <CircularProgress size={18} color="inherit" /> : null}
                        sx={{ 
                          minWidth: 160,
                          fontSize: '0.875rem',
                          py: 1,
                          px: 3,
                          fontWeight: 500
                        }}
                      >
                        {isProcessing ? 'Processando...' 
                         : status === 'INSCRITO' ? 'Ver Detalhes' 
                         : status === 'DISPONÍVEL' ? 'Confirmar Presença' 
                         : 'Encerrada'}
                      </Button>
                    </Box>
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

const PastExams = ({ userExams, userId, shouldHighlight }: any) => {
  const [filters, setFilters] = useState({ search: '', startDate: null, endDate: null });

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredHistory = useMemo(() => {
    // Mostrar todas as provas que já possuem resultado (legado ou novo modelo)
    return (userExams || []).filter((exam: any) => {
      const examDate = new Date(exam.date);
      const regs: any[] = Array.isArray(exam.registrations) ? exam.registrations : [];
      const hasResult = regs.some((r: any) => {
        const hasLegacy = r?.result && String(r.result).trim() !== '';
        const hasTime = r?.timeSeconds !== undefined && r?.timeSeconds !== null && String(r.timeSeconds).trim() !== '';
        const hasGeneral = r?.generalRank !== undefined && r?.generalRank !== null;
        const hasCategory = r?.categoryRank !== undefined && r?.categoryRank !== null;
        return hasLegacy || hasTime || hasGeneral || hasCategory;
      });
      if (!hasResult) return false;

      const searchMatch = filters.search ? exam.name.toLowerCase().includes(filters.search.toLowerCase()) : true;
      const startDateMatch = filters.startDate ? examDate >= filters.startDate : true;
      const endDateMatch = filters.endDate ? examDate <= filters.endDate : true;
      return searchMatch && startDateMatch && endDateMatch;
    });
  }, [userExams, filters]);

  const formatTime = (value: any) => {
    const n = Number(value);
    if (!isFinite(n)) return null;
    const abs = Math.abs(n);
    const hours = Math.floor(abs / 3600);
    const minutes = Math.floor((abs % 3600) / 60);
    const secondsFloat = abs % 60;
    const secondsInt = Math.floor(secondsFloat);
    const fraction = Number((secondsFloat - secondsInt).toFixed(1));
    const secondsStr = fraction > 0 ? (secondsInt + fraction).toFixed(1) : secondsInt.toString();
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secondsStr).padStart(2, '0')}`;
  };

  const formatResult = (registration: any) => {
    if (!registration) return '';
    const parts: string[] = [];
    if (registration.timeSeconds !== undefined && registration.timeSeconds !== null && String(registration.timeSeconds).trim() !== '') {
      const t = formatTime(registration.timeSeconds);
      if (t) parts.push(`Tempo: ${t}`);
    }
    if (registration.generalRank !== undefined && registration.generalRank !== null) {
      parts.push(`Geral: ${registration.generalRank}`);
    }
    if (registration.categoryRank !== undefined && registration.categoryRank !== null) {
      parts.push(`Categoria: ${registration.categoryRank}`);
    }
    if (parts.length === 0 && registration.result) return String(registration.result);
    return parts.join(' • ');
  };

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
            // Buscar informações de inscrição do usuário atual para esta prova
            const userRegistration = exam.registrations?.find((reg: any) => 
              reg.userId === userId && reg.deletedAt === null
            );
            
            return (
              <React.Fragment key={exam.id}>
                <ListItem
                  sx={{
                    ...(shouldHighlight(exam.id, 'exam') ? {
                      backgroundColor: 'rgba(255, 128, 18, 0.1)',
                      border: '2px solid #FF8012',
                      borderRadius: '8px',
                      boxShadow: '0 0 20px rgba(255, 128, 18, 0.3)',
                      animation: 'highlight-pulse 2s ease-in-out 3',
                      mb: 1,
                    } : {})
                  }}
                  {...(shouldHighlight(exam.id, 'exam') ? { 'data-highlighted': 'true' } : {})}
                >
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
                          Data: {formatDate(exam.date)}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          📍 Local: {exam.location}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          🏃 Modalidade: {exam.modalidade?.name}
                        </Typography>
                        {userRegistration && (
                          <>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              🏁 Resultado: {formatResult(userRegistration)}
                            </Typography>
                          </>
                        )}
                        
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
  const { highlightInfo, shouldHighlight, clearHighlight } = useNotificationHighlight();
  const { registerUpdateCallback, unregisterUpdateCallback } = useRealtimeUpdates();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allExams, setAllExams] = useState<any[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isDistanceModalOpen, setIsDistanceModalOpen] = useState(false);
  const [selectedExamForRegistration, setSelectedExamForRegistration] = useState<any>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  
  const loadExams = useCallback(async () => {
    if (!auth.user?.id) {
      setError('Usuário não autenticado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Buscar todas as provas e as provas em que o usuário está inscrito
      const [allExamsResponse, firstUserExamsPage] = await Promise.all([
        enduranceApi.getExams({ page: 1, limit: 100 }),
        enduranceApi.getUserExams(auth.user.id, { page: 1, limit: 50 })
      ]);

      const allExamsData = Array.isArray(allExamsResponse) ? allExamsResponse : allExamsResponse.data;

      // Normalizar primeira página do histórico do usuário
      let userExamsData: any[] = [];
      let pagination = (firstUserExamsPage as any)?.pagination;
      if ((firstUserExamsPage as any)?.data && Array.isArray((firstUserExamsPage as any).data)) {
        userExamsData = (firstUserExamsPage as any).data;
      } else if (Array.isArray(firstUserExamsPage)) {
        userExamsData = firstUserExamsPage as any[];
      }

      // Se houver mais páginas, buscar todas as demais e agregar
      if (pagination?.totalPages && pagination.totalPages > 1) {
        const remainingPages = Array.from({ length: pagination.totalPages - 1 }, (_, idx) => idx + 2);
        const pageResults = await Promise.all(
          remainingPages.map((pageNum) => enduranceApi.getUserExams(auth.user!.id, { page: pageNum, limit: pagination.limit || 50 }))
        );
        for (const pr of pageResults) {
          if ((pr as any)?.data && Array.isArray((pr as any).data)) {
            userExamsData = userExamsData.concat((pr as any).data);
          } else if (Array.isArray(pr)) {
            userExamsData = userExamsData.concat(pr as any[]);
          }
        }
      }
      
      
      
      setUserRegistrations(userExamsData || []);

      // Manter apenas as registrations reais da API, sem criar registrations artificiais
      const examsWithRegistrations = (allExamsData || []).map((exam: any) => ({
        ...exam,
        // Manter apenas as registrations reais da API
        registrations: exam.registrations && Array.isArray(exam.registrations) ? exam.registrations : []
      }));

      setAllExams(examsWithRegistrations);
      
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

  // Registrar callback para atualizações em tempo real
  React.useEffect(() => {
    registerUpdateCallback('exams', loadExams);
    
    return () => {
      unregisterUpdateCallback('exams');
    };
  }, [registerUpdateCallback, unregisterUpdateCallback, loadExams]);
  
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
    
    // Encontrar a prova selecionada
    const exam = allExams.find(e => e.id === examId);
    if (!exam) return;
    
    // Se a prova tem distâncias ou categorias, abrir modal de seleção
    if ((exam.distances && exam.distances.length > 0) || (exam.categories && exam.categories.length > 0)) {
      setSelectedExamForRegistration(exam);
      setIsDistanceModalOpen(true);
      setRegistrationError(null);
    } else {
      // Se não tem distâncias nem categorias, registrar diretamente
      setProcessingId(examId);
      toast.promise(enduranceApi.registerForExam(examId), {
        loading: 'Realizando inscrição...',
        success: () => { 
          loadExams();
          return 'Inscrição realizada com sucesso!'; 
        },
        error: (err) => handleApiError(err),
      }).finally(() => setProcessingId(null));
    }
  };

  const handleRegisterWithDistance = async (selectedId: string) => {
    if (!selectedExamForRegistration || !auth.user) return;
    
    setRegistrationLoading(true);
    setRegistrationError(null);
    
    try {
      // Determinar se é uma prova de distância ou categoria
      const isDistanceRegistration = selectedExamForRegistration.distances && 
        selectedExamForRegistration.distances.length > 0;
      
      // Preparar payload baseado no tipo de prova
      const payload = isDistanceRegistration 
        ? { distanceId: selectedId }
        : { categoryId: selectedId };
      

      
      await enduranceApi.registerForExam(selectedExamForRegistration.id, payload);
      toast.success('Inscrição realizada com sucesso!');
      loadExams();
      setIsDistanceModalOpen(false);
      setSelectedExamForRegistration(null);
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      setRegistrationError(error.response?.data?.message || 'Erro ao realizar inscrição');
    } finally {
      setRegistrationLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!selectedExam || !auth.user) return;
    
    setProcessingId(selectedExam.id);
    setIsCancelConfirmOpen(false);
    toast.promise(enduranceApi.cancelExamRegistration(selectedExam.id), {
      loading: 'Cancelando inscrição...',
      success: () => { 
        loadExams(); // Recarrega provas e inscrições
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
    <DashboardLayout user={auth.user} onLogout={auth.logout} overdueInfo={auth.overdueInfo}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Provas & Competições</Typography>
        
        {/* Alerta de destaque por notificação */}
        {highlightInfo.isActive && highlightInfo.type === 'exam' && (
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
              🎯 <strong>Destacando prova:</strong> {highlightInfo.name || `ID: ${highlightInfo.id}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Você foi redirecionado aqui através de uma notificação. A prova está destacada abaixo.
            </Typography>
          </Alert>
        )}
        
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)} 
              aria-label="abas de provas"
            >
              <Tab label="Disponíveis" id="tab-available" aria-controls="tabpanel-available" />
              <Tab label="Histórico" id="tab-history" aria-controls="tabpanel-history" />
              <Tab label="Externas" id="tab-external" aria-controls="tabpanel-external" />
            </Tabs>
          </Box>

          <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-available" aria-labelledby="tab-available">
            {activeTab === 0 && (
              <>
                {loading && <CircularProgress />}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && allExams.length > 0 && (
                  <AvailableExams
                    exams={allExams}
                    userId={auth.user.id}
                    onRegister={handleRegister}
                    onOpenDetails={handleOpenDetailsModal}
                    processingId={processingId}
                    shouldHighlight={shouldHighlight}
                  />
                )}
                {!loading && !error && allExams.length === 0 && (
                  <Alert severity="info">Nenhuma prova disponível no momento.</Alert>
                )}
              </>
            )}
          </Box>

          <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-history" aria-labelledby="tab-history">
            {activeTab === 1 && (
              <>
                {loading && <CircularProgress />}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                  <PastExams userExams={userRegistrations} userId={auth.user.id} shouldHighlight={shouldHighlight} />
                )}
              </>
            )}
          </Box>

          <Box role="tabpanel" hidden={activeTab !== 2} id="tabpanel-external" aria-labelledby="tab-external">
            {activeTab === 2 && (
              <ExternalExamsTab
                onExamClick={(exam) => {
                  // Aqui você pode implementar uma ação quando clicar em uma prova externa
                }}
              />
            )}
          </Box>
        </LocalizationProvider>
      </Container>
      
      <Modal open={isDetailsModalOpen} onClose={handleCloseDetailsModal}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 450, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2 }}>
          <Typography variant="h6" component="h2" fontWeight="bold" color="text.primary">{selectedExam?.name}</Typography>
          <Divider sx={{my: 2}} />
          <List>
            <ListItem><ListItemText primary="Data" secondary={selectedExam ? formatDate(selectedExam.date) : ''} primaryTypographyProps={{ color: 'text.primary' }} secondaryTypographyProps={{ color: 'text.secondary' }} /></ListItem>
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

      {/* Modal de seleção de distância/categoria */}
      <DistanceSelectionModal
        open={isDistanceModalOpen}
        onClose={() => {
          setIsDistanceModalOpen(false);
          setSelectedExamForRegistration(null);
        }}
        onConfirm={handleRegisterWithDistance}
        examName={selectedExamForRegistration?.name || ''}
        distances={selectedExamForRegistration?.distances || []}
        categories={selectedExamForRegistration?.categories || []}
        loading={registrationLoading}
        error={registrationError}
      />
    </DashboardLayout>
  );
} 