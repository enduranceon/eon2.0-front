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

// Schema de validação para o formulário
const adminSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().optional(),
}).refine(data => {
    // Se a senha for fornecida, ela deve ter pelo menos 8 caracteres
    if (data.password && data.password.length < 8) {
        return false;
    }
    return true;
}, {
    message: 'A senha deve ter pelo menos 8 caracteres',
    path: ['password'],
});

type AdminFormData = z.infer<typeof adminSchema>;

interface AdminFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AdminFormData) => Promise<void>;
  admin?: User | null;
  loading: boolean;
  error: string | null;
}

export default function AdminForm({
  open,
  onClose,
  onSubmit,
  admin,
  loading,
  error,
}: AdminFormProps) {
  const isEditMode = !!admin;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      if (isEditMode && admin) {
        reset({
          name: admin.name,
          email: admin.email,
          password: '',
        });
      } else {
        reset({
          name: '',
          email: '',
          password: '',
        });
      }
    }
  }, [open, admin, isEditMode, reset]);
  
  const internalSubmit = (data: AdminFormData) => {
    const payload: Partial<AdminFormData> = { ...data };
    if (!payload.password) {
      delete payload.password; // Não envia a senha se o campo estiver vazio
    }
    onSubmit(payload as AdminFormData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Administrador' : 'Novo Administrador'}</DialogTitle>
      <form onSubmit={handleSubmit(internalSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller name="name" control={control} render={({ field }) => ( <TextField {...field} label="Nome Completo" fullWidth error={!!errors.name} helperText={errors.name?.message} /> )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller name="email" control={control} render={({ field }) => ( <TextField {...field} label="Email" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} /> )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller name="password" control={control} render={({ field }) => ( 
                <TextField 
                  {...field} 
                  label="Senha" 
                  type="password" 
                  fullWidth 
                  error={!!errors.password} 
                  helperText={isEditMode ? 'Deixe em branco para não alterar' : errors.password?.message}
                  required={!isEditMode}
                /> 
              )}/>
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