'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  useTheme,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  QuestionAnswer as QuestionIcon,
  ArrowForward as ArrowIcon,
  Psychology as QuizIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { User } from '../../types/api';
import CoachSelectionScreen from './CoachSelectionScreen';
import CoachMatcher from './CoachMatcher';

interface CoachMatcherWithSelectionProps {
  onComplete?: (selectedCoach: User) => void;
}

type CoachScreenType = 'initial' | 'selection' | 'quiz';

const CoachMatcherWithSelection: React.FC<CoachMatcherWithSelectionProps> = ({ onComplete }) => {
  const theme = useTheme();
  const [currentScreen, setCurrentScreen] = useState<CoachScreenType>('quiz'); // Iniciar diretamente no quiz
  const [loading, setLoading] = useState(false);

  const handleKnowsCoach = () => {
    setCurrentScreen('selection');
  };

  const handleDoesntKnowCoach = () => {
    setCurrentScreen('quiz');
  };

  const handleBackToInitial = () => {
    setCurrentScreen('initial');
  };

  const handleCoachSelected = (coach: User) => {
    if (onComplete) {
      onComplete(coach);
    }
  };

  const handleQuizCoachSelected = (coach: User) => {
    if (onComplete) {
      onComplete(coach);
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
          Você sabe qual treinador escolher?
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Pode escolher diretamente um treinador específico ou usar nossa calculadora para descobrir 
          qual treinador melhor combina com seu perfil.
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
            onClick={handleKnowsCoach}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Sim, eu sei
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Quero ver todos os treinadores disponíveis e escolher diretamente
              </Typography>
              
              <Button 
                variant="contained" 
                fullWidth
                endIcon={<ArrowIcon />}
                sx={{ fontWeight: 'bold' }}
              >
                Ver Todos os Treinadores
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
            onClick={handleDoesntKnowCoach}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <QuizIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Não, preciso de ajuda
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Usar a calculadora para descobrir qual treinador é ideal para mim
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
              <Button onClick={handleDoesntKnowCoach} variant="outlined" size="small">
                Usar Quiz
              </Button>
            </Box>
            
            <CoachSelectionScreen
              onCoachSelected={handleCoachSelected}
              onBack={handleBackToInitial}
            />
          </Box>
        );
      
      case 'quiz':
        return (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button onClick={handleKnowsCoach} variant="outlined" size="small">
                ← Escolher Manualmente
              </Button>
            </Box>
            
            <CoachMatcher onComplete={handleQuizCoachSelected} />
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

export default CoachMatcherWithSelection; 