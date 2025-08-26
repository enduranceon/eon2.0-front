import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ConsentTerm } from '../types/api';

interface ConsentTermModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  consentTerm: ConsentTerm | null;
  loading: boolean;
  error?: string;
}

export default function ConsentTermModal({
  open,
  onClose,
  onAccept,
  consentTerm,
  loading,
  error,
}: ConsentTermModalProps) {
  const [accepted, setAccepted] = React.useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAccepted(false);
      onClose();
    }
  };

  if (!consentTerm) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" gutterBottom>
          {consentTerm.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Versão {consentTerm.version} - {new Date(consentTerm.updatedAt).toLocaleDateString('pt-BR')}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            maxHeight: '50vh',
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            backgroundColor: 'background.paper',
          }}
        >
                     <Typography
             variant="body1"
             component="div"
             sx={{
               whiteSpace: 'pre-wrap',
               lineHeight: 1.6,
               fontFamily: 'monospace',
               fontSize: '0.875rem',
             }}
           >
             {consentTerm.content}
           </Typography>
        </Box>

        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                disabled={loading}
              />
            }
            label={
              <Typography variant="body2">
                Li e aceito o Termo de Consentimento LGPD acima
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleAccept}
          disabled={!accepted || loading}
          variant="contained"
          sx={{ minWidth: 120 }}
        >
          {loading ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Processando...
            </>
          ) : (
            'Aceitar e Continuar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
