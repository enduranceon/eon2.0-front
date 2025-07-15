import React, { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
  MenuItem,
  OutlinedInput,
  Box,
  Chip,
  Typography,
  IconButton,
  InputAdornment
} from '@mui/material';
import { AddCircleOutline as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Plan, Modalidade, PlanPrice, PlanPeriod } from '../../../types/api';
import { enduranceApi } from '../../../services/enduranceApi';

const planPeriodTranslations: { [key in PlanPeriod]: string } = {
  [PlanPeriod.MONTHLY]: 'Mensal',
  [PlanPeriod.QUARTERLY]: 'Trimestral',
  [PlanPeriod.SEMIANNUAL]: 'Semestral',
  [PlanPeriod.ANNUAL]: 'Anual',
  [PlanPeriod.WEEKLY]: 'Semanal',
  [PlanPeriod.BIWEEKLY]: 'Quinzenal',
};

const planPriceSchema = z.object({
  period: z.nativeEnum(PlanPeriod),
  price: z.number().min(0, 'O preço deve ser positivo'),
});

const planSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  enrollmentFee: z.number().min(0, 'A taxa deve ser positiva').optional(),
  modalidadeIds: z.array(z.string()).min(1, 'Selecione ao menos uma modalidade'),
  prices: z.array(planPriceSchema).min(1, 'Adicione ao menos um preço'),
});

type PlanFormData = z.infer<typeof planSchema>;

interface PlanFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PlanFormData) => Promise<void>;
  plan?: Plan | null;
  loading: boolean;
  error: string | null;
}

export default function PlanForm({ open, onClose, onSubmit, plan, loading, error }: PlanFormProps) {
  const isEditMode = !!plan;
  const [modalities, setModalities] = useState<Modalidade[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: '', description: '', enrollmentFee: 0, modalidadeIds: [], prices: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "prices" });

  useEffect(() => {
    async function fetchModalities() {
      try {
        const response = await enduranceApi.getModalidades({ limit: 100 }); // Busca todas
        setModalities(Array.isArray(response) ? response : response.data || []);
      } catch (e) {
        console.error("Erro ao buscar modalidades", e);
      }
    }
    fetchModalities();
  }, []);

  useEffect(() => {
    if (open) {
      if (isEditMode && plan) {
        reset({
          name: plan.name,
          description: plan.description || '',
          enrollmentFee: plan.enrollmentFee || 0,
          modalidadeIds: plan.modalidades.map(m => m.modalidade.id),
          prices: plan.prices.map(p => ({ period: p.period, price: p.price })),
        });
      } else {
        reset({ name: '', description: '', enrollmentFee: 0, modalidadeIds: [], prices: [{ period: PlanPeriod.MONTHLY, price: 0 }] });
      }
    }
  }, [open, plan, isEditMode, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <Controller name="name" control={control} render={({ field }) => ( <TextField {...field} label="Nome do Plano" fullWidth required error={!!errors.name} helperText={errors.name?.message} /> )}/>
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller name="enrollmentFee" control={control} render={({ field }) => ( 
                <TextField 
                  {...field} 
                  label="Taxa de Matrícula" 
                  fullWidth 
                  type="number" 
                  InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }} 
                  error={!!errors.enrollmentFee} 
                  helperText={errors.enrollmentFee?.message}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                /> 
              )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller name="description" control={control} render={({ field }) => ( <TextField {...field} label="Descrição" multiline rows={3} fullWidth /> )}/>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.modalidadeIds}>
                <InputLabel>Modalidades</InputLabel>
                <Controller name="modalidadeIds" control={control} render={({ field }) => (
                  <Select {...field} multiple required input={<OutlinedInput label="Modalidades" />} renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => ( <Chip key={value} label={modalities.find(m => m.id === value)?.name || value} /> ))}
                      </Box>
                    )}>
                    {modalities.map((m) => ( <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem> ))}
                  </Select>
                )}/>
                {errors.modalidadeIds && <Typography color="error" variant="caption" sx={{ pl: 2 }}>{errors.modalidadeIds.message}</Typography>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 6 }}>Preços</Typography>
              {errors.prices && <Alert severity="warning" sx={{ mb: 1 }}>{errors.prices.message}</Alert>}
              {fields.map((field, index) => (
                <Grid container spacing={2} key={field.id} sx={{ alignItems: 'center', mb: 1 }}>
                  <Grid item xs={5}>
                    <Controller name={`prices.${index}.period`} control={control} render={({ field: selectField }) => (
                      <FormControl fullWidth>
                        <InputLabel>Período</InputLabel>
                        <Select {...selectField} label="Período">
                          {Object.values(PlanPeriod).map(p => <MenuItem key={p} value={p}>{planPeriodTranslations[p] || p}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}/>
                  </Grid>
                  <Grid item xs={5}>
                    <Controller name={`prices.${index}.price`} control={control} render={({ field: priceField }) => (
                       <TextField 
                         {...priceField} 
                         label="Preço" 
                         fullWidth 
                         type="number" 
                         InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment>}}
                         onChange={(e) => priceField.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                       />
                    )}/>
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton onClick={() => remove(index)} color="error"><DeleteIcon /></IconButton>
                  </Grid>
                </Grid>
              ))}
               <Button startIcon={<AddIcon />} onClick={() => append({ period: PlanPeriod.MONTHLY, price: 0 })}>
                Adicionar Preço
              </Button>
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