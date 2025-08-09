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
import { validateAndFormatCpf, applyCpfMask } from '../../../utils/cpfUtils';

// Função para aplicar máscara de telefone
const applyPhoneMask = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) {
    return `(${digits}`;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
};

// Função para aplicar máscara de CEP
const applyCepMask = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 5) {
    return digits;
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  }
};

const coachSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres').optional(),
  cpfCnpj: z.string()
    .min(1, 'CPF é obrigatório')
    .refine((value) => {
      const validation = validateAndFormatCpf(value);
      return validation.isValid;
    }, 'CPF inválido'),
  phone: z.string()
    .min(1, 'Telefone é obrigatório')
    .min(14, 'Telefone deve ter pelo menos 10 dígitos')
    .refine((value) => {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 10;
    }, 'Telefone deve ter pelo menos 10 dígitos'),
  coachLevel: z.nativeEnum(CoachLevel).optional(),
  bio: z.string().optional(),
  experience: z.string().optional(),
  certifications: z.string().optional(), // Simplificando como string por agora
  // Campos de endereço obrigatórios
  address: z.object({
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    zipCode: z.string()
      .min(1, 'CEP é obrigatório')
      .min(8, 'CEP deve ter pelo menos 8 dígitos')
      .refine((value) => {
        const digits = value.replace(/\D/g, '');
        return digits.length >= 8;
      }, 'CEP deve ter pelo menos 8 dígitos'),
    city: z.string().optional(),
    state: z.string().optional(),
    complement: z.string().optional(),
  }),
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
    setValue,
    watch,
  } = useForm<CoachFormData>({
    resolver: zodResolver(coachSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      cpfCnpj: '',
      phone: '',
      coachLevel: CoachLevel.JUNIOR,
      bio: '',
      experience: '',
      certifications: '',
      address: {
        street: '',
        number: '',
        neighborhood: '',
        zipCode: '',
        city: '',
        state: '',
        complement: '',
      },
    },
  });

  // Observar mudanças nos campos para aplicar máscaras
  const cpfCnpjValue = watch('cpfCnpj');
  const phoneValue = watch('phone');
  const zipCodeValue = watch('address.zipCode');

  // Aplicar máscaras automaticamente
  useEffect(() => {
    if (cpfCnpjValue && !cpfCnpjValue.includes('.')) {
      const masked = applyCpfMask(cpfCnpjValue);
      if (masked !== cpfCnpjValue) {
        setValue('cpfCnpj', masked);
      }
    }
  }, [cpfCnpjValue, setValue]);

  useEffect(() => {
    if (phoneValue && !phoneValue.includes('(')) {
      const masked = applyPhoneMask(phoneValue);
      if (masked !== phoneValue) {
        setValue('phone', masked);
      }
    }
  }, [phoneValue, setValue]);

  useEffect(() => {
    if (zipCodeValue && !zipCodeValue.includes('-')) {
      const masked = applyCepMask(zipCodeValue);
      if (masked !== zipCodeValue) {
        setValue('address.zipCode', masked);
      }
    }
  }, [zipCodeValue, setValue]);

  React.useEffect(() => {
    if (open) {
      if (isEditMode && coach) {
        // Endereço pode vir como coach.address (legado) ou coach.addresses[0] (novo formato da API)
        const addressesArray = (coach as any).addresses as any[] | undefined;
        const sourceAddress = Array.isArray(addressesArray) && addressesArray.length > 0
          ? addressesArray[0]
          : coach.address;

        reset({
          name: coach.name,
          email: coach.email,
          cpfCnpj: coach.cpfCnpj ? applyCpfMask(coach.cpfCnpj) : '',
          phone: coach.phone || '',
          coachLevel: coach.coachLevel,
          bio: coach.bio || '',
          experience: (coach as any).experience || '', // Assuming experience is on User
          certifications: Array.isArray(coach.certifications) ? coach.certifications.join(', ') : '',
          address: {
            street: sourceAddress?.street || '',
            number: sourceAddress?.number || '',
            neighborhood: sourceAddress?.neighborhood || '',
            zipCode: sourceAddress?.zipCode ? applyCepMask(sourceAddress.zipCode) : '',
            city: sourceAddress?.city || '',
            state: sourceAddress?.state || '',
            complement: sourceAddress?.complement || '',
          },
        });
        setLinkedPlans(coach.coachPlans || []);
        setLinkedModalities(coach.coachModalidades || []);
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          cpfCnpj: '',
          phone: '',
          coachLevel: CoachLevel.JUNIOR,
          bio: '',
          experience: '',
          certifications: '',
          address: {
            street: '',
            number: '',
            neighborhood: '',
            zipCode: '',
            city: '',
            state: '',
            complement: '',
          },
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Treinador' : 'Cadastrar Novo Treinador'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {/* Informações Pessoais */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
            Informações Pessoais
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller 
                name="name" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Nome Completo *" 
                    fullWidth 
                    error={!!errors.name} 
                    helperText={errors.name?.message} 
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller 
                name="email" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Email *" 
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
                name="cpfCnpj" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="CPF *" 
                    fullWidth 
                    error={!!errors.cpfCnpj} 
                    helperText={errors.cpfCnpj?.message} 
                    placeholder="000.000.000-00"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller 
                name="phone" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Telefone *" 
                    fullWidth 
                    error={!!errors.phone} 
                    helperText={errors.phone?.message} 
                    placeholder="(00) 00000-0000"
                  />
                )}
              />
            </Grid>
            {!isEditMode && (
              <Grid item xs={12} sm={6}>
                <Controller 
                  name="password" 
                  control={control} 
                  render={({ field }) => (
                    <TextField 
                      {...field} 
                      label="Senha *" 
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

          {/* Endereço */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Endereço
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Controller 
                name="address.street" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Rua *" 
                    fullWidth 
                    error={!!errors.address?.street} 
                    helperText={errors.address?.street?.message} 
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller 
                name="address.number" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Número *" 
                    fullWidth 
                    error={!!errors.address?.number} 
                    helperText={errors.address?.number?.message} 
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller 
                name="address.neighborhood" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Bairro *" 
                    fullWidth 
                    error={!!errors.address?.neighborhood} 
                    helperText={errors.address?.neighborhood?.message} 
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller 
                name="address.zipCode" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="CEP *" 
                    fullWidth 
                    error={!!errors.address?.zipCode} 
                    helperText={errors.address?.zipCode?.message} 
                    placeholder="00000-000"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller 
                name="address.city" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Cidade" 
                    fullWidth 
                    error={!!errors.address?.city} 
                    helperText={errors.address?.city?.message} 
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller 
                name="address.state" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Estado" 
                    fullWidth 
                    error={!!errors.address?.state} 
                    helperText={errors.address?.state?.message} 
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller 
                name="address.complement" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Complemento" 
                    fullWidth 
                    error={!!errors.address?.complement} 
                    helperText={errors.address?.complement?.message} 
                  />
                )}
              />
            </Grid>
          </Grid>

          {/* Informações Profissionais */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Informações Profissionais
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Nível</InputLabel>
                <Controller 
                  name="coachLevel" 
                  control={control} 
                  render={({ field }) => (
                    <Select {...field} label="Nível">
                      {Object.keys(CoachLevel).map(level => (
                        <MenuItem key={level} value={level}>{level}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller 
                name="experience" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Experiência" 
                    fullWidth 
                    error={!!errors.experience} 
                    helperText={errors.experience?.message} 
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller 
                name="bio" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Bio" 
                    multiline 
                    rows={3} 
                    fullWidth 
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller 
                name="certifications" 
                control={control} 
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Certificações (separadas por vírgula)" 
                    fullWidth 
                  />
                )}
              />
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