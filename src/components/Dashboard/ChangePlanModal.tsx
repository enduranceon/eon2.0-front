'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { subscriptionService, PlanQuote } from '../../services/subscriptionService';
import { Plan, PlanPeriod } from '../../types/api';

interface ChangePlanModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan: Plan;
  currentSubscription: any;
  onPlanChanged: () => void;
}

const ChangePlanModal: React.FC<ChangePlanModalProps> = ({
  open,
  onClose,
  currentPlan,
  currentSubscription,
  onPlanChanged,
}) => {
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [quote, setQuote] = useState<PlanQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [quotingPlan, setQuotingPlan] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planPeriodSelections, setPlanPeriodSelections] = useState<Record<string, PlanPeriod>>({});

  useEffect(() => {
    if (open && currentPlan) {
      loadAvailablePlans();
    }
  }, [open, currentPlan]);

  const loadAvailablePlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const plans = await subscriptionService.getAvailablePlans();
      
      // Verificar se recebemos um array válido
      if (!Array.isArray(plans)) {
        console.error('Resposta da API não é um array:', plans);
        setError('Erro ao carregar planos disponíveis');
        return;
      }
      
      // Filtrar planos diferentes do atual
      const filteredPlans = currentPlan ? plans.filter((plan: any) => plan.id !== currentPlan.id) : plans;
      setAvailablePlans(filteredPlans);
      const defaultPeriod = (currentSubscription?.period as PlanPeriod) || PlanPeriod.MONTHLY;
      const initialSelections: Record<string, PlanPeriod> = {};
      filteredPlans.forEach((plan: any) => {
        const hasDefault = Array.isArray(plan.prices) && plan.prices.some((p: any) => p.period === defaultPeriod && p.isActive !== false);
        if (hasDefault) {
          initialSelections[plan.id] = defaultPeriod;
        } else {
          const firstActive = Array.isArray(plan.prices) ? plan.prices.find((p: any) => p.isActive !== false) : null;
          initialSelections[plan.id] = (firstActive?.period as PlanPeriod) || PlanPeriod.MONTHLY;
        }
      });
      setPlanPeriodSelections(initialSelections);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      setError('Erro ao carregar planos disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const getQuote = async (plan: Plan, periodOverride?: PlanPeriod) => {
    try {
      setQuotingPlan(plan.id);
      setError(null);
      const selectedPeriod = periodOverride || planPeriodSelections[plan.id] || (currentSubscription?.period as PlanPeriod) || PlanPeriod.MONTHLY;
      const quoteData = await subscriptionService.getPlanQuote(plan.id, selectedPeriod);
      setQuote(quoteData);
      setSelectedPlan(plan);
    } catch (error) {
      console.error('Erro ao obter cotação:', error);
      setError('Erro ao calcular cotação do plano');
      toast.error('Erro ao calcular cotação do plano');
    } finally {
      setQuotingPlan(null);
    }
  };

  const confirmChange = async () => {
    if (!selectedPlan) return;

    try {
      setConfirming(true);
      setError(null);

      await subscriptionService.changePlanAdvanced({
        newPlanId: selectedPlan.id,
        confirmChange: true,
      });

      toast.success('Plano alterado com sucesso!');
      onPlanChanged();
      handleClose();
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      setError('Erro ao alterar plano. Tente novamente.');
      toast.error('Erro ao alterar plano');
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    setSelectedPlan(null);
    setQuote(null);
    setError(null);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getPlanPrice = (plan: Plan, period: string = 'MONTHLY') => {
    if (!plan || !plan.prices || !Array.isArray(plan.prices)) {
      return 0;
    }
    const price = plan.prices.find(p => p.period === period);
    return price ? price.price : 0;
  };

  const getCurrentPlanPrice = () => {
    if (!currentPlan) {
      return 0;
    }
    return getPlanPrice(currentPlan, currentSubscription?.period || 'MONTHLY');
  };

  const getPlanTypeColor = (plan: Plan) => {
    const planPrice = getPlanPrice(plan, currentSubscription?.period || 'MONTHLY');
    const currentPrice = getCurrentPlanPrice();
    if (planPrice > currentPrice) return 'success'; // Upgrade
    if (planPrice < currentPrice) return 'warning'; // Downgrade
    return 'default';
  };

  const getPlanTypeLabel = (plan: Plan) => {
    const planPrice = getPlanPrice(plan, currentSubscription?.period || 'MONTHLY');
    const currentPrice = getCurrentPlanPrice();
    if (planPrice > currentPrice) return 'Upgrade';
    if (planPrice < currentPrice) return 'Downgrade';
    return 'Mesmo valor';
  };

  const periodMapping: { [key in PlanPeriod]?: string } = {
    [PlanPeriod.WEEKLY]: 'Semanal',
    [PlanPeriod.BIWEEKLY]: 'Quinzenal',
    [PlanPeriod.MONTHLY]: 'Mensal',
    [PlanPeriod.QUARTERLY]: 'Trimestral',
    [PlanPeriod.SEMIANNUALLY]: 'Semestral',
    [PlanPeriod.YEARLY]: 'Anual'
  };

  // Não renderizar se não houver plano atual
  if (!currentPlan) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Alterar Plano
          </Typography>
          <Button onClick={handleClose} sx={{ minWidth: 'auto', p: 1 }}>
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Plano Atual */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
          <Typography variant="subtitle1" gutterBottom>
            Plano Atual
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">{currentPlan.name}</Typography>
            <Chip label={formatCurrency(getCurrentPlanPrice())} color="primary" />
            <Chip 
              label={`Periodicidade: ${periodMapping[currentSubscription?.period as PlanPeriod] || 'Mensal'}`} 
              size="small" 
              color="default" 
              sx={{ ml: 1 }} 
            />
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Planos Disponíveis */}
            <Typography variant="h6" gutterBottom>
              Planos Disponíveis
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {availablePlans.map((plan) => (
                <Grid item xs={12} sm={6} key={plan.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedPlan?.id === plan.id ? 2 : 1,
                      borderColor: selectedPlan?.id === plan.id ? 'primary.main' : 'divider',
                      '&:hover': {
                        boxShadow: 3,
                      },
                    }}
                    onClick={() => getQuote(plan)}
                  >
                    <CardContent>
                      {(() => {
                        const selectedPeriod = planPeriodSelections[plan.id] || (currentSubscription?.period as PlanPeriod) || PlanPeriod.MONTHLY;
                        return (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                              <Typography variant="h6">{plan.name}</Typography>
                              <Chip 
                                label={getPlanTypeLabel(plan, selectedPeriod)}
                                color={getPlanTypeColor(plan, selectedPeriod)}
                                size="small"
                              />
                            </Box>
                            <Typography variant="h5" color="primary" gutterBottom>
                              {formatCurrency(getPlanPrice(plan, selectedPeriod))}
                            </Typography>
                            <FormControl fullWidth size="small" sx={{ mt: 1 }} onClick={(e) => e.stopPropagation()}>
                              <InputLabel>Periodicidade</InputLabel>
                              <Select
                                label="Periodicidade"
                                value={selectedPeriod}
                                onChange={(e) => {
                                  const value = e.target.value as PlanPeriod;
                                  setPlanPeriodSelections(prev => ({ ...prev, [plan.id]: value }));
                                  // Atualiza a cotação ao trocar a periodicidade
                                  getQuote(plan, value);
                                }}
                              >
                                {(plan.prices || []).filter((p: any) => p.isActive !== false).map((p: any) => (
                                  <MenuItem key={p.period} value={p.period}>
                                    {periodMapping[p.period as PlanPeriod] || p.period} - {formatCurrency(Number(p.price))}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {plan.description}
                            </Typography>
                            {quotingPlan === plan.id && (
                              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <CircularProgress size={24} />
                              </Box>
                            )}
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Cotação */}
            {quote && selectedPlan && (
              <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <InfoIcon sx={{ mr: 1 }} />
                  Detalhes da Alteração
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ color: 'inherit' }}>
                          <MoneyIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Plano atual"
                          secondary={formatCurrency(quote.currentPlanValue)}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ color: 'inherit' }}>
                          <TrendingUpIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Novo plano"
                          secondary={formatCurrency(quote.newPlanValue)}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ color: 'inherit' }}>
                          <CalendarIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Dias utilizados"
                          secondary={`${quote.daysUsed} de ${quote.totalDays} dias`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon sx={{ color: 'inherit' }}>
                          <CheckIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Saldo restante"
                          secondary={formatCurrency(quote.remainingBalance)}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    {quote.description}
                  </Typography>
                  {quote.amountToPay > 0 && (
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(quote.amountToPay)}
                    </Typography>
                  )}
                  {quote.amountToPay === 0 && (
                    <Typography variant="h6" sx={{ color: 'success.main' }}>
                      Sem cobrança adicional
                    </Typography>
                  )}
                </Box>
              </Paper>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={confirming}>
          Cancelar
        </Button>
        <Button
          onClick={confirmChange}
          variant="contained"
          disabled={!selectedPlan || confirming}
          startIcon={confirming ? <CircularProgress size={16} /> : null}
        >
          {confirming ? 'Processando...' : 'Confirmar Alteração'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePlanModal; 