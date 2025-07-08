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
  Fade,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { UserType } from '../../../types/api';
import PlanCalculator from '../../../components/Quiz/PlanCalculator';
import OnboardingStepper from '../../../components/Onboarding/OnboardingStepper';
import { 
  DirectionsRun as RunIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';

export default function QuizPlanoPage() {
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
  }, [auth.isAuthenticated, auth.user, router]);

  const handlePlanSelected = (planData: any) => {
    setLoading(true);

    // Salvar plano e modalidade selecionados
    localStorage.setItem('onboarding_selected_plan', JSON.stringify(planData.plan));
    localStorage.setItem('onboarding_selected_modalidade', JSON.stringify({ id: planData.modalidadeId, name: planData.modalidade }));
    
    // Marcar etapa 1 como completa
    localStorage.setItem('onboarding_step_1_completed', 'true');
    
    // Redirecionar para próxima etapa (calculadora de treinadores)
    router.push('/onboarding/quiz-treinador');
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
            Bem-vindo, {auth.user?.name?.split(' ')[0]}!
          </Typography>
          <Typography variant="h6" color="rgba(255, 255, 255, 0.9)" sx={{ mb: 3 }}>
            Vamos descobrir o plano ideal para você
          </Typography>
        </Box>

        {/* Stepper */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <OnboardingStepper
              activeStep={0}
              userType="FITNESS_STUDENT"
            />
          </CardContent>
        </Card>

        {/* Quiz de Plano */}
        <Box sx={{ mb: 4 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                  Calculadora de Planos
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Descubra o plano ideal para seus objetivos respondendo a algumas perguntas.
                </Typography>
              </Box>
              
              <PlanCalculator onPlanSelected={handlePlanSelected} />
              
            </CardContent>
          </Card>
        </Box>

        {/* Informações adicionais */}
        <Card sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)' }}>
          <CardContent sx={{ textAlign: 'center', p: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Por que fazer o quiz?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nosso algoritmo analisa seus objetivos, experiência e preferências para 
              recomendar o plano que melhor se adapta ao seu perfil e estilo de vida.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
} 