'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  DirectionsRun as RunIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { enduranceApi } from '../../../../services/enduranceApi';

interface Modalidade {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface LinkedModalidade {
  id: string;
  modalidade: Modalidade;
  linkedAt: string;
}

export default function CoachModalidadesPage() {
  const auth = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [linkedModalidades, setLinkedModalidades] = useState<LinkedModalidade[]>([]);
  const [availableModalidades, setAvailableModalidades] = useState<Modalidade[]>([]);
  const [filteredAvailable, setFilteredAvailable] = useState<Modalidade[]>([]);
  
  const [addModalidadeOpen, setAddModalidadeOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Verificar se é coach
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      router.push('/login');
      return;
    }

    if (auth.user.userType !== 'COACH') {
      router.push('/dashboard');
      return;
    }

    loadModalidades();
  }, [auth.isAuthenticated, auth.user, router]);

  // Filtrar modalidades disponíveis
  useEffect(() => {
    if (searchTerm) {
      setFilteredAvailable(
        availableModalidades.filter(modalidade =>
          modalidade.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          modalidade.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredAvailable(availableModalidades);
    }
  }, [searchTerm, availableModalidades]);

  const loadModalidades = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [linked, available] = await Promise.all([
        enduranceApi.getCoachModalidades(),
        enduranceApi.getCoachModalidadesAvailable()
      ]);
      
      setLinkedModalidades(linked.modalidades || []);
      setAvailableModalidades(available.modalidades || []);
      
    } catch (err) {
      console.error('Erro ao carregar modalidades:', err);
      setError('Erro ao carregar modalidades. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkModalidade = async (modalidadeId: string) => {
    try {
      setActionLoading(modalidadeId);
      await enduranceApi.linkCoachModalidade(modalidadeId);
      
      // Atualizar listas
      const modalidade = availableModalidades.find(m => m.id === modalidadeId);
      if (modalidade) {
        setLinkedModalidades(prev => [...prev, {
          id: `new-${Date.now()}`,
          modalidade,
          linkedAt: new Date().toISOString()
        }]);
        setAvailableModalidades(prev => prev.filter(m => m.id !== modalidadeId));
      }
      
      setAddModalidadeOpen(false);
    } catch (err) {
      console.error('Erro ao vincular modalidade:', err);
      setError('Erro ao vincular modalidade. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlinkModalidade = async (modalidadeId: string) => {
    try {
      setActionLoading(modalidadeId);
      await enduranceApi.unlinkCoachModalidade(modalidadeId);
      
      // Atualizar listas
      const linkedModalidade = linkedModalidades.find(m => m.modalidade.id === modalidadeId);
      if (linkedModalidade) {
        setLinkedModalidades(prev => prev.filter(m => m.modalidade.id !== modalidadeId));
        setAvailableModalidades(prev => [...prev, linkedModalidade.modalidade]);
      }
      
    } catch (err) {
      console.error('Erro ao desvincular modalidade:', err);
      setError('Erro ao desvincular modalidade. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={['COACH']}>
        <DashboardLayout user={auth.user} onLogout={handleLogout}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <CircularProgress size={60} />
            </Box>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['COACH']}>
      <DashboardLayout user={auth.user} onLogout={handleLogout}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Minhas Modalidades
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gerencie as modalidades vinculadas ao seu perfil de treinador
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <RunIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Vinculadas</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {linkedModalidades.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Modalidades ativas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AddIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Disponíveis</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {availableModalidades.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Para vincular
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Modalidades Vinculadas */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Modalidades Vinculadas ({linkedModalidades.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddModalidadeOpen(true)}
                disabled={availableModalidades.length === 0}
              >
                Adicionar Modalidade
              </Button>
            </Box>

            {linkedModalidades.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <RunIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhuma modalidade vinculada
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Vincule modalidades para oferecer treinamento especializado
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddModalidadeOpen(true)}
                  disabled={availableModalidades.length === 0}
                >
                  Adicionar Primeira Modalidade
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {linkedModalidades.map((linkedModalidade) => (
                  <Grid item xs={12} md={6} key={linkedModalidade.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <RunIcon />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight="bold">
                              {linkedModalidade.modalidade.name}
                            </Typography>
                            <Chip
                              label={linkedModalidade.modalidade.isActive ? 'Ativa' : 'Inativa'}
                              color={linkedModalidade.modalidade.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {linkedModalidade.modalidade.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Vinculada em: {new Date(linkedModalidade.linkedAt).toLocaleDateString('pt-BR')}
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <CardActions>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<LinkOffIcon />}
                          onClick={() => handleUnlinkModalidade(linkedModalidade.modalidade.id)}
                          disabled={actionLoading === linkedModalidade.modalidade.id}
                        >
                          {actionLoading === linkedModalidade.modalidade.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            'Desvincular'
                          )}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>

          {/* Dialog para Adicionar Modalidade */}
          <Dialog 
            open={addModalidadeOpen} 
            onClose={() => setAddModalidadeOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AddIcon sx={{ mr: 1 }} />
                Adicionar Modalidade
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar modalidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              {filteredAvailable.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    {searchTerm ? 'Nenhuma modalidade encontrada' : 'Nenhuma modalidade disponível'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ? 'Tente outro termo de busca' : 'Todas as modalidades já estão vinculadas'}
                  </Typography>
                </Box>
              ) : (
                <List>
                  {filteredAvailable.map((modalidade, index) => (
                    <React.Fragment key={modalidade.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {modalidade.name}
                              </Typography>
                              <Chip
                                label={modalidade.isActive ? 'Ativa' : 'Inativa'}
                                color={modalidade.isActive ? 'success' : 'default'}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {modalidade.description}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            color="primary"
                            onClick={() => handleLinkModalidade(modalidade.id)}
                            disabled={actionLoading === modalidade.id}
                          >
                            {actionLoading === modalidade.id ? (
                              <CircularProgress size={24} />
                            ) : (
                              <LinkIcon />
                            )}
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < filteredAvailable.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setAddModalidadeOpen(false)}>
                Fechar
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 