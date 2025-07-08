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
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Email as EmailIcon,
  ArrowBack as BackIcon,
  Send as SendIcon,
  DirectionsRun as RunIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { enduranceTheme } from '../../theme/enduranceTheme';

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // Redirecionar se já autenticado
  React.useEffect(() => {
    if (auth.isAuthenticated) {
      router.push('/dashboard');
    }
  }, [auth.isAuthenticated, router]);

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
    setError(''); // Limpar erro ao digitar
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validação básica
      if (!email) {
        setError('Por favor, digite seu email');
        return;
      }

      if (!email.includes('@')) {
        setError('Por favor, digite um email válido');
        return;
      }

      // Enviar email de recuperação
      await auth.forgotPassword(email.toLowerCase().trim());
      setSent(true);
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      
      // Não expor se email existe ou não por segurança
      if (error.response?.status === 404) {
        setError('Se este email estiver cadastrado, você receberá as instruções de recuperação.');
      } else if (error.response?.status === 429) {
        setError('Muitas tentativas. Tente novamente em alguns minutos.');
      } else {
        setError('Erro ao processar solicitação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const handleResendEmail = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      await auth.forgotPassword(email.toLowerCase().trim());
      setError('');
    } catch (error) {
      setError('Erro ao reenviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
        <Card sx={{ maxWidth: 450, width: '100%' }}>
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
                <SendIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                Email Enviado!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Verifique sua caixa de entrada
              </Typography>
            </Box>

            <Alert severity="success" sx={{ mb: 3 }}>
              Se o email <strong>{email}</strong> estiver cadastrado, você receberá as instruções para redefinir sua senha.
            </Alert>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              O link de recuperação expira em 1 hora por segurança. Verifique também sua caixa de spam.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleResendEmail}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
              >
                Reenviar Email
              </Button>
              
              <Button
                variant="contained"
                onClick={handleBackToLogin}
              >
                Voltar ao Login
              </Button>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Não recebeu o email? Verifique se o endereço está correto.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

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
      <Card sx={{ maxWidth: 420, width: '100%' }}>
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
              Esqueci a Senha
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Digite seu email para recuperar o acesso
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
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
              placeholder="seu@email.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
              autoComplete="email"
              autoFocus
            />

            <Alert severity="info" sx={{ mb: 3 }}>
              Enviaremos um link seguro para redefinir sua senha. O link expira em 1 hora.
            </Alert>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !email}
              sx={{
                py: 1.5,
                mb: 3,
                fontWeight: 'bold',
                fontSize: '1.1rem',
                '&:disabled': {
                  background: theme.colors.surface.tertiary,
                },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Enviando...
                </>
              ) : (
                <>
                  <SendIcon sx={{ mr: 1 }} />
                  Enviar Link de Recuperação
                </>
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={handleBackToLogin}
                disabled={loading}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                <BackIcon sx={{ mr: 0.5, fontSize: 16 }} />
                Voltar ao Login
              </Link>
            </Box>
          </Box>

          {/* Help Text */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Lembrou da senha?{' '}
              <Link
                component="button"
                type="button"
                onClick={handleBackToLogin}
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