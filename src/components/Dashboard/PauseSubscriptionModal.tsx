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
  Divider,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { subscriptionService } from '../../services/subscriptionService';

interface PauseSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PauseSubscriptionModal: React.FC<PauseSubscriptionModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Por favor, informe o motivo da pausa.');
      return;
    }

    if (reason.trim().length < 10) {
      setError('O motivo deve ter pelo menos 10 caracteres.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await subscriptionService.requestPause({ reason: reason.trim() });
      
      toast.success('Solicitação de pausa enviada com sucesso!');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Erro ao solicitar pausa:', error);
      setError('Erro ao enviar solicitação. Tente novamente.');
      toast.error('Erro ao solicitar pausa');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Solicitar Pausa de Assinatura
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

          {/* Informações sobre a pausa */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <WarningIcon sx={{ mr: 1 }} />
              Importante sobre a pausa
            </Typography>
            <List dense>
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
              <ListItem>
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <CheckIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Suspensão temporária"
                  secondary="Se aprovada, sua assinatura será suspensa temporariamente"
                />
              </ListItem>
            </List>
          </Paper>

          {/* Formulário */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Motivo da solicitação de pausa *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explique o motivo da solicitação de pausa da sua assinatura. Ex: Lesão no joelho, necessito de repouso por 2 meses conforme orientação médica."
              required
              variant="outlined"
              inputProps={{ maxLength: 500 }}
              helperText={`${reason.length}/500 caracteres`}
            />
          </Box>

          {/* Exemplos de motivos */}
          <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon sx={{ mr: 1, fontSize: 18 }} />
              Exemplos de motivos válidos:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="• Lesão ou problema de saúde"
                  secondary="Requer repouso temporário"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="• Viagem prolongada"
                  secondary="Impossibilidade de treinar por período determinado"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="• Questões financeiras temporárias"
                  secondary="Dificuldade financeira passageira"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="• Compromissos pessoais/profissionais"
                  secondary="Indisponibilidade temporária para treinos"
                />
              </ListItem>
            </List>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !reason.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {loading ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PauseSubscriptionModal; 