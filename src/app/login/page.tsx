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
  CircularProgress,
  useTheme,
  Backdrop,
  Fade,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  DirectionsRun as RunIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import Image from 'next/image';
import { enduranceApi } from '../../services/enduranceApi';
import { getPendingPaymentData, clearPendingPaymentData } from '../../utils/paymentUtils';
import { PaymentStatus } from '../../types/api';
import { saveRememberMeData, getRememberMeData } from '../../utils/rememberMeUtils';
import LogoSymbol from '@/assets/images/logo/logo_simbolo_preto.png';
import NextLink from 'next/link';

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginStep, setLoginStep] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const emailInputRef = React.useRef<HTMLInputElement>(null);

  // Redirecionar se já autenticado
  React.useEffect(() => {
    if (auth.isAuthenticated) {
      router.push('/dashboard');
    }
  }, [auth.isAuthenticated, router]);

  // Carregar dados de "Lembrar-me" ao montar o componente
  React.useEffect(() => {
    const savedData = getRememberMeData();
    if (savedData) {
      setFormData(prev => ({
        ...prev,
        email: savedData.email,
      }));
      setRememberMe(savedData.rememberMe);
    }
  }, []);

  // Prevenir reload durante submit
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSubmitting]);

  const handleChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Limpar erro ao digitar
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await auth.login({ 
        email: formData.email.toLowerCase().trim(),
        password: formData.password 
      });
      
      // Salvar dados de "Lembrar-me" se marcado
      saveRememberMeData(formData.email.toLowerCase().trim(), rememberMe);
      
      // Redirecionar baseado no tipo de usuário
      if (response.user.userType === 'ADMIN') {
        router.push('/dashboard/admin');
      } else if (response.user.userType === 'COACH') {
        router.push('/dashboard/coach');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Email ou senha incorretos.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Conta bloqueada. Entre em contato com o suporte.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Muitas tentativas. Aguarde um momento.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  // Determinar se deve mostrar loading global (tela local ou AuthContext)
  const showGlobalLoading = loading || auth.isLoading || isSubmitting;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100],
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          background: theme.palette.background.paper,
          boxShadow: theme.shadows[6],
          filter: showGlobalLoading ? 'blur(2px)' : 'none',
          transition: 'filter 0.3s ease',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo e Título */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <NextLink href="/" passHref>
                <Image src={LogoSymbol} alt="EnduranceOn Symbol" width={82} style={{ marginBottom: '16px' }} />
            </NextLink>
            <Typography variant="h4" component="h1" gutterBottom>
              Bem-vindo de volta!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Entre para continuar na plataforma.
            </Typography>
          </Box>

          {/* Formulário */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  animation: 'shake 0.5s',
                  '@keyframes shake': {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              disabled={showGlobalLoading}
              inputRef={emailInputRef}
              error={error.includes('email') || error.includes('Email')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color={showGlobalLoading ? "disabled" : "action"} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 3,
                opacity: showGlobalLoading ? 0.7 : 1,
                transition: 'opacity 0.3s ease',
              }}
              autoComplete="email"
            />

            <TextField
              fullWidth
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              disabled={showGlobalLoading}
              error={error.includes('senha') || error.includes('password') || error.includes('incorretos')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color={showGlobalLoading ? "disabled" : "action"} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={showGlobalLoading}
                      sx={{ opacity: showGlobalLoading ? 0.5 : 1 }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 2,
                opacity: showGlobalLoading ? 0.7 : 1,
                transition: 'opacity 0.3s ease',
              }}
              autoComplete="current-password"
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    name="remember" 
                    color="primary"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={showGlobalLoading}
                  />
                }
                label="Lembrar-me"
                sx={{ 
                  opacity: showGlobalLoading ? 0.7 : 1,
                  transition: 'opacity 0.3s ease',
                }}
              />
              <Link 
                component={NextLink} 
                href="/forgot-password" 
                variant="body2"
                sx={{ 
                  opacity: showGlobalLoading ? 0.7 : 1,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: showGlobalLoading ? 'none' : 'auto',
                }}
              >
                Esqueceu a senha?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={showGlobalLoading}
              startIcon={showGlobalLoading ? <CircularProgress size={24} color="inherit" /> : null}
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
              }}
            >
              {showGlobalLoading ? loginStep : 'Entrar'}
            </Button>

            <Typography variant="body2" sx={{ textAlign: 'center', mt: 4 }}>
              Não tem uma conta?{' '}
              <Link component={NextLink} href="/register" fontWeight="bold">
                Cadastre-se
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Loading Backdrop */}
      <Backdrop
        open={showGlobalLoading}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `rgba(0,0,0, ${theme.palette.mode === 'dark' ? 0.7 : 0.5})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <CircularProgress color="primary" size={60} />
        <Fade in={!!loginStep}>
          <Box
            sx={{
              mt: 2,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              padding: '8px 16px',
            }}
          >
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
              {loginStep}
            </Typography>
          </Box>
        </Fade>
      </Backdrop>

      {/* Usuários de teste para desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            p: 2,
            borderRadius: 2,
            fontSize: '0.8rem',
            zIndex: 2,
            opacity: showGlobalLoading ? 0.3 : 1,
            transition: 'opacity 0.3s ease',
          }}
        >
          <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', mb: 1 }}>
            Usuários de Teste:
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Admin: admin@enduranceon.com.br
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Coach: coach@enduranceon.com.br
          </Typography>
          <Typography variant="caption" sx={{ display: 'block' }}>
            Aluno: student@enduranceon.com.br
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Senha: 123456
          </Typography>
        </Box>
      )}
    </Box>
  );
} 