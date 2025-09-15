'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  AttachMoney,
  Assignment,
  CalendarMonth,
  Star,
  Lightbulb,
  CheckCircle,
  List as ListIcon
} from '@mui/icons-material';
import { enduranceApi } from '../../../services/enduranceApi';
import { Plan, Modalidade, User, PaymentMethod, PlanPeriod, EnrollmentFee, UserType } from '../../../types/api';
import PlanRegistrationForm from '../../../components/PlanRegistration/PlanRegistrationForm';
import PublicLayout from '../../../components/PublicLayout';

const steps = [
  'Dados de Acesso',
  'Dados Pessoais', 
  'Dados de Endereço',
  'Seleção de Treinador',
  'Checkout'
];

export default function PlanRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(-1); // -1 para mostrar o card do plano primeiro
  const [enrollmentFee, setEnrollmentFee] = useState<EnrollmentFee | null>(null);

  useEffect(() => {
    const loadPlanData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar dados do plano
        const planData = await enduranceApi.getPlan(planId);
        setPlan(planData);

        // Carregar modalidades
        const modalidadesData = await enduranceApi.getModalidades({ isActive: true });
        setModalidades(modalidadesData.data);

        // Carregar treinadores
        const coachesData = await enduranceApi.getCoaches({ 
          userType: UserType.COACH,
          isActive: true 
        });
        setCoaches(coachesData.data);

        // Carregar taxa de matrícula
        const feeData = await enduranceApi.getActiveEnrollmentFee();
        setEnrollmentFee(feeData);

      } catch (err: any) {
        console.error('Erro ao carregar dados do plano:', err);
        setError('Plano não encontrado ou não está disponível para venda.');
      } finally {
        setLoading(false);
      }
    };

    if (planId) {
      loadPlanData();
    }
  }, [planId]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      setActiveStep(-1); // Voltar para o card do plano
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  const handleStartRegistration = () => {
    setActiveStep(0); // Começar no primeiro passo
  };

  const handleRegistrationComplete = () => {
    // Redirecionar para login após cadastro bem-sucedido
    router.push('/login?message=registration-success');
  };

  if (loading) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </PublicLayout>
    );
  }

  if (error || !plan) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Plano não encontrado'}
          </Alert>
          <Box sx={{ textAlign: 'center' }}>
            <Button variant="contained" onClick={() => router.push('/')}>
              Voltar ao Início
            </Button>
          </Box>
        </Container>
      </PublicLayout>
    );
  }

  if (!plan.forSale) {
    return (
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Este plano não está disponível para venda no momento.
          </Alert>
          <Box sx={{ textAlign: 'center' }}>
            <Button variant="contained" onClick={() => router.push('/')}>
              Voltar ao Início
            </Button>
          </Box>
        </Container>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {activeStep === -1 ? (
          // Card do Plano - Primeira tela
          <Card sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h3" component="h1" gutterBottom color="primary" fontWeight="bold">
                {plan.name}
              </Typography>
              
              {plan.description && (
                <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 3 }}>
                  {plan.description}
                </Typography>
              )}

              {/* Modalidades */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Modalidades Incluídas:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {plan.modalidades.map(({ modalidade }) => (
                    <Chip 
                      key={modalidade.id} 
                      label={modalidade.name} 
                      color="primary" 
                      variant="filled"
                      sx={{ fontSize: '0.9rem', py: 2, px: 1 }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Features do Plano */}
              {plan.features && plan.features.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                    <ListIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      O que está incluído
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {plan.features
                      .filter(planFeature => planFeature.isActive)
                      .map((planFeature, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Box sx={{ 
                            p: 2, 
                            bgcolor: 'grey.50', 
                            borderRadius: 2, 
                            border: '1px solid', 
                            borderColor: 'grey.200',
                            height: '100%'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <CheckCircle sx={{ color: 'success.main', fontSize: '1.2rem', mt: 0.5, flexShrink: 0 }} />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold" color="text.primary" gutterBottom>
                                  {planFeature.feature.name}
                                </Typography>
                                {planFeature.feature.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {planFeature.feature.description}
                                  </Typography>
                                )}
                                {planFeature.feature.quantity && (
                                  <Typography variant="caption" color="primary" fontWeight="medium">
                                    {planFeature.feature.quantity} unidades incluídas
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              )}

              {/* Preços */}
              <Box sx={{ mb: 4, p: 4, bgcolor: 'grey.50', borderRadius: 3, border: '2px solid', borderColor: 'primary.light' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                  <AttachMoney sx={{ fontSize: '2rem', color: 'primary.main' }} />
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    Investimento
                  </Typography>
                </Box>
                
                {/* Preço Principal */}
                <Box sx={{ textAlign: 'center', mb: 3, p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'primary.main' }}>
                  <Typography variant="h3" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
                    A partir de R$ {plan.prices && plan.prices.length > 0 ? Math.min(...plan.prices.map(p => parseFloat(p.price.toString()))).toFixed(2) : '0.00'}/mês
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    *Valor varia conforme periodicidade escolhida
                  </Typography>
                </Box>

                {/* Taxa de Matrícula */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <Assignment sx={{ fontSize: '1.5rem', color: 'secondary.main' }} />
                    <Typography variant="h6" color="text.primary">
                      Taxa de Matrícula
                    </Typography>
                  </Box>
                  <Typography variant="h5" color="secondary.main" fontWeight="bold">
                    R$ {enrollmentFee ? enrollmentFee.amount.toFixed(2) : '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Taxa única paga no momento da contratação
                  </Typography>
                </Box>

                {/* Lista de Preços por Periodicidade */}
                {plan.prices && plan.prices.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                      <CalendarMonth sx={{ fontSize: '2rem', color: 'primary.main' }} />
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        Opções de Pagamento
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
                      {plan.prices.map((price, index) => {
                        const isRecommended = price.period === 'MONTHLY';
                        return (
                          <Box 
                            key={index} 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              p: 2,
                              bgcolor: isRecommended ? 'primary.light' : 'white',
                              borderRadius: 2,
                              border: isRecommended ? '2px solid' : '1px solid',
                              borderColor: isRecommended ? 'primary.main' : 'grey.300',
                              position: 'relative'
                            }}
                          >
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {price.period === 'WEEKLY' && <CalendarMonth sx={{ fontSize: '1.2rem', color: isRecommended ? 'white' : 'primary.main' }} />}
                                {price.period === 'BIWEEKLY' && <CalendarMonth sx={{ fontSize: '1.2rem', color: isRecommended ? 'white' : 'primary.main' }} />}
                                {price.period === 'MONTHLY' && <Star sx={{ fontSize: '1.2rem', color: 'white' }} />}
                                {price.period === 'QUARTERLY' && <CalendarMonth sx={{ fontSize: '1.2rem', color: isRecommended ? 'white' : 'primary.main' }} />}
                                {price.period === 'SEMIANNUALLY' && <CalendarMonth sx={{ fontSize: '1.2rem', color: isRecommended ? 'white' : 'primary.main' }} />}
                                {price.period === 'YEARLY' && <CalendarMonth sx={{ fontSize: '1.2rem', color: isRecommended ? 'white' : 'primary.main' }} />}
                                <Typography 
                                  variant="h6" 
                                  fontWeight="bold"
                                  color={isRecommended ? 'white' : 'text.primary'}
                                >
                                  {price.period === 'WEEKLY' && 'Semanal'}
                                  {price.period === 'BIWEEKLY' && 'Quinzenal'}
                                  {price.period === 'MONTHLY' && 'Mensal (Recomendado)'}
                                  {price.period === 'QUARTERLY' && 'Trimestral'}
                                  {price.period === 'SEMIANNUALLY' && 'Semestral'}
                                  {price.period === 'YEARLY' && 'Anual'}
                                </Typography>
                              </Box>
                              <Typography 
                                variant="body2" 
                                color={isRecommended ? 'white' : 'text.secondary'}
                              >
                                {price.period === 'WEEKLY' && 'Pagamento semanal'}
                                {price.period === 'BIWEEKLY' && 'Pagamento a cada 15 dias'}
                                {price.period === 'MONTHLY' && 'Pagamento mensal'}
                                {price.period === 'QUARTERLY' && 'Pagamento trimestral'}
                                {price.period === 'SEMIANNUALLY' && 'Pagamento semestral'}
                                {price.period === 'YEARLY' && 'Pagamento anual'}
                              </Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography 
                                variant="h4" 
                                color={isRecommended ? 'white' : 'primary'} 
                                fontWeight="bold"
                              >
                                R$ {parseFloat(price.price.toString()).toFixed(2)}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color={isRecommended ? 'white' : 'text.secondary'}
                              >
                                por {price.period === 'WEEKLY' && 'semana'}
                                {price.period === 'BIWEEKLY' && 'quinzena'}
                                {price.period === 'MONTHLY' && 'mês'}
                                {price.period === 'QUARTERLY' && 'trimestre'}
                                {price.period === 'SEMIANNUALLY' && 'semestre'}
                                {price.period === 'YEARLY' && 'ano'}
                              </Typography>
                            </Box>
                            {isRecommended && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  bgcolor: 'primary.main',
                                  color: 'white',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                RECOMENDADO
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* Informações Adicionais */}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 2, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <Lightbulb sx={{ fontSize: '1.2rem', color: 'white' }} />
                    <Typography variant="body2" color="white" fontWeight="medium">
                      <strong>Dica:</strong> Quanto maior a periodicidade, maior o desconto! 
                      A opção anual oferece a melhor relação custo-benefício.
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Botão de Início */}
              <Button
                variant="contained"
                size="large"
                onClick={handleStartRegistration}
                sx={{ 
                  py: 2, 
                  px: 6, 
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 2
                }}
              >
                Começar Cadastro
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Formulário de Cadastro
          <>
            {/* Stepper */}
            <Paper sx={{ p: 3, mb: 4 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>

            {/* Formulário de Cadastro */}
            <Paper sx={{ p: 3 }}>
              <PlanRegistrationForm
                plan={plan}
                modalidades={modalidades}
                coaches={coaches}
                activeStep={activeStep}
                onNext={handleNext}
                onBack={handleBack}
                onComplete={handleRegistrationComplete}
              />
            </Paper>
          </>
        )}
      </Container>
    </PublicLayout>
  );
}
