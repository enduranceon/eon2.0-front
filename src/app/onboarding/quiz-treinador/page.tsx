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
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { UserType, User } from '../../../types/api';
import CoachMatcher from '../../../components/Quiz/CoachMatcher';
import OnboardingStepper from '../../../components/Onboarding/OnboardingStepper';
import { 
  DirectionsRun as RunIcon,
  ArrowForward as ArrowIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';

export default function QuizTreinadorPage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();
  
  const [loading, setLoading] = useState(false);

  // Verificar se usuário está autenticado e é aluno
  React.useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      router.push('/login');
      return;
    }

    if (auth.user.userType !== UserType.FITNESS_STUDENT) {
      router.push('/dashboard');
      return;
    }

    // Se já completou onboarding, redirecionar
    if (auth.user.onboardingCompleted) {
      router.push('/dashboard');
      return;
    }

    // Verificar se completou etapa anterior
    const step1Completed = localStorage.getItem('onboarding_step_1_completed');
    if (!step1Completed) {
      router.push('/onboarding/quiz-plano');
      return;
    }
  }, [auth.isAuthenticated, auth.user, router]);

  const handleCoachSelected = (coach: User) => {
    setLoading(true);
    
    // Salvar ID do treinador selecionado
    localStorage.setItem('onboarding_selected_coach_id', coach.id);
    
    // Marcar etapa como completa
    localStorage.setItem('onboarding_step_2_completed', 'true');
    
    // Redirecionar para próxima etapa (checkout)
    router.push('/onboarding/checkout');
  };

  const handleBack = () => {
    router.push('/onboarding/quiz-plano');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
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
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              mb: 2,
            }}
          >
            <RunIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h3" fontWeight="bold" color="white" gutterBottom>
            Escolha seu Treinador
          </Typography>
          <Typography variant="h6" color="rgba(255, 255, 255, 0.9)" sx={{ mb: 3 }}>
            Encontre o coach ideal para sua jornada
          </Typography>
        </Box>

        {/* Stepper */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <OnboardingStepper
              activeStep={1}
              userType="FITNESS_STUDENT"
            />
          </CardContent>
        </Card>

        {/* Quiz de Treinador */}
        <Box sx={{ mb: 4 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                  Match de Treinador
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Responda algumas perguntas para encontrarmos o treinador que melhor combina com você
                </Typography>
              </Box>
              
              <CoachMatcher onComplete={handleCoachSelected} />
              
            </CardContent>
          </Card>
        </Box>

        {/* Informações adicionais */}
        <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Como funciona o match?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nosso algoritmo considera sua personalidade, objetivos e preferências de comunicação 
              para conectar você com o treinador que melhor se adapta ao seu perfil.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
} 