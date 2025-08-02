'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  useTheme,
  Alert,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { UserType, CoachLevel } from '../../../types/api';
import OnboardingStepper from '../../../components/Onboarding/OnboardingStepper';
import { 
  DirectionsRun as RunIcon,
  ArrowForward as ArrowIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const specialties = [
  'Corrida de Rua',
  'Corrida de Montanha',
  'Triathlon',
  'Natação',
  'Ciclismo',
  'Fitness Geral',
  'Emagrecimento',
  'Ganho de Massa',
  'Condicionamento',
  'Reabilitação',
];

export default function CoachProfilePage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    experience: '',
    certifications: '',
    specialties: [] as string[],
    weeklyRate: '',
    monthlyRate: '',
    availability: '',
  });

  // Verificar se usuário está autenticado e é treinador
  React.useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      router.push('/login');
      return;
    }

    if (auth.user.userType !== UserType.COACH) {
      // Redirecionar para dashboard específico baseado no tipo de usuário
      if (auth.user.userType === UserType.ADMIN) {
        router.push('/dashboard/admin');
      } else if (auth.user.userType === UserType.FITNESS_STUDENT) {
        router.push('/dashboard/aluno');
      } else {
        router.push('/login');
      }
      return;
    }

    // Se já completou onboarding, redirecionar
    if (auth.user.onboardingCompleted) {
      router.push('/dashboard/coach');
      return;
    }


  }, [auth.isAuthenticated, auth.user, router]);

  const handleChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Salvar dados do perfil (por enquanto localStorage)
      localStorage.setItem('coach_profile_data', JSON.stringify(formData));
      localStorage.setItem('onboarding_completed', 'true');
      
      // Redirecionar para dashboard
      router.push('/dashboard/coach?welcome=true');
      
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.bio && formData.experience && formData.specialties.length > 0;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100],
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.1)',
              color: 'text.primary',
              mb: 2,
            }}
          >
            <PersonIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h3" fontWeight="bold" color="text.primary" gutterBottom>
            Complete seu Perfil
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Conte-nos sobre sua experiência como treinador
          </Typography>
        </Box>

        {/* Stepper */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <OnboardingStepper
              activeStep={0}
              userType="COACH"
            />
          </CardContent>
        </Card>

        {/* Aviso sobre acesso restrito */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Acesso Restrito:</strong> Esta página é destinada apenas para treinadores 
                que foram cadastrados pelo administrador do sistema. Se você chegou aqui por engano, 
                será redirecionado para o dashboard.
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Perfil Profissional
            </Typography>
            
            <Grid container spacing={3}>
              {/* Biografia */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Biografia"
                  multiline
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange('bio')}
                  placeholder="Conte um pouco sobre você, sua paixão pelo esporte e motivação para treinar pessoas..."
                  helperText="Máximo 500 caracteres"
                  inputProps={{ maxLength: 500 }}
                />
              </Grid>

              {/* Experiência */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Experiência Profissional"
                  multiline
                  rows={3}
                  value={formData.experience}
                  onChange={handleChange('experience')}
                  placeholder="Descreva sua experiência como treinador, principais conquistas e tempo de atuação..."
                />
              </Grid>

              {/* Certificações */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Certificações e Cursos"
                  multiline
                  rows={2}
                  value={formData.certifications}
                  onChange={handleChange('certifications')}
                  placeholder="Liste suas principais certificações, cursos e formações na área..."
                />
              </Grid>

              {/* Especialidades */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Especialidades
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Selecione suas áreas de especialização:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {specialties.map((specialty) => (
                    <Chip
                      key={specialty}
                      label={specialty}
                      onClick={() => handleSpecialtyToggle(specialty)}
                      color={formData.specialties.includes(specialty) ? 'primary' : 'default'}
                      variant={formData.specialties.includes(specialty) ? 'filled' : 'outlined'}
                      clickable
                    />
                  ))}
                </Box>
              </Grid>

              {/* Disponibilidade */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Disponibilidade"
                  value={formData.availability}
                  onChange={handleChange('availability')}
                  placeholder="Ex: Segunda a sexta das 6h às 18h, sábados pela manhã..."
                />
              </Grid>

              {/* Valores */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Taxa Semanal (R$)"
                  type="number"
                  value={formData.weeklyRate}
                  onChange={handleChange('weeklyRate')}
                  placeholder="0,00"
                  helperText="Valor por semana de acompanhamento"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Taxa Mensal (R$)"
                  type="number"
                  value={formData.monthlyRate}
                  onChange={handleChange('monthlyRate')}
                  placeholder="0,00"
                  helperText="Valor por mês de acompanhamento"
                />
              </Grid>
            </Grid>

            {/* Informações */}
            <Alert severity="info" sx={{ mt: 4, mb: 3 }}>
              <Typography variant="body2">
                <strong>Importante:</strong> Essas informações serão exibidas para os alunos 
                durante o processo de match. Seja claro e detalhado para atrair os melhores alunos!
              </Typography>
            </Alert>

            {/* Botões */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={loading || !isFormValid}
                endIcon={<ArrowIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  minWidth: 200,
                }}
              >
                {loading ? 'Salvando...' : 'Finalizar Cadastro'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Benefícios */}
        <Card sx={{ mt: 4, bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Benefícios da Endurance On
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Plataforma completa para gerenciar seus alunos, receber pagamentos automatizados 
              e ter acesso a ferramentas profissionais de treinamento.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
} 