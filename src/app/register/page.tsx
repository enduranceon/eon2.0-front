'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  DirectionsRun as RunIcon,
  Phone as PhoneIcon,
  CreditCard as CardIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { UserType, Gender } from '../../types/api';
import { enduranceTheme } from '../../theme/enduranceTheme';
import { geocodingService } from '../../services/geocodingService';
import { validateAndFormatCpf } from '../../utils/cpfUtils';
import { validateAndFormatEmail } from '../../utils/emailUtils';
import toast from 'react-hot-toast';

interface AddressData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface FormData {
  // Campos básicos
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
  
  // Campos específicos
  cpf: string;
  phone: string;
  birthDate?: string;
  gender?: Gender | string;
  
  // Para alunos
  address?: AddressData;
  avatar?: string;
}

const steps = ['Bem-vindo', 'Dados Pessoais', 'Endereço'];

export default function RegisterPage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [addressValidation, setAddressValidation] = useState<{
    isValidating: boolean;
    isValid: boolean;
    message: string;
    coordinates?: { lat: number; lng: number };
  }>({
    isValidating: false,
    isValid: false,
    message: '',
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [cpfValidation, setCpfValidation] = useState<{
    isValid: boolean;
    error?: string;
  }>({
    isValid: false,
  });
  
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    error?: string;
  }>({
    isValid: false,
  });
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: UserType.FITNESS_STUDENT,
    cpf: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Brasil',
    },
  });

  // Redirecionar se já autenticado
  React.useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      // Redirecionar para dashboard específico baseado no tipo de usuário
      if (auth.user.userType === UserType.ADMIN) {
        router.push('/dashboard/admin');
      } else if (auth.user.userType === UserType.COACH) {
        router.push('/dashboard/coach');
      } else if (auth.user.userType === UserType.FITNESS_STUDENT) {
        router.push('/dashboard/aluno');
      } else {
        router.push('/login');
      }
    }
  }, [auth.isAuthenticated, auth.user, router]);

  const handleChange = (field: keyof FormData | string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address!,
          [addressField]: value,
        },
      }));
      
      // Resetar validação de endereço quando mudança ocorrer
      if (addressValidation.isValid) {
        setAddressValidation({
          isValidating: false,
          isValid: false,
          message: '',
        });
      }
    } else if (field === 'cpf') {
      // Aplicar máscara e validação para CPF
      const cpfResult = validateAndFormatCpf(value);
      setFormData(prev => ({
        ...prev,
        [field]: cpfResult.formatted,
      }));
      
      // Atualizar estado de validação do CPF
      setCpfValidation({
        isValid: cpfResult.isValid,
        error: cpfResult.error,
      });
    } else if (field === 'email') {
      // Validar e formatar e-mail
      const emailResult = validateAndFormatEmail(value);
      setFormData(prev => ({
        ...prev,
        [field]: emailResult.formatted,
      }));
      
      // Atualizar estado de validação do e-mail
      setEmailValidation({
        isValid: emailResult.isValid,
        error: emailResult.error,
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
    setError('');
  };

  // Buscar endereço por CEP
  const handleCepBlur = async () => {
    const cep = formData.address?.zipCode;
    if (!cep || cep.length < 8) return;

    setCepLoading(true);
    try {
      const result = await geocodingService.getAddressByCep(cep);
      
      if (result.isValid) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address!,
            street: result.street || prev.address!.street,
            neighborhood: result.neighborhood || prev.address!.neighborhood,
            city: result.city || prev.address!.city,
            state: result.state || prev.address!.state,
          },
        }));
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setCepLoading(false);
    }
  };

  // Validar endereço completo
  const validateAddress = async () => {
    if (!formData.address) return false;

    const { street, number, neighborhood, city, state, zipCode } = formData.address;
    
    if (!street || !number || !neighborhood || !city || !state || !zipCode) {
      setAddressValidation({
        isValidating: false,
        isValid: false,
        message: 'Preencha todos os campos do endereço',
      });
      return false;
    }

    setAddressValidation({
      isValidating: true,
      isValid: false,
      message: 'Validando endereço...',
    });

    try {
      const result = await geocodingService.validateAddress({
        street,
        number,
        neighborhood,
        city,
        state,
        zipCode,
      });

      setAddressValidation({
        isValidating: false,
        isValid: result.isValid,
        message: result.message,
        coordinates: result.coordinates,
      });

      if (result.isValid) {
        toast.success('Endereço validado com sucesso! ✅');
      } else {
        toast.error(result.message);
      }

      return result.isValid;
    } catch (error) {
      setAddressValidation({
        isValidating: false,
        isValid: false,
        message: 'Erro ao validar endereço',
      });
      return false;
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return true; // Sempre válido pois é apenas informativo
      case 1:
        return !!(
          formData.name &&
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          formData.cpf &&
          formData.phone &&
          formData.password === formData.confirmPassword &&
          cpfValidation.isValid &&
          emailValidation.isValid
        );
      case 2:
        return !!(
          formData.address?.street &&
          formData.address?.number &&
          formData.address?.neighborhood &&
          formData.address?.city &&
          formData.address?.state &&
          formData.address?.zipCode &&
          addressValidation.isValid
        );
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!validateStep(activeStep)) {
      // Verificar se o erro é específico do CPF ou e-mail
      if (activeStep === 1) {
        if (formData.cpf && !cpfValidation.isValid) {
          setError('Por favor, digite um CPF válido');
        } else if (formData.email && !emailValidation.isValid) {
          setError('Por favor, digite um e-mail válido');
        } else {
          setError('Por favor, preencha todos os campos obrigatórios');
        }
      } else {
        setError('Por favor, preencha todos os campos obrigatórios');
      }
      return;
    }

    // Validar endereço especificamente no step 2
    if (activeStep === 2) {
      if (!addressValidation.isValid) {
        const isValid = await validateAddress();
        if (!isValid) {
          setError('Endereço inválido. Por favor, verifique os dados e tente novamente.');
          return;
        }
      }
    }

    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Validações finais
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }

      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (!emailValidation.isValid) {
        setError('Por favor, digite um e-mail válido');
        return;
      }

      if (!cpfValidation.isValid) {
        setError('Por favor, digite um CPF válido');
        return;
      }

      // Validar endereço antes de enviar
      if (!addressValidation.isValid) {
        const isValid = await validateAddress();
        if (!isValid) {
          setError('Endereço deve ser validado antes de prosseguir. Verifique os dados e tente novamente.');
          return;
        }
      }

      // Preparar dados para envio
      const registerData = {
        name: formData.name,
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        userType: UserType.FITNESS_STUDENT,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, ''),
        birthDate: formData.birthDate ? `${formData.birthDate} 00:00:00.000` : undefined,
        gender: formData.gender || undefined,
        address: {
          ...formData.address,
          // Incluir coordenadas validadas
          coordinates: addressValidation.coordinates,
        },
      };

      await auth.register(registerData);
      
      // O AuthContext já gerencia o redirecionamento
    } catch (error: any) {
      console.error('Erro no registro:', error);
      
      if (error.response?.status === 409) {
        setError('Email ou CPF já cadastrado');
      } else {
        setError(error.response?.data?.message || 'Erro ao criar conta. Tente novamente');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Criar conta de aluno
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Como aluno, você terá acesso a planos de treino personalizados e acompanhamento profissional.
            </Alert>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Observação:</strong> Se você é um profissional e deseja ser treinador em nossa plataforma, 
                entre em contato com nosso suporte ou aguarde ser convidado por um administrador.
              </Typography>
            </Alert>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Dados Pessoais
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome Completo"
                  value={formData.name}
                  onChange={handleChange('name')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  error={!!emailValidation.error}
                  helperText={emailValidation.error || 'Digite seu e-mail'}
                  placeholder="seu@email.com"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CPF"
                  value={formData.cpf}
                  onChange={handleChange('cpf')}
                  error={!!cpfValidation.error}
                  helperText={cpfValidation.error || 'Digite apenas números'}
                  placeholder="000.000.000-00"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CardIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="birthDate"
                  label="Data de Nascimento"
                  type="date"
                  fullWidth
                  value={formData.birthDate || ''}
                  onChange={handleChange('birthDate')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="gender-label">Gênero</InputLabel>
                  <Select
                    labelId="gender-label"
                    label="Gênero"
                    value={formData.gender || ''}
                    onChange={handleChange('gender')}
                  >
                    <MenuItem value=""><em>Selecione</em></MenuItem>
                    <MenuItem value={Gender.MALE}>Masculino</MenuItem>
                    <MenuItem value={Gender.FEMALE}>Feminino</MenuItem>
                    <MenuItem value={Gender.OTHER}>Outro</MenuItem>
                    <MenuItem value={Gender.PREFER_NOT_TO_SAY}>Prefiro não informar</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange('password')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar Senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Informações de Endereço
            </Typography>
            
            {(
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Endereço
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="CEP"
                    value={formData.address?.zipCode || ''}
                    onChange={handleChange('address.zipCode')}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    InputProps={{
                      endAdornment: cepLoading ? (
                        <CircularProgress size={20} />
                      ) : null,
                    }}
                    helperText="Digite o CEP para preenchimento automático"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Estado"
                    value={formData.address?.state || ''}
                    onChange={handleChange('address.state')}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cidade"
                    value={formData.address?.city || ''}
                    onChange={handleChange('address.city')}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bairro"
                    value={formData.address?.neighborhood || ''}
                    onChange={handleChange('address.neighborhood')}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Rua"
                    value={formData.address?.street || ''}
                    onChange={handleChange('address.street')}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Número"
                    value={formData.address?.number || ''}
                    onChange={handleChange('address.number')}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Complemento"
                    value={formData.address?.complement || ''}
                    onChange={handleChange('address.complement')}
                  />
                </Grid>

                {/* Validação de Endereço */}
                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={validateAddress}
                      disabled={addressValidation.isValidating}
                      startIcon={
                        addressValidation.isValidating ? (
                          <CircularProgress size={16} />
                        ) : null
                      }
                      sx={{ mr: 2 }}
                    >
                      {addressValidation.isValidating ? 'Validando...' : 'Validar Endereço'}
                    </Button>
                    
                    {addressValidation.message && (
                      <Alert 
                        severity={addressValidation.isValid ? 'success' : 'error'} 
                        sx={{ mt: 1 }}
                      >
                        {addressValidation.message}
                        {addressValidation.isValid && addressValidation.coordinates && (
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Coordenadas: {addressValidation.coordinates.lat.toFixed(6)}, {addressValidation.coordinates.lng.toFixed(6)}
                          </Typography>
                        )}
                      </Alert>
                    )}
                  </Box>
                </Grid>
              </Grid>
            )}
            
            <Alert severity={addressValidation.isValid ? "success" : "warning"} sx={{ mt: 2 }}>
              {addressValidation.isValid ? (
                'Endereço validado! ✅ Clique em "Criar Conta" para finalizar.'
              ) : (
                'Por favor, valide seu endereço antes de prosseguir. É obrigatório para cadastro de alunos.'
              )}
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) => theme.palette.background.default,
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 600, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: (theme) => theme.palette.primary.main,
                color: 'white',
                mb: 2,
              }}
            >
              <RunIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              Criar Conta
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Junte-se à comunidade Endurance On
            </Typography>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Step Content */}
          {renderStepContent(activeStep)}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              variant="outlined"
            >
              Voltar
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={loading || !validateStep(activeStep)}
              variant="contained"
              sx={{
                minWidth: 120,
              }}
            >
              {loading ? 'Criando...' : activeStep === steps.length - 1 ? 'Criar Conta' : 'Próximo'}
            </Button>
          </Box>

          {/* Login Link */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Já tem uma conta?{' '}
              <Link
                component="button"
                type="button"
                onClick={() => router.push('/login')}
                disabled={loading}
                sx={{
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Fazer login
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 