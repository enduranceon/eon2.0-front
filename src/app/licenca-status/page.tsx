'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import {
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  CalendarToday as CalendarIcon,
  DirectionsRun as RunIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Logout as LogoutIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { enduranceApi } from '@/services/enduranceApi';
import ProtectedRoute from '@/components/ProtectedRoute';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function LicencaStatusPage() {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await enduranceApi.getActiveSubscription();
      setSubscription(response);
      
      // Se não está em licença, redirecionar para dashboard
      if (response && response.status !== 'ON_LEAVE') {
        router.push('/dashboard/aluno');
        return;
      }
    } catch (err) {
      console.error('Erro ao carregar assinatura:', err);
      setError('Erro ao carregar informações da licença.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelLeave = async () => {
    try {
      setLoading(true);
      await enduranceApi.cancelLeave();
      toast.success('Licença cancelada com sucesso!');
      router.push('/dashboard/aluno');
    } catch (error) {
      console.error('Erro ao cancelar licença:', error);
      toast.error('Erro ao cancelar licença.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      auth.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const calculateDaysRemaining = () => {
    if (!subscription?.leaveEndDate) return 0;
    
    try {
      const endDate = new Date(subscription.leaveEndDate);
      if (isNaN(endDate.getTime())) return 0;
      return Math.max(0, differenceInDays(endDate, new Date()));
    } catch (error) {
      console.error('Erro ao calcular dias restantes:', error);
      return 0;
    }
  };

  const getProgressColor = () => {
    const daysRemaining = calculateDaysRemaining();
    if (daysRemaining === 0) return 'error';
    if (daysRemaining <= 3) return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    const daysRemaining = calculateDaysRemaining();
    if (daysRemaining === 0) return 'Expirada';
    if (daysRemaining <= 3) return 'Expira em breve';
    return 'Ativa';
  };

  if (!auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Endurance On
            </Typography>
            <IconButton
              color="inherit"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Endurance On
            </Typography>
            <IconButton
              color="inherit"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={loadSubscription}>
            Tentar Novamente
          </Button>
        </Container>
      </Box>
    );
  }

  const daysRemaining = calculateDaysRemaining();

  return (
    <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <PauseIcon sx={{ mr: 2, color: 'warning.main' }} />
              <Typography variant="h6" component="div">
                Status da Licença
              </Typography>
            </Box>
            <IconButton
              color="inherit"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          {/* Header da Página */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" color="text.primary" gutterBottom>
              Licença Temporária Ativa
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sua assinatura está temporariamente pausada
            </Typography>
          </Box>

          {subscription ? (
            <Card sx={{ mb: 4, border: '2px solid', borderColor: getProgressColor() }}>
              <CardContent sx={{ p: 4 }}>
                <Alert severity="info" sx={{ mb: 4 }}>
                  <Typography variant="body1">
                    Sua assinatura está temporariamente pausada. Após a data de fim, ela será reativada automaticamente.
                    Durante este período, você não tem acesso ao dashboard.
                  </Typography>
                </Alert>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Data de Início
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {formatDate(subscription.leaveStartDate)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Data de Fim
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {formatDate(subscription.leaveEndDate)}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Dias Restantes
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: daysRemaining === 0 ? 'error.main' : 
                               daysRemaining <= 3 ? 'warning.main' : 'success.main'
                      }}
                    >
                      {daysRemaining === 0 ? 'Expirada' : `${daysRemaining} dias`}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={getStatusText()}
                      color={getProgressColor() as any}
                      icon={daysRemaining === 0 ? <WarningIcon /> : 
                            daysRemaining <= 3 ? <WarningIcon /> : <CheckCircleIcon />}
                    />
                  </Grid>

                  {subscription.leaveReason && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Motivo da Licença
                      </Typography>
                      <Typography variant="body1">
                        {subscription.leaveReason}
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Configurações da Licença */}
                <Typography variant="h6" gutterBottom>
                  Configurações da Licença
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Chip
                    label={`Treinos ${subscription.pauseTraining ? 'Pausados' : 'Ativos'}`}
                    color={subscription.pauseTraining ? 'warning' : 'success'}
                    icon={<RunIcon />}
                  />
                  <Chip
                    label={`Cobrança ${subscription.pauseBilling ? 'Pausada' : 'Ativa'}`}
                    color={subscription.pauseBilling ? 'warning' : 'success'}
                    icon={<PaymentIcon />}
                  />
                </Box>

                {/* Progresso da Licença */}
                {daysRemaining > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Progresso da Licença
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={((subscription.leaveDays - daysRemaining) / subscription.leaveDays) * 100}
                      color={getProgressColor() as any}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}

                {/* Informações da Assinatura */}
                <Card variant="outlined" sx={{ mb: 4 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Informações da Assinatura
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Plano
                        </Typography>
                        <Typography variant="body1">
                          {subscription.plan?.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Modalidade
                        </Typography>
                        <Typography variant="body1">
                          {subscription.modalidade?.name}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Ações */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleCancelLeave}
                    disabled={loading || daysRemaining === 0}
                    size="large"
                  >
                    Cancelar Licença e Reativar Assinatura
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ mb: 4 }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Carregando informações da licença...
                </Typography>
              </CardContent>
            </Card>
          )}
        </Container>
        <Toaster position="top-right" />
      </Box>
    </ProtectedRoute>
  );
} 