'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  useTheme,
  Link,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  DirectionsRun as RunIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { enduranceTheme } from '../../theme/enduranceTheme';

export default function TwoFactorPage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Verificar se usuário precisa de 2FA
  useEffect(() => {
    if (!auth.user || !auth.has2FA) {
      router.push('/login');
    }
  }, [auth.user, auth.has2FA, router]);

  // Cooldown para reenvio
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus no input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, ''); // Apenas números
    if (value.length <= 6) {
      setCode(value);
      setError('');
      
      // Auto-submit quando completar 6 dígitos
      if (value.length === 6) {
        handleSubmit(value);
      }
    }
  };

  const handleSubmit = async (submitCode?: string) => {
    const codeToSubmit = submitCode || code;
    
    if (codeToSubmit.length !== 6) {
      setError('Por favor, digite o código de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await auth.verify2FA(codeToSubmit);
      // O AuthContext já gerencia o redirecionamento
    } catch (error: any) {
      console.error('Erro na verificação 2FA:', error);
      
      setAttempts(prev => prev + 1);
      
      if (error.response?.status === 401) {
        setError('Código incorreto. Tente novamente.');
      } else if (error.response?.status === 410) {
        setError('Código expirado. Solicite um novo código.');
      } else if (error.response?.status === 429) {
        setError('Muitas tentativas incorretas. Aguarde antes de tentar novamente.');
      } else {
        setError(error.response?.data?.message || 'Erro na verificação. Tente novamente.');
      }
      
      // Bloquear temporariamente após muitas tentativas
      if (attempts >= 2) {
        setResendCooldown(120); // 2 minutos
      }
      
      // Limpar código em caso de erro
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      await auth.resend2FA();
      setResendCooldown(60); // 60 segundos de cooldown
      setAttempts(0); // Reset tentativas
    } catch (error: any) {
      console.error('Erro ao reenviar código 2FA:', error);
      setError(error.response?.data?.message || 'Erro ao reenviar código');
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    auth.logout();
    router.push('/login');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Formatação do código (XXX XXX)
  const formatCode = (value: string): string => {
    if (value.length <= 3) return value;
    return `${value.slice(0, 3)} ${value.slice(3)}`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.gradient.primary,
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
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: theme.colors.gradient.primary,
                color: 'white',
                mb: 2,
              }}
            >
              <SecurityIcon sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              Verificação 2FA
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Digite o código de 6 dígitos
            </Typography>
          </Box>

          {/* Informações do usuário */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Enviamos um código de verificação para:<br />
              <strong>{auth.user?.email}</strong>
            </Typography>
          </Alert>

          {/* Formulário */}
          <Box sx={{ width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ position: 'relative', mb: 3 }}>
              <TextField
                ref={inputRef}
                fullWidth
                label="Código de Verificação"
                value={formatCode(code)}
                onChange={handleCodeChange}
                disabled={loading || resendCooldown > 60}
                placeholder="000 000"
                autoComplete="one-time-code"
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  maxLength: 7, // Incluindo o espaço
                  style: {
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    letterSpacing: '0.5rem',
                    fontWeight: 'bold',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    textAlign: 'center',
                  },
                }}
              />
              
              {loading && (
                <Box
                  sx={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  <CircularProgress size={20} />
                </Box>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
              O código expira em 10 minutos
            </Typography>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => handleSubmit()}
              disabled={loading || code.length !== 6 || resendCooldown > 60}
              sx={{
                py: 1.5,
                mb: 3,
                background: theme.colors.gradient.primary,
                fontWeight: 'bold',
                fontSize: '1.1rem',
                '&:hover': {
                  background: theme.colors.gradient.secondary,
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: theme.colors.surface.tertiary,
                },
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Verificando...
                </>
              ) : (
                'Verificar Código'
              )}
            </Button>

            {/* Reenviar código */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Não recebeu o código?
              </Typography>
              
              <Button
                variant="text"
                onClick={handleResendCode}
                disabled={resendLoading || resendCooldown > 0}
                startIcon={
                  resendLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    <RefreshIcon />
                  )
                }
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
              >
                {resendCooldown > 0
                  ? `Reenviar em ${formatTime(resendCooldown)}`
                  : 'Reenviar código'
                }
              </Button>
            </Box>

            {/* Tentativas restantes */}
            {attempts > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Tentativas incorretas: {attempts}/3
                  {attempts >= 2 && (
                    <><br />Após 3 tentativas, haverá um bloqueio temporário.</>
                  )}
                </Typography>
              </Alert>
            )}

            {/* Métodos alternativos */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Problemas com 2FA?{' '}
                <Link
                  component="button"
                  variant="caption"
                  onClick={() => {
                    // Implementar suporte para métodos alternativos
                    alert('Entre em contato com o suporte: suporte@enduranceon.com.br');
                  }}
                  sx={{
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Entre em contato
                </Link>
              </Typography>
            </Box>

            {/* Voltar ao login */}
            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={handleBackToLogin}
                disabled={loading}
                sx={{
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                ← Voltar ao Login
              </Link>
            </Box>
          </Box>

          {/* Informações de segurança */}
          <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
              🔒 Sua conta está protegida por autenticação de dois fatores
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 