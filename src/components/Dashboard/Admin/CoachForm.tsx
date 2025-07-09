import React, { useState, useEffect } from 'react';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { User, CoachLevel, Plan, Modalidade } from '../../../types/api';
import { enduranceApi } from '../../../services/enduranceApi';

const coachSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres').optional(),
  coachLevel: z.nativeEnum(CoachLevel).optional(),
  bio: z.string().optional(),
  experience: z.string().optional(),
  certifications: z.string().optional(), // Simplificando como string por agora
});

type CoachFormData = z.infer<typeof coachSchema>;

interface CoachFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CoachFormData) => Promise<void>;
  coach?: User | null;
  loading: boolean;
  error: string | null;
  onDataChange?: () => void; // Para forçar a atualização da lista
}

export default function CoachForm({
  open,
  onClose,
  onSubmit,
  coach,
  loading,
  error,
  onDataChange,
}: CoachFormProps) {
  const isEditMode = !!coach;
  const [linkedPlans, setLinkedPlans] = useState<{ plan: Plan }[]>([]);
  const [linkedModalities, setLinkedModalities] = useState<{ modalidade: Modalidade }[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CoachFormData>({
    resolver: zodResolver(coachSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      coachLevel: CoachLevel.JUNIOR,
      bio: '',
      experience: '',
      certifications: '',
    },
  });

  React.useEffect(() => {
    if (open) {
      if (isEditMode && coach) {
        reset({
          name: coach.name,
          email: coach.email,
          coachLevel: coach.coachLevel,
          bio: coach.bio || '',
          experience: (coach as any).experience || '', // Assuming experience is on User
          certifications: Array.isArray(coach.certifications) ? coach.certifications.join(', ') : '',
        });
        setLinkedPlans(coach.coachPlans || []);
        setLinkedModalities(coach.coachModalidades || []);
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          coachLevel: CoachLevel.JUNIOR,
          bio: '',
          experience: '',
          certifications: '',
        });
        setLinkedPlans([]);
        setLinkedModalities([]);
      }
    }
  }, [open, coach, isEditMode, reset]);

  const handleUnlinkPlan = async (planId: string) => {
    if (!coach) return;
    setInternalLoading(true);
    try {
      await enduranceApi.unlinkCoachFromPlan(coach.id, planId);
      setLinkedPlans(prev => prev.filter(p => p.plan.id !== planId));
      onDataChange?.(); // Notifica o pai sobre a mudança
    } catch (err) {
      console.error("Erro ao desvincular plano", err);
      // Idealmente, mostrar um toast/snackbar de erro
    } finally {
      setInternalLoading(false);
    }
  };

  const handleUnlinkModality = async (modalityId: string) => {
    if (!coach) return;
    setInternalLoading(true);
    try {
      await enduranceApi.unlinkCoachFromModality(coach.id, modalityId);
      setLinkedModalities(prev => prev.filter(m => m.modalidade.id !== modalityId));
      onDataChange?.(); // Notifica o pai sobre a mudança
    } catch (err) {
      console.error("Erro ao desvincular modalidade", err);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Treinador' : 'Cadastrar Novo Treinador'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller name="name" control={control} render={({ field }) => ( <TextField {...field} label="Nome Completo" fullWidth error={!!errors.name} helperText={errors.name?.message} /> )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller name="email" control={control} render={({ field }) => ( <TextField {...field} label="Email" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} /> )}/>
            </Grid>
            {!isEditMode && (
              <Grid item xs={12}>
                <Controller name="password" control={control} render={({ field }) => ( <TextField {...field} label="Senha" type="password" fullWidth error={!!errors.password} helperText={errors.password?.message} /> )}/>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Nível</InputLabel>
                <Controller name="coachLevel" control={control} render={({ field }) => (
                  <Select {...field} label="Nível">
                    {Object.keys(CoachLevel).map(level => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                )}/>
              </FormControl>
            </Grid>
             <Grid item xs={12} sm={6}>
              <Controller name="experience" control={control} render={({ field }) => ( <TextField {...field} label="Experiência" fullWidth error={!!errors.experience} helperText={errors.experience?.message} /> )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller name="bio" control={control} render={({ field }) => ( <TextField {...field} label="Bio" multiline rows={3} fullWidth /> )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller name="certifications" control={control} render={({ field }) => ( <TextField {...field} label="Certificações (separadas por vírgula)" fullWidth /> )}/>
            </Grid>
          </Grid>

          {isEditMode && (
            <>
              <Divider sx={{ my: 3 }} />

              {/* Planos Vinculados */}
              <Box>
                <Typography variant="h6" gutterBottom>Planos Vinculados</Typography>
                {linkedPlans.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {linkedPlans.map(({ plan }) => (
                      <Chip
                        key={plan.id}
                        label={plan.name}
                        onDelete={() => handleUnlinkPlan(plan.id)}
                        deleteIcon={<DeleteIcon />}
                        disabled={internalLoading}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">Nenhum plano vinculado.</Typography>
                )}
              </Box>

              {/* Modalidades Vinculadas */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Modalidades Vinculadas</Typography>
                {linkedModalities.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {linkedModalities.map(({ modalidade }) => (
                      <Chip
                        key={modalidade.id}
                        label={modalidade.name}
                        onDelete={() => handleUnlinkModality(modalidade.id)}
                        deleteIcon={<DeleteIcon />}
                        disabled={internalLoading}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">Nenhuma modalidade vinculada.</Typography>
                )}
              </Box>
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