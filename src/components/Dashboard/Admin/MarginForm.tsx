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
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useSnackbar } from 'notistack';

import { enduranceApi } from '../../../services/enduranceApi';
import { Margin, Plan, CoachLevel } from '../../../types/api';

const marginSchema = z.object({
  planId: z.string().min(1, 'O plano é obrigatório.'),
  coachLevel: z.nativeEnum(CoachLevel, { errorMap: () => ({ message: "O nível é obrigatório" }) }),
  percentage: z.number().min(0, 'A porcentagem não pode ser negativa.').max(100, 'A porcentagem não pode exceder 100.'),
  isActive: z.boolean(),
});

type MarginFormData = z.infer<typeof marginSchema>;

interface MarginFormProps {
  open: boolean;
  onClose: () => void;
  margin: Margin | null;
}

const coachLevels = Object.values(CoachLevel);

export default function MarginForm({ open, onClose, margin }: MarginFormProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  const { control, handleSubmit, reset, setValue } = useForm<MarginFormData>({
    resolver: zodResolver(marginSchema),
    defaultValues: {
      planId: '',
      coachLevel: undefined,
      percentage: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await enduranceApi.getPlans({ limit: 100 });
        setPlans(response.data);
      } catch (err) {
        enqueueSnackbar('Erro ao carregar planos.', { variant: 'error' });
      }
    }
    fetchPlans();
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (margin) {
      setValue('planId', margin.planId);
      setValue('coachLevel', margin.coachLevel);
      setValue('percentage', margin.percentage);
      setValue('isActive', margin.isActive);
    } else {
      reset({
        planId: '',
        coachLevel: undefined,
        percentage: 0,
        isActive: true,
      });
    }
  }, [margin, reset, setValue]);

  const onSubmit = async (data: MarginFormData) => {
    setLoading(true);
    try {
      if (margin) {
        await enduranceApi.updateMargin(margin.id, data);
        enqueueSnackbar('Margem atualizada com sucesso!', { variant: 'success' });
      } else {
        await enduranceApi.createMargin(data);
        enqueueSnackbar('Margem criada com sucesso!', { variant: 'success' });
      }
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Erro ao salvar a margem. Verifique se já não existe uma margem para esta combinação de plano e nível.', { variant: 'error', autoHideDuration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{margin ? 'Editar Margem' : 'Nova Margem'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="planId"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Plano"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={!!margin} // Não pode alterar o plano de uma margem existente
                  >
                    {plans.map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="coachLevel"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label="Nível do Treinador"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={!!margin} // Não pode alterar o nível de uma margem existente
                  >
                    {coachLevels.map((level) => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="percentage"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Percentual de Margem (%)"
                    type="number"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </Grid>
            {margin && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Controller
                      name="isActive"
                      control={control}
                      render={({ field }) => (
                        <Switch {...field} checked={field.value} />
                      )}
                    />
                  }
                  label="Margem Ativa"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} color="secondary">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 