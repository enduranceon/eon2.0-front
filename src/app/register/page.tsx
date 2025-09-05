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
  FormControlLabel,
  Checkbox,
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
import { UserType, Gender, ConsentTerm } from '../../types/api';
import { FormData } from '../../types/formData';
import { enduranceTheme } from '../../theme/enduranceTheme';
import { geocodingService } from '../../services/geocodingService';
import { validateAndFormatCpf } from '../../utils/cpfUtils';
import { validateAndFormatEmail } from '../../utils/emailUtils';
import { consentService } from '../../services/consentService';
import { formStorageService } from '../../services/formStorageService';
import ConsentTermModal from '../../components/ConsentTermModal';
import toast from 'react-hot-toast';

const steps = ['Bem-vindo', 'Dados Pessoais', 'Endereço', 'Termo de Aceite'];

export default function RegisterPage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();

  const [activeStep, setActiveStep] = useState(() => {
    // Tentar carregar o passo atual salvo
    return formStorageService.getCurrentStep();
  });
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

  const [consentTerm, setConsentTerm] = useState<ConsentTerm | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentLoading, setConsentLoading] = useState(false);
  const [consentError, setConsentError] = useState('');
  
  const [formData, setFormData] = useState<FormData>(() => {
    // Tentar carregar dados salvos do localStorage
    const savedData = formStorageService.getFormData();
    if (savedData) {
      return savedData;
    }
    
    // Dados padrão se não houver dados salvos
    return {
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
    };
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

  // Carregar termo de consentimento quando chegar no passo 3
  React.useEffect(() => {
    if (activeStep === 3 && !consentTerm) {
      loadConsentTerm();
    }
  }, [activeStep, consentTerm]);

  // Salvar o passo atual no localStorage sempre que mudar
  React.useEffect(() => {
    formStorageService.saveCurrentStep(activeStep);
  }, [activeStep]);

  // Salvar dados do formulário no localStorage sempre que mudarem
  React.useEffect(() => {
    formStorageService.saveFormData(formData);
  }, [formData]);

  // Mostrar alerta se houver dados salvos
  React.useEffect(() => {
    if (formStorageService.hasStoredData()) {
      toast.success('Dados do formulário restaurados! Você pode continuar de onde parou.', {
        duration: 5000,
      });
    }
  }, []);

  const loadConsentTerm = async () => {
    try {
      setConsentLoading(true);
      setConsentError('');
      const term = await consentService.getLatestConsent();
      setConsentTerm(term);
    } catch (error: any) {
      const errorMessage = error.message || 'Erro desconhecido';
      setConsentError(`Erro ao carregar o termo de consentimento: ${errorMessage}. Tente novamente.`);
      console.error('Erro ao carregar termo:', error);
    } finally {
      setConsentLoading(false);
    }
  };

  const handleChange = (field: keyof FormData | string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setFormData(prev => {
        const newData = {
          ...prev,
          address: {
            ...prev.address!,
            [addressField]: value,
          },
        };
        // Salvar no localStorage
        formStorageService.saveFormData(newData);
        return newData;
      });
      
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
      setFormData(prev => {
        const newData = {
          ...prev,
          [field]: cpfResult.formatted,
        };
        // Salvar no localStorage
        formStorageService.saveFormData(newData);
        return newData;
      });
      
      // Atualizar estado de validação do CPF
      setCpfValidation({
        isValid: cpfResult.isValid,
        error: cpfResult.error,
      });
    } else if (field === 'email') {
      // Validar e formatar e-mail
      const emailResult = validateAndFormatEmail(value);
      setFormData(prev => {
        const newData = {
          ...prev,
          [field]: emailResult.formatted,
        };
        // Salvar no localStorage
        formStorageService.saveFormData(newData);
        return newData;
      });
      
      // Atualizar estado de validação do e-mail
      setEmailValidation({
        isValid: emailResult.isValid,
        error: emailResult.error,
      });
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [field]: value,
        };
        // Salvar no localStorage
        formStorageService.saveFormData(newData);
        return newData;
      });
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
        setFormData(prev => {
          const newData = {
            ...prev,
            address: {
              ...prev.address!,
              street: result.street || prev.address!.street,
              neighborhood: result.neighborhood || prev.address!.neighborhood,
              city: result.city || prev.address!.city,
              state: result.state || prev.address!.state,
            },
          };
          // Salvar no localStorage
          formStorageService.saveFormData(newData);
          return newData;
        });
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
      case 3:
        return consentAccepted;
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

    // Validar termo de consentimento no step 3
    if (activeStep === 3) {
      if (!consentAccepted) {
        setError('Você deve aceitar o termo de consentimento para continuar.');
        return;
      }
    }

    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      // Salvar o passo atual no localStorage
      formStorageService.saveCurrentStep(nextStep);
    }
  };

  const handleBack = () => {
    // Se estiver no passo 0 (Bem-vindo), redirecionar para login
    if (activeStep === 0) {
      router.push('/login');
      return;
    }
    
    const prevStep = activeStep - 1;
    setActiveStep(prevStep);
    // Salvar o passo atual no localStorage
    formStorageService.saveCurrentStep(prevStep);
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

      const registerResponse = await auth.register(registerData);
      
      
      // Após criar a conta, aceitar o termo de consentimento
      // Usar o userId real retornado pelo registro
      if (consentTerm && registerResponse) {
        try {
          
          // O usuário será redirecionado automaticamente após o registro
          // O termo será aceito em background
          consentService.acceptConsent({
            userId: registerResponse.userId, // Usar o userId real retornado
            consentTermVersion: consentTerm.version,
            ipAddress: undefined, // Será capturado pelo backend
            userAgent: navigator.userAgent,
          }).catch((consentError) => {
            console.error('Erro ao aceitar termo de consentimento:', consentError);
            // Não falhar o registro se houver erro no consentimento
            // O usuário pode aceitar posteriormente
          });
        } catch (consentError) {
          console.error('Erro ao aceitar termo de consentimento:', consentError);
          // Não falhar o registro se houver erro no consentimento
        }
      }
      
      // Limpar dados do localStorage após sucesso do registro
      formStorageService.clearFormData();
      formStorageService.clearCurrentStep();
      
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
              Bem-vindo à Endurance On!
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
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Já tem uma conta?</strong> Clique em "Ir para Login" para acessar sua conta existente.
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
                'Endereço validado! ✅ Clique em "Próximo" para continuar.'
              ) : (
                'Por favor, valide seu endereço antes de prosseguir. É obrigatório para cadastro de alunos.'
              )}
            </Alert>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Termo de Consentimento LGPD
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Para finalizar seu cadastro, você deve ler e aceitar nosso Termo de Consentimento LGPD. 
                Este documento explica como seus dados pessoais serão tratados em nossa plataforma.
              </Typography>
            </Alert>

            {consentLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Carregando termo de consentimento...
                </Typography>
              </Box>
            ) : consentError ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {consentError}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={loadConsentTerm}
                  sx={{ ml: 2 }}
                >
                  Tentar Novamente
                </Button>
              </Alert>
            ) : consentTerm ? (
              <Box>
                                 <Box
                   sx={{
                     maxHeight: '40vh',
                     overflow: 'auto',
                     border: '1px solid',
                     borderColor: 'divider',
                     borderRadius: 1,
                     p: 2,
                     backgroundColor: 'background.paper',
                     mb: 3,
                   }}
                 >
                   <Typography variant="subtitle2" gutterBottom>
                     {consentTerm.title} - Versão {consentTerm.version}
                   </Typography>
                   <Typography
                     variant="body2"
                     component="div"
                     sx={{
                       whiteSpace: 'pre-wrap',
                       lineHeight: 1.6,
                       fontFamily: 'monospace',
                       fontSize: '0.875rem',
                     }}
                   >
                     {consentTerm.content}
                   </Typography>
                 </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={consentAccepted}
                        onChange={(e) => setConsentAccepted(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        Li e aceito o Termo de Consentimento LGPD acima
                      </Typography>
                    }
                  />
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setConsentModalOpen(true)}
                    sx={{ textTransform: 'none' }}
                  >
                    Ler completo
                  </Button>
                </Box>

                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Importante:</strong> Ao aceitar este termo, você concorda com o tratamento de seus dados pessoais 
                    conforme a Lei Geral de Proteção de Dados (LGPD).
                  </Typography>
                </Alert>
              </Box>
            ) : null}
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
              disabled={loading}
              variant="outlined"
            >
              {activeStep === 0 ? 'Ir para Login' : 'Voltar'}
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

          {/* Botão para limpar dados salvos */}
          {formStorageService.hasStoredData() && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  formStorageService.clearFormData();
                  formStorageService.clearCurrentStep();
                  setActiveStep(0);
                  setFormData({
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
                  toast.success('Dados limpos! Começando do início.');
                }}
                sx={{ textTransform: 'none' }}
              >
                Limpar dados salvos e começar do zero
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modal do Termo de Consentimento */}
      <ConsentTermModal
        open={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        onAccept={() => {
          setConsentAccepted(true);
          setConsentModalOpen(false);
        }}
        consentTerm={consentTerm}
        loading={consentLoading}
        error={consentError}
      />
    </Box>
  );
} 