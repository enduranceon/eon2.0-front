'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Button,
  Stack,
  Divider,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AssignmentTurnedIn as PlanIcon,
  EventRepeat as PeriodIcon,
  Today as DateIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  SwapHoriz as SwapIcon,
  Pause as PauseIcon,
  Cancel as CancelIcon,
  Person as CoachIcon,
  DirectionsRun as ModalidadeIcon,
  AttachMoney as MoneyIcon,
  Star as FeatureIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  CreditCard as PaymentIcon,
} from '@mui/icons-material';
import { Subscription, PlanPeriod, PlanFeature } from '@/types/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import ChangePlanModal from '../ChangePlanModal';
import PauseSubscriptionModal from '../PauseSubscriptionModal';
import CancelSubscriptionModal from '../CancelSubscriptionModal';

const periodMapping: { [key in PlanPeriod]?: string } = {
    [PlanPeriod.WEEKLY]: 'Semanal',
    [PlanPeriod.BIWEEKLY]: 'Quinzenal',
    [PlanPeriod.MONTHLY]: 'Mensal',
    [PlanPeriod.QUARTERLY]: 'Trimestral',
    [PlanPeriod.SEMIANNUALLY]: 'Semestral',
    [PlanPeriod.YEARLY]: 'Anual'
};

interface PlanDetailsCardProps {
  subscription: Subscription | null;
  onSubscriptionUpdate?: () => void;
}

const PlanDetailsCard: React.FC<PlanDetailsCardProps> = ({ 
  subscription, 
  onSubscriptionUpdate 
}) => {
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<PlanFeature[]>([]);

  // Usar features do plano diretamente da subscription
  useEffect(() => {
    if (subscription?.plan?.features) {
      setPlanFeatures(subscription.plan.features);
    } else {
      setPlanFeatures([]);
    }
  }, [subscription?.plan?.features]);

  const handleSuccessAction = (message: string) => {
    toast.success(message);
    if (onSubscriptionUpdate) {
      onSubscriptionUpdate();
    }
  };

  const isActiveSubscription = subscription?.status === 'ACTIVE';

  const formatCurrency = (value: number) => {
    if (isNaN(value) || value === null || value === undefined) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getCurrentPlanPrice = () => {
    if (!subscription?.plan?.prices) return 0;
    
    const currentPrice = subscription.plan.prices.find(price => price.period === subscription.period);
    return currentPrice ? currentPrice.price : subscription.amount || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warning';
      case 'CANCELLED': return 'error';
      case 'EXPIRED': return 'error';
      case 'ON_LEAVE': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativa';
      case 'INACTIVE': return 'Inativa';
      case 'CANCELLED': return 'Cancelada';
      case 'EXPIRED': return 'Expirada';
      case 'ON_LEAVE': return 'Em Licença';
      default: return status;
    }
  };

  if (!subscription) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <PlanIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Nenhum plano ativo
          </Typography>
          <Typography color="text.secondary">
            Você ainda não possui uma assinatura ativa.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Card Principal do Plano */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <PlanIcon color="primary" sx={{ fontSize: 40 }}/>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="div">
                {subscription.plan.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {subscription.plan.description}
              </Typography>
              <Chip
                label={getStatusLabel(subscription.status)}
                color={getStatusColor(subscription.status) as any}
                size="small"
                icon={subscription.status === 'ACTIVE' ? <ActiveIcon fontSize="small" /> : <InactiveIcon fontSize="small" />}
              />
            </Box>
          </Box>

          {!isActiveSubscription && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Assinatura inativa. Algumas funcionalidades podem estar limitadas.
            </Alert>
          )}

          {/* Informações Básicas */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PeriodIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Periodicidade
                  </Typography>
                  <Typography variant="h6">
                    {periodMapping[subscription.period]}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <MoneyIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Valor
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(getCurrentPlanPrice())}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <DateIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Início da Assinatura
                  </Typography>
                  <Typography variant="h6">
                    {format(new Date(subscription.startDate), 'dd/MM/yyyy')}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <ScheduleIcon color="action" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Próximo Vencimento
                  </Typography>
                  <Typography variant="h6">
                    {subscription.nextPaymentDate ? format(new Date(subscription.nextPaymentDate), 'dd/MM/yyyy') : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Ações de Gerenciamento */}
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Gerenciar Assinatura
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<SwapIcon />}
              onClick={() => setChangePlanOpen(true)}
              disabled={!isActiveSubscription}
            >
              Alterar Plano
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              color="secondary"
              startIcon={<PauseIcon />}
              onClick={() => setPauseModalOpen(true)}
              disabled={!isActiveSubscription}
            >
              Pausar Assinatura
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setCancelModalOpen(true)}
              disabled={!isActiveSubscription}
            >
              Cancelar Assinatura
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Detalhes Expandidos */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Detalhes Completos do Plano</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {/* Modalidades */}
            <Grid item xs={12} md={6}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ModalidadeIcon color="primary" />
                  Modalidades Incluídas
                </Typography>
                <List dense>
                  {subscription.plan.modalidades.map((mod, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ModalidadeIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={mod.modalidade.name}
                        secondary={mod.modalidade.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>

            {/* Treinador */}
            {subscription.coach && (
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CoachIcon color="primary" />
                    Seu Treinador
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle1">
                        {subscription.coach.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {subscription.coach.email}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Features do Plano */}
            {((Array.isArray(planFeatures) && planFeatures.length > 0) || subscription.plan.features?.length > 0) && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FeatureIcon color="primary" />
                    Features Incluídas
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Array.isArray(planFeatures) && planFeatures.map((planFeature) => {
                      if (!planFeature || !planFeature.feature) return null;
                      
                      return (
                        <Chip
                          key={planFeature.id}
                          label={planFeature.feature.name || 'Feature sem nome'}
                          color="primary"
                          variant="outlined"
                          size="small"
                          title={planFeature.feature.description}
                        />
                      );
                    })}
                  </Box>
                </Paper>
              </Grid>
            )}

            {/* Preços do Plano */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PaymentIcon color="primary" />
                  Estrutura de Preços
                </Typography>
                <Grid container spacing={2}>
                  {subscription.plan.prices.map((price, index) => (
                    <Grid item xs={6} sm={4} md={2} key={index}>
                      <Box sx={{ textAlign: 'center', p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {periodMapping[price.period]}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(price.price)}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Taxa de matrícula: {formatCurrency(subscription.plan.enrollmentFee)}
                </Typography>
              </Paper>
            </Grid>

            {/* Informações Técnicas */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Informações Técnicas
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Criado em
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(subscription.createdAt), 'dd/MM/yyyy HH:mm')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Última atualização
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(subscription.updatedAt), 'dd/MM/yyyy HH:mm')}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Modais */}
      <ChangePlanModal
        open={changePlanOpen}
        onClose={() => setChangePlanOpen(false)}
        currentPlan={subscription.plan}
        currentSubscription={subscription}
        onPlanChanged={() => handleSuccessAction('Plano alterado com sucesso!')}
      />
      
      <PauseSubscriptionModal
        open={pauseModalOpen}
        onClose={() => setPauseModalOpen(false)}
        onSuccess={() => handleSuccessAction('Solicitação de pausa enviada com sucesso!')}
      />
      
      <CancelSubscriptionModal
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onSuccess={() => handleSuccessAction('Solicitação de cancelamento enviada com sucesso!')}
      />
    </Box>
  );
};

export default PlanDetailsCard;
