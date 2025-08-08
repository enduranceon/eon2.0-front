import React, { useEffect } from 'react';
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
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import { AvailableTest, TestType } from '../../../types/api';

const testSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  type: z.nativeEnum(TestType, { errorMap: () => ({ message: 'Selecione um tipo válido.' }) }),
  isActive: z.boolean(),
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
      isActive: true
    },
  });


  useEffect(() => {
    if (open) {
      if (isEditMode && test) {
        reset({
          name: test.name,
          description: test.description || '',
          type: test.type,
          isActive: test.isActive
        });
      } else {
        reset({ 
          name: '', 
          description: '', 
          type: TestType.PERFORMANCE, 
          isActive: true
        });
      }
    }
  }, [open, test, isEditMode, reset]);

  const handleFormSubmit = (data: TestFormData) => {
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