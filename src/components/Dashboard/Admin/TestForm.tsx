import React, { useEffect, useMemo, useState } from 'react';
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
  Switch,
  FormControlLabel,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { AvailableTest, TestDynamicField, TestType, Modalidade } from '../../../types/api';
import { enduranceApi } from '../../../services/enduranceApi';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const dynamicFieldSchema = z.object({
  id: z.string().optional(),
  fieldName: z.string().optional(),
  metric: z.string().optional(),
  value: z.string().optional(),
});

const testSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  type: z.nativeEnum(TestType, { errorMap: () => ({ message: 'Selecione um tipo válido.' }) }),
  modalidadeId: z.string().optional(),
  isActive: z.boolean(),
  dynamicFields: z.array(dynamicFieldSchema).default([]),
});

type TestFormData = z.infer<typeof testSchema>;

interface TestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TestFormData & { removedDynamicFieldIds?: string[] }) => Promise<void>;
  test?: AvailableTest | null;
  loading: boolean;
  error: string | null;
}

export default function TestForm({ open, onClose, onSubmit, test, loading, error }: TestFormProps) {
  const isEditMode = !!test;

  const [initialDynamicFields, setInitialDynamicFields] = useState<TestDynamicField[]>([]);
  const [loadingDynamicFields, setLoadingDynamicFields] = useState<boolean>(false);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [loadingModalidades, setLoadingModalidades] = useState<boolean>(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: { 
      name: '', 
      description: '', 
      type: TestType.PERFORMANCE, 
      modalidadeId: '',
      isActive: true,
      dynamicFields: []
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'dynamicFields'
  });

  const [removedDynamicFieldIds, setRemovedDynamicFieldIds] = useState<string[]>([]);


  useEffect(() => {
    if (open) {
      // Carregar modalidades sempre que o modal abrir
      setLoadingModalidades(true);
      enduranceApi.getModalidades({ limit: 100 })
        .then((response) => {
          setModalidades(response.data || []);
        })
        .catch((error) => {
          console.error('Erro ao carregar modalidades:', error);
        })
        .finally(() => setLoadingModalidades(false));

      if (isEditMode && test) {
        reset({
          name: test.name,
          description: test.description || '',
          type: test.type,
          modalidadeId: test.modalidadeId || '',
          isActive: test.isActive,
          dynamicFields: []
        });
        // Carregar campos dinâmicos existentes do teste
        setLoadingDynamicFields(true);
        enduranceApi.getTestDynamicFields(test.id)
          .then((df) => {
            const mapped = (df || []).map((f) => ({
              id: f.id,
              fieldName: f.fieldName,
              metric: f.metric,
              value: f.value || ''
            }));
            setInitialDynamicFields(df || []);
            reset({
              name: test.name,
              description: test.description || '',
              type: test.type,
              modalidadeId: test.modalidadeId || '',
              isActive: test.isActive,
              dynamicFields: mapped
            });
          })
          .finally(() => setLoadingDynamicFields(false));
      } else {
        reset({ 
          name: '', 
          description: '', 
          type: TestType.PERFORMANCE, 
          modalidadeId: '',
          isActive: true,
          dynamicFields: []
        });
        setInitialDynamicFields([]);
        setRemovedDynamicFieldIds([]);
      }
    }
  }, [open, test, isEditMode, reset]);

  const handleFormSubmit = (data: TestFormData) => {
    // Filtrar campos dinâmicos válidos antes de enviar
    const validDynamicFields = data.dynamicFields.filter(field => 
      field.fieldName && field.fieldName.trim().length > 0
    );
    
    const processedData = {
      ...data,
      dynamicFields: validDynamicFields,
      removedDynamicFieldIds
    };
    
    return onSubmit(processedData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Teste' : 'Novo Teste'}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller name="name" control={control} render={({ field }) => ( 
                <TextField {...field} label="Nome do Teste" fullWidth required error={!!errors.name} helperText={errors.name?.message} /> 
              )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller name="description" control={control} render={({ field }) => ( 
                <TextField {...field} label="Descrição" multiline rows={3} fullWidth /> 
              )}/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.type}>
                <InputLabel>Tipo de Teste</InputLabel>
                <Controller name="type" control={control} render={({ field }) => (
                  <Select {...field} label="Tipo de Teste">
                    {Object.values(TestType).map((type) => ( 
                      <MenuItem key={type} value={type}>{type}</MenuItem> 
                    ))}
                  </Select>
                )}/>
                {errors.type && <Alert severity="error" sx={{ mt: 1 }}>{errors.type.message}</Alert>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.modalidadeId}>
                <InputLabel>Modalidade</InputLabel>
                <Controller name="modalidadeId" control={control} render={({ field }) => (
                  <Select {...field} label="Modalidade" disabled={loadingModalidades}>
                    <MenuItem value=""><em>Selecione uma modalidade (opcional)</em></MenuItem>
                    {modalidades.map((modalidade) => ( 
                      <MenuItem key={modalidade.id} value={modalidade.id}>{modalidade.name}</MenuItem> 
                    ))}
                  </Select>
                )}/>
                {errors.modalidadeId && <Alert severity="error" sx={{ mt: 1 }}>{errors.modalidadeId.message}</Alert>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Teste Ativo"
                    sx={{ pt: 2 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 1, mb: 1 }}>Campos Dinâmicos</Typography>
              {loadingDynamicFields && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Carregando campos...</Typography>
                </Box>
              )}
              <Grid container spacing={2}>
                {fields.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <Grid item xs={12} sm={4}>
                      <Controller
                        name={`dynamicFields.${index}.fieldName` as const}
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} label="Nome do campo" fullWidth required />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Controller
                        name={`dynamicFields.${index}.metric` as const}
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} label="Métrica/Unidade" fullWidth />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Controller
                        name={`dynamicFields.${index}.value` as const}
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} label="Valor padrão" fullWidth />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Controller
                        name={`dynamicFields.${index}.id` as const}
                        control={control}
                        render={({ field }) => (
                          <IconButton
                            aria-label="Remover campo"
                            color="error"
                            onClick={() => {
                              if (field.value) {
                                setRemovedDynamicFieldIds((prev) => Array.from(new Set([...prev, field.value as string])));
                              }
                              remove(index);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      />
                    </Grid>
                  </React.Fragment>
                ))}
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => append({ fieldName: '', metric: '', value: '' })}
                  >
                    Adicionar Campo
                  </Button>
                </Grid>
              </Grid>
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