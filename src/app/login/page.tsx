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
import toast from 'react-hot-toast';

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

  // Redirecionar se já autenticado
  React.useEffect(() => {
    if (auth.isAuthenticated && auth.emailVerified) {
      router.push('/dashboard');
    }
  }, [auth.isAuthenticated, auth.emailVerified, router]);

  const handleChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(''); // Limpar erro ao digitar
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setLoginStep('Validando credenciais...');

    try {
      // Validação básica
      if (!formData.email || !formData.password) {
        setError('Por favor, preencha todos os campos');
        return;
      }

      if (!formData.email.includes('@')) {
        setError('Por favor, digite um email válido');
        return;
      }

      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      // Fazer login com feedback visual
      setLoginStep('Fazendo login...');
      await auth.login({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      // Aguardar resposta da API e processar
      setLoginStep('Processando login...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Aguardar que o AuthContext processe tudo
      // O loading será mantido ativo pelo AuthContext até o redirecionamento
      setLoginStep('Finalizando...');
      
      // Não finalizar o loading local - deixar o AuthContext controlar
      // O AuthContext manterá isLoading=true até o redirecionamento ser concluído
      
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      // Mensagens de erro específicas
      if (error.response?.status === 401) {
        setError('Email ou senha incorretos');
      } else if (error.response?.status === 403) {
        setError('Conta bloqueada. Entre em contato com o suporte');
      } else if (error.response?.status === 429) {
        setError('Muitas tentativas. Tente novamente em alguns minutos');
      } else {
        setError(error.response?.data?.message || 'Erro ao fazer login. Tente novamente');
      }
      
      // Só finalizar loading local em caso de erro
      setLoading(false);
      setLoginStep('');
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  // Determinar se deve mostrar loading global (tela local ou AuthContext)
  const showGlobalLoading = loading || auth.isLoading;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.colors.gradient.primary,
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
          zIndex: 0,
        },
      }}
    >
      <Card
        sx={{
          maxWidth: 420,
          width: '100%',
          position: 'relative',
          zIndex: 1,
          backdropFilter: 'blur(20px)',
          background: theme.palette.background.paper,
          boxShadow: theme.colors.shadow.elevated,
          filter: showGlobalLoading ? 'blur(2px)' : 'none',
          transition: 'filter 0.3s ease',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo e Título */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: theme.colors.gradient.primary,
                color: 'white',
                mb: 2,
              }}
            >
              <RunIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              Endurance On
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Entre em sua conta
            </Typography>
          </Box>

          {/* Formulário */}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
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

            <Box sx={{ textAlign: 'right', mb: 3 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handleForgotPassword}
                disabled={showGlobalLoading}
                sx={{
                  textDecoration: 'none',
                  opacity: showGlobalLoading ? 0.5 : 1,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Esqueceu sua senha?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={showGlobalLoading}
              sx={{
                py: 1.5,
                mb: 3,
                background: showGlobalLoading ? theme.colors.surface.tertiary : theme.colors.gradient.primary,
                fontWeight: 'bold',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: showGlobalLoading ? theme.colors.surface.tertiary : theme.colors.gradient.secondary,
                  transform: showGlobalLoading ? 'none' : 'translateY(-2px)',
                },
                '&:disabled': {
                  background: theme.colors.surface.tertiary,
                  color: theme.palette.text.secondary,
                },
              }}
            >
              {showGlobalLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress 
                    size={20} 
                    sx={{ 
                      color: theme.palette.primary.main,
                      mr: 1 
                    }} 
                  />
                  <Typography component="span" sx={{ fontWeight: 'bold' }}>
                    Entrando...
                  </Typography>
                </Box>
              ) : (
                'Entrar'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Não tem uma conta?{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={handleRegister}
                  disabled={showGlobalLoading}
                  sx={{
                    fontWeight: 'bold',
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    opacity: showGlobalLoading ? 0.5 : 1,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Criar conta
                </Link>
              </Typography>
            </Box>
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