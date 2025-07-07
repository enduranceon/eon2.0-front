import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import {
  AssignmentTurnedIn as PlanIcon,
  EventRepeat as PeriodIcon,
  Today as DateIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { Subscription, PlanPeriod } from '@/types/api';
import { format } from 'date-fns';

const periodMapping: { [key in PlanPeriod]?: string } = {
    [PlanPeriod.MONTHLY]: 'Mensal',
    [PlanPeriod.QUARTERLY]: 'Trimestral',
    [PlanPeriod.SEMIANNUAL]: 'Semestral',
    [PlanPeriod.YEARLY]: 'Anual',
};

interface SubscriptionCardProps {
  subscription: Subscription | null;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" component="div" sx={{ mb: 3 }}>
          Assinatura Ativa
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

            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Gerenciar Assinatura
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button variant="outlined" size="small">
                Alterar Plano
              </Button>
              <Button variant="outlined" size="small" color="secondary">
                Pausar Assinatura
              </Button>
              <Button variant="outlined" size="small" color="error">
                Cancelar Assinatura
              </Button>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard; 