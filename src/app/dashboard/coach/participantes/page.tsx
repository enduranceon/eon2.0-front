'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Event as EventIcon,
  Category as CategoryIcon,
  Straighten as DistanceIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { enduranceApi } from '../../../../services/enduranceApi';
import { handleApiError } from '../../../../utils/errors';
import toast from 'react-hot-toast';

interface Participant {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    birthDate?: string;
    gender?: string;
    age?: number;
  };
  exam: {
    id: string;
    name: string;
    date: string;
    location: string;
    modalidade: {
      id: string;
      name: string;
    };
  };
  distance?: {
    id: string;
    distance: string;
    unit: string;
  };
  category?: {
    id: string;
    name: string;
  };
  attended: boolean;
  attendanceConfirmedAt?: string;
  createdAt: string;
}

export default function ParticipantsPage() {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [modalidades, setModalidades] = useState<any[]>([]);
  
  // Estados de filtros
  const [examFilter, setExamFilter] = useState<string>('');
  const [modalidadeFilter, setModalidadeFilter] = useState<string>('');
  const [attendedFilter, setAttendedFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Estados de paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Estados de modal
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [confirmingAttendance, setConfirmingAttendance] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados em paralelo
      const [participantsResponse, examsResponse] = await Promise.all([
        enduranceApi.getCoachExamRegistrations({
          page: page + 1,
          limit: rowsPerPage,
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
          // Retornar dados vazios em caso de erro
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
        // Usar o endpoint geral de modalidades para obter todas as modalidades disponíveis
        modalidadesResponse = await enduranceApi.getModalidades();
      } catch (modalidadesError) {
        console.error('Erro ao carregar modalidades:', modalidadesError);
        modalidadesResponse = null;
      }

      setParticipants(participantsResponse.data || []);
      setTotal(participantsResponse.pagination?.total || 0);
      // Usar o novo endpoint público de provas
      if (examsResponse.success && Array.isArray(examsResponse.data)) {
        setExams(examsResponse.data);
        console.log('Provas carregadas com sucesso:', examsResponse.data.length, 'provas');
      } else {
        setExams([]);
        console.warn('Erro ao carregar provas:', examsResponse.message);
      }
      // Verificar se modalidadesResponse tem estrutura de resposta paginada
      let modalidadesData = modalidadesResponse?.data || modalidadesResponse;
      
      // Se modalidadesData não é um array, tentar extrair de outras propriedades
      if (!Array.isArray(modalidadesData)) {
        if (modalidadesData && typeof modalidadesData === 'object') {
          // Verificar se há propriedades que podem conter o array
          modalidadesData = modalidadesData.modalidades || modalidadesData.data || modalidadesData.items || [];
        } else {
          modalidadesData = [];
        }
      }
      
      // Garantir que temos um array válido
      if (!Array.isArray(modalidadesData)) {
        modalidadesData = [];
      }
      
      const modalidadesArray = Array.isArray(modalidadesData) ? modalidadesData : [];
      setModalidades(modalidadesArray);
      
      // Se não há modalidades, usar dados dos participantes para extrair modalidades únicas
      if (modalidadesArray.length === 0 && participantsResponse.data?.length > 0) {
        const uniqueModalidades = participantsResponse.data
          .map(p => p.exam?.modalidade)
          .filter((modalidade, index, self) => 
            modalidade && modalidade.id && modalidade.name && 
            self.findIndex(m => m?.id === modalidade.id) === index
          );
        setModalidades(uniqueModalidades);

      }
      
      
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      console.error('Erro detalhado:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      // Verificar se o erro é específico do endpoint de provas
      if (err.message && err.message.includes('provas')) {
        setError('Erro ao carregar lista de provas. O filtro de provas pode não funcionar corretamente.');
      } else {
        setError('Erro ao carregar dados dos participantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.user?.id) {
      loadData();
    }
  }, [auth.user?.id, page, rowsPerPage, examFilter, modalidadeFilter, attendedFilter]);



  const handleConfirmAttendance = async (participant: Participant) => {
    if (!participant) return;
    
    setConfirmingAttendance(true);
    try {
      await enduranceApi.confirmExamAttendance(participant.id);
      toast.success('Presença confirmada com sucesso!');
      loadData(); // Recarregar dados
      setIsDetailsModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao confirmar presença:', error);
      toast.error(error.response?.data?.message || 'Erro ao confirmar presença');
    } finally {
      setConfirmingAttendance(false);
    }
  };

  const handleCopyList = () => {
    const csvContent = generateCSV();
    navigator.clipboard.writeText(csvContent).then(() => {
      toast.success('Lista copiada para a área de transferência!');
    }).catch(() => {
      toast.error('Erro ao copiar lista');
    });
  };

  const handleExportCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'participantes_provas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearFilters = () => {
    setExamFilter('');
    setModalidadeFilter('');
    setAttendedFilter('');
    setSearchTerm('');
    setPage(0); // Resetar para primeira página
  };

  const generateCSV = () => {
    const headers = ['Nome', 'Email', 'Idade', 'Gênero', 'Prova', 'Modalidade', 'Distância/Categoria', 'Data da Prova', 'Local', 'Presença Confirmada', 'Data da Confirmação'];
    const rows = participants.map(p => [
      p.user.name,
      p.user.email,
      p.user.age || 'N/A',
      p.user.gender === 'MALE' ? 'Masculino' : 
      p.user.gender === 'FEMALE' ? 'Feminino' : 
      p.user.gender === 'OTHER' ? 'Outro' : 'N/A',
      p.exam.name,
      p.exam.modalidade.name,
      p.distance ? `${p.distance.distance}${p.distance.unit}` : p.category ? p.category.name : 'N/A',
      new Date(p.exam.date).toLocaleDateString('pt-BR'),
      p.exam.location,
      p.attended ? 'Sim' : 'Não',
      p.attendanceConfirmedAt ? new Date(p.attendanceConfirmedAt).toLocaleDateString('pt-BR') : 'N/A'
    ]);
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = !searchTerm || 
      participant.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
    <ProtectedRoute allowedUserTypes={['COACH']}>
      <DashboardLayout user={auth.user} onLogout={auth.logout}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Participantes das Provas
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Visualize e gerencie a lista de participantes confirmados em suas provas
            </Typography>
          </Box>

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
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                size="small"
                color="secondary"
                disabled={!examFilter && !modalidadeFilter && !attendedFilter && !searchTerm}
              >
                Limpar Filtros
              </Button>
            </Box>
          </Paper>

          {/* Tabela de Participantes */}
          <Paper>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Participante</TableCell>
                        <TableCell>Idade</TableCell>
                        <TableCell>Gênero</TableCell>
                        <TableCell>Prova</TableCell>
                        <TableCell>Modalidade</TableCell>
                        <TableCell>Distância/Categoria</TableCell>
                        <TableCell>Data da Prova</TableCell>
                        <TableCell>Local</TableCell>
                        <TableCell>Presença</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredParticipants.map((participant) => (
                        <TableRow key={participant.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {participant.user.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {participant.user.email}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" align="center">
                              {participant.user.age || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" align="center">
                              {participant.user.gender === 'MALE' ? 'Masculino' : 
                               participant.user.gender === 'FEMALE' ? 'Feminino' : 
                               participant.user.gender === 'OTHER' ? 'Outro' : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {participant.exam.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={participant.exam.modalidade.name} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {participant.distance ? (
                              <Chip 
                                label={`${participant.distance.distance}${participant.distance.unit}`}
                                size="small"
                                icon={<DistanceIcon />}
                              />
                            ) : participant.category ? (
                              <Chip 
                                label={participant.category.name}
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
                            <Typography variant="body2">
                              {formatDate(participant.exam.date)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {participant.exam.location}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={participant.attended ? 'Confirmada' : 'Pendente'}
                              color={participant.attended ? 'success' : 'warning'}
                              size="small"
                              icon={participant.attended ? <CheckIcon /> : <CancelIcon />}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver detalhes">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedParticipant(participant);
                                  setIsDetailsModalOpen(true);
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {!participant.attended && (
                              <Tooltip title="Confirmar presença">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleConfirmAttendance(participant)}
                                  disabled={confirmingAttendance}
                                >
                                  <CheckIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  component="div"
                  count={total}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[10, 25, 50]}
                  labelRowsPerPage="Linhas por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </>
            )}
          </Paper>

          {/* Modal de Detalhes */}
          <Dialog 
            open={isDetailsModalOpen} 
            onClose={() => setIsDetailsModalOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Detalhes do Participante
            </DialogTitle>
            <DialogContent>
              {selectedParticipant && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Informações do Participante</Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Nome</Typography>
                        <Typography variant="body1" fontWeight="medium">{selectedParticipant.user.name}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1">{selectedParticipant.user.email}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Idade</Typography>
                        <Typography variant="body1">{selectedParticipant.user.age || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Gênero</Typography>
                        <Typography variant="body1">
                          {selectedParticipant.user.gender === 'MALE' ? 'Masculino' : 
                           selectedParticipant.user.gender === 'FEMALE' ? 'Feminino' : 
                           selectedParticipant.user.gender === 'OTHER' ? 'Outro' : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>Informações da Prova</Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Prova</Typography>
                        <Typography variant="body1" fontWeight="medium">{selectedParticipant.exam.name}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Modalidade</Typography>
                        <Chip label={selectedParticipant.exam.modalidade.name} size="small" />
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Distância/Categoria</Typography>
                        <Typography variant="body1">
                          {selectedParticipant.distance 
                            ? `${selectedParticipant.distance.distance}${selectedParticipant.distance.unit}`
                            : selectedParticipant.category 
                            ? selectedParticipant.category.name
                            : 'N/A'
                          }
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Data da Prova</Typography>
                        <Typography variant="body1">{formatDate(selectedParticipant.exam.date)}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Local</Typography>
                        <Typography variant="body1">{selectedParticipant.exam.location}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Status da Presença</Typography>
                        <Chip
                          label={selectedParticipant.attended ? 'Confirmada' : 'Pendente'}
                          color={selectedParticipant.attended ? 'success' : 'warning'}
                          icon={selectedParticipant.attended ? <CheckIcon /> : <CancelIcon />}
                        />
                      </Box>
                      {selectedParticipant.attendanceConfirmedAt && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">Data da Confirmação</Typography>
                          <Typography variant="body1">
                            {new Date(selectedParticipant.attendanceConfirmedAt).toLocaleDateString('pt-BR')}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsDetailsModalOpen(false)}>
                Fechar
              </Button>
              {selectedParticipant && !selectedParticipant.attended && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={() => handleConfirmAttendance(selectedParticipant)}
                  disabled={confirmingAttendance}
                >
                  {confirmingAttendance ? 'Confirmando...' : 'Confirmar Presença'}
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 