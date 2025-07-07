'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  useTheme,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  UserType, 
  PaymentMethod, 
  PlanPeriod, 
  Plan, 
  Modalidade, 
  User, 
  CheckoutRequest, 
  CheckoutResponse 
} from '../../../types/api';
import OnboardingStepper from '../../../components/Onboarding/OnboardingStepper';
import { enduranceApi } from '../../../services/enduranceApi';
import { 
  DirectionsRun as RunIcon,
  ArrowForward as ArrowIcon,
  ArrowBack as BackIcon,
  Check as CheckIcon,
  CreditCard as CardIcon,
  Pix as PixIcon,
  Receipt as BoletoIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

export default function CheckoutPage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedModalidade, setSelectedModalidade] = useState<Modalidade | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<User | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [period, setPeriod] = useState<PlanPeriod>(PlanPeriod.SEMIANNUAL);
  const [creditCardData, setCreditCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
    document: '',
    phone: '',
    postalCode: '',
    addressNumber: '',
  });
  const [paymentResult, setPaymentResult] = useState<CheckoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carrega dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Verificar se usuário está autenticado e é aluno
  useEffect(() => {
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

    // Verificar se completou etapas anteriores
    const step1Completed = localStorage.getItem('onboarding_step_1_completed');
    const step2Completed = localStorage.getItem('onboarding_step_2_completed');
    
    if (!step1Completed) {
      router.push('/onboarding/quiz-plano');
      return;
    }
    
    if (!step2Completed) {
      router.push('/onboarding/quiz-treinador');
      return;
    }
  }, [auth.isAuthenticated, auth.user, router]);

  const loadInitialData = async () => {
    try {
      setDataLoading(true);
      setError(null);

      // Carrega dados em paralelo
      const [plansData, modalidadesData, coachesData] = await Promise.all([
        enduranceApi.getPlans(),
        enduranceApi.getModalidades(),
        enduranceApi.getCoaches({ userType: UserType.COACH })
      ]);

      // Extrair dados dos arrays
      const plansArrayRaw = Array.isArray(plansData) ? plansData : plansData?.data || [];
      const normalizePrices = (plan: any) => {
        if (Array.isArray(plan.prices)) {
          const priceObj = {
            monthly: 0,
            quarterly: 0,
            semiannual: 0,
            annual: 0,
          } as any;
          plan.prices.forEach((p: any) => {
            const key = p.period?.toLowerCase();
            if (key) priceObj[key] = Number(p.price || p.amount || 0);
          });
          return { ...plan, prices: priceObj };
        }
        return plan;
      };
      const plansArray = plansArrayRaw.map(normalizePrices);
      const modalidadesArray = Array.isArray(modalidadesData) ? modalidadesData : modalidadesData?.data || [];
      const coachesArray = Array.isArray((coachesData as any)?.data) ? (coachesData as any).data : Array.isArray(coachesData) ? coachesData as any : [];
      
      setPlans(plansArray);
      setModalidades(modalidadesArray);
      setCoaches(coachesArray);

      // Recuperar seleções do localStorage
      const savedPlanRaw = localStorage.getItem('onboarding_selected_plan');
      let savedPlanId: string | null = null;
      try {
        if (savedPlanRaw) {
          const parsed = JSON.parse(savedPlanRaw);
          savedPlanId = typeof parsed === 'string' ? parsed : parsed.id;
        }
      } catch {
        savedPlanId = savedPlanRaw;
      }

      const savedModalidadeId = localStorage.getItem('onboarding_selected_modalidade');
      const savedCoachId = localStorage.getItem('onboarding_selected_coach_id');

      if (savedPlanId) {
        const plan = plansArray.find(p => p.id === savedPlanId);
        if (plan) setSelectedPlan(plan);
      }

      if (savedModalidadeId) {
        const modalidade = modalidadesArray.find(m => m.id === savedModalidadeId);
        if (modalidade) setSelectedModalidade(modalidade);
      }

      if (savedCoachId) {
        const coach = coachesArray.find((c: any) => c.id === savedCoachId);
        if (coach) setSelectedCoach(coach);
      }

      // Se não tiver seleções, usar padrões
      if (!selectedPlan && plansArray.length > 0) {
        setSelectedPlan(plansArray[0]);
      }

      if (!selectedModalidade && modalidadesArray.length > 0) {
        setSelectedModalidade(modalidadesArray[0]);
      }

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setDataLoading(false);
    }
  };

  const getCurrentPrice = () => {
    if (!selectedPlan || !selectedPlan.prices) return 0;
    const periodKey = period.toLowerCase();
    const price = (selectedPlan.prices as any)?.[periodKey] || 0;
    return Number(price);
  };

  const getDiscount = () => {
    if (period === 'SEMIANNUALLY') return 15;
    if (period === 'YEARLY') return 25;
    return 0;
  };

  const getTotalAmount = () => {
    const basePrice = getCurrentPrice();
    const discount = getDiscount();
    const discountAmount = (basePrice * discount) / 100;
    return basePrice - discountAmount;
  };

  const handlePayment = async () => {
    if (!auth.user || !selectedPlan || !selectedModalidade) {
      setError('Dados incompletos para processar pagamento');
      return;
    }

    setLoading(true);
    setPaymentResult(null);
    setError(null);
    
    try {
      // Validações de dados
      if (paymentMethod === PaymentMethod.CREDIT_CARD) {
        if (!creditCardData.holderName || !creditCardData.number || 
            !creditCardData.expiryMonth || !creditCardData.expiryYear || 
            !creditCardData.ccv || !creditCardData.document || 
            !creditCardData.phone || !creditCardData.postalCode || !creditCardData.addressNumber) {
          setError('Por favor, preencha todos os dados do cartão, incluindo CPF, telefone e endereço do titular.');
          setLoading(false);
          return;
        }
      }

      // Preparar dados do checkout
      const checkoutData: CheckoutRequest = {
        userId: auth.user.id,
        planId: selectedPlan.id,
        modalidadeId: selectedModalidade.id,
        coachId: localStorage.getItem('onboarding_selected_coach_id') || undefined,
        paymentMethod,
        period,
        creditCard: paymentMethod === PaymentMethod.CREDIT_CARD ? {
          holderName: creditCardData.holderName,
          number: creditCardData.number.replace(/\s/g, ''),
          expiryMonth: creditCardData.expiryMonth,
          expiryYear: creditCardData.expiryYear,
          ccv: creditCardData.ccv,
          holderEmail: auth.user.email,
          holderCpfCnpj: creditCardData.document,
          holderPostalCode: creditCardData.postalCode.replace(/\D/g, ''),
          holderAddressNumber: creditCardData.addressNumber,
          holderPhone: creditCardData.phone.replace(/\D/g, ''),
        } : undefined,
      };

      // Processar pagamento
      const result = await enduranceApi.checkout(checkoutData);
      
      setPaymentResult(result);

      // Se pagamento foi confirmado, completar onboarding
      if (result.status === 'CONFIRMED') {
        localStorage.setItem('onboarding_completed', 'true');
        localStorage.removeItem('onboarding_step_1_completed');
        localStorage.removeItem('onboarding_step_2_completed');
        localStorage.removeItem('onboarding_selected_plan');
        localStorage.removeItem('onboarding_selected_modalidade');
        localStorage.removeItem('onboarding_selected_coach_id');
        
        // Desloga e redireciona para login após 2s
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
      
    } catch (error: any) {
      console.error('Erro no pagamento:', error);
      setError(error?.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/onboarding/quiz-treinador');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getPeriodLabel = (p: PlanPeriod) => {
    switch (p) {
      case 'MONTHLY': return 'Mensal';
      case 'QUARTERLY': return 'Trimestral';
      case 'SEMIANNUALLY': return 'Semestral';
      case 'YEARLY': return 'Anual';
      default: return p;
    }
  };

  if (dataLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: theme.colors.gradient.primary,
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error && !selectedPlan) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: theme.colors.gradient.primary,
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={() => router.push('/onboarding/quiz-plano')}
            startIcon={<BackIcon />}
          >
            Voltar ao Quiz
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.colors.gradient.primary,
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
            Finalize sua Assinatura
          </Typography>
          <Typography variant="h6" color="rgba(255, 255, 255, 0.9)" sx={{ mb: 3 }}>
            Último passo para começar sua jornada!
          </Typography>
        </Box>

        {/* Stepper */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <OnboardingStepper
              activeStep={2}
              userType="FITNESS_STUDENT"
            />
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {paymentResult ? (
          // Resultado do pagamento
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              {paymentResult.success ? (
                <>
                  <CheckIcon
                    sx={{
                      fontSize: 80,
                      color: 'success.main',
                      mb: 2,
                    }}
                  />
                  <Typography variant="h4" gutterBottom>
                    {paymentResult.status === 'CONFIRMED' ? 'Pagamento Confirmado!' : 'Pagamento Processado!'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {paymentResult.status === 'CONFIRMED' 
                      ? 'Seu pagamento foi confirmado e você será redirecionado em instantes.'
                      : 'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.'
                    }
                  </Typography>
                  
                  {/* PIX QR Code */}
                  {paymentResult.pixQrCode && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" gutterBottom>
                        Pague com PIX
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <img 
                          src={`data:image/png;base64,${paymentResult.pixQrCode}`}
                          alt="QR Code PIX"
                          style={{ maxWidth: 200, height: 'auto' }}
                        />
                      </Box>
                      {paymentResult.pixCopyPaste && (
                        <TextField
                          fullWidth
                          value={paymentResult.pixCopyPaste}
                          label="Código PIX para copiar"
                          InputProps={{
                            readOnly: true,
                          }}
                          sx={{ maxWidth: 400, mb: 2 }}
                        />
                      )}
                    </Box>
                  )}

                  {/* Boleto URL */}
                  {paymentResult.bankSlipUrl && (
                    <Box sx={{ mt: 4 }}>
                      <Button
                        variant="outlined"
                        href={paymentResult.bankSlipUrl}
                        target="_blank"
                        startIcon={<BoletoIcon />}
                      >
                        Visualizar Boleto
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                <>
                  <Alert severity="error" sx={{ mb: 4 }}>
                    Falha no processamento do pagamento
                  </Alert>
                  <Button
                    variant="contained"
                    onClick={() => setPaymentResult(null)}
                  >
                    Tentar Novamente
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={4}>
            {/* Resumo do Pedido */}
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Resumo do Pedido
                  </Typography>
                  
                  {selectedPlan && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        {selectedPlan.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {selectedPlan.description}
                      </Typography>
                      
                      {selectedModalidade && (
                        <Chip 
                          label={selectedModalidade.name}
                          color="primary"
                          sx={{ mr: 1, mb: 2 }}
                        />
                      )}
                      
                      {selectedCoach && (
                        <Chip 
                          label={`Treinador: ${selectedCoach.name}`}
                          color="secondary"
                          sx={{ mb: 2 }}
                        />
                      )}

                      <List dense>
                        {(selectedPlan?.features || []).map((feature, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckIcon color="success" />
                            </ListItemIcon>
                            <ListItemText primary={feature} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  <Divider sx={{ mb: 3 }} />

                  {/* Seleção de Período */}
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Periodicidade</InputLabel>
                    <Select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value as PlanPeriod)}
                      label="Periodicidade"
                    >
                      <MenuItem value={PlanPeriod.MONTHLY}>Mensal</MenuItem>
                      <MenuItem value={PlanPeriod.QUARTERLY}>Trimestral</MenuItem>
                      <MenuItem value={PlanPeriod.SEMIANNUAL}>Semestral</MenuItem>
                      <MenuItem value={PlanPeriod.YEARLY}>Anual</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Método de Pagamento */}
                  <Typography variant="h6" gutterBottom>
                    Método de Pagamento
                  </Typography>
                  <RadioGroup
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    <FormControlLabel
                      value={PaymentMethod.PIX}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PixIcon sx={{ mr: 1 }} />
                          PIX - Aprovação Instantânea
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value={PaymentMethod.CREDIT_CARD}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CardIcon sx={{ mr: 1 }} />
                          Cartão de Crédito
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value={PaymentMethod.BOLETO}
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BoletoIcon sx={{ mr: 1 }} />
                          Boleto Bancário
                        </Box>
                      }
                    />
                  </RadioGroup>

                  {/* Campos do Cartão de Crédito */}
                  {paymentMethod === PaymentMethod.CREDIT_CARD && (
                    <Box sx={{ mt: 3, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <SecurityIcon sx={{ mr: 1 }} />
                        Dados do Cartão
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Nome no Cartão"
                            value={creditCardData.holderName}
                            onChange={(e) => setCreditCardData(prev => ({ ...prev, holderName: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="CPF do Titular"
                            value={creditCardData.document}
                            onChange={(e) => setCreditCardData(prev => ({ ...prev, document: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Telefone com DDD"
                            value={creditCardData.phone}
                            onChange={(e) => setCreditCardData(prev => ({ ...prev, phone: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="CEP"
                            value={creditCardData.postalCode}
                            onChange={(e) => setCreditCardData(prev => ({ ...prev, postalCode: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            label="Número"
                            value={creditCardData.addressNumber}
                            onChange={(e) => setCreditCardData(prev => ({ ...prev, addressNumber: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Número do Cartão"
                            value={creditCardData.number}
                            onChange={(e) => setCreditCardData(prev => ({ ...prev, number: e.target.value }))}
                            placeholder="0000 0000 0000 0000"
                            required
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <TextField
                            fullWidth
                            label="Mês (MM)"
                            value={creditCardData.expiryMonth}
                            onChange={(e) => setCreditCardData(prev => ({ ...prev, expiryMonth: e.target.value }))}
                            placeholder="MM"
                            required
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <TextField
                            fullWidth
                            label="Ano (AAAA)"
                            value={creditCardData.expiryYear}
                            onChange={(e) => setCreditCardData(prev => ({ ...prev, expiryYear: e.target.value }))}
                            placeholder="YYYY"
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField
                            fullWidth
                            label="CVV"
                            value={creditCardData.ccv}
                            onChange={(e) => setCreditCardData(prev => ({ ...prev, ccv: e.target.value }))}
                            placeholder="000"
                            required
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Resumo Financeiro */}
            <Grid item xs={12} md={4}>
              <Card sx={{ position: 'sticky', top: 20 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumo Financeiro
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {selectedPlan?.name} ({getPeriodLabel(period)})
                      </Typography>
                      <Typography variant="body2">
                        {formatPrice(getCurrentPrice())}
                      </Typography>
                    </Box>
                    
                    {getDiscount() > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="success.main">
                          Desconto ({getDiscount()}%)
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          -{formatPrice((getCurrentPrice() * getDiscount()) / 100)}
                        </Typography>
                      </Box>
                    )}

                    {selectedCoach && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          ✅ Split com treinador ativado
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h6">
                      Total
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatPrice(getTotalAmount())}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handlePayment}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                    sx={{ mb: 2 }}
                  >
                    {loading ? 'Processando...' : 'Finalizar Pagamento'}
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<BackIcon />}
                  >
                    Voltar
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
} 