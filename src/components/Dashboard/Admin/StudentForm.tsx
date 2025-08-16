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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { User, Gender } from '../../../types/api';
import { Stack } from '@mui/material';

const studentSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  cpfCnpj: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY']).optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
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
      phone: '',
      cpfCnpj: '',
      birthDate: '',
      gender: undefined,
      address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' },
      password: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      if (isEditMode && student) {
        reset({
          name: student.name,
          email: student.email,
          phone: student.phone || '',
          cpfCnpj: (student as any).cpfCnpj || '',
          birthDate: student.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : '',
          gender: (student as any).gender || undefined,
          address: {
            street: (student as any).address?.street || (student as any).addresses?.[0]?.street || '',
            number: (student as any).address?.number || (student as any).addresses?.[0]?.number || '',
            complement: (student as any).address?.complement || (student as any).addresses?.[0]?.complement || '',
            neighborhood: (student as any).address?.neighborhood || (student as any).addresses?.[0]?.neighborhood || '',
            city: (student as any).address?.city || (student as any).addresses?.[0]?.city || '',
            state: (student as any).address?.state || (student as any).addresses?.[0]?.state || '',
            zipCode: (student as any).address?.zipCode || (student as any).addresses?.[0]?.zipCode || '',
          },
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
            <Grid item xs={12} sm={6}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Telefone" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="cpfCnpj"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="CPF/CNPJ" fullWidth />
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="gender-label">Gênero</InputLabel>
                    <Select
                      {...field}
                      labelId="gender-label"
                      label="Gênero"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || undefined)}
                    >
                      <MenuItem value="">
                        <em>Não informado</em>
                      </MenuItem>
                      <MenuItem value={Gender.MALE}>Masculino</MenuItem>
                      <MenuItem value={Gender.FEMALE}>Feminino</MenuItem>
                      <MenuItem value={Gender.OTHER}>Outro</MenuItem>
                      <MenuItem value={Gender.PREFER_NOT_TO_SAY}>Prefiro não informar</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Controller name="address.street" control={control} render={({ field }) => (<TextField {...field} label="Rua" fullWidth />)} />
                <Controller name="address.number" control={control} render={({ field }) => (<TextField {...field} label="Número" fullWidth />)} />
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Controller name="address.complement" control={control} render={({ field }) => (<TextField {...field} label="Complemento" fullWidth />)} />
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Controller name="address.neighborhood" control={control} render={({ field }) => (<TextField {...field} label="Bairro" fullWidth />)} />
                <Controller name="address.city" control={control} render={({ field }) => (<TextField {...field} label="Cidade" fullWidth />)} />
                <Controller name="address.state" control={control} render={({ field }) => (<TextField {...field} label="Estado" fullWidth />)} />
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Controller name="address.zipCode" control={control} render={({ field }) => (<TextField {...field} label="CEP" fullWidth />)} />
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