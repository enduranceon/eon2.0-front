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
import { User } from '../../../types/api';

const studentSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  birthDate: z.string().optional(),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres').optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface StudentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: StudentFormData) => Promise<void>;
  student?: User | null;
  loading: boolean;
  error: string | null;
}

export default function StudentForm({
  open,
  onClose,
  onSubmit,
  student,
  loading,
  error,
}: StudentFormProps) {
  const isEditMode = !!student;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      email: '',
      birthDate: '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      if (isEditMode && student) {
        reset({
          name: student.name,
          email: student.email,
          birthDate: student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : '',
        });
      } else {
        reset({ name: '', email: '', birthDate: '', password: '' });
      }
    }
  }, [open, student, isEditMode, reset]);

  const handleFormSubmit = (data: StudentFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nome Completo"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="birthDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Data de Nascimento"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.birthDate}
                    helperText={errors.birthDate?.message}
                  />
                )}
              />
            </Grid>
            {!isEditMode && (
              <Grid item xs={12}>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Senha"
                      type="password"
                      fullWidth
                      error={!!errors.password}
                      helperText={errors.password?.message}
                    />
                  )}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Salvar Alterações' : 'Cadastrar Aluno')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 