'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { subscriptionService } from '../../services/subscriptionService';

interface CancelSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Por favor, informe o motivo do cancelamento.');
      return;
    }

    if (reason.trim().length < 10) {
      setError('O motivo deve ter pelo menos 10 caracteres.');
      return;
    }

    if (!confirmed) {
      setError('Você deve confirmar que entende as consequências do cancelamento.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await subscriptionService.requestCancel({ reason: reason.trim() });
      
      toast.success('Solicitação de cancelamento enviada com sucesso!');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Erro ao solicitar cancelamento:', error);
      setError('Erro ao enviar solicitação. Tente novamente.');
      toast.error('Erro ao solicitar cancelamento');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    setConfirmed(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Solicitar Cancelamento de Assinatura
          </Typography>
          <Button onClick={handleClose} sx={{ minWidth: 'auto', p: 1 }}>
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Aviso importante */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ErrorIcon sx={{ mr: 1 }} />
              ATENÇÃO: Cancelamento Permanente
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <CancelIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Cancelamento definitivo"
                  secondary="O cancelamento é permanente e não pode ser revertido"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <ScheduleIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Análise necessária"
                  secondary="Sua solicitação será analisada por um administrador"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Notificação por email"
                  secondary="Você será notificado sobre a decisão"
                />
              </ListItem>
            </List>
          </Paper>

          {/* Alternativa à pausa */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1 }} />
              Considere uma pausa temporária
            </Typography>
            <Typography variant="body2">
              Se você está passando por dificuldades temporárias, considere solicitar uma pausa ao invés 
              de cancelar definitivamente. A pausa permite que você mantenha sua assinatura suspensa 
              temporariamente e a reative quando estiver pronto.
            </Typography>
          </Paper>

          {/* Formulário */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Motivo do cancelamento *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique o motivo do cancelamento da sua assinatura. Ex: Mudança de cidade, não conseguirei continuar com os treinos."
              required
              variant="outlined"
              inputProps={{ maxLength: 500 }}
              helperText={`${reason.length}/500 caracteres`}
            />
          </Box>

          {/* Exemplos de motivos */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1, fontSize: 18 }} />
              Exemplos de motivos válidos:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="• Mudança de cidade/país"
                  secondary="Impossibilidade de continuar com os treinos"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="• Insatisfação com o serviço"
                  secondary="Serviço não atende às expectativas"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="• Mudança de objetivos"
                  secondary="Objetivos pessoais mudaram"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="• Questões financeiras permanentes"
                  secondary="Situação financeira não permite continuar"
                />
              </ListItem>
            </List>
          </Paper>

          {/* Confirmação */}
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                color="error"
              />
            }
            label={
              <Typography variant="body2">
                Eu entendo que o cancelamento é permanente e não poderá ser revertido. 
                Para usar os serviços novamente, será necessário criar uma nova assinatura.
              </Typography>
            }
          />
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar Solicitação
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={loading || !reason.trim() || !confirmed}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Enviando...' : 'Confirmar Cancelamento'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CancelSubscriptionModal; 