'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Divider
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  Assignment as AssignmentIcon,
  DirectionsRun as RunIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { enduranceApi } from '@/services/enduranceApi';
import { LeaveRequest } from '@/types/api';
import PageHeader from '@/components/Dashboard/PageHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import toast, { Toaster } from 'react-hot-toast';

const steps = [
  'Definir Período',
  'Configurar Opções',
  'Revisar Solicitação'
];

export default function RequestLeavePage() {
  const auth = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [leaveForm, setLeaveForm] = useState<LeaveRequest>({
    leaveStartDate: '',
    leaveDays: 20,
    leaveReason: '',
    pauseTraining: false,
    pauseBilling: false
  });

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await enduranceApi.getActiveSubscription();
      setSubscription(response);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validar dados
      if (!leaveForm.leaveStartDate) {
        toast.error('Selecione a data de início da licença.');
        return;
      }

      if (leaveForm.leaveDays < 1 || leaveForm.leaveDays > 365) {
        toast.error('A licença deve ter entre 1 e 365 dias.');
        return;
      }

      try {
        const startDate = new Date(leaveForm.leaveStartDate);
        if (isNaN(startDate.getTime())) {
          toast.error('Data de início inválida.');
          return;
        }
        
        if (isBefore(startDate, startOfDay(new Date()))) {
          toast.error('A data de início deve ser futura.');
          return;
        }
      } catch (error) {
        toast.error('Data de início inválida.');
        return;
      }

      // Enviar solicitação
      await enduranceApi.requestLeave(leaveForm);
      
      toast.success('Licença solicitada com sucesso!');
      
      // Resetar formulário
      setLeaveForm({
        leaveStartDate: '',
        leaveDays: 20,
        leaveReason: '',
        pauseTraining: false,
        pauseBilling: false
      });
      setActiveStep(0);
      
    } catch (error) {
      console.error('Erro ao solicitar licença:', error);
      toast.error('Erro ao solicitar licença. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const calculateEndDate = () => {
    if (!leaveForm.leaveStartDate) return null;
    try {
      const startDate = new Date(leaveForm.leaveStartDate);
      if (isNaN(startDate.getTime())) return null;
      return addDays(startDate, leaveForm.leaveDays);
    } catch (error) {
      console.error('Erro ao calcular data de fim:', error);
      return null;
    }
  };

  const endDate = calculateEndDate();

  if (!auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>
      <DashboardLayout user={auth.user} onLogout={auth.logout}>
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <PageHeader
            title="Solicitar Licença Temporária"
            description="Solicite uma pausa temporária em sua assinatura por motivos pessoais ou profissionais."
          />

          {/* Informações da Assinatura */}
          {subscription && (
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📋 Sua Assinatura Atual
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="body1">
                        <strong>Plano:</strong> {subscription.plan?.name}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <RunIcon sx={{ mr: 1, color: 'secondary.main' }} />
                      <Typography variant="body1">
                        <strong>Modalidade:</strong> {subscription.modalidade?.name}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Chip
                      label={`Status: ${subscription.status}`}
                      color={subscription.status === 'ACTIVE' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Stepper */}
          <Paper sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {/* Passo 1: Definir Período */}
              <Step>
                <StepLabel>
                  <Typography variant="h6">📅 Definir Período da Licença</Typography>
                </StepLabel>
                <StepContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                        <DatePicker
                          label="Data de Início"
                          value={leaveForm.leaveStartDate ? new Date(leaveForm.leaveStartDate) : null}
                          onChange={(date) => setLeaveForm({
                            ...leaveForm,
                            leaveStartDate: date ? format(date, 'yyyy-MM-dd') : ''
                          })}
                          minDate={new Date()}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              helperText: 'Selecione a data de início da licença'
                            }
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Dias de Licença"
                        type="number"
                        value={leaveForm.leaveDays}
                        onChange={(e) => setLeaveForm({
                          ...leaveForm,
                          leaveDays: parseInt(e.target.value) || 1
                        })}
                        inputProps={{ min: 1, max: 365 }}
                        helperText="Entre 1 e 365 dias"
                      />
                    </Grid>

                    {endDate && (
                      <Grid item xs={12}>
                        <Alert severity="info">
                          <Typography variant="body2">
                            <strong>Data de Fim:</strong> {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
                            <br />
                            <strong>Duração:</strong> {leaveForm.leaveDays} dias
                          </Typography>
                        </Alert>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Motivo da Licença (opcional)"
                        multiline
                        rows={3}
                        value={leaveForm.leaveReason}
                        onChange={(e) => setLeaveForm({
                          ...leaveForm,
                          leaveReason: e.target.value
                        })}
                        placeholder="Ex: Viagem de trabalho, período de recuperação, etc."
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!leaveForm.leaveStartDate || leaveForm.leaveDays < 1}
                    >
                      Continuar
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Passo 2: Configurar Opções */}
              <Step>
                <StepLabel>
                  <Typography variant="h6">⚙️ Configurar Opções</Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Configure como sua assinatura deve se comportar durante a licença:
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={leaveForm.pauseTraining}
                                onChange={(e) => setLeaveForm({
                                  ...leaveForm,
                                  pauseTraining: e.target.checked
                                })}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PauseIcon sx={{ mr: 1, color: 'warning.main' }} />
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    Pausar Treinos
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Durante a licença, você não receberá novos treinos
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={leaveForm.pauseBilling}
                                onChange={(e) => setLeaveForm({
                                  ...leaveForm,
                                  pauseBilling: e.target.checked
                                })}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PaymentIcon sx={{ mr: 1, color: 'info.main' }} />
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                    Pausar Cobrança
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Durante a licença, não haverá cobrança da mensalidade
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Button onClick={handleBack} sx={{ mr: 1 }}>
                      Voltar
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                    >
                      Continuar
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Passo 3: Revisar Solicitação */}
              <Step>
                <StepLabel>
                  <Typography variant="h6">✅ Revisar Solicitação</Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Revise os detalhes da sua solicitação de licença:
                  </Typography>

                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Data de Início
                          </Typography>
                          <Typography variant="body1">
                            {leaveForm.leaveStartDate ? format(new Date(leaveForm.leaveStartDate), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Data de Fim
                          </Typography>
                          <Typography variant="body1">
                            {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Duração
                          </Typography>
                          <Typography variant="body1">
                            {leaveForm.leaveDays} dias
                          </Typography>
                        </Grid>

                        {leaveForm.leaveReason && (
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Motivo
                            </Typography>
                            <Typography variant="body1">
                              {leaveForm.leaveReason}
                            </Typography>
                          </Grid>
                        )}

                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Configurações
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={`Treinos ${leaveForm.pauseTraining ? 'Pausados' : 'Ativos'}`}
                              color={leaveForm.pauseTraining ? 'warning' : 'success'}
                              size="small"
                            />
                            <Chip
                              label={`Cobrança ${leaveForm.pauseBilling ? 'Pausada' : 'Ativa'}`}
                              color={leaveForm.pauseBilling ? 'warning' : 'success'}
                              size="small"
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Importante:</strong> Após a data de fim da licença, sua assinatura será reativada automaticamente.
                    </Typography>
                  </Alert>

                  <Box sx={{ mt: 2 }}>
                    <Button onClick={handleBack} sx={{ mr: 1 }}>
                      Voltar
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                    >
                      {loading ? 'Solicitando...' : 'Solicitar Licença'}
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </Paper>
        </Container>
        <Toaster position="top-right" />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 