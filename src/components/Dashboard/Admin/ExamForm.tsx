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
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Exam, Modalidade, ExamDistance } from '../../../types/api';
import { enduranceApi } from '../../../services/enduranceApi';

const distanceSchema = z.object({
  distance: z.coerce.number().min(0.1, 'Distância deve ser maior que 0'),
  unit: z.string().default('km'),
  price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a 0'),
  maxParticipants: z.coerce.number().min(1, 'Limite deve ser maior que 0'),
});

const examSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  location: z.string().min(3, 'O local é obrigatório'),
  date: z.string().refine((val) => {
    if (!val) return false;
    // Aceita formato date (YYYY-MM-DD)
    return /^\d{4}-\d{2}-\d{2}$/.test(val);
  }, {
    message: "Data inválida",
  }),
  modalidadeId: z.string().min(1, 'Selecione uma modalidade'),
  price: z.coerce.number().min(0, 'Preço deve ser maior ou igual a 0').optional(),
  maxParticipants: z.coerce.number().min(1, 'Limite deve ser maior que 0').optional(),
  distances: z.array(distanceSchema).min(1, 'Adicione pelo menos uma distância'),
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

  const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: { 
      name: '', 
      description: '', 
      location: '', 
      date: '', 
      modalidadeId: '',
      price: 0,
      maxParticipants: 100,
      distances: [{ distance: 5, unit: 'km', price: 30, maxParticipants: 50 }]
    },
  });

  // Função para converter data do formato date para ISO
  const convertToISO = (dateString: string) => {
    if (!dateString) return '';
    // Converte data para ISO com horário 00:00:00
    return dateString + 'T00:00:00.000Z';
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "distances"
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
          date: new Date(exam.date).toISOString().substring(0, 10),
          modalidadeId: exam.modalidadeId,
          price: exam.price || 0,
          maxParticipants: exam.maxParticipants || 100,
          distances: exam.distances?.length > 0 ? exam.distances.map(d => ({
            distance: d.distance,
            unit: d.unit,
            price: d.price,
            maxParticipants: d.maxParticipants
          })) : [{ distance: 5, unit: 'km', price: 30, maxParticipants: 50 }]
        });
      } else {
        reset({ 
          name: '', 
          description: '', 
          location: '', 
          date: '', 
          modalidadeId: '',
          price: 0,
          maxParticipants: 100,
          distances: [{ distance: 5, unit: 'km', price: 30, maxParticipants: 50 }]
        });
      }
    }
  }, [open, exam, isEditMode, reset]);

  const addDistance = () => {
    append({ distance: 10, unit: 'km', price: 50, maxParticipants: 50 });
  };

  const removeDistance = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Prova' : 'Nova Prova'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {/* Informações básicas da prova */}
          <Typography variant="h6" sx={{ mb: 2 }}>Informações da Prova</Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Controller name="name" control={control} render={({ field }) => ( 
                <TextField {...field} label="Nome da Prova" fullWidth required error={!!errors.name} helperText={errors.name?.message} /> 
              )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller name="description" control={control} render={({ field }) => ( 
                <TextField {...field} label="Descrição" multiline rows={3} fullWidth /> 
              )}/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="location" control={control} render={({ field }) => ( 
                <TextField {...field} label="Local" fullWidth required error={!!errors.location} helperText={errors.location?.message} /> 
              )}/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="date" control={control} render={({ field }) => ( 
                <TextField {...field} type="date" label="Data da Prova" fullWidth required InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date?.message} /> 
              )}/>
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
            <Grid item xs={12} sm={6}>
              <Controller name="price" control={control} render={({ field }) => ( 
                <TextField {...field} type="number" label="Preço Base (opcional)" fullWidth error={!!errors.price} helperText={errors.price?.message} /> 
              )}/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="maxParticipants" control={control} render={({ field }) => ( 
                <TextField {...field} type="number" label="Limite Geral de Participantes (opcional)" fullWidth error={!!errors.maxParticipants} helperText={errors.maxParticipants?.message} /> 
              )}/>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Gerenciamento de distâncias */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Distâncias da Prova</Typography>
            <Button
              type="button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addDistance}
              size="small"
            >
              Adicionar Distância
            </Button>
          </Box>

          {errors.distances && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.distances.message}
            </Alert>
          )}

          {fields.map((field, index) => (
            <Card key={field.id} sx={{ mb: 2, p: 2 }}>
              <CardContent sx={{ p: '0 !important' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name={`distances.${index}.distance`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          label="Distância"
                          fullWidth
                          required
                          error={!!errors.distances?.[index]?.distance}
                          helperText={errors.distances?.[index]?.distance?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Controller
                      name={`distances.${index}.unit`}
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Unidade</InputLabel>
                          <Select {...field} label="Unidade">
                            <MenuItem value="km">km</MenuItem>
                            <MenuItem value="m">m</MenuItem>
                            <MenuItem value="mi">mi</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name={`distances.${index}.price`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          label="Preço"
                          fullWidth
                          required
                          error={!!errors.distances?.[index]?.price}
                          helperText={errors.distances?.[index]?.price?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Controller
                      name={`distances.${index}.maxParticipants`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          label="Limite de Participantes"
                          fullWidth
                          required
                          error={!!errors.distances?.[index]?.maxParticipants}
                          helperText={errors.distances?.[index]?.maxParticipants?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton
                      onClick={() => removeDistance(index)}
                      color="error"
                      disabled={fields.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
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