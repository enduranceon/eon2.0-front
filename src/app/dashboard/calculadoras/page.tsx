'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  Fade,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Person as CoachIcon,
  Payment as CheckoutIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import PlanCalculatorWithSelection from '../../../components/Quiz/PlanCalculatorWithSelection';
import CoachMatcherWithSelection from '../../../components/Quiz/CoachMatcherWithSelection';
import { useAuth } from '../../../contexts/AuthContext';
import { User } from '../../../types/api';
import { useRouter } from 'next/navigation';

type OnboardingStep = 'plan' | 'coach' | 'completed';

interface OnboardingState {
  step: OnboardingStep;
  selectedPlan?: {
    type: 'essencial' | 'premium';
    modalidade: 'corrida' | 'triathlon';
    answers: Record<string, any>;
  };
  selectedCoach?: User;
}

const steps = [
  {
    label: 'Escolher Plano',
    icon: <CalculateIcon />,
    description: 'Descubra seu plano ideal'
  },
  {
    label: 'Escolher Treinador', 
    icon: <CoachIcon />,
    description: 'Encontre seu treinador perfeito'
  },
  {
    label: 'Finalizar',
    icon: <CheckoutIcon />,
    description: 'Complete sua inscrição'
  }
];

export default function CalculadorasPage() {
  const theme = useTheme();
  const auth = useAuth();
  const router = useRouter();
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    step: 'plan'
  });

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      router.replace('/login');
    }
  }, [auth.isAuthenticated, auth.user, router]);

  // Limpar dados de onboarding antigos ao entrar na página
  const clearOldOnboardingData = () => {
    const keysToCheck = [
      'onboarding_selected_plan',
      'onboarding_selected_coach', 
      'onboarding_step_1_completed',
      'onboarding_step_2_completed'
    ];
    
    const savedUserId = localStorage.getItem('onboarding_user_id');
    if (savedUserId && savedUserId !== auth.user.id) {
      // Dados pertencem a outro usuário, limpar tudo
      [...keysToCheck, 'onboarding_user_id'].forEach(key => localStorage.removeItem(key));
      console.error('🧹 Dados de onboarding de outro usuário removidos');
      return;
    }
    
    // Verificar se existe dados completos salvos
    const hasPlan = localStorage.getItem('onboarding_selected_plan');
    const hasCoach = localStorage.getItem('onboarding_selected_coach');
    
    // Se não tem ambos, limpar tudo para começar fresh
    if (!hasPlan || !hasCoach) {
      keysToCheck.forEach(key => localStorage.removeItem(key));
      console.error('🧹 Dados de onboarding parciais limpos - iniciando fluxo do zero');
    }
  };

  // Verificar se há dados salvos no localStorage
  useEffect(() => {
    // Primeiro, limpar dados parciais
    clearOldOnboardingData();
    
    const savedPlan = localStorage.getItem('onboarding_selected_plan');
    const savedCoach = localStorage.getItem('onboarding_selected_coach');
    
          if (savedPlan && savedCoach) {
        // Se já tem plano e treinador salvos, ir direto para checkout
        router.push('/onboarding/checkout');
        return;
      }
      
      // SEMPRE começar pelo plano para garantir fluxo correto
      setOnboardingState(prev => ({ ...prev, step: 'plan' }));
  }, [router]);

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  // Callback quando plano é selecionado
  const handlePlanSelected = (planData: any) => {
    localStorage.setItem('onboarding_selected_plan', JSON.stringify(planData.plan));
    localStorage.setItem('onboarding_selected_modalidade', JSON.stringify(planData.modalidade));
    localStorage.setItem('onboarding_step_1_completed', 'true');
    
    setOnboardingState(prev => ({
      ...prev,
      selectedPlan: planData,
      step: 'coach'
    }));
  };

  // Callback quando treinador é selecionado  
  const handleCoachSelected = (coach: User) => {
    localStorage.setItem('onboarding_selected_coach_id', coach.id);
    localStorage.setItem('onboarding_step_2_completed', 'true');
    
    setOnboardingState(prev => ({
      ...prev,
      selectedCoach: coach,
      step: 'completed'
    }));
  };

  const getActiveStep = () => {
    switch (onboardingState.step) {
      case 'plan': return 0;
      case 'coach': return 1;
      case 'completed': return 2;
      default: return 0;
    }
  };

  // Aguarda autenticação antes de renderizar layout completo
  if (!auth.isAuthenticated || !auth.user) {
    return null;
  }

  return (
    <DashboardLayout user={auth.user} onLogout={handleLogout}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Configure sua Conta
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vamos configurar sua experiência personalizada em apenas 2 passos
          </Typography>
        </Box>

        {/* Stepper de progresso */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Stepper activeStep={getActiveStep()} alternativeLabel>
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepLabel 
                    icon={step.icon}
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontWeight: 'bold',
                        '&.Mui-active': {
                          color: theme.palette.primary.main,
                        },
                      },
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {step.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Conteúdo baseado no step atual */}
        <Fade in timeout={600}>
          <Box>
            {onboardingState.step === 'plan' && (
              <PlanCalculatorWrapper onPlanSelected={handlePlanSelected} />
            )}
            
            {onboardingState.step === 'coach' && (
              <CoachMatcherWrapper onCoachSelected={handleCoachSelected} />
            )}
          </Box>
        </Fade>
      </Container>
    </DashboardLayout>
  );
}

// Wrapper para PlanCalculator com callback personalizado
function PlanCalculatorWrapper({ onPlanSelected }: { onPlanSelected: (planData: any) => void }) {
  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
          📊 Passo 1: Descobrir seu Plano Ideal
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Responda algumas perguntas para encontrarmos o plano que melhor se adapta ao seu perfil
        </Typography>
        <PlanCalculatorWithSelection onPlanSelected={onPlanSelected} />
      </CardContent>
    </Card>
  );
}

// Wrapper para CoachMatcher com callback personalizado
function CoachMatcherWrapper({ onCoachSelected }: { onCoachSelected: (coach: User) => void }) {
  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
          🎯 Passo 2: Encontrar seu Treinador Ideal
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Agora vamos encontrar o treinador que melhor combina com seu perfil e objetivos
        </Typography>
        <CoachMatcherWithSelection onComplete={onCoachSelected} />
      </CardContent>
    </Card>
  );
} 