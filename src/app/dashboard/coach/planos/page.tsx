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
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { enduranceApi } from '../../../../services/enduranceApi';
import { Plan, PlanPeriod } from '../../../../types/api';

interface PlanPrice {
  id: string;
  period: string;
  price: string;
}

interface PlanWithPrices extends Omit<Plan, 'prices'> {
  prices: PlanPrice[];
}

interface LinkedPlan {
  id: string;
  plan: PlanWithPrices;
  linkedAt: string;
}

export default function CoachPlanosPage() {
  const auth = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [linkedPlans, setLinkedPlans] = useState<LinkedPlan[]>([]);
  const [availablePlans, setAvailablePlans] = useState<PlanWithPrices[]>([]);
  const [filteredAvailable, setFilteredAvailable] = useState<PlanWithPrices[]>([]);
  
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Verificar se é coach
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      router.push('/login');
      return;
    }

    if (auth.user.userType !== 'COACH') {
      // Redirecionar para dashboard específico baseado no tipo de usuário
      if (auth.user.userType === 'ADMIN') {
        router.push('/dashboard/admin');
      } else if (auth.user.userType === 'FITNESS_STUDENT') {
        router.push('/dashboard/aluno');
      } else {
        router.push('/login');
      }
      return;
    }

    loadPlans();
  }, [auth.isAuthenticated, auth.user, router]);

  // Filtrar planos disponíveis
  useEffect(() => {
    if (searchTerm) {
      setFilteredAvailable(
        availablePlans.filter(plan =>
          plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    } else {
      setFilteredAvailable(availablePlans);
    }
  }, [searchTerm, availablePlans]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [linked, available] = await Promise.all([
        enduranceApi.getCoachPlans(),
        enduranceApi.getCoachPlansAvailable()
      ]);
      
      setLinkedPlans(linked.plans || []);
      setAvailablePlans(available.plans || []);
      
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
      setError('Erro ao carregar planos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPlan = async (planId: string) => {
    try {
      setActionLoading(planId);
      await enduranceApi.linkCoachPlan(planId);
      
      // Atualizar listas
      const plan = availablePlans.find(p => p.id === planId);
      if (plan) {
        setLinkedPlans(prev => [...prev, {
          id: `new-${Date.now()}`,
          plan,
          linkedAt: new Date().toISOString()
        }]);
        setAvailablePlans(prev => prev.filter(p => p.id !== planId));
      }
      
      setAddPlanOpen(false);
    } catch (err) {
      console.error('Erro ao vincular plano:', err);
      setError('Erro ao vincular plano. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlinkPlan = async (planId: string) => {
    try {
      setActionLoading(planId);
      await enduranceApi.unlinkCoachPlan(planId);
      
      // Atualizar listas
      const linkedPlan = linkedPlans.find(p => p.plan.id === planId);
      if (linkedPlan) {
        setLinkedPlans(prev => prev.filter(p => p.plan.id !== planId));
        setAvailablePlans(prev => [...prev, linkedPlan.plan]);
      }
      
    } catch (err) {
      console.error('Erro ao desvincular plano:', err);
      setError('Erro ao desvincular plano. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numValue);
  };

  const getLowestPrice = (prices: PlanPrice[]) => {
    if (!prices || prices.length === 0) return 0;
    const lowestPrice = prices.reduce((min, price) => {
      const currentPrice = typeof price.price === 'string' ? parseFloat(price.price) : price.price;
      const minPrice = typeof min.price === 'string' ? parseFloat(min.price) : min.price;
      return currentPrice < minPrice ? price : min;
    });
    return typeof lowestPrice.price === 'string' ? parseFloat(lowestPrice.price) : lowestPrice.price;
  };

  const getPeriodLabel = (period: string) => {
    const periodMap: Record<string, string> = {
      'MONTHLY': 'Mensal',
      'QUARTERLY': 'Trimestral',
      'SEMIANNUALLY': 'Semestral',
      'YEARLY': 'Anual',
      'WEEKLY': 'Semanal',
      'BIWEEKLY': 'Quinzenal'
    };
    return periodMap[period] || period;
  };

  const handleLogout = () => {
    auth.logout();
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
              Meus Planos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gerencie os planos vinculados ao seu perfil de treinador
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
                    <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Vinculados</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {linkedPlans.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Planos ativos
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
                    {availablePlans.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Para vincular
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MoneyIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Valor Médio</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {linkedPlans.length > 0 ? formatCurrency(
                      (linkedPlans.reduce((sum, p) => {
                        const lowestPrice = getLowestPrice(p.plan.prices || []);
                        return sum + lowestPrice;
                      }, 0) / linkedPlans.length)
                    ) : 'R$ 0,00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dos planos vinculados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Planos Vinculados */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Planos Vinculados ({linkedPlans.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddPlanOpen(true)}
                disabled={availablePlans.length === 0}
              >
                Adicionar Plano
              </Button>
            </Box>

            {linkedPlans.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhum plano vinculado
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Vincule planos para oferecer serviços aos seus alunos
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddPlanOpen(true)}
                  disabled={availablePlans.length === 0}
                >
                  Adicionar Primeiro Plano
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {linkedPlans.map((linkedPlan) => (
                  <Grid item xs={12} md={6} key={linkedPlan.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                            <AssignmentIcon />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight="bold">
                              {linkedPlan.plan.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={linkedPlan.plan.isActive ? 'Ativo' : 'Inativo'}
                                color={linkedPlan.plan.isActive ? 'success' : 'default'}
                                size="small"
                              />
                              <Chip
                                label={`A partir de ${formatCurrency(getLowestPrice(linkedPlan.plan.prices || []))}`}
                                color="warning"
                                size="small"
                              />
                            </Box>
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {linkedPlan.plan.description}
                        </Typography>
                        
                        {linkedPlan.plan.prices && linkedPlan.plan.prices.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              Preços:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {linkedPlan.plan.prices.map((price) => (
                                <Chip
                                  key={price.id}
                                  label={`${getPeriodLabel(price.period)}: ${formatCurrency(price.price)}`}
                                  variant="outlined"
                                  size="small"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                        
                        {linkedPlan.plan.modalidades && linkedPlan.plan.modalidades.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              Modalidades:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {linkedPlan.plan.modalidades.map((modalidade) => (
                                <Chip
                                  key={modalidade.modalidade.id}
                                  label={modalidade.modalidade.name}
                                  variant="outlined"
                                  size="small"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Vinculado em: {new Date(linkedPlan.linkedAt).toLocaleDateString('pt-BR')}
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <CardActions>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<LinkOffIcon />}
                          onClick={() => handleUnlinkPlan(linkedPlan.plan.id)}
                          disabled={actionLoading === linkedPlan.plan.id}
                        >
                          {actionLoading === linkedPlan.plan.id ? (
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

          {/* Dialog para Adicionar Plano */}
          <Dialog 
            open={addPlanOpen} 
            onClose={() => setAddPlanOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AddIcon sx={{ mr: 1 }} />
                Adicionar Plano
              </Box>
            </DialogTitle>
            
            <DialogContent>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar planos..."
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
                    {searchTerm ? 'Nenhum plano encontrado' : 'Nenhum plano disponível'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ? 'Tente outro termo de busca' : 'Todos os planos já estão vinculados'}
                  </Typography>
                </Box>
              ) : (
                <List>
                  {filteredAvailable.map((plan, index) => (
                    <React.Fragment key={plan.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primaryTypographyProps={{ component: 'div' }}
                          secondaryTypographyProps={{ component: 'div' }}
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold" component="span">
                                {plan.name}
                              </Typography>
                              <Chip
                                label={plan.isActive ? 'Ativo' : 'Inativo'}
                                color={plan.isActive ? 'success' : 'default'}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                              <Chip
                                label={`A partir de ${formatCurrency(getLowestPrice(plan.prices || []))}`}
                                color="warning"
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box component="div">
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} component="div">
                                {plan.description}
                              </Typography>
                              
                              {plan.prices && plan.prices.length > 0 && (
                                <Box sx={{ mb: 1 }} component="div">
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }} component="div">
                                    Preços:
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }} component="div">
                                    {plan.prices.map((price) => (
                                      <Chip
                                        key={price.id}
                                        label={`${getPeriodLabel(price.period)}: ${formatCurrency(price.price)}`}
                                        variant="outlined"
                                        size="small"
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                              
                              {plan.modalidades && plan.modalidades.length > 0 && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }} component="div">
                                  {plan.modalidades.map((modalidade) => (
                                    <Chip
                                      key={modalidade.modalidade.id}
                                      label={modalidade.modalidade.name}
                                      variant="outlined"
                                      size="small"
                                    />
                                  ))}
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            color="primary"
                            onClick={() => handleLinkPlan(plan.id)}
                            disabled={actionLoading === plan.id}
                          >
                            {actionLoading === plan.id ? (
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
              <Button onClick={() => setAddPlanOpen(false)}>
                Fechar
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 