import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { Subscription, PlanPeriod } from '@/types/api';
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

interface SubscriptionCardProps {
  subscription: Subscription | null;
  onSubscriptionUpdate?: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ 
  subscription, 
  onSubscriptionUpdate 
}) => {
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const handleSuccessAction = (message: string) => {
    toast.success(message);
    if (onSubscriptionUpdate) {
      onSubscriptionUpdate();
    }
  };

  const isActiveSubscription = subscription?.status === 'ACTIVE';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" component="div" sx={{ mb: 3 }}>
          {subscription ? 'Assinatura Ativa' : 'Nenhuma Assinatura'}
        </Typography>
        
        {!subscription ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">Nenhum plano ativo</Typography>
            <Typography color="text.secondary">
              Você ainda não possui uma assinatura.
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <PlanIcon color="primary" sx={{ fontSize: 40 }}/>
              <Box>
                <Typography variant="h6" component="div">
                  {subscription.plan.name}
                </Typography>
                <Chip
                  label={subscription.status}
                  color={subscription.status === 'ACTIVE' ? 'success' : 'warning'}
                  size="small"
                  icon={subscription.status === 'ACTIVE' ? <ActiveIcon fontSize="small" /> : <InactiveIcon fontSize="small" />}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, pl: 1 }}>
              <PeriodIcon color="action" />
              <Typography>
                Periodicidade: <strong>{periodMapping[subscription.period]}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 1 }}>
              <DateIcon color="action" />
              <Typography>
                Próximo Vencimento: <strong>{subscription.nextPaymentDate ? format(new Date(subscription.nextPaymentDate), 'dd/MM/yyyy') : 'N/A'}</strong>
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {!isActiveSubscription && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Assinatura inativa. Algumas funcionalidades podem estar limitadas.
              </Alert>
            )}

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
          </Box>
        )}
      </CardContent>

      {/* Modais */}
      {subscription && (
        <>
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
        </>
      )}
    </Card>
  );
};

export default SubscriptionCard; 