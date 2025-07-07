import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { 
  QuestionAnswer as QuizIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

interface OnboardingStepperProps {
  activeStep: number;
  userType: 'FITNESS_STUDENT' | 'COACH';
  isVertical?: boolean;
}

const OnboardingStepper: React.FC<OnboardingStepperProps> = ({ 
  activeStep, 
  userType, 
  isVertical = false 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const studentSteps = [
    {
      label: 'Quiz de Plano',
      description: 'Descubra seu plano ideal',
      icon: <QuizIcon />,
    },
    {
      label: 'Escolha de Treinador',
      description: 'Encontre seu coach perfeito',
      icon: <PersonIcon />,
    },
    {
      label: 'Pagamento',
      description: 'Finalize sua assinatura',
      icon: <PaymentIcon />,
    },
    {
      label: 'Concluído',
      description: 'Bem-vindo à Endurance On!',
      icon: <CheckIcon />,
    },
  ];

  const coachSteps = [
    {
      label: 'Perfil Profissional',
      description: 'Complete seu perfil',
      icon: <PersonIcon />,
    },
    {
      label: 'Configurações',
      description: 'Configure sua conta',
      icon: <QuizIcon />,
    },
    {
      label: 'Concluído',
      description: 'Pronto para receber alunos!',
      icon: <CheckIcon />,
    },
  ];

  const steps = userType === 'FITNESS_STUDENT' ? studentSteps : coachSteps;

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper
        activeStep={activeStep}
        orientation={isVertical || isMobile ? 'vertical' : 'horizontal'}
        sx={{
          '& .MuiStepLabel-root': {
            color: theme.palette.text.secondary,
          },
          '& .MuiStepLabel-label': {
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: 500,
          },
          '& .MuiStepIcon-root': {
            fontSize: isMobile ? '1.5rem' : '2rem',
            '&.Mui-active': {
              color: theme.palette.primary.main,
            },
            '&.Mui-completed': {
              color: theme.palette.success.main,
            },
          },
          '& .MuiStepConnector-line': {
            borderColor: theme.palette.divider,
            borderTopWidth: 2,
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              StepIconComponent={({ active, completed }) => (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40,
                    borderRadius: '50%',
                    backgroundColor: completed
                      ? theme.palette.success.main
                      : active
                      ? theme.palette.primary.main
                      : theme.palette.grey[300],
                    color: completed || active ? 'white' : theme.palette.grey[600],
                    transition: 'all 0.3s ease',
                    fontSize: isMobile ? '1rem' : '1.25rem',
                  }}
                >
                  {completed ? <CheckIcon /> : step.icon}
                </Box>
              )}
            >
              <Box>
                <Typography
                  variant={isMobile ? 'body2' : 'body1'}
                  fontWeight={activeStep === index ? 'bold' : 'medium'}
                  color={
                    activeStep === index
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary
                  }
                >
                  {step.label}
                </Typography>
                {!isMobile && (
                  <Typography
                    variant="caption"
                    color={theme.palette.text.secondary}
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {step.description}
                  </Typography>
                )}
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default OnboardingStepper; 