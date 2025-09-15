'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Chip,
  Divider
} from '@mui/material';
import { Plan, Modalidade, User, PaymentMethod, PlanPeriod, Gender, EnrollmentFee, UserType } from '../../types/api';
import { enduranceApi } from '../../services/enduranceApi';
import { validateCpf } from '../../utils/cpfUtils';
import { geocodingService } from '../../services/geocodingService';
import { formStorageService } from '../../services/formStorageService';
import CheckoutCreditCardForm, { checkoutCardSchema, CheckoutCardFormData } from '../Forms/CheckoutCreditCardForm';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackbar } from 'notistack';
import CountdownTimer from '../CountdownTimer';
import { 
  Check as CheckIcon,
  CreditCard as CardIcon,
  Pix as PixIcon,
  Receipt as BoletoIcon,
  ContentCopy as ContentCopyIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

// Chave específica para o formulário de cadastro de planos
const PLAN_REGISTRATION_STORAGE_KEY = 'endurance_plan_registration_form_data';

// Funções específicas para persistência do formulário de cadastro de planos
const savePlanRegistrationData = (formData: FormData) => {
  try {
    localStorage.setItem(PLAN_REGISTRATION_STORAGE_KEY, JSON.stringify(formData));
  } catch (error) {
    console.error('Erro ao salvar dados do formulário de cadastro:', error);
  }
};

const loadPlanRegistrationData = (): FormData | null => {
  try {
    const stored = localStorage.getItem(PLAN_REGISTRATION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Erro ao carregar dados do formulário de cadastro:', error);
    return null;
  }
};

const clearPlanRegistrationData = () => {
  try {
    localStorage.removeItem(PLAN_REGISTRATION_STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar dados do formulário de cadastro:', error);
  }
};

interface FormData {
  // Dados de Acesso
  email: string;
  password: string;
  confirmPassword: string;
  
  // Dados Pessoais
  name: string;
  cpf: string;
  phone: string;
  birthDate: string;
  gender: Gender | '';
  
  // Dados de Endereço
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Seleção de Treinador
  coachId: string;
  
  // Checkout
  period: PlanPeriod;
  paymentMethod: PaymentMethod;
  couponCode: string;
}

interface PlanRegistrationFormProps {
  plan: Plan;
  modalidades: Modalidade[];
  coaches: User[];
  activeStep: number;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
}

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const steps = [
  'Dados de Acesso',
  'Dados Pessoais', 
  'Dados de Endereço',
  'Seleção de Treinador',
  'Checkout'
];

export default function PlanRegistrationForm({
  plan,
  modalidades,
  coaches,
  activeStep,
  onNext,
  onBack,
  onComplete
}: PlanRegistrationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    cpf: '',
    phone: '',
    birthDate: '',
    gender: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    coachId: '',
    period: PlanPeriod.MONTHLY,
    paymentMethod: PaymentMethod.PIX,
    couponCode: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponValidation, setCouponValidation] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [enrollmentFee, setEnrollmentFee] = useState<EnrollmentFee | null>(null);
  const [paymentOption, setPaymentOption] = useState<'AVISTA' | 'PARCELADO'>('AVISTA');
  const [installmentCount, setInstallmentCount] = useState<number>(0);
  const [remoteIp, setRemoteIp] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // Hook para notificações
  const { enqueueSnackbar } = useSnackbar();

  // Hook do react-hook-form para cartão de crédito
  const cardForm = useForm<CheckoutCardFormData>({
    resolver: zodResolver(checkoutCardSchema),
    defaultValues: {
      creditCard: { holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '' },
      creditCardHolderInfo: { name: '', email: '', cpfCnpj: '', postalCode: '', addressNumber: '', phone: '' }
    }
  });
  
  const { control: cardControl, getValues: getCardValues, formState: { errors: cardErrors } } = cardForm;

  // Carregar taxa de matrícula ativa
  const loadEnrollmentFee = async () => {
    try {
      const fee = await enduranceApi.getActiveEnrollmentFee();
      setEnrollmentFee(fee);
    } catch (error) {
      console.error('Erro ao carregar taxa de matrícula:', error);
    }
  };

  // Função para calcular parcelas máximas
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

  // Carregar dados iniciais
  React.useEffect(() => {
    loadEnrollmentFee();
    
    // Carregar dados salvos do localStorage
    const savedData = loadPlanRegistrationData();
    if (savedData) {
      setFormData(savedData);
    }

    // Buscar IP do cliente
    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setRemoteIp(data.ip);
      } catch (error) {
        console.error('Erro ao buscar IP:', error);
      }
    };
    fetchIp();
  }, []);

  // Ajustar parcelas com base na periodicidade e método de pagamento
  React.useEffect(() => {
    if (formData.paymentMethod !== PaymentMethod.CREDIT_CARD) {
      setPaymentOption('AVISTA');
      setInstallmentCount(0);
      return;
    }
    
    // Para periodicidade mensal, sempre forçar pagamento à vista
    if (formData.period === PlanPeriod.MONTHLY) {
      setPaymentOption('AVISTA');
      setInstallmentCount(0);
      return;
    }
    
    const max = getMaxInstallments(formData.period);
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
  }, [formData.paymentMethod, formData.period, paymentOption]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    let formattedValue = value;
    
    // Aplicar máscaras
    if (field === 'cpf') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (field === 'phone') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (field === 'zipCode') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    
    const newFormData = { ...formData, [field]: formattedValue };
    setFormData(newFormData);
    savePlanRegistrationData(newFormData);
    setError(null);
  };

  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      setCepError('CEP deve ter 8 dígitos');
      return;
    }

    setCepLoading(true);
    setCepError(null);

    try {
      const result = await geocodingService.getAddressByCep(cleanCep);
      
      if (result.isValid) {
        const newFormData = {
          ...formData,
          street: result.street || '',
          neighborhood: result.neighborhood || '',
          city: result.city || '',
          state: result.state || ''
        };
        setFormData(newFormData);
        savePlanRegistrationData(newFormData);
        setCepError(null);
      } else {
        setCepError(result.message);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepError('Erro ao consultar CEP. Tente novamente.');
    } finally {
      setCepLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Dados de Acesso
        if (!formData.email || !formData.password || !formData.confirmPassword) {
          setError('Todos os campos são obrigatórios');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('As senhas não coincidem');
          return false;
        }
        if (formData.password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres');
          return false;
        }
        return true;

      case 1: // Dados Pessoais
        if (!formData.name || !formData.cpf || !formData.phone || !formData.birthDate || !formData.gender) {
          setError('Todos os campos são obrigatórios');
          return false;
        }
        if (!validateCpf(formData.cpf)) {
          setError('CPF inválido');
          return false;
        }
        return true;

      case 2: // Dados de Endereço
        if (!formData.street || !formData.number || !formData.neighborhood || 
            !formData.city || !formData.state || !formData.zipCode) {
          setError('Todos os campos obrigatórios devem ser preenchidos');
          return false;
        }
        return true;

      case 3: // Seleção de Treinador
        if (!formData.coachId) {
          setError('Selecione um treinador');
          return false;
        }
        return true;

      case 4: // Checkout
        // Modalidade é automaticamente definida pelo plano, não precisa validar
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      onNext();
    }
  };

  // Função para traduzir periodicidades
  const getPeriodLabel = (period: PlanPeriod) => {
    const periodLabels: Record<PlanPeriod, string> = {
      [PlanPeriod.WEEKLY]: 'Semanal',
      [PlanPeriod.BIWEEKLY]: 'Quinzenal',
      [PlanPeriod.MONTHLY]: 'Mensal',
      [PlanPeriod.QUARTERLY]: 'Trimestral',
      [PlanPeriod.SEMIANNUALLY]: 'Semestral',
      [PlanPeriod.YEARLY]: 'Anual'
    };
    return periodLabels[period] || period;
  };

  const handleCouponValidation = async () => {
    if (!formData.couponCode) return;

    try {
      const validation = await enduranceApi.validateCoupon(formData.couponCode);
      setCouponValidation(validation);
      if (!validation.isValid) {
        setCouponError(validation.message);
        // Limpar erro após 3 segundos
        setTimeout(() => {
          setCouponError(null);
        }, 3000);
      } else {
        setCouponError(null);
      }
    } catch (err) {
      setCouponError('Erro ao validar cupom');
      // Limpar erro após 3 segundos
      setTimeout(() => {
        setCouponError(null);
      }, 3000);
    }
  };

  // Função para lidar com timeout do PIX/Boleto
  const handlePaymentTimeout = () => {
    enqueueSnackbar('Tempo esgotado! Redirecionando para o login...', { variant: 'warning' });
    clearPlanRegistrationData();
    window.location.href = '/login?message=registration-success';
  };

  // Função para redirecionar manualmente para o login
  const handleGoToLogin = () => {
    clearPlanRegistrationData();
    window.location.href = '/login?message=registration-success';
  };

  // Função para copiar código PIX
  const handleCopyPixCode = () => {
    if (paymentResult?.pixCopyPaste) {
      navigator.clipboard.writeText(paymentResult.pixCopyPaste);
      enqueueSnackbar('Código PIX copiado!', { variant: 'success' });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Registrar usuário
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        userType: UserType.FITNESS_STUDENT,
        cpf: formData.cpf,
        phone: formData.phone,
        birthDate: formData.birthDate,
        gender: formData.gender as Gender,
        address: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        }
      };

      const registrationResponse = await enduranceApi.register(userData);
      
      // 2. Fazer checkout
      const checkoutData = {
        userId: registrationResponse.user.id,
        planId: plan.id,
        modalidadeId: plan.modalidades?.[0]?.modalidade?.id || '',
        coachId: formData.coachId,
        billingType: formData.paymentMethod,
        period: formData.period,
        enrollmentFee: enrollmentFee?.amount || 0,
        discountCoupon: formData.couponCode || undefined
      };

      // Adicionar dados específicos do cartão de crédito se necessário
      if (formData.paymentMethod === PaymentMethod.CREDIT_CARD) {
        // Obter dados do formulário de cartão
        const cardFormData = getCardValues();
        (checkoutData as any).installmentCount = paymentOption === 'PARCELADO' ? installmentCount : 0;
        (checkoutData as any).creditCard = cardFormData.creditCard;
        (checkoutData as any).creditCardHolderInfo = cardFormData.creditCardHolderInfo;
        (checkoutData as any).remoteIp = remoteIp;
      }

      const checkoutResponse = await enduranceApi.checkout(checkoutData);
      
      // 3. Processar resultado do pagamento
      setPaymentResult(checkoutResponse);
      setShowPaymentSuccess(true);
      
      // 4. Notificar sucesso
      enqueueSnackbar('Cadastro realizado com sucesso!', { variant: 'success' });
      
      // 5. Redirecionar baseado no método de pagamento
      if (formData.paymentMethod === PaymentMethod.PIX && checkoutResponse.pixQrCode) {
        // PIX - mostrar QR Code e código copia e cola
        enqueueSnackbar('PIX gerado! Complete o pagamento para ativar sua conta.', { variant: 'info' });
      } else if (formData.paymentMethod === PaymentMethod.BOLETO && checkoutResponse.bankSlipUrl) {
        // Boleto - mostrar link para download
        enqueueSnackbar('Boleto gerado! Baixe e pague para ativar sua conta.', { variant: 'info' });
      } else if (formData.paymentMethod === PaymentMethod.CREDIT_CARD) {
        // Cartão de crédito - pagamento aprovado
        enqueueSnackbar('Pagamento aprovado! Redirecionando para o login...', { variant: 'success' });
        // Redirecionar em 5 segundos
        setTimeout(() => {
          clearPlanRegistrationData();
          window.location.href = '/login?message=registration-success';
        }, 5000);
      }

    } catch (err: any) {
      console.error('Erro no cadastro:', err);
      setError(err.response?.data?.message || 'Erro ao processar cadastro');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentSuccess = () => {
    if (formData.paymentMethod === PaymentMethod.PIX && paymentResult.pixQrCode) {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            {/* Contador de 3 minutos */}
            <CountdownTimer 
              minutes={3} 
              onTimeout={handlePaymentTimeout}
              title="Tempo para pagamento PIX"
            />
            
            <PixIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>PIX Gerado com Sucesso!</Typography>
            <Typography sx={{ mb: 3 }}>
              Escaneie o QR Code ou copie o código para pagar via PIX. 
              Após o pagamento, sua conta será ativada automaticamente.
            </Typography>
            
            {/* QR Code */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
              <img 
                src={`data:image/png;base64,${paymentResult.pixQrCode}`} 
                alt="QR Code PIX" 
                style={{ maxWidth: '200px', height: 'auto' }}
              />
            </Box>
            
            {/* Código PIX Copia e Cola */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Código PIX (Copia e Cola)</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  value={paymentResult.pixCopyPaste || ''}
                  InputProps={{ readOnly: true }}
                  variant="outlined"
                  multiline
                  rows={3}
                />
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyPixCode}
                >
                  Copiar
                </Button>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              onClick={handleGoToLogin}
              sx={{ mt: 2 }}
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (formData.paymentMethod === PaymentMethod.BOLETO && paymentResult.bankSlipUrl) {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            {/* Contador de 3 minutos */}
            <CountdownTimer 
              minutes={3} 
              onTimeout={handlePaymentTimeout}
              title="Tempo para acessar o boleto"
            />
            
            <BoletoIcon sx={{ fontSize: 60, color: 'info.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>Boleto Gerado com Sucesso!</Typography>
            <Typography sx={{ mb: 3 }}>
              Clique no botão abaixo para visualizar e imprimir seu boleto. 
              A confirmação pode levar até 2 dias úteis.
            </Typography>
            
            <Button
              variant="contained"
              href={paymentResult.bankSlipUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mb: 2 }}
            >
              Visualizar Boleto
            </Button>
            
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Vencimento em: {new Date(paymentResult.dueDate).toLocaleDateString()}
            </Typography>
            
            <Button
              variant="outlined"
              onClick={handleGoToLogin}
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (formData.paymentMethod === PaymentMethod.CREDIT_CARD && paymentResult.paymentStatus === 'CONFIRMED') {
      return (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>Pagamento Aprovado!</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Sua assinatura está ativa! Você será redirecionado para o login em 5 segundos.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Se não for redirecionado automaticamente, clique no botão abaixo.
            </Typography>
            <Button
              variant="contained"
              onClick={handleGoToLogin}
              size="large"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Fallback para outros casos
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>Cadastro Realizado!</Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Seu cadastro foi realizado com sucesso!
          </Typography>
          <Button
            variant="contained"
            onClick={handleGoToLogin}
            size="large"
          >
            Ir para Login
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderStepContent = () => {
    // Se mostrar sucesso do pagamento, renderizar tela de sucesso
    if (showPaymentSuccess && paymentResult) {
      return renderPaymentSuccess();
    }

    switch (activeStep) {
      case 0: // Dados de Acesso
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Senha"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirmar Senha"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
              />
            </Grid>
          </Grid>
        );

      case 1: // Dados Pessoais
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CPF"
                value={formData.cpf}
                onChange={(e) => handleInputChange('cpf', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data de Nascimento"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <FormLabel>Gênero</FormLabel>
                <RadioGroup
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  row
                >
                  <FormControlLabel value="MALE" control={<Radio />} label="Masculino" />
                  <FormControlLabel value="FEMALE" control={<Radio />} label="Feminino" />
                  <FormControlLabel value="OTHER" control={<Radio />} label="Outro" />
                  <FormControlLabel value="PREFER_NOT_TO_SAY" control={<Radio />} label="Prefiro não dizer" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2: // Dados de Endereço
        return (
          <Grid container spacing={3}>
            {/* CEP - Primeiro campo para preenchimento automático */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="CEP"
                value={formData.zipCode}
                onChange={(e) => {
                  handleInputChange('zipCode', e.target.value);
                  // Buscar endereço quando CEP estiver completo
                  if (e.target.value.replace(/\D/g, '').length === 8) {
                    handleCepSearch(e.target.value);
                  }
                }}
                onBlur={(e) => {
                  // Buscar endereço ao sair do campo se CEP estiver completo
                  if (e.target.value.replace(/\D/g, '').length === 8) {
                    handleCepSearch(e.target.value);
                  }
                }}
                placeholder="00000-000"
                error={!!cepError}
                helperText={cepError || 'Digite o CEP para buscar o endereço automaticamente'}
                InputProps={{
                  endAdornment: cepLoading ? (
                    <CircularProgress size={20} />
                  ) : null
                }}
                required
              />
            </Grid>
            
            {/* Rua - Preenchida automaticamente pelo CEP */}
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                label="Rua"
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                required
              />
            </Grid>
            
            {/* Número - Campo manual */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Número"
                value={formData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                required
              />
            </Grid>
            
            {/* Complemento - Campo manual */}
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                label="Complemento"
                value={formData.complement}
                onChange={(e) => handleInputChange('complement', e.target.value)}
                placeholder="Apartamento, casa, etc."
              />
            </Grid>
            
            {/* Bairro - Preenchido automaticamente pelo CEP */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bairro"
                value={formData.neighborhood}
                onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                required
              />
            </Grid>
            
            {/* Cidade - Preenchida automaticamente pelo CEP */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cidade"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
            </Grid>
            
            {/* Estado - Preenchido automaticamente pelo CEP */}
            <Grid item xs={12} md={12}>
              <FormControl fullWidth required>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  label="Estado"
                >
                  {states.map((state) => (
                    <MenuItem key={state} value={state}>{state}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 3: // Seleção de Treinador
        // Filtrar treinadores que atendem as modalidades do plano
        const planModalidadeIds = plan.modalidades.map(m => m.modalidade.id);
        const filteredCoaches = coaches.filter(coach => {
          if (!coach.coachModalidades || coach.coachModalidades.length === 0) {
            return false; // Treinador sem modalidades não aparece
          }
          
          // Verificar se o treinador atende pelo menos uma modalidade do plano
          const coachModalidadeIds = coach.coachModalidades.map(cm => cm.modalidade.id);
          return planModalidadeIds.some(planModalidadeId => 
            coachModalidadeIds.includes(planModalidadeId)
          );
        });

        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Selecione seu Treinador</InputLabel>
                <Select
                  value={formData.coachId}
                  onChange={(e) => handleInputChange('coachId', e.target.value)}
                  label="Selecione seu Treinador"
                >
                  {filteredCoaches.length > 0 ? (
                    filteredCoaches.map((coach) => {
                      const modalidades = coach.coachModalidades?.map(cm => cm.modalidade.name).join(', ') || 'Sem modalidades';
                      const senioridade = coach.coachLevel || 'Não informado';
                      
                      return (
                        <MenuItem key={coach.id} value={coach.id}>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">{coach.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {senioridade} • {modalidades}
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    })
                  ) : (
                    <MenuItem disabled>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Nenhum treinador disponível para este plano
                      </Typography>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              
              {filteredCoaches.length > 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  💡 Mostrando {filteredCoaches.length} treinador(es) que atendem as modalidades deste plano
                </Typography>
              )}
            </Grid>
          </Grid>
        );

      case 4: // Checkout
        // Usar a primeira modalidade do plano (já que o plano tem modalidades associadas)
        const selectedModalidade = plan.modalidades?.[0]?.modalidade;
        const selectedCoach = coaches.find(c => c.id === formData.coachId);
        const selectedPrice = plan.prices.find(p => p.period === formData.period);
        const selectedPriceValue = selectedPrice ? parseFloat(selectedPrice.price.toString()) : 0;

        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Resumo do Plano</Typography>
                  <Typography variant="body1"><strong>Plano:</strong> {plan.name}</Typography>
                  <Typography variant="body1"><strong>Modalidade:</strong> {selectedModalidade?.name || 'Modalidade do plano'}</Typography>
                  <Typography variant="body1"><strong>Treinador:</strong> {selectedCoach?.name || 'Selecione um treinador'}</Typography>
                  <Typography variant="body1"><strong>Periodicidade:</strong> {getPeriodLabel(formData.period)}</Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body1">
                    <strong>Valor do Plano: R$ {selectedPriceValue.toFixed(2)}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    + Taxa de Matrícula: R$ {enrollmentFee ? enrollmentFee.amount.toFixed(2) : '0.00'}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6">
                    <strong>Total: R$ {(selectedPriceValue + (enrollmentFee?.amount || 0)).toFixed(2)}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required sx={{ mb: 2 }}>
                <InputLabel>Periodicidade</InputLabel>
                <Select
                  value={formData.period}
                  onChange={(e) => handleInputChange('period', e.target.value)}
                  label="Periodicidade"
                >
                  {plan.prices.map((price) => (
                    <MenuItem key={price.period} value={price.period}>
                      {getPeriodLabel(price.period)} - R$ {parseFloat(price.price.toString()).toFixed(2)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required sx={{ mb: 2 }}>
                <FormLabel>Forma de Pagamento</FormLabel>
                <RadioGroup
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                >
                  <FormControlLabel value={PaymentMethod.PIX} control={<Radio />} label="PIX" />
                  <FormControlLabel value={PaymentMethod.CREDIT_CARD} control={<Radio />} label="Cartão de Crédito" />
                  <FormControlLabel value={PaymentMethod.BOLETO} control={<Radio />} label="Boleto Bancário" />
                </RadioGroup>
              </FormControl>

              {/* Campos de Cartão de Crédito */}
              {formData.paymentMethod === PaymentMethod.CREDIT_CARD && (
                <Box sx={{ mb: 3 }}>
                  {/* Opções de Pagamento */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <FormLabel>Opção de Pagamento</FormLabel>
                    <RadioGroup
                      row
                      value={paymentOption}
                      onChange={(e) => {
                        const value = e.target.value as 'AVISTA' | 'PARCELADO';
                        
                        // Para periodicidade mensal, sempre forçar à vista
                        if (formData.period === PlanPeriod.MONTHLY) {
                          setPaymentOption('AVISTA');
                          setInstallmentCount(0);
                          return;
                        }
                        
                        const max = getMaxInstallments(formData.period);
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
                        disabled={formData.period === PlanPeriod.MONTHLY || getMaxInstallments(formData.period) <= 1}
                      />
                    </RadioGroup>
                  </FormControl>

                  {/* Select de Parcelas */}
                  {paymentOption === 'PARCELADO' && getMaxInstallments(formData.period) > 1 && (
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Parcelas</InputLabel>
                      <Select
                        value={installmentCount}
                        label="Parcelas"
                        onChange={(e) => setInstallmentCount(Number(e.target.value))}
                      >
                        {Array.from({ length: Math.max(0, getMaxInstallments(formData.period) - 1) }, (_, i) => i + 2).map((n) => (
                          <MenuItem key={n} value={n}>{n}x</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Formulário de Cartão de Crédito */}
                  <CheckoutCreditCardForm control={cardControl} />
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Cupom de Desconto"
                  value={formData.couponCode}
                  onChange={(e) => handleInputChange('couponCode', e.target.value)}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleCouponValidation}
                  disabled={!formData.couponCode}
                >
                  Validar
                </Button>
              </Box>

              {couponValidation && couponValidation.isValid && (
                <Alert 
                  severity="success"
                  sx={{ mb: 2 }}
                >
                  {couponValidation.message}
                </Alert>
              )}

              {couponError && (
                <Alert 
                  severity="error"
                  sx={{ mb: 2 }}
                >
                  {couponError}
                </Alert>
              )}
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {renderStepContent()}

      {/* Esconder botões de navegação quando mostrar sucesso do pagamento */}
      {!showPaymentSuccess && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            disabled={activeStep === 0}
            onClick={onBack}
          >
            {activeStep === 0 ? 'Voltar ao Plano' : 'Voltar'}
          </Button>
          
          {/* Botão de debug para limpar dados salvos */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outlined"
              color="warning"
              size="small"
              onClick={() => {
                clearPlanRegistrationData();
                setFormData({
                  email: '',
                  password: '',
                  confirmPassword: '',
                  name: '',
                  cpf: '',
                  phone: '',
                  birthDate: '',
                  gender: '',
                  street: '',
                  number: '',
                  complement: '',
                  neighborhood: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  coachId: '',
                  period: PlanPeriod.MONTHLY,
                  paymentMethod: PaymentMethod.PIX,
                  couponCode: ''
                });
              }}
            >
              Limpar Dados
            </Button>
          )}
        </Box>
        
        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : activeStep === steps.length - 1 ? (
            'Finalizar Cadastro'
          ) : (
            'Próximo'
          )}
        </Button>
        </Box>
      )}
    </Box>
  );
}
