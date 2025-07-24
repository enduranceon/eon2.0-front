import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Alert,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  CalendarToday as CalendarIcon,
  DirectionsRun as RunIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { enduranceApi } from '@/services/enduranceApi';
import toast from 'react-hot-toast';

interface LeaveStatusCardProps {
  subscription: any;
  onUpdate: () => void;
}

export default function LeaveStatusCard({ subscription, onUpdate }: LeaveStatusCardProps) {
  // Verificar se está em licença
  if (subscription.status !== 'ON_LEAVE' || !subscription.leaveEndDate) {
    return null;
  }

  const daysRemaining = (() => {
    try {
      const endDate = new Date(subscription.leaveEndDate);
      if (isNaN(endDate.getTime())) return 0;
      return Math.max(0, differenceInDays(endDate, new Date()));
    } catch (error) {
      console.error('Erro ao calcular dias restantes:', error);
      return 0;
    }
  })();

  const handleCancelLeave = async () => {
    try {
      await enduranceApi.cancelLeave();
      toast.success('Licença cancelada com sucesso!');
      onUpdate();
    } catch (error) {
      console.error('Erro ao cancelar licença:', error);
      toast.error('Erro ao cancelar licença.');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const getProgressColor = () => {
    if (daysRemaining === 0) return 'error';
    if (daysRemaining <= 3) return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    if (daysRemaining === 0) return 'Expirada';
    if (daysRemaining <= 3) return 'Expira em breve';
    return 'Ativa';
  };

  return (
    <Card sx={{ mb: 3, border: '2px solid', borderColor: getProgressColor() }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PauseIcon sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Licença Temporária Ativa
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Sua assinatura está temporariamente pausada. Após a data de fim, ela será reativada automaticamente.
          </Typography>
        </Alert>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Data de Início
            </Typography>
            <Typography variant="body1">
              {formatDate(subscription.leaveStartDate)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Data de Fim
            </Typography>
            <Typography variant="body1">
              {formatDate(subscription.leaveEndDate)}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Dias Restantes
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 'bold',
                color: daysRemaining === 0 ? 'error.main' : 
                       daysRemaining <= 3 ? 'warning.main' : 'success.main'
              }}
            >
              {daysRemaining === 0 ? 'Expirada' : `${daysRemaining} dias`}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={getStatusText()}
              color={getProgressColor() as any}
              size="small"
              icon={daysRemaining === 0 ? <WarningIcon /> : 
                    daysRemaining <= 3 ? <WarningIcon /> : <CheckCircleIcon />}
            />
          </Grid>

          {subscription.leaveReason && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Motivo
              </Typography>
              <Typography variant="body1">
                {subscription.leaveReason}
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Configurações */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Configurações da Licença
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`Treinos ${subscription.pauseTraining ? 'Pausados' : 'Ativos'}`}
              color={subscription.pauseTraining ? 'warning' : 'success'}
              size="small"
              icon={<RunIcon />}
            />
            <Chip
              label={`Cobrança ${subscription.pauseBilling ? 'Pausada' : 'Ativa'}`}
              color={subscription.pauseBilling ? 'warning' : 'success'}
              size="small"
              icon={<PaymentIcon />}
            />
          </Box>
        </Box>

        {/* Progresso */}
        {daysRemaining > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Progresso da Licença
            </Typography>
            <LinearProgress
              variant="determinate"
              value={((subscription.leaveDays - daysRemaining) / subscription.leaveDays) * 100}
              color={getProgressColor() as any}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {/* Ações */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<PlayArrowIcon />}
            onClick={handleCancelLeave}
            disabled={daysRemaining === 0}
            size="small"
          >
            Cancelar Licença
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
} 