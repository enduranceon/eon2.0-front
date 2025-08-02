'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  DirectionsRun as RunIcon,
} from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { UserType } from '../../types/api';
import { enduranceTheme } from '../../theme/enduranceTheme';

type ResetStatus = 'loading' | 'valid' | 'invalid' | 'success' | 'error';

function ResetPasswordContent() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<ResetStatus>('loading');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setError('Token de redefinição não encontrado');
    } else {
      setStatus('valid');
    }
  }, [token]);

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

  const handleChange = (field: keyof typeof formData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    setError(''); // Limpar erro ao digitar
  };

  const validatePassword = (): boolean => {
    if (!formData.password) {
      setError('Por favor, digite uma nova senha');
      return false;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    // Validação adicional de força da senha
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumbers = /\d/.test(formData.password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('A senha deve conter pelo menos: 1 maiúscula, 1 minúscula e 1 número');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await auth.resetPassword(token!, formData.password);
      setStatus('success');
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      
      if (error.response?.status === 410) {
        setStatus('invalid');
        setError('Token expirado. Solicite um novo link de recuperação.');
      } else if (error.response?.status === 404) {
        setStatus('invalid');
        setError('Token inválido ou já utilizado.');
      } else {
        setError(error.response?.data?.message || 'Erro ao redefinir senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  const handleRequestNewToken = () => {
    router.push('/forgot-password');
  };

  const getPasswordStrength = (): { level: number; text: string; color: string } => {
    const password = formData.password;
    if (!password) return { level: 0, text: '', color: 'transparent' };

    let score = 0;
    const checks = [
      password.length >= 6,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];

    score = checks.filter(Boolean).length;

    if (score <= 2) return { level: 1, text: 'Fraca', color: theme.palette.error.main };
    if (score === 3) return { level: 2, text: 'Média', color: theme.palette.warning.main };
    if (score === 4) return { level: 3, text: 'Boa', color: theme.palette.info.main };
    return { level: 4, text: 'Forte', color: theme.palette.success.main };
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={48} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Validando token...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aguarde enquanto verificamos seu link de redefinição.
            </Typography>
          </Box>
        );

      case 'success':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 3 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Senha Redefinida!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Sua senha foi alterada com sucesso.
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              Agora você pode fazer login com sua nova senha.
            </Alert>
            <Button
              variant="contained"
              onClick={handleGoToLogin}
              sx={{
                background: 'linear-gradient(135deg, #FF8012, #E67300)',
                minWidth: 140,
              }}
            >
              Ir para Login
            </Button>
          </Box>
        );

      case 'invalid':
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 3 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Link Inválido
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Os links de redefinição expiram em 1 hora por segurança.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleRequestNewToken}
                sx={{
                  background: 'linear-gradient(135deg, #FF8012, #E67300)',
                }}
              >
                Solicitar Novo Link
              </Button>
              <Button
                variant="outlined"
                onClick={handleGoToLogin}
              >
                Ir para Login
              </Button>
            </Box>
          </Box>
        );

      case 'valid':
        const passwordStrength = getPasswordStrength();
        
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Redefinir Senha
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Digite sua nova senha. Ela deve ser forte e segura.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Nova Senha"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange('password')}
                disabled={loading}
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
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
                autoComplete="new-password"
                autoFocus
              />

              {/* Indicador de força da senha */}
              {formData.password && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        flex: 1,
                        height: 4,
                        bgcolor: 'grey.200',
                        borderRadius: 2,
                        mr: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(passwordStrength.level / 4) * 100}%`,
                          height: '100%',
                          bgcolor: passwordStrength.color,
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: passwordStrength.color, fontWeight: 'bold' }}
                    >
                      {passwordStrength.text}
                    </Typography>
                  </Box>
                </Box>
              )}

              <TextField
                fullWidth
                label="Confirmar Nova Senha"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                disabled={loading}
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
                        disabled={loading}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
                autoComplete="new-password"
              />

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Dicas para uma senha forte:</strong><br />
                  • Pelo menos 6 caracteres<br />
                  • Letras maiúsculas e minúsculas<br />
                  • Números<br />
                  • Caracteres especiais (opcional)
                </Typography>
              </Alert>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !formData.password || !formData.confirmPassword}
                sx={{
                  py: 1.5,
                  mb: 3,
                  background: 'linear-gradient(135deg, #FF8012, #E67300)',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #E67300, #FF8012)',
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
                    Redefinindo...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </Box>
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
        background: 'linear-gradient(135deg, #FF8012, #E67300)',
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
                background: 'linear-gradient(135deg, #FF8012, #E67300)',
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

          {/* Content */}
          {renderContent()}

          {/* Help Text */}
          {status === 'valid' && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Lembrou da senha?{' '}
                <Button
                  variant="text"
                  size="small"
                  onClick={handleGoToLogin}
                  sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                >
                  Fazer login
                </Button>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
} 
