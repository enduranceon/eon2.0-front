'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  useTheme,
  IconButton,
  Fade,
  Zoom,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  RestartAlt as RestartIcon,
} from '@mui/icons-material';

export interface QuizQuestion {
  id: string;
  title: string;
  description?: string;
  options: QuizOption[];
  type?: 'single' | 'multiple';
}

export interface QuizOption {
  id: string;
  label: string;
  description?: string;
  value: any;
  icon?: React.ReactNode;
}

export interface QuizResult {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  data?: any;
}

interface QuizBaseProps {
  title: string;
  subtitle: string;
  questions: QuizQuestion[];
  onComplete: (answers: Record<string, any>) => QuizResult;
  onRestart?: () => void;
  showProgress?: boolean;
  icon?: React.ReactNode;
  autoAdvance?: boolean;
}

export default function QuizBase({
  title,
  subtitle,
  questions,
  onComplete,
  onRestart,
  showProgress = true,
  icon,
  autoAdvance = false,
}: QuizBaseProps) {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const isLastQuestion = currentStep === questions.length - 1;
  const canGoNext = answers[currentQuestion?.id] !== undefined;

  const handleStart = () => {
    setIsStarted(true);
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
  };

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));

    // Auto-advance to next question if enabled
    if (autoAdvance) {
      setTimeout(() => {
        if (isLastQuestion) {
          const quizResult = onComplete({
            ...answers,
            [questionId]: value,
          });
          setResult(quizResult);
        } else {
          setCurrentStep(prev => prev + 1);
        }
      }, 600); // Delay para mostrar a seleção
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const quizResult = onComplete(answers);
      setResult(quizResult);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setIsStarted(false);
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    onRestart?.();
  };

  // Tela inicial
  if (!isStarted && !result) {
    return (
      <Card
        sx={{
          maxWidth: 600,
          mx: 'auto',
          p: 4,
          textAlign: 'center',
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <CardContent>
          {icon && (
            <Box sx={{ fontSize: 80, mb: 2, color: 'white' }}>
              {icon}
            </Box>
          )}
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
            {title}
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.9)' }}>
            {subtitle}
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: 'rgba(255, 255, 255, 0.8)' }}>
            Leva apenas {Math.ceil(questions.length / 2)} minuto{questions.length > 2 ? 's' : ''}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleStart}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Começar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Tela de resultado
  if (result) {
    return (
      <Zoom in timeout={600}>
        <Card sx={{ maxWidth: 800, mx: 'auto', p: 4 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            {result.icon && (
              <Box sx={{ fontSize: 80, mb: 2, color: theme.palette.primary.main }}>
                {result.icon}
              </Box>
            )}
            <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
              {result.title}
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
              {result.description}
            </Typography>
            
            {result.data && (
              <Box sx={{ mb: 4 }}>
                {result.data}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<RestartIcon />}
                onClick={handleRestart}
              >
                Refazer o teste
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Zoom>
    );
  }

  // Verificar se há perguntas disponíveis
  if (!questions || questions.length === 0) {
    return (
      <Card sx={{ maxWidth: 700, mx: 'auto', p: 4, textAlign: 'center' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="text.primary">
            Ops! Não há perguntas disponíveis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Por favor, tente novamente mais tarde.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card sx={{ maxWidth: 700, mx: 'auto', p: 4, textAlign: 'center' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="text.primary">
            Carregando pergunta...
          </Typography>
          <CircularProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  // Tela de pergunta
  return (
    <Card sx={{ maxWidth: 700, mx: 'auto' }}>
      {showProgress && (
        <Box sx={{ p: 2, pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Pergunta {currentStep + 1} de {questions.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: (theme) => theme.palette.grey[300],
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
              },
            }}
          />
        </Box>
      )}

      <CardContent sx={{ p: 4 }}>
        <Fade in key={currentStep} timeout={300}>
          <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
              {currentQuestion?.title || 'Carregando pergunta...'}
            </Typography>
            {currentQuestion?.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {currentQuestion.description}
              </Typography>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
              {currentQuestion?.options?.map((option) => (
                <Card
                  key={option.id}
                  onClick={() => handleAnswer(currentQuestion.id, option.value)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: 2,
                    borderColor: answers[currentQuestion.id] === option.value
                      ? 'primary.main'
                      : 'rgba(0, 0, 0, 0.12)',
                    backgroundColor: answers[currentQuestion.id] === option.value
                      ? `${theme.palette.primary.main}15`
                      : theme.palette.background.paper,
                    boxShadow: answers[currentQuestion.id] === option.value
                      ? theme.shadows[2]
                      : theme.shadows[1],
                    '&:hover': {
                      borderColor: 'primary.light',
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {option.icon && (
                        <Box sx={{ color: 'primary.main', fontSize: 24 }}>
                          {option.icon}
                        </Box>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="medium" color="text.primary">
                          {option.label}
                        </Typography>
                        {option.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {option.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: autoAdvance ? 'flex-start' : 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handlePrevious}
                disabled={currentStep === 0}
                sx={{
                  color: 'text.primary',
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                Anterior
              </Button>

              {!autoAdvance && (
                <Button
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleNext}
                  disabled={!canGoNext}
                  sx={{
                    px: 4,
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '&:disabled': {
                      backgroundColor: 'rgba(0, 0, 0, 0.12)',
                      color: 'rgba(0, 0, 0, 0.26)',
                    },
                  }}
                >
                  {isLastQuestion ? 'Finalizar' : 'Próximo'}
                </Button>
              )}
              
              {autoAdvance && canGoNext && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  Avançando automaticamente...
                </Typography>
              )}
            </Box>
          </Box>
        </Fade>
      </CardContent>
    </Card>
  );
} 