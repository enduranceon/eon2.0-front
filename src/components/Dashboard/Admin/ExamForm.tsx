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
import { Exam, Modalidade, ExamDistance, ExamCategory } from '../../../types/api';
import { enduranceApi } from '../../../services/enduranceApi';

const distanceSchema = z.object({
  distance: z.coerce.number().optional().refine((val) => {
    if (!val || val <= 0) return false;
    return true;
  }, {
    message: "Distância deve ser maior que 0",
  }),
  unit: z.string().default('km'),
  date: z.string().optional().refine((val) => {
    if (!val || val === '') return true; // Campo opcional no schema, mas validado customizadamente
    // Aceita formato date (YYYY-MM-DD)
    return /^\d{4}-\d{2}-\d{2}$/.test(val);
  }, {
    message: "Data inválida",
  }),
});

const categorySchema = z.object({
  category: z.nativeEnum(ExamCategory, {
    errorMap: () => ({ message: 'Selecione uma categoria' })
  }),
  date: z.string().optional().refine((val) => {
    if (!val || val === '') return true; // Campo opcional no schema, mas validado customizadamente
    // Aceita formato date (YYYY-MM-DD)
    return /^\d{4}-\d{2}-\d{2}$/.test(val);
  }, {
    message: "Data inválida",
  }),
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
  end_date: z.string().optional().refine((val) => {
    if (!val || val === '') return true; // Campo opcional
    // Aceita formato date (YYYY-MM-DD)
    return /^\d{4}-\d{2}-\d{2}$/.test(val);
  }, {
    message: "Data inválida",
  }),
  exam_url: z.string().url('URL inválida').optional().or(z.literal('')),
  modalidadeId: z.string().min(1, 'Selecione uma modalidade'),
  distances: z.array(distanceSchema).optional(),
  categories: z.array(categorySchema).optional(),
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
  const [isCorrida, setIsCorrida] = useState(false);

  const { control, handleSubmit, reset, formState: { errors }, watch, getValues } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: { 
      name: '', 
      description: '', 
      location: '', 
      date: '', 
      end_date: '',
      exam_url: '',
      modalidadeId: '',
      distances: [{ distance: 5, unit: 'km', date: '' }],
      categories: [{ category: ExamCategory.SPRINT, date: '' }]
    },
  });

  const selectedModalidadeId = watch('modalidadeId');

  // Detectar se a modalidade selecionada é Corrida
  useEffect(() => {
    if (selectedModalidadeId && modalities.length > 0) {
      const selectedModalidade = modalities.find(m => m.id === selectedModalidadeId);
      const newIsCorrida = selectedModalidade?.name.toLowerCase() === 'corrida';
      setIsCorrida(newIsCorrida);
      
      
      // Limpar campos quando a modalidade muda
      if (newIsCorrida) {
        // Se mudou para Corrida, limpar categorias
        reset({
          ...getValues(),
          categories: [{ category: ExamCategory.SPRINT, date: '' }]
        });
      } else {
        // Se mudou para outra modalidade, limpar distâncias
        reset({
          ...getValues(),
          distances: [{ distance: 5, unit: 'km', date: '' }]
        });
      }
          }
    }, [selectedModalidadeId, modalities, reset, getValues]);

  // Função para converter data do formato date para ISO
  const convertToISO = (dateString: string) => {
    if (!dateString) return '';
    // Converte data para ISO com horário 00:00:00
    return dateString + 'T00:00:00.000Z';
  };

  const { fields: distanceFields, append: appendDistance, remove: removeDistance } = useFieldArray({
    control,
    name: "distances"
  });

  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
    control,
    name: "categories"
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
        // Determinar se é modalidade Corrida para decidir quais campos mostrar
        const isCorrida = exam.modalidade?.name.toLowerCase() === 'corrida';
        
        reset({
          name: exam.name,
          description: exam.description || '',
          location: exam.location,
          date: new Date(exam.date).toISOString().substring(0, 10),
          end_date: exam.end_date ? new Date(exam.end_date).toISOString().substring(0, 10) : '',
          exam_url: exam.exam_url || '',
          modalidadeId: exam.modalidadeId,
          distances: isCorrida && exam.distances?.length > 0 ? exam.distances.map(d => ({
            distance: d.distance,
            unit: d.unit,
            date: d.date ? new Date(d.date).toISOString().substring(0, 10) : '',
          })) : [{ distance: 5, unit: 'km', date: '' }],
          categories: !isCorrida && exam.categories?.length > 0 ? exam.categories.map(c => ({
            category: c.name as ExamCategory, // Converter string para enum
            date: c.date ? new Date(c.date).toISOString().substring(0, 10) : '',
          })) : [{ category: ExamCategory.SPRINT, date: '' }]
        });
      } else {
        reset({ 
          name: '', 
          description: '', 
          location: '', 
          date: '', 
          end_date: '',
          exam_url: '',
          modalidadeId: '',
          distances: [{ distance: 5, unit: 'km', date: '' }],
          categories: [{ category: ExamCategory.SPRINT, date: '' }]
        });
      }
    }
  }, [open, exam, isEditMode, reset]);

  const addDistance = () => {
    appendDistance({ distance: 10, unit: 'km', date: '' });
  };

  const removeDistanceItem = (index: number) => {
    if (distanceFields.length > 1) {
      removeDistance(index);
    }
  };

  const addCategory = () => {
    appendCategory({ category: ExamCategory.SPRINT, date: '' });
  };

  const removeCategoryItem = (index: number) => {
    if (categoryFields.length > 1) {
      removeCategory(index);
    }
  };

  // Validação customizada baseada na modalidade
  const validateFormData = (data: ExamFormData) => {
    const selectedModalidade = modalities.find(m => m.id === data.modalidadeId);
    const isCorrida = selectedModalidade?.name.toLowerCase() === 'corrida';
    

    if (isCorrida) {
      // Para modalidade Corrida, validar distâncias
      if (!data.distances || data.distances.length === 0) {
        throw new Error('Para provas de Corrida, adicione pelo menos uma distância');
      }
      
      // Validar se todas as distâncias têm dados válidos
      for (let i = 0; i < data.distances.length; i++) {
        const distance = data.distances[i];
        if (!distance.distance || distance.distance <= 0) {
          throw new Error(`Distância ${i + 1}: valor deve ser maior que 0`);
        }
        if (!distance.date || distance.date.trim() === '') {
          throw new Error(`Distância ${i + 1}: data é obrigatória`);
        }
      }
    } else {
      // Para outras modalidades, validar categorias
      if (!data.categories || data.categories.length === 0) {
        throw new Error('Para outras modalidades, adicione pelo menos uma categoria');
      }
      
      // Validar se todas as categorias têm dados válidos
      for (let i = 0; i < data.categories.length; i++) {
        const category = data.categories[i];
        if (!category.category) {
          throw new Error(`Categoria ${i + 1}: selecione uma categoria`);
        }
        if (!category.date || category.date.trim() === '') {
          throw new Error(`Categoria ${i + 1}: data é obrigatória`);
        }
      }
    }
    
  };

  const handleFormSubmit = async (data: ExamFormData) => {
    try {
      // Validar dados baseado na modalidade
      validateFormData(data);
      await onSubmit(data);
    } catch (error: any) {
      console.error('Erro de validação:', error);
      // Propagar o erro para o componente pai
      throw error;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Prova' : 'Nova Prova'}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
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
                <TextField {...field} type="date" label="Data de Início da Prova" fullWidth required InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date?.message} /> 
              )}/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="end_date" control={control} render={({ field }) => ( 
                <TextField {...field} type="date" label="Data de Fim da Prova (opcional)" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.end_date} helperText={errors.end_date?.message} /> 
              )}/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller name="exam_url" control={control} render={({ field }) => ( 
                <TextField {...field} label="URL Externa do Evento (opcional)" fullWidth error={!!errors.exam_url} helperText={errors.exam_url?.message} /> 
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
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Gerenciamento de distâncias ou categorias baseado na modalidade */}
          {isCorrida ? (
            <>
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

              {distanceFields.map((field, index) => (
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
                      <Grid item xs={12} sm={5}>
                        <Controller
                          name={`distances.${index}.date`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="date"
                              label="Data da Prova"
                              fullWidth
                              required
                              InputLabelProps={{ shrink: true }}
                              error={!!errors.distances?.[index]?.date}
                              helperText={errors.distances?.[index]?.date?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <IconButton
                          onClick={() => removeDistanceItem(index)}
                          color="error"
                          disabled={distanceFields.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Categorias da Prova</Typography>
                <Button
                  type="button"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addCategory}
                  size="small"
                >
                  Adicionar Categoria
                </Button>
              </Box>

              {errors.categories && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.categories.message}
                </Alert>
              )}

              {categoryFields.map((field, index) => (
                <Card key={field.id} sx={{ mb: 2, p: 2 }}>
                  <CardContent sx={{ p: '0 !important' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <Controller
                          name={`categories.${index}.category`}
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth required>
                              <InputLabel>Categoria</InputLabel>
                              <Select {...field} label="Categoria">
                                <MenuItem value={ExamCategory.SPRINT}>Sprint</MenuItem>
                                <MenuItem value={ExamCategory.SUPER_SPRINT}>Super Sprint</MenuItem>
                                <MenuItem value={ExamCategory.OLYMPIC}>Olímpico</MenuItem>
                                <MenuItem value={ExamCategory.HALF_DISTANCE}>Half Distance</MenuItem>
                                <MenuItem value={ExamCategory.DUATHLON}>Duathlon</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <Controller
                          name={`categories.${index}.date`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              type="date"
                              label="Data da Prova"
                              fullWidth
                              required
                              InputLabelProps={{ shrink: true }}
                              error={!!errors.categories?.[index]?.date}
                              helperText={errors.categories?.[index]?.date?.message}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <IconButton
                          onClick={() => removeCategoryItem(index)}
                          color="error"
                          disabled={categoryFields.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
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