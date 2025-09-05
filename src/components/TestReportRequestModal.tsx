'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Link
} from '@mui/material';
import {
  Description as ReportIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  QrCode as QrCodeIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';
import { enduranceApi } from '@/services/enduranceApi';
import { 
  TestReportRequest, 
  TestReportRequestStatus, 
  TestReportRequestType,
  CreateTestReportRequestRequest,
  TestReportPaymentRequest,
  PaymentMethod
} from '@/types/api';

interface TestReportRequestModalProps {
  open: boolean;
  onClose: () => void;
  testResultId: string;
  testName: string;
  userPlan: string;
  onSuccess?: (request: TestReportRequest) => void;
}

const TestReportRequestModal: React.FC<TestReportRequestModalProps> = ({
  open,
  onClose,
  testResultId,
  testName,
  userPlan,
  onSuccess
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para solicitação
  const [request, setRequest] = useState<TestReportRequest | null>(null);
  const [requestType, setRequestType] = useState<TestReportRequestType | null>(null);
  
  // Estados para pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Verificar se é plano Premium
  // Normalizar o nome do plano para comparação (remover espaços extras, converter para minúsculas)
  const normalizedPlan = userPlan?.toLowerCase().trim() || '';
  
  // Lista de planos Premium (incluindo variações possíveis)
  const premiumPlans = [
    'corrida avancado',
    'corrida avançado',
    'triathlon avançado',
    'triathlon avancado'
  ];
  
  // Verificar se é plano Premium (exato ou contém palavras-chave)
  const isPremiumPlan = premiumPlans.includes(normalizedPlan) || 
                        normalizedPlan.includes('premium') ||
                        normalizedPlan.includes('avançado') ||
                        normalizedPlan.includes('avancado');

  const steps = [
    'Solicitar Relatório',
    isPremiumPlan ? 'Aguardar Aprovação' : 'Realizar Pagamento',
    'Concluído'
  ];

  const handleClose = () => {
    setActiveStep(0);
    setReason('');
    setError(null);
    setSuccess(null);
    setRequest(null);
    setRequestType(null);
    setPaymentData(null);
    setPaymentError(null);
    onClose();
  };

  const handleCreateRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      const requestData: CreateTestReportRequestRequest = {
        testResultId,
        reason: reason.trim() || undefined
      };

      const response = await enduranceApi.createTestReportRequest(requestData);
      
      if (response.success) {
        setRequest({
          id: response.data.requestId,
          userId: '',
          testResultId,
          requestType: response.data.requestType,
          status: response.data.status,
          reason: reason.trim() || undefined,
          createdAt: response.data.createdAt,
          updatedAt: response.data.createdAt
        });
        setRequestType(response.data.requestType);
        setSuccess(response.message);
        
        if (response.data.requestType === TestReportRequestType.FREE_PREMIUM) {
          setActiveStep(2); // Pular para conclusão se for plano Premium
        } else {
          setActiveStep(1); // Ir para pagamento se for plano não-Premium
        }
      } else {
        setError(response.message || 'Erro ao criar solicitação');
      }
    } catch (err: any) {
      console.error('Erro ao criar solicitação:', err);
      setError(err.response?.data?.message || 'Erro ao criar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!request) return;

    try {
      setPaymentLoading(true);
      setPaymentError(null);

      const paymentData: TestReportPaymentRequest = {
        billingType: paymentMethod
      };

      const response = await enduranceApi.createTestReportPayment(request.id, paymentData);
      
      if (response.success) {
        setPaymentData(response.data);
        setActiveStep(2);
      } else {
        setPaymentError(response.message || 'Erro ao criar pagamento');
      }
    } catch (err: any) {
      console.error('Erro ao criar pagamento:', err);
      setPaymentError(err.response?.data?.message || 'Erro ao criar pagamento');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aqui você pode adicionar um toast de confirmação
  };

  const handleOpenPaymentUrl = () => {
    if (paymentData?.paymentUrl) {
      window.open(paymentData.paymentUrl, '_blank');
    }
  };

  const getStatusColor = (status: TestReportRequestStatus) => {
    switch (status) {
      case TestReportRequestStatus.PENDING: return 'warning';
      case TestReportRequestStatus.APPROVED: return 'info';
      case TestReportRequestStatus.REJECTED: return 'error';
      case TestReportRequestStatus.COMPLETED: return 'success';
      case TestReportRequestStatus.CANCELLED: return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: TestReportRequestStatus) => {
    switch (status) {
      case TestReportRequestStatus.PENDING: return 'Pendente';
      case TestReportRequestStatus.APPROVED: return 'Aprovado';
      case TestReportRequestStatus.REJECTED: return 'Rejeitado';
      case TestReportRequestStatus.COMPLETED: return 'Concluído';
      case TestReportRequestStatus.CANCELLED: return 'Cancelado';
      default: return status;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon color="primary" />
          <Typography variant="h6">
            Solicitar Relatório de Teste
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Teste: <strong>{testName}</strong>
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Passo 1: Solicitar Relatório */}
          <Step>
            <StepLabel>Solicitar Relatório</StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {isPremiumPlan 
                    ? 'Como você possui um plano Premium, o relatório será gratuito e enviado após aprovação do seu treinador.'
                    : 'O relatório tem um custo de R$ 29,90 e será enviado após o pagamento e aprovação do seu treinador.'
                  }
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Motivo da solicitação (opcional)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Análise de performance, acompanhamento de evolução..."
                  sx={{ mb: 2 }}
                />

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleCreateRequest}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <ReportIcon />}
                  >
                    {loading ? 'Criando...' : 'Solicitar Relatório'}
                  </Button>
                  <Button onClick={handleClose}>
                    Cancelar
                  </Button>
                </Box>
              </Box>
            </StepContent>
          </Step>

          {/* Passo 2: Pagamento (apenas para planos não-Premium) */}
          {!isPremiumPlan && (
            <Step>
              <StepLabel>Realizar Pagamento</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        💳 Resumo do Pagamento
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Relatório de Teste: <strong>R$ 29,90</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Teste: <strong>{testName}</strong>
                      </Typography>
                    </CardContent>
                  </Card>

                  <FormControl component="fieldset" sx={{ mb: 2 }}>
                    <FormLabel component="legend">Método de Pagamento</FormLabel>
                    <RadioGroup
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    >
                      <FormControlLabel 
                        value={PaymentMethod.PIX} 
                        control={<Radio />} 
                        label="PIX (Recomendado)" 
                      />
                      <FormControlLabel 
                        value={PaymentMethod.BOLETO} 
                        control={<Radio />} 
                        label="Boleto Bancário" 
                      />
                      <FormControlLabel 
                        value={PaymentMethod.CREDIT_CARD} 
                        control={<Radio />} 
                        label="Cartão de Crédito" 
                      />
                    </RadioGroup>
                  </FormControl>

                  {paymentError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {paymentError}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleCreatePayment}
                      disabled={paymentLoading}
                      startIcon={paymentLoading ? <CircularProgress size={20} /> : <PaymentIcon />}
                    >
                      {paymentLoading ? 'Criando...' : 'Criar Pagamento'}
                    </Button>
                    <Button onClick={() => setActiveStep(0)}>
                      Voltar
                    </Button>
                  </Box>
                </Box>
              </StepContent>
            </Step>
          )}

          {/* Passo 3: Concluído */}
          <Step>
            <StepLabel>Concluído</StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {request && (
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        ✅ Solicitação Criada com Sucesso!
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography variant="body2">Status:</Typography>
                        <Chip 
                          label={getStatusText(request.status)} 
                          color={getStatusColor(request.status) as any}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>ID da Solicitação:</strong> {request.id}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Tipo:</strong> {request.requestType === TestReportRequestType.FREE_PREMIUM ? 'Gratuito (Plano Premium)' : 'Pago'}
                      </Typography>

                      {request.reason && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          <strong>Motivo:</strong> {request.reason}
                        </Typography>
                      )}

                      {isPremiumPlan ? (
                        <Alert severity="info">
                          Sua solicitação foi enviada para seu treinador. Você receberá uma notificação quando o relatório for aprovado e enviado.
                        </Alert>
                      ) : paymentData ? (
                        <Box>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            Pagamento criado com sucesso! Realize o pagamento para que sua solicitação seja processada.
                          </Alert>

                          {paymentMethod === PaymentMethod.PIX && paymentData.pixData && (
                            <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
                              <CardContent>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                  <QrCodeIcon sx={{ mr: 1 }} />
                                  PIX - QR Code
                                </Typography>
                                
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                  <img 
                                    src={`data:image/png;base64,${paymentData.pixData.qrCode}`} 
                                    alt="QR Code PIX"
                                    style={{ maxWidth: '200px', height: 'auto' }}
                                  />
                                </Box>

                                <TextField
                                  fullWidth
                                  label="Código PIX (Copiar e Colar)"
                                  value={paymentData.pixData.copyPaste}
                                  InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                      <Button
                                        size="small"
                                        onClick={() => handleCopyToClipboard(paymentData.pixData.copyPaste)}
                                        startIcon={<CopyIcon />}
                                      >
                                        Copiar
                                      </Button>
                                    )
                                  }}
                                  sx={{ mb: 2 }}
                                />

                                <Button
                                  variant="contained"
                                  fullWidth
                                  onClick={handleOpenPaymentUrl}
                                  startIcon={<OpenIcon />}
                                >
                                  Abrir Página de Pagamento
                                </Button>
                              </CardContent>
                            </Card>
                          )}

                          {paymentMethod !== PaymentMethod.PIX && (
                            <Button
                              variant="contained"
                              fullWidth
                              onClick={handleOpenPaymentUrl}
                              startIcon={<OpenIcon />}
                              sx={{ mb: 2 }}
                            >
                              Abrir Página de Pagamento
                            </Button>
                          )}

                          <Typography variant="body2" color="text.secondary">
                            <strong>Vencimento:</strong> {new Date(paymentData.dueDate).toLocaleDateString('pt-BR')}
                          </Typography>
                        </Box>
                      ) : null}
                    </CardContent>
                  </Card>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handleClose}
                    startIcon={<CheckIcon />}
                  >
                    Fechar
                  </Button>
                  {onSuccess && request && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        onSuccess(request);
                        handleClose();
                      }}
                    >
                      Ver Minhas Solicitações
                    </Button>
                  )}
                </Box>
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>
    </Dialog>
  );
};

export default TestReportRequestModal;
