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
  Switch,
  FormControlLabel,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { AvailableTest, TestType, DynamicTestResult } from '../../../types/api';

const dynamicResultSchema = z.object({
  fieldName: z.string().min(1, 'Nome do campo é obrigatório'),
  value: z.string().optional().or(z.literal('')),
  unit: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

const testSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  type: z.nativeEnum(TestType, { errorMap: () => ({ message: 'Selecione um tipo válido.' }) }),
  isActive: z.boolean(),
  // Campos para resultados dinâmicos (obrigatórios)
  supportsDynamicResults: z.boolean().default(true),
  defaultResultFields: z.array(dynamicResultSchema).min(1, 'Pelo menos um campo de resultado deve ser definido'),
}).refine((data) => {
  // Verifica se pelo menos um campo tem fieldName preenchido
  if (data.defaultResultFields) {
    const hasValidField = data.defaultResultFields.some(field => field.fieldName && field.fieldName.trim() !== '');
    if (!hasValidField) {
      return false;
    }
  }
  return true;
}, {
  message: "Pelo menos um campo deve ter um nome definido",
  path: ["defaultResultFields"]
});

type TestFormData = z.infer<typeof testSchema>;

interface TestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TestFormData) => Promise<void>;
  test?: AvailableTest | null;
  loading: boolean;
  error: string | null;
}

export default function TestForm({ open, onClose, onSubmit, test, loading, error }: TestFormProps) {
  const isEditMode = !!test;

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: { 
      name: '', 
      description: '', 
      type: TestType.PERFORMANCE, 
      isActive: true,
      supportsDynamicResults: true,
      defaultResultFields: []
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "defaultResultFields"
  });

  // Log para debug
  console.log('TestForm - errors:', errors);
  console.log('TestForm - fields:', fields);
  console.log('TestForm - fields.length:', fields.length);
  console.log('TestForm - errors.defaultResultFields:', errors.defaultResultFields);
  if (errors.defaultResultFields) {
    errors.defaultResultFields.forEach((error: any, index: number) => {
      console.log(`TestForm - erro campo ${index}:`, error);
    });
  }

  useEffect(() => {
    if (open) {
      if (isEditMode && test) {
        console.log('TestForm - Editando teste:', test);
        console.log('TestForm - dynamicFields:', test.dynamicFields);
        
        const mappedFields = test.dynamicFields?.map(field => ({
          fieldName: field.fieldName,
          value: field.value || '',
          unit: field.metric || '',
          description: field.description || ''
        })) || [];
        
        console.log('TestForm - Campos mapeados:', mappedFields);
        
        reset({
          name: test.name,
          description: test.description || '',
          type: test.type,
          isActive: test.isActive,
          supportsDynamicResults: true
        });
        
        // Atualizar os campos dinâmicos separadamente
        replace(mappedFields);
      } else {
        reset({ 
          name: '', 
          description: '', 
          type: TestType.PERFORMANCE, 
          isActive: true,
          supportsDynamicResults: true
        });
        
        // Limpar os campos dinâmicos
        replace([]);
      }
    }
  }, [open, test, isEditMode, reset]);

  const handleAddResultField = () => {
    append({
      fieldName: '',
      value: '',
      unit: '',
      description: ''
    });
  };

  const handleRemoveResultField = (index: number) => {
    remove(index);
  };

  const handleFormSubmit = (data: TestFormData) => {
    console.log('TestForm - onSubmit chamado com dados:', data);
    return onSubmit(data);
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
            
            {/* Seção de Resultados Dinâmicos */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Configuração de Resultados
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Campos de Resultado Padrão
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Defina os campos de resultado que estarão disponíveis para este teste. 
                Os treinadores poderão apenas registrar os valores dos campos definidos aqui.
                <strong>Apenas o nome do campo é obrigatório.</strong> Valor padrão, unidade e descrição são opcionais.
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                  
                  {fields.map((field, index) => (
                    <Card key={field.id} sx={{ mb: 2, p: 2 }}>
                      <CardContent sx={{ p: 0 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={3}>
                            <Controller
                              name={`defaultResultFields.${index}.fieldName`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label="Nome do Campo"
                                  fullWidth
                                  size="small"
                                  placeholder="Ex: Tempo, Velocidade, Distância"
                                  error={!!errors.defaultResultFields?.[index]?.fieldName}
                                  helperText={errors.defaultResultFields?.[index]?.fieldName?.message}
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Controller
                              name={`defaultResultFields.${index}.value`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label="Valor Padrão (Opcional)"
                                  fullWidth
                                  size="small"
                                  placeholder="Ex: 15s, 18.5, 1000m (opcional)"
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} sm={2}>
                            <Controller
                              name={`defaultResultFields.${index}.unit`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label="Unidade"
                                  fullWidth
                                  size="small"
                                  placeholder="Ex: s, km/h, m"
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <Controller
                              name={`defaultResultFields.${index}.description`}
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  label="Descrição"
                                  fullWidth
                                  size="small"
                                  placeholder="Descrição opcional"
                                />
                              )}
                            />
                          </Grid>
                          <Grid item xs={12} sm={1}>
                            <IconButton
                              onClick={() => handleRemoveResultField(index)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddResultField}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Adicionar Campo de Resultado
                  </Button>
                  
                  {fields.length === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Nenhum campo de resultado definido. É obrigatório definir pelo menos um campo para que os treinadores possam registrar resultados.
                    </Alert>
                  )}
                  
                  {errors.defaultResultFields && typeof errors.defaultResultFields === 'object' && !Array.isArray(errors.defaultResultFields) && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {errors.defaultResultFields.message}
                    </Alert>
                  )}
                </Box>
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