'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  CircularProgress,
  useTheme,
  Paper,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  DirectionsRun as RunIcon,
  ErrorOutline,
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { enduranceTheme } from '../../theme/enduranceTheme';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired' | 'pending';

export default function VerifyEmailPage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmailToken(token);
    } else {
      setStatus('pending');
    }
  }, [token]);

  // Cooldown para reenvio
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const verifyEmailToken = async (token: string) => {
    setLoading(true);
    try {
      await auth.verifyEmail(token);
      setStatus('success');
      setMessage('Email verificado com sucesso!');
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        if (auth.user) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      }, 2000);
    } catch (error: any) {
      console.error('Erro na verificação:', error);
      
      if (error.response?.status === 410) {
        setStatus('expired');
        setMessage('Token expirado. Solicite um novo link de verificação.');
      } else {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Token inválido ou expirado');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!auth.user?.email) {
      setMessage('Email não encontrado. Faça login novamente.');
      return;
    }

    setResendLoading(true);
    try {
      // Assumindo que existe um método para reenviar email
      await auth.resendVerificationEmail();
      setMessage('Email de verificação reenviado com sucesso!');
      setResendCooldown(60); // 60 segundos de cooldown
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      setMessage(error.response?.data?.message || 'Erro ao reenviar email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CircularProgress size={64} />
          </Box>
        );

      case 'success':
        return (
          <Paper
            elevation={6}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 500,
              textAlign: 'center',
            }}
          >
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 3 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Email Verificado!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Sua conta foi ativada com sucesso.
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Redirecionando para o dashboard...
            </Typography>
            <CircularProgress size={24} sx={{ mt: 2 }} />
          </Paper>
        );

      case 'error':
        return (
          <Paper
            elevation={6}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 500,
              textAlign: 'center',
            }}
          >
            <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Erro na Verificação
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              O token de verificação é inválido ou já foi utilizado.
            </Typography>
            <Button
              variant="contained"
              onClick={handleGoToLogin}
              sx={{
                background: theme.colors.gradient.primary,
                mr: 2,
              }}
            >
              Ir para Login
            </Button>
            {auth.user && (
              <Button
                variant="outlined"
                onClick={handleResendEmail}
                disabled={resendLoading || resendCooldown > 0}
                startIcon={resendLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
              >
                {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar Email'}
              </Button>
            )}
          </Paper>
        );

      case 'expired':
        return (
          <Paper
            elevation={6}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 500,
              textAlign: 'center',
            }}
          >
            <ErrorOutline sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Token Expirado
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Por segurança, os links de verificação expiram em 24 horas.
            </Typography>
            <Button
              variant="contained"
              onClick={handleResendEmail}
              disabled={resendLoading || resendCooldown > 0}
              startIcon={resendLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
              sx={{
                background: theme.colors.gradient.primary,
                mr: 2,
              }}
            >
              {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Solicitar Novo Link'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleGoToLogin}
            >
              Ir para Login
            </Button>
          </Paper>
        );

      case 'pending':
        return (
          <Paper
            elevation={6}
            sx={{
              p: 4,
              width: '100%',
              maxWidth: 500,
              textAlign: 'center',
            }}
          >
            <EmailIcon sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Verifique seu Email
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Enviamos um link de verificação para seu email.
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Clique no link enviado para ativar sua conta.
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Não recebeu o email? Verifique sua caixa de spam ou solicite um novo.
            </Typography>
            <Button
              variant="contained"
              onClick={handleResendEmail}
              disabled={resendLoading || resendCooldown > 0}
              startIcon={resendLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
              sx={{
                background: theme.colors.gradient.primary,
                mr: 2,
              }}
            >
              {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar Email'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleGoToLogin}
            >
              Ir para Login
            </Button>
          </Paper>
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
        flexDirection: 'column',
      }}
    >
      <AppBar position="static" sx={{ background: 'transparent', boxShadow: 'none' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: theme.colors.gradient.primary,
                color: 'white',
                mb: 2,
              }}
            >
              <RunIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Endurance On
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      <Card sx={{ flexGrow: 1 }}>
        <CardContent sx={{ p: 4 }}>
          {renderContent()}

          {/* Additional Message */}
          {message && status !== 'success' && status !== 'error' && status !== 'expired' && (
            <Box sx={{ mt: 3 }}>
              <Alert severity="info">
                {message}
              </Alert>
            </Box>
          )}

          {/* Help Text */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Precisa de ajuda? Entre em contato com o suporte.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 