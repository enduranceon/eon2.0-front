'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { featureService, Feature, FeaturePurchaseRequest } from '@/services/featureService';
import { enduranceApi } from '@/services/enduranceApi';
import { toast } from 'sonner';

interface FeaturesTabProps {
  onFeaturePurchased?: () => void;
}

const FeaturesTab: React.FC<FeaturesTabProps> = ({ onFeaturePurchased }) => {
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);
  const [userFeatures, setUserFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [billingType, setBillingType] = useState<'PIX' | 'BOLETO' | 'CREDIT_CARD'>('PIX');
  const [creditCardData, setCreditCardData] = useState({
    number: '',
    holderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  });
  const [purchasing, setPurchasing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [pendingPaymentDialogOpen, setPendingPaymentDialogOpen] = useState(false);
  const [selectedPendingPayment, setSelectedPendingPayment] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [featuresData, paymentMethodsData, activeSubscription, pendingPaymentsData] = await Promise.all([
        featureService.getFeaturesForSale(),
        enduranceApi.getPaymentMethods(),
        enduranceApi.getActiveSubscription(),
        featureService.getPendingPayments()
      ]);

      setAvailableFeatures(featuresData);
      setPaymentMethods(Array.isArray(paymentMethodsData) ? paymentMethodsData : []);
      
      // Extrair dados dos pagamentos pendentes da resposta da API
      setPendingPayments(Array.isArray(pendingPaymentsData) ? pendingPaymentsData : []);
      
      // Extrair features do plano da assinatura ativa
      const planFeatures = activeSubscription?.plan?.features || [];
      const userFeaturesFromPlan = planFeatures.map((planFeature: any) => planFeature.feature).filter(Boolean);
      setUserFeatures(userFeaturesFromPlan);
    } catch (err) {
      console.error('Erro ao carregar dados das features:', err);
      setError('Falha ao carregar as features disponíveis. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o usuário já possui uma feature
  const hasFeature = (featureId: string): boolean => {
    return userFeatures.some(userFeature => userFeature.id === featureId);
  };

  // Verificar se existe pagamento pendente para uma feature
  const hasPendingPayment = (featureId: string): boolean => {
    return pendingPayments.some(payment => {
      const paymentFeatureId = payment.feature?.id;
      return paymentFeatureId === featureId;
    });
  };

  // Obter pagamento pendente de uma feature
  const getPendingPayment = (featureId: string) => {
    return pendingPayments.find(payment => payment.feature?.id === featureId);
  };

  const handlePurchaseClick = (feature: Feature) => {
    // Verificar se existe pagamento pendente
    if (hasPendingPayment(feature.id)) {
      const pendingPayment = getPendingPayment(feature.id);
      setSelectedPendingPayment(pendingPayment);
      setPendingPaymentDialogOpen(true);
      return;
    }

    // Verificar se já possui a feature
    if (hasFeature(feature.id)) {
      toast.info('Você já possui esta feature em seu plano.');
      return;
    }

    setSelectedFeature(feature);
    setSelectedPaymentMethod('');
    setPurchaseDialogOpen(true);
  };

  const handlePurchase = async () => {
    if (!selectedFeature) return;

    // Validações específicas por tipo de pagamento
    if (billingType === 'CREDIT_CARD' && !selectedPaymentMethod && !creditCardData.number) {
      setError('Selecione um cartão salvo ou preencha os dados do cartão.');
      return;
    }

    try {
      setPurchasing(true);
      
      const purchaseData: FeaturePurchaseRequest = {
        featureId: selectedFeature.id,
        billingType: billingType
      };

      // Adicionar dados específicos baseado no tipo de pagamento
      if (billingType === 'CREDIT_CARD') {
        if (selectedPaymentMethod) {
          // Usar cartão salvo
          purchaseData.paymentMethodId = selectedPaymentMethod;
        } else {
          // Usar dados do cartão preenchidos
          purchaseData.creditCardNumber = creditCardData.number;
          purchaseData.creditCardHolderName = creditCardData.holderName;
          purchaseData.creditCardExpiryMonth = creditCardData.expiryMonth;
          purchaseData.creditCardExpiryYear = creditCardData.expiryYear;
          purchaseData.creditCardCvv = creditCardData.cvv;
          purchaseData.remoteIp = '192.168.1.1'; // IP padrão
        }
      }

      const result = await featureService.purchaseFeature(purchaseData);
      
      // Verificar se é pagamento pendente (PIX ou Boleto)
      if (result.payment?.status === 'PENDING') {
        setPaymentResult(result);
        setPaymentDialogOpen(true);
        setPurchaseDialogOpen(false);
        
        // Mostrar notificação de pagamento pendente
        const paymentMethod = result.payment?.paymentMethod || 'PIX';
        toast.success(`Pagamento ${paymentMethod} gerado com sucesso!`);
      } else {
        // Pagamento confirmado (Cartão)
        setPurchaseDialogOpen(false);
        setSelectedFeature(null);
        setSelectedPaymentMethod('');
        setBillingType('PIX');
        setCreditCardData({
          number: '',
          holderName: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: ''
        });
        
        // Mostrar notificação de sucesso
        toast.success('Feature comprada com sucesso!');
        
        // Recarregar dados
        await loadData();
        
        if (onFeaturePurchased) {
          onFeaturePurchased();
        }
      }
    } catch (err: any) {
      console.error('Erro ao comprar feature:', err);
      
      // Verificar se é erro de pagamento pendente (409)
      if (err.response?.status === 409) {
        const errorData = err.response.data;
        console.log('Dados do erro 409:', errorData);
        
        // Mostrar notificação de pagamento pendente
        toast.error('Já existe um pagamento pendente para esta feature.');
        
        // Fechar dialog de compra
        setPurchaseDialogOpen(false);
        
        // Recarregar dados para atualizar o status dos botões
        await loadData();
      } else {
        setError('Falha ao processar a compra. Tente novamente.');
      }
    } finally {
      setPurchasing(false);
    }
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Carregando features disponíveis...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Features Disponíveis para Compra */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCartIcon color="primary" />
          Features Disponíveis
        </Typography>
        
        {availableFeatures.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Não há features disponíveis para compra no momento.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {availableFeatures.map((feature) => (
              <Grid item xs={12} sm={6} md={4} key={feature.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {feature.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {feature.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        {formatCurrency(feature.value)}
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      variant="contained"
                      color={
                        hasFeature(feature.id) ? "success" : 
                        hasPendingPayment(feature.id) ? "warning" : 
                        "primary"
                      }
                      startIcon={
                        hasFeature(feature.id) ? <AddIcon /> : 
                        hasPendingPayment(feature.id) ? <ShoppingCartIcon /> :
                        <ShoppingCartIcon />
                      }
                      onClick={() => hasFeature(feature.id) ? null : handlePurchaseClick(feature)}
                      disabled={!feature.isActive || feature.status !== 'ACTIVE' || hasFeature(feature.id) || hasPendingPayment(feature.id)}
                      fullWidth
                    >
                      {hasFeature(feature.id) ? 'Já Possui' : 
                       hasPendingPayment(feature.id) ? 'Aguardando Pagamento' : 
                       'Comprar'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Dialog de Compra */}
      <Dialog
        open={purchaseDialogOpen}
        onClose={() => setPurchaseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Comprar Feature: {selectedFeature?.name}
        </DialogTitle>
        <DialogContent>
          {selectedFeature && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>
                {selectedFeature.description}
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                Valor: {formatCurrency(selectedFeature.value)}
              </Typography>
            </Box>
          )}
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Tipo de Pagamento</InputLabel>
            <Select
              value={billingType}
              onChange={(e) => setBillingType(e.target.value as 'PIX' | 'BOLETO' | 'CREDIT_CARD')}
              label="Tipo de Pagamento"
            >
              <MenuItem value="PIX">PIX</MenuItem>
              <MenuItem value="BOLETO">Boleto</MenuItem>
              <MenuItem value="CREDIT_CARD">Cartão de Crédito</MenuItem>
            </Select>
          </FormControl>

          {billingType === 'CREDIT_CARD' && (
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Cartão Salvo (Opcional)</InputLabel>
                <Select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  label="Cartão Salvo (Opcional)"
                >
                  <MenuItem value="">
                    <em>Usar novo cartão</em>
                  </MenuItem>
                  {paymentMethods.map((method) => (
                    <MenuItem key={method.id} value={method.id}>
                      {method.cardBrand} ****{method.last4Digits} {method.isDefault ? '(Padrão)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!selectedPaymentMethod && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Dados do Cartão
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Número do Cartão"
                        value={creditCardData.number}
                        onChange={(e) => setCreditCardData(prev => ({ ...prev, number: e.target.value }))}
                        placeholder="4111111111111111"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Nome no Cartão"
                        value={creditCardData.holderName}
                        onChange={(e) => setCreditCardData(prev => ({ ...prev, holderName: e.target.value }))}
                        placeholder="João Silva"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Mês"
                        value={creditCardData.expiryMonth}
                        onChange={(e) => setCreditCardData(prev => ({ ...prev, expiryMonth: e.target.value }))}
                        placeholder="12"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Ano"
                        value={creditCardData.expiryYear}
                        onChange={(e) => setCreditCardData(prev => ({ ...prev, expiryYear: e.target.value }))}
                        placeholder="2025"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="CVV"
                        value={creditCardData.cvv}
                        onChange={(e) => setCreditCardData(prev => ({ ...prev, cvv: e.target.value }))}
                        placeholder="123"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handlePurchase}
            variant="contained"
            disabled={purchasing || (billingType === 'CREDIT_CARD' && !selectedPaymentMethod && !creditCardData.number)}
            startIcon={purchasing ? <CircularProgress size={20} /> : <ShoppingCartIcon />}
          >
            {purchasing ? 'Processando...' : 'Confirmar Compra'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Pagamento (PIX/Boleto) */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {paymentResult?.payment?.paymentMethod === 'PIX' ? 'Pagamento PIX' : 'Boleto Bancário'}
        </DialogTitle>
        <DialogContent>
          {paymentResult?.payment?.paymentMethod === 'PIX' && paymentResult?.payment?.pixData && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Escaneie o QR Code ou copie o código PIX
              </Typography>
              
              {/* QR Code */}
              <Box sx={{ mb: 3 }}>
                <img 
                  src={`data:image/png;base64,${paymentResult.payment.pixData.encodedImage}`} 
                  alt="QR Code PIX"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </Box>
              
              {/* Código PIX */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Código PIX:
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={paymentResult.payment.pixData.payload}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ fontFamily: 'monospace' }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigator.clipboard.writeText(paymentResult.payment.pixData.payload)}
                  sx={{ mt: 1 }}
                >
                  Copiar Código
                </Button>
              </Box>
              
              {/* Data de Expiração */}
              <Typography variant="body2" color="text.secondary">
                Válido até: {new Date(paymentResult.payment.pixData.expirationDate).toLocaleString('pt-BR')}
              </Typography>
            </Box>
          )}

          {paymentResult?.payment?.paymentMethod === 'BOLETO' && paymentResult?.payment?.boletoData && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Boleto Bancário Gerado
              </Typography>
              
              <Typography variant="body1" paragraph>
                Seu boleto foi gerado com sucesso!
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Número do boleto: {paymentResult.payment.boletoData.invoiceNumber}
              </Typography>
              
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => window.open(paymentResult.payment.boletoData.invoiceUrl, '_blank')}
                startIcon={<ShoppingCartIcon />}
              >
                Baixar Boleto PDF
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Pagamento Pendente */}
      <Dialog 
        open={pendingPaymentDialogOpen} 
        onClose={() => setPendingPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Pagamento Pendente
        </DialogTitle>
        <DialogContent>
          {selectedPendingPayment && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom color="warning.main">
                ⚠️ Já existe um pagamento pendente para esta feature
              </Typography>
              
              <Typography variant="body1" paragraph>
                <strong>Feature:</strong> {selectedPendingPayment.featureName}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Status:</strong> {selectedPendingPayment.paymentStatus}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Método de Pagamento:</strong> {selectedPendingPayment.paymentMethod}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Data de Criação:</strong> {new Date(selectedPendingPayment.createdAt).toLocaleString('pt-BR')}
              </Typography>
              
              {selectedPendingPayment.dueDate && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Vencimento:</strong> {new Date(selectedPendingPayment.dueDate).toLocaleString('pt-BR')}
                </Typography>
              )}
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Aguarde a confirmação do pagamento ou entre em contato com o suporte se necessário.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingPaymentDialogOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeaturesTab;
