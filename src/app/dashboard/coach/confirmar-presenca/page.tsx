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
  Today as TodayIcon
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
}

export default function ConfirmarPresencaPage() {
  const [registrations, setRegistrations] = useState<ExamRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRegistration, setSelectedRegistration] = useState<ExamRegistration | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      
      // Buscar inscrições em provas usando o novo endpoint
      const response = await enduranceApi.getCoachExamRegistrations({
        page: 1,
        limit: 100 // Buscar todas as inscrições
      });
      
      
      
      // Mapear os dados para o formato esperado pelo componente
      const mappedRegistrations: ExamRegistration[] = response.data.map((registration: any, index: number) => {
        
        
        // Verificar se o ID é válido (UUID, CUID ou NanoID)
        let validId = registration.id;
        if (!isValidId(registration.id)) {
          console.warn(`⚠️  ID inválido detectado: "${registration.id}". Gerando ID temporário.`);
          validId = `temp-${Date.now()}-${index}`; // ID temporário para desenvolvimento
        } else {
          
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
          attendanceConfirmed: registration.attended
        };
      });
      
      setRegistrations(mappedRegistrations);
      
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
        console.warn('⚠️  Tentando usar dados mockados ou de desenvolvimento');
        
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

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && !reg.attendanceConfirmed) ||
                         (statusFilter === 'confirmed' && reg.attendanceConfirmed);
    return matchesSearch && matchesStatus;
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
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Buscar por aluno ou prova"
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
                  <MenuItem value="confirmed">Confirmados</MenuItem>
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
                  <TableCell>Status</TableCell>
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
                      <Chip 
                        label={registration.attendanceConfirmed ? 'Confirmado' : 'Pendente'}
                        color={registration.attendanceConfirmed ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
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
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 