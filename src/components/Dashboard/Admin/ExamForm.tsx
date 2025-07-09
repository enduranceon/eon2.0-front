import React, { useEffect, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Exam, Modalidade } from '../../../types/api';
import { enduranceApi } from '../../../services/enduranceApi';

const examSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  location: z.string().min(3, 'O local é obrigatório'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data inválida",
  }),
  modalidadeId: z.string().min(1, 'Selecione uma modalidade'),
});

type ExamFormData = z.infer<typeof examSchema>;

interface ExamFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExamFormData) => Promise<void>;
  exam?: Exam | null;
  loading: boolean;
  error: string | null;
}

export default function ExamForm({ open, onClose, onSubmit, exam, loading, error }: ExamFormProps) {
  const isEditMode = !!exam;
  const [modalities, setModalities] = useState<Modalidade[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: { name: '', description: '', location: '', date: '', modalidadeId: '' },
  });

  useEffect(() => {
    async function fetchModalities() {
      try {
        const response = await enduranceApi.getModalidades({ limit: 100 });
        setModalities(Array.isArray(response) ? response : response.data || []);
      } catch (e) {
        console.error("Erro ao buscar modalidades", e);
      }
    }
    fetchModalities();
  }, []);

  useEffect(() => {
    if (open) {
      if (isEditMode && exam) {
        reset({
          name: exam.name,
          description: exam.description || '',
          location: exam.location,
          date: new Date(exam.date).toISOString().substring(0, 16), // Formato para datetime-local
          modalidadeId: exam.modalidadeId,
        });
      } else {
        reset({ name: '', description: '', location: '', date: '', modalidadeId: '' });
      }
    }
  }, [open, exam, isEditMode, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller name="name" control={control} render={({ field }) => ( <TextField {...field} label="Nome do Evento" fullWidth required error={!!errors.name} helperText={errors.name?.message} /> )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller name="description" control={control} render={({ field }) => ( <TextField {...field} label="Descrição" multiline rows={3} fullWidth /> )}/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="location" control={control} render={({ field }) => ( <TextField {...field} label="Local" fullWidth required error={!!errors.location} helperText={errors.location?.message} /> )}/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="date" control={control} render={({ field }) => ( <TextField {...field} type="datetime-local" label="Data e Hora" fullWidth required InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date?.message} /> )}/>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.modalidadeId}>
                <InputLabel>Modalidade</InputLabel>
                <Controller name="modalidadeId" control={control} render={({ field }) => (
                  <Select {...field} label="Modalidade">
                    {modalities.map((m) => ( <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem> ))}
                  </Select>
                )}/>
                {errors.modalidadeId && <Alert severity="error" sx={{ mt: 1 }}>{errors.modalidadeId.message}</Alert>}
              </FormControl>
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