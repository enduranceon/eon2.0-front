'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  useTheme,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import {
  QuestionAnswer as QuestionIcon,
  ArrowForward as ArrowIcon,
  Calculate as CalculateIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { enduranceApi } from '../../services/enduranceApi';
import { Plan, Modalidade, PlanPeriod } from '../../types/api';
import PlanSelectionScreen from './PlanSelectionScreen';
import PlanCalculator from './PlanCalculator';

interface PlanCalculatorWithSelectionProps {
  onPlanSelected?: (planData: any) => void;
}

type PlanScreenType = 'initial' | 'selection' | 'quiz';

const PlanCalculatorWithSelection: React.FC<PlanCalculatorWithSelectionProps> = ({ onPlanSelected }) => {
  const theme = useTheme();
  const [currentScreen, setCurrentScreen] = useState<PlanScreenType>('quiz'); // Iniciar diretamente no quiz
  const [loading, setLoading] = useState(false);

  const handleKnowsPlan = () => {
    setCurrentScreen('selection');
  };

  const handleDoesntKnowPlan = () => {
    setCurrentScreen('quiz');
  };

  const handleBackToInitial = () => {
    setCurrentScreen('initial');
  };

  const handlePlanSelected = (planData: any) => {
    if (onPlanSelected) {
      onPlanSelected(planData);
    }
  };

  const handleQuizComplete = (planData: any) => {
    if (onPlanSelected) {
      onPlanSelected(planData);
    }
  };

  // Tela inicial com a pergunta
  const renderInitialScreen = () => (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'white',
            mb: 3,
          }}
        >
          <QuestionIcon sx={{ fontSize: 40 }} />
        </Box>
        
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Você sabe qual plano escolher?
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Pode escolher diretamente um plano específico ou usar nossa calculadora para descobrir 
          qual plano melhor atende às suas necessidades.
        </Typography>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} sm={6} md={5}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
            }}
            onClick={handleKnowsPlan}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Sim, eu sei
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Quero ver todos os planos disponíveis e escolher diretamente
              </Typography>
              
              <Button 
                variant="contained" 
                fullWidth
                endIcon={<ArrowIcon />}
                sx={{ fontWeight: 'bold' }}
              >
                Ver Todos os Planos
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={5}>
          <Card 
            sx={{ 
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[8],
              },
            }}
            onClick={handleDoesntKnowPlan}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CalculateIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Não, preciso de ajuda
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Usar a calculadora para descobrir qual plano é ideal para mim
              </Typography>
              
              <Button 
                variant="outlined" 
                fullWidth
                endIcon={<ArrowIcon />}
                sx={{ fontWeight: 'bold' }}
              >
                Usar Calculadora
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Renderizar tela baseada no estado atual
  const renderCurrentScreen = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      );
    }

    switch (currentScreen) {
      case 'initial':
        return renderInitialScreen();
      
      case 'selection':
        return (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button onClick={handleBackToInitial} variant="outlined" size="small">
                ← Voltar
              </Button>
              <Button onClick={handleDoesntKnowPlan} variant="outlined" size="small">
                Usar Quiz
              </Button>
            </Box>
            
            <PlanSelectionScreen
              onPlanSelected={handlePlanSelected}
              onBack={handleBackToInitial}
            />
          </Box>
        );
      
      case 'quiz':
        return (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button onClick={handleBackToInitial} variant="outlined" size="small">
                ← Escolher Manualmente
              </Button>
            </Box>
            
            <PlanCalculator onPlanSelected={handleQuizComplete} />
          </Box>
        );
      
      default:
        return renderInitialScreen();
    }
  };

  return (
    <Box>
      {renderCurrentScreen()}
    </Box>
  );
};

export default PlanCalculatorWithSelection; 