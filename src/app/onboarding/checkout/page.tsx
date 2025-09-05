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
  IconButton,
  Tooltip,
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
  CheckoutResponse,
  CouponDiscountResponse,
  EnrollmentFee,
} from '../../../types/api';
import OnboardingStepper from '../../../components/Onboarding/OnboardingStepper';
import { enduranceApi } from '../../../services/enduranceApi';
import CheckoutCreditCardForm, { checkoutCardSchema, CheckoutCardFormData } from '../../../components/Forms/CheckoutCreditCardForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  DirectionsRun as RunIcon,
  ArrowForward as ArrowIcon,
  ArrowBack as BackIcon,
  Check as CheckIcon,
  CreditCard as CardIcon,
  Pix as PixIcon,
  Receipt as BoletoIcon,
  ContentCopy as ContentCopyIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import CountdownTimer from '../../../components/CountdownTimer';
import { clearStorageAndRedirectToLogin, savePaymentForVerification } from '../../../utils/paymentUtils';

export default function CheckoutPage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedModalidade, setSelectedModalidade] = useState<Modalidade | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<User | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [period, setPeriod] = useState<PlanPeriod>(PlanPeriod.MONTHLY);
  const [remoteIp, setRemoteIp] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<'AVISTA' | 'PARCELADO'>('AVISTA');
  const [installmentCount, setInstallmentCount] = useState<number>(0);
  
  // Estados para cupom e taxa de matrícula
  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<CouponDiscountResponse | null>(null);
  const [enrollmentFee, setEnrollmentFee] = useState<EnrollmentFee | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  
  const [paymentResult, setPaymentResult] = useState<CheckoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<CheckoutCardFormData>({
    resolver: zodResolver(checkoutCardSchema),
    defaultValues: {
      creditCard: { holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '' },
      creditCardHolderInfo: { name: '', email: '', cpfCnpj: '', postalCode: '', addressNumber: '', phone: '' }
    }
  });

  useEffect(() => {
    // Buscar IP do cliente
    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setRemoteIp(data.ip);
      } catch (err) {
        console.error("Falha ao obter IP do cliente:", err);
        setError("Não foi possível obter o seu endereço de IP, necessário para pagamentos com cartão.");
      }
    };
    fetchIp();
  }, []);

  // Definir valor padrão para parcelas quando a opção "Parcelado" for selecionada
  useEffect(() => {
    if (paymentOption === 'PARCELADO' && installmentCount === 0) {
      const maxInstallments = getMaxInstallments(period);
      if (maxInstallments > 1) {
        setInstallmentCount(2); // Valor padrão de 2 parcelas
      }
    } else if (paymentOption === 'AVISTA') {
      setInstallmentCount(0);
    }
  }, [paymentOption, period, installmentCount]);

  // Outros useEffects...
  const loadInitialData = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      const [plansData, modalidadesData, coachesData] = await Promise.all([
        enduranceApi.getPlans(),
        enduranceApi.getModalidades(),
        enduranceApi.getCoaches()
      ]);
      
      setPlans(plansData.data);
      setModalidades(modalidadesData.data);
      setCoaches(coachesData.data);

      const savedPlanData = localStorage.getItem('onboarding_selected_plan');
      const savedModalidadeData = localStorage.getItem('onboarding_selected_modalidade');
      const savedCoachId = localStorage.getItem('onboarding_selected_coach_id');

      // Recuperar dados do localStorage
      if (savedPlanData) {
        try {
          const planData = JSON.parse(savedPlanData);
          
          const plan = plansData.data.find(p => p.id === planData.id);
          if (plan) {
            setSelectedPlan(plan);
            
            // Definir período padrão baseado no primeiro preço disponível
            if (plan.prices && plan.prices.length > 0) {
              setTimeout(() => {
                setPeriod(plan.prices[0].period);
              }, 0);
            }
          } else {
          }
        } catch (error) {
          console.error('❌ Erro ao recuperar plano do localStorage:', error);
        }
      } else {
      }

      // Recuperar modalidade do localStorage
      if (savedModalidadeData) {
        try {
          const modalidadeData = JSON.parse(savedModalidadeData);
          
          const modalidade = modalidadesData.data.find(m => m.id === modalidadeData.id);
          if (modalidade) {
            setSelectedModalidade(modalidade);
          } else {
            // Modalidade não encontrada na API
          }
        } catch (error) {
          // Erro ao recuperar modalidade do localStorage
        }
      }

      // Recuperar treinador do localStorage
      if (savedCoachId) {
        const coach = coachesData.data.find(c => c.id === savedCoachId);
        if (coach) {
          setSelectedCoach(coach);
        } else {
          // Treinador não encontrado na API
        }
      }

    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    loadEnrollmentFee();
  }, []);

  // Carregar taxa de matrícula ativa
  const loadEnrollmentFee = async () => {
    try {
      const fee = await enduranceApi.getActiveEnrollmentFee();
      setEnrollmentFee(fee);
    } catch (error) {
      console.error('Erro ao carregar taxa de matrícula:', error);
    }
  };

  // Validar cupom de desconto
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponDiscount(null);
      return;
    }

    if (!selectedPlan) {
      enqueueSnackbar('Selecione um plano primeiro', { variant: 'warning' });
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const planPrice = getCurrentPrice();
      const feeAmount = enrollmentFee?.amount || 0;
      
      const discount = await enduranceApi.checkCouponDiscount({
        code: couponCode.trim().toUpperCase(),
        planPrice,
        enrollmentFee: feeAmount
      });
      
      setCouponDiscount(discount);
      
      if (discount.isValid) {
        enqueueSnackbar('Cupom aplicado com sucesso!', { variant: 'success' });
      } else {
        enqueueSnackbar(discount.message, { variant: 'error' });
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      enqueueSnackbar('Erro ao validar cupom', { variant: 'error' });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Limpar cupom
  const clearCoupon = () => {
    setCouponCode('');
    setCouponDiscount(null);
  };

  // Ajustar parcelas com base na periodicidade e método de pagamento
  useEffect(() => {
    if (paymentMethod !== PaymentMethod.CREDIT_CARD) {
      setPaymentOption('AVISTA');
      setInstallmentCount(0);
      return;
    }
    
    // Para periodicidade mensal, sempre forçar pagamento à vista
    if (period === PlanPeriod.MONTHLY) {
      setPaymentOption('AVISTA');
      setInstallmentCount(0);
      return;
    }
    
    const max = getMaxInstallments(period);
    if (max <= 1) {
      setPaymentOption('AVISTA');
      setInstallmentCount(0);
      return;
    }
    if (paymentOption === 'PARCELADO') {
      setInstallmentCount(prev => {
        if (!prev || prev < 2) return Math.min(2, max);
        return Math.min(prev, max);
      });
    } else {
      setInstallmentCount(0);
    }
  }, [period, paymentMethod]);

  const handlePayment = async (formData: CheckoutCardFormData) => {
    if (!auth.user || !selectedPlan || !selectedModalidade) {
      setError('Dados da assinatura incompletos. Por favor, volte e selecione um plano.');
      return;
    }
    if (paymentMethod === PaymentMethod.CREDIT_CARD && !remoteIp) {
      setError("Seu endereço de IP não pôde ser verificado. Tente recarregar a página ou usar outro método de pagamento.");
      return;
    }
    setLoading(true);
    setPaymentResult(null);
    setError(null);
    
    try {
      const checkoutData: any = {
        userId: auth.user.id,
        planId: selectedPlan.id,
        modalidadeId: selectedModalidade.id,
        coachId: selectedCoach?.id,
        billingType: paymentMethod,
        period: period,
        enrollmentFee: enrollmentFee?.amount,
        discountCoupon: couponDiscount?.isValid ? couponCode : undefined,
      };

      if (paymentMethod === PaymentMethod.CREDIT_CARD) {
        checkoutData.installmentCount = paymentOption === 'PARCELADO' ? installmentCount : 0;
        checkoutData.creditCard = formData.creditCard;
        checkoutData.creditCardHolderInfo = formData.creditCardHolderInfo;
        checkoutData.remoteIp = remoteIp;
      }

      const result = await enduranceApi.checkout(checkoutData);
      setPaymentResult(result);

      // Salvar dados do pagamento para verificação posterior
      if (result.paymentId && auth.user?.id) {
        savePaymentForVerification(result.paymentId, auth.user.id);
      }

      if (result.paymentStatus === 'CONFIRMED') {
        enqueueSnackbar('Pagamento aprovado com sucesso!', { variant: 'success' });
        localStorage.setItem('onboarding_step_3_completed', 'true');
        // Para cartão de crédito confirmado, redirecionar diretamente para dashboard
        if (paymentMethod === PaymentMethod.CREDIT_CARD) {
          setTimeout(() => router.push('/dashboard/aluno'), 5000);
        }
      } else {
        enqueueSnackbar('Pagamento pendente. Siga as instruções.', { variant: 'info' });
        
        // Para cartão de crédito pendente, redirecionar para tela de processamento
        if (paymentMethod === PaymentMethod.CREDIT_CARD) {
          setTimeout(() => {
            router.push('/payment-processing');
          }, 2000);
        }
      }

    } catch (err: any) {
      console.error('Erro no checkout:', err);
      const message = err.response?.data?.message || 'Ocorreu um erro ao processar seu pagamento.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar('Código PIX copiado!', { variant: 'success' });
  };
  
  const getCurrentPrice = () => {
    const priceInfo = selectedPlan?.prices.find(p => p.period === period);
    const basePrice = Number(priceInfo?.price || 0);
    
    if (couponDiscount?.isValid) {
      return couponDiscount.discountedPlanPrice;
    }
    
    return basePrice;
  };

  const getEnrollmentFeeAmount = () => {
    if (couponDiscount?.isValid) {
      return couponDiscount.discountedEnrollmentFee;
    }
    
    return enrollmentFee?.amount || 0;
  };

  const getTotalAmount = () => {
    return getCurrentPrice() + getEnrollmentFeeAmount();
  };
  
  const getPeriodLabel = (p: PlanPeriod) => {
    switch (p) {
      case PlanPeriod.WEEKLY: return 'Semanal';
      case PlanPeriod.BIWEEKLY: return 'Quinzenal';
      case PlanPeriod.MONTHLY: return 'Mensal';
      case PlanPeriod.QUARTERLY: return 'Trimestral';
      case PlanPeriod.SEMIANNUALLY: return 'Semestral';
      case PlanPeriod.YEARLY: return 'Anual';
      default: return p;
    }
  };

  const getMaxInstallments = (p: PlanPeriod): number => {
    switch (p) {
      case PlanPeriod.WEEKLY: return 1;
      case PlanPeriod.BIWEEKLY: return 2;
      case PlanPeriod.MONTHLY: return 1; // Ocultar parcelamento para periodicidade mensal
      case PlanPeriod.QUARTERLY: return 3;
      case PlanPeriod.SEMIANNUALLY: return 6;
      case PlanPeriod.YEARLY: return 12;
      default: return 1;
    }
  };

  if (dataLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: (theme) =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100],
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleTimeout = () => {
    clearStorageAndRedirectToLogin(router);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      auth.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  if (paymentResult) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: (theme) =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100],
        }}
      >
        <Container maxWidth="sm" sx={{ textAlign: 'center', py: 5 }}>
          {paymentResult.paymentMethod === PaymentMethod.PIX && (
          <Card>
            <CardContent>
              {/* Contador de 5 minutos */}
              <CountdownTimer 
                minutes={5} 
                onTimeout={handleTimeout}
                title="Tempo para realizar o pagamento PIX"
              />
              
              <PixIcon sx={{ fontSize: 60, color: 'success.main' }} />
              <Typography variant="h5" gutterBottom>Pague com PIX para ativar sua assinatura</Typography>
              <img src={`data:image/png;base64,${paymentResult.pixQrCode}`} alt="PIX QR Code" style={{ maxWidth: 300, margin: '20px auto' }} />
              <Typography variant="body1" sx={{ mt: 2, wordBreak: 'break-all' }}>{paymentResult.pixCopyPaste}</Typography>
              <Button
                startIcon={<ContentCopyIcon />}
                onClick={() => copyToClipboard(paymentResult.pixCopyPaste || '')}
                sx={{ mt: 2 }}
              >
                Copiar Código
              </Button>
               <Typography color="text.secondary" sx={{ mt: 2 }}>Vencimento em: {new Date(paymentResult.dueDate).toLocaleDateString()}</Typography>
            </CardContent>
          </Card>
        )}
        {paymentResult.paymentMethod === PaymentMethod.BOLETO && (
          <Card>
            <CardContent>
              {/* Contador de 5 minutos */}
              <CountdownTimer 
                minutes={5} 
                onTimeout={handleTimeout}
                title="Tempo para acessar o boleto"
              />
              
               <BoletoIcon sx={{ fontSize: 60, color: 'info.main' }} />
              <Typography variant="h5" gutterBottom>Boleto Gerado</Typography>
              <Typography sx={{ mt: 2 }}>Clique no botão abaixo para visualizar e imprimir seu boleto. A confirmação pode levar até 2 dias úteis.</Typography>
              <Button
                variant="contained"
                href={paymentResult.bankSlipUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ mt: 3 }}
              >
                Visualizar Boleto
              </Button>
               <Typography color="text.secondary" sx={{ mt: 2 }}>Vencimento em: {new Date(paymentResult.dueDate).toLocaleDateString()}</Typography>
            </CardContent>
          </Card>
        )}
        {paymentResult.paymentStatus === 'CONFIRMED' && paymentResult.paymentMethod === 'CREDIT_CARD' && (
             <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <CheckIcon sx={{ fontSize: 80, color: theme.palette.success.main, mb: 2 }} />
                    <Typography variant="h4" gutterBottom>Pagamento Confirmado!</Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Sua assinatura está ativa! Você será redirecionado para o seu dashboard em até 5 segundos.
                    </Typography>
                    <Button variant="contained" onClick={() => router.push('/dashboard/aluno')}>
                      Ir agora para o Dashboard
                    </Button>
                </CardContent>
             </Card>
        )}
         <Button onClick={() => router.push('/dashboard/aluno')} sx={{ mt: 4 }}>Ir para o Dashboard</Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100],
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4, position: 'relative' }}>
          {/* Botão de Logout */}
          <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
            <Tooltip title="Sair">
              <IconButton
                onClick={handleLogout}
                disabled={loading}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'error.main',
                  },
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>

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
            <SecurityIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h3" fontWeight="bold" color="text.primary" gutterBottom>
            Finalize sua Assinatura
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
            Escolha sua forma de pagamento e conclua sua assinatura
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

        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} lg={10}>
            <Grid container spacing={4}>
              {/* Card de Forma de Pagamento */}
              <Grid item xs={12} md={7}>
                <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Forma de Pagamento
                    </Typography>
                    
                    <RadioGroup 
                      row 
                      value={paymentMethod} 
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      sx={{ mb: 3, gap: 2 }}
                    >
                      <FormControlLabel 
                        value={PaymentMethod.PIX} 
                        control={<Radio />} 
                        label={
                          <Chip 
                            icon={<PixIcon />} 
                            label="PIX" 
                            variant="outlined" 
                            sx={{ p: 2, minWidth: 120 }} 
                          />
                        } 
                      />
                      <FormControlLabel 
                        value={PaymentMethod.CREDIT_CARD} 
                        control={<Radio />} 
                        label={
                          <Chip 
                            icon={<CardIcon />} 
                            label="Cartão de Crédito" 
                            variant="outlined" 
                            sx={{ p: 2, minWidth: 120 }} 
                          />
                        } 
                      />
                      <FormControlLabel 
                        value={PaymentMethod.BOLETO} 
                        control={<Radio />} 
                        label={
                          <Chip 
                            icon={<BoletoIcon />} 
                            label="Boleto" 
                            variant="outlined" 
                            sx={{ p: 2, minWidth: 120 }} 
                          />
                        } 
                      />
                    </RadioGroup>

                    {paymentMethod === PaymentMethod.CREDIT_CARD && (
                      <Box sx={{ mt: 3 }}>
                        <form id="checkout-form" onSubmit={handleSubmit(handlePayment)}>
                          <CheckoutCreditCardForm control={control} />
                        </form>
                      </Box>
                    )}
                    
                    {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
                  </CardContent>
                </Card>
              </Grid>

              {/* Card de Resumo do Pedido */}
              <Grid item xs={12} md={5}>
                <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      Resumo do Pedido
                    </Typography>
                    
                    <List sx={{ py: 0 }}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><RunIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Plano" 
                          secondary={selectedPlan?.name || 'Nenhum plano selecionado'} 
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                          secondaryTypographyProps={{ 
                            color: selectedPlan ? 'text.secondary' : 'error.main',
                            fontWeight: selectedPlan ? 'normal' : 'medium'
                          }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><RunIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Modalidade" 
                          secondary={selectedModalidade?.name || 'Nenhuma modalidade selecionada'} 
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                          secondaryTypographyProps={{ 
                            color: selectedModalidade ? 'text.secondary' : 'error.main',
                            fontWeight: selectedModalidade ? 'normal' : 'medium'
                          }}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><SecurityIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Treinador" 
                          secondary={selectedCoach?.name || 'Qualquer treinador da modalidade'} 
                          primaryTypographyProps={{ fontWeight: 'medium' }}
                          secondaryTypographyProps={{ 
                            color: 'text.secondary',
                            fontStyle: selectedCoach ? 'normal' : 'italic'
                          }}
                        />
                      </ListItem>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <ListItem sx={{ px: 0 }}>
                        <FormControl fullWidth>
                          <InputLabel>Periodicidade</InputLabel>
                          <Select 
                            value={period} 
                            label="Periodicidade" 
                            onChange={e => setPeriod(e.target.value as PlanPeriod)}
                          >
                            {selectedPlan?.prices.map(p => (
                              <MenuItem key={p.period} value={p.period}>
                                {getPeriodLabel(p.period)} - R$ {Number(p.price).toFixed(2)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </ListItem>

                      {/* Seção de Cupom de Desconto */}
                      <Divider sx={{ my: 2 }} />
                      <ListItem sx={{ px: 0 }}>
                        <Box sx={{ width: '100%' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Cupom de Desconto
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <TextField
                              size="small"
                              placeholder="Digite o código do cupom"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              disabled={isValidatingCoupon}
                              sx={{ flex: 1 }}
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={validateCoupon}
                              disabled={isValidatingCoupon || !couponCode.trim()}
                            >
                              {isValidatingCoupon ? 'Validando...' : 'Aplicar'}
                            </Button>
                            {couponDiscount && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={clearCoupon}
                                color="error"
                              >
                                Limpar
                              </Button>
                            )}
                          </Box>
                          {couponDiscount && (
                            <Alert 
                              severity={couponDiscount.isValid ? 'success' : 'error'} 
                              sx={{ mt: 1 }}
                            >
                              {couponDiscount.isValid ? (
                                <>
                                  <Typography variant="body2">
                                    <strong>{couponDiscount.coupon.name}</strong> aplicado!
                                  </Typography>
                                  <Typography variant="body2">
                                    Desconto: R$ {couponDiscount.totalDiscount.toFixed(2)}
                                  </Typography>
                                </>
                              ) : (
                                <Typography variant="body2">
                                  {couponDiscount.message}
                                </Typography>
                              )}
                            </Alert>
                          )}
                        </Box>
                      </ListItem>

                      {paymentMethod === PaymentMethod.CREDIT_CARD && (
                        <>
                          <ListItem sx={{ px: 0, mt: 1 }}>
                            <ListItemText primary="Pagamento no Cartão" />
                          </ListItem>
                          <ListItem sx={{ px: 0 }}>
                            <RadioGroup
                              row
                              value={paymentOption}
                              onChange={(e) => {
                                const value = e.target.value as 'AVISTA' | 'PARCELADO';
                                
                                // Para periodicidade mensal, sempre forçar à vista
                                if (period === PlanPeriod.MONTHLY) {
                                  setPaymentOption('AVISTA');
                                  setInstallmentCount(0);
                                  return;
                                }
                                
                                const max = getMaxInstallments(period);
                                if (value === 'PARCELADO' && max <= 1) {
                                  setPaymentOption('AVISTA');
                                  setInstallmentCount(0);
                                } else {
                                  setPaymentOption(value);
                                  if (value === 'PARCELADO') {
                                    setInstallmentCount(prev => {
                                      if (!prev || prev < 2) return Math.min(2, max);
                                      return Math.min(prev, max);
                                    });
                                  } else {
                                    setInstallmentCount(0);
                                  }
                                }
                              }}
                              sx={{ gap: 2 }}
                            >
                              <FormControlLabel value="AVISTA" control={<Radio />} label="À vista" />
                              <FormControlLabel 
                                value="PARCELADO" 
                                control={<Radio />} 
                                label="Parcelado"
                                disabled={period === PlanPeriod.MONTHLY || getMaxInstallments(period) <= 1}
                              />
                            </RadioGroup>
                          </ListItem>
                          {paymentOption === 'PARCELADO' && getMaxInstallments(period) > 1 && (
                            <ListItem sx={{ px: 0 }}>
                              <FormControl fullWidth>
                                <InputLabel>Parcelas</InputLabel>
                                <Select
                                  value={installmentCount}
                                  label="Parcelas"
                                  onChange={(e) => setInstallmentCount(Number(e.target.value))}
                                >
                                  {Array.from({ length: Math.max(0, getMaxInstallments(period) - 1) }, (_, i) => i + 2).map((n) => (
                                    <MenuItem key={n} value={n}>{n}x</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </ListItem>
                          )}
                        </>
                      )}
                    </List>
                    
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Plano ({getPeriodLabel(period)})
                          </Typography>
                          <Typography variant="body2">
                            R$ {getCurrentPrice().toFixed(2)}
                          </Typography>
                        </Box>
                        
                        {enrollmentFee && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Taxa de Matrícula
                            </Typography>
                            <Typography variant="body2">
                              R$ {getEnrollmentFeeAmount().toFixed(2)}
                            </Typography>
                          </Box>
                        )}
                        
                        {couponDiscount?.isValid && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="success.main">
                              Desconto ({couponDiscount.coupon.name})
                            </Typography>
                            <Typography variant="body2" color="success.main">
                              -R$ {couponDiscount.totalDiscount.toFixed(2)}
                            </Typography>
                          </Box>
                        )}
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="h6" fontWeight="bold">
                            Total
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            R$ {getTotalAmount().toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                
                {/* Aviso se dados essenciais estão faltando */}
                {(!selectedPlan || !selectedModalidade) && (
                  <Alert severity="warning" sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Dados do onboarding incompletos
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Para continuar com o pagamento, você precisa selecionar um plano e uma modalidade.
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => router.push('/onboarding/quiz-plano')}
                    >
                      Completar Onboarding
                    </Button>
                  </Alert>
                )}
                
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{ mt: 3, py: 2, fontWeight: 'bold' }}
                  onClick={paymentMethod === 'CREDIT_CARD' ? handleSubmit(handlePayment) : () => handlePayment({} as any)}
                  disabled={loading || !selectedPlan || !selectedModalidade}
                >
                  {loading ? (
                    <CircularProgress color="inherit" size={28} />
                  ) : (
                    `Pagar com ${paymentMethod === PaymentMethod.PIX ? 'PIX' : 
                      paymentMethod === PaymentMethod.CREDIT_CARD ? 'Cartão' : 'Boleto'}`
                  )}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 