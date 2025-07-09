import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Modalidade } from '../../../types/api';

const modalitySchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
});

type ModalityFormData = z.infer<typeof modalitySchema>;

interface ModalityFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ModalityFormData) => Promise<void>;
  modality?: Modalidade | null;
  loading: boolean;
  error: string | null;
}

export default function ModalityForm({
  open,
  onClose,
  onSubmit,
  modality,
  loading,
  error,
}: ModalityFormProps) {
  const isEditMode = !!modality;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ModalityFormData>({
    resolver: zodResolver(modalitySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      if (isEditMode && modality) {
        reset({
          name: modality.name,
          description: modality.description || '',
        });
      } else {
        reset({
          name: '',
          description: '',
        });
      }
    }
  }, [open, modality, isEditMode, reset]);
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Modalidade' : 'Nova Modalidade'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller name="name" control={control} render={({ field }) => ( 
                <TextField {...field} label="Nome da Modalidade" fullWidth required error={!!errors.name} helperText={errors.name?.message} /> 
              )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller name="description" control={control} render={({ field }) => ( 
                <TextField {...field} label="Descrição" multiline rows={4} fullWidth /> 
              )}/>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Salvar' : 'Cadastrar')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 