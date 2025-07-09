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
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

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

  // Outros useEffects...
  const loadInitialData = async () => {
    try {
      setDataLoading(true);
      setError(null);
      const [plansData, modalidadesData, coachesData] = await Promise.all([
        enduranceApi.getPlans(),
        enduranceApi.getModalidades(),
        enduranceApi.getUsers({ userType: UserType.COACH })
      ]);
      setPlans(plansData.data);
      setModalidades(modalidadesData.data);
      setCoaches(coachesData.data);

      const savedPlanId = localStorage.getItem('onboarding_selected_plan');
      const savedModalidadeId = localStorage.getItem('onboarding_selected_modalidade');
      const savedCoachId = localStorage.getItem('onboarding_selected_coach_id');

      if (savedPlanId) {
        const plan = plansData.data.find(p => p.id === savedPlanId);
        if (plan) setSelectedPlan(plan);
      }
      if (savedModalidadeId) {
        const modalidade = modalidadesData.data.find(m => m.id === savedModalidadeId);
        if (modalidade) setSelectedModalidade(modalidade);
      }
      if (savedCoachId) {
        const coach = coachesData.data.find(c => c.id === savedCoachId);
        if (coach) setSelectedCoach(coach);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

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
      };

      if (paymentMethod === PaymentMethod.CREDIT_CARD) {
        checkoutData.creditCard = formData.creditCard;
        checkoutData.creditCardHolderInfo = formData.creditCardHolderInfo;
        checkoutData.remoteIp = remoteIp;
      }

      const result = await enduranceApi.checkout(checkoutData);
      setPaymentResult(result);

      if (result.paymentStatus === 'CONFIRMED') {
        enqueueSnackbar('Pagamento aprovado com sucesso!', { variant: 'success' });
        localStorage.setItem('onboarding_step_3_completed', 'true');
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
         enqueueSnackbar('Pagamento pendente. Siga as instruções.', { variant: 'info' });
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
    return priceInfo?.price || 0;
  };
  
  const getPeriodLabel = (p: PlanPeriod) => {
    switch (p) {
      case PlanPeriod.MONTHLY: return 'Mensal';
      case PlanPeriod.QUARTERLY: return 'Trimestral';
      case PlanPeriod.SEMIANNUALLY: return 'Semestral';
      case PlanPeriod.YEARLY: return 'Anual';
      default: return p;
    }
  };

  if (dataLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (paymentResult) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: 'center', py: 5 }}>
        {paymentResult.paymentMethod === PaymentMethod.PIX && (
          <Card>
            <CardContent>
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
                    <Typography variant="body1" color="text.secondary" paragraph>Sua assinatura está ativa! Você será redirecionado em instantes.</Typography>
                </CardContent>
             </Card>
        )}
         <Button onClick={() => router.push('/dashboard')} sx={{ mt: 4 }}>Ir para o Dashboard</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <OnboardingStepper activeStep={2} />
      <Typography variant="h4" align="center" gutterBottom sx={{ mt: 4 }}>
        Finalize sua Assinatura
      </Typography>

      <Grid container spacing={4} mt={2}>
        <Grid item xs={12} md={7}>
            <Typography variant="h6">Forma de Pagamento</Typography>
            <RadioGroup row value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                <FormControlLabel value={PaymentMethod.PIX} control={<Radio />} label={<Chip icon={<PixIcon/>} label="PIX" variant="outlined" sx={{ p: 2 }} />} />
                <FormControlLabel value={PaymentMethod.CREDIT_CARD} control={<Radio />} label={<Chip icon={<CardIcon/>} label="Cartão de Crédito" variant="outlined" sx={{ p: 2 }} />} />
                <FormControlLabel value={PaymentMethod.BOLETO} control={<Radio />} label={<Chip icon={<BoletoIcon/>} label="Boleto" variant="outlined" sx={{ p: 2 }} />} />
            </RadioGroup>

            {paymentMethod === PaymentMethod.CREDIT_CARD && (
                <form id="checkout-form" onSubmit={handleSubmit(handlePayment)}>
                    <CheckoutCreditCardForm control={control} />
                </form>
            )}
            
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Grid>

        <Grid item xs={12} md={5}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Resumo do Pedido</Typography>
              <List>
                <ListItem>
                  <ListItemIcon><RunIcon /></ListItemIcon>
                  <ListItemText primary="Plano" secondary={selectedPlan?.name || 'N/A'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><RunIcon /></ListItemIcon>
                  <ListItemText primary="Modalidade" secondary={selectedModalidade?.name || 'N/A'} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SecurityIcon /></ListItemIcon>
                  <ListItemText primary="Treinador" secondary={selectedCoach?.name || 'Qualquer treinador da modalidade'} />
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <ListItem>
                    <FormControl fullWidth>
                        <InputLabel>Periodicidade</InputLabel>
                        <Select value={period} label="Periodicidade" onChange={e => setPeriod(e.target.value as PlanPeriod)}>
                            {selectedPlan?.prices.map(p => (
                                <MenuItem key={p.period} value={p.period}>{getPeriodLabel(p.period)} - R$ {p.price.toFixed(2)}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </ListItem>
              </List>
              <Box sx={{ p: 2, textAlign: 'right' }}>
                <Typography variant="h5">Total: R$ {getCurrentPrice().toFixed(2)}</Typography>
              </Box>
            </CardContent>
          </Card>
           <Button
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 3, py: 2 }}
              onClick={paymentMethod === 'CREDIT_CARD' ? handleSubmit(handlePayment) : () => handlePayment({} as any)}
              disabled={loading}
            >
              {loading ? <CircularProgress color="inherit" size={28} /> : `Pagar com ${paymentMethod}`}
            </Button>
        </Grid>
      </Grid>
    </Container>
  );
} 