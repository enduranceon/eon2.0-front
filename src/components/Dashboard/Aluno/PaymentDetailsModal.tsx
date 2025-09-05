import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Link,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon,
  QrCode as QrCodeIcon,
  CreditCard as CreditCardIcon,
  Receipt as ReceiptIcon,
  Pix as PixIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { Payment, PaymentMethod, PaymentStatus } from '@/types/api';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';

interface PaymentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  open,
  onClose,
  payment,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  if (!payment) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar(`${label} copiado!`, { variant: 'success' });
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.CONFIRMED:
        return 'success';
      case PaymentStatus.PENDING:
        return 'warning';
      case PaymentStatus.OVERDUE:
        return 'error';
      case PaymentStatus.CANCELLED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.CONFIRMED:
        return 'Confirmado';
      case PaymentStatus.PENDING:
        return 'Pendente';
      case PaymentStatus.OVERDUE:
        return 'Vencido';
      case PaymentStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CREDIT_CARD:
        return 'Cartão de Crédito';
      case PaymentMethod.PIX:
        return 'PIX';
      case PaymentMethod.BOLETO:
        return 'Boleto';
      default:
        return method;
    }
  };

  const renderPixDetails = () => {
    if (payment.paymentMethod !== PaymentMethod.PIX || !payment.asaasPaymentData?.pixData) {
      return null;
    }

    const { pixData } = payment.asaasPaymentData;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PixIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Dados do PIX</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                QR Code
              </Typography>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <img
                  src={pixData.encodedImage}
                  alt="QR Code PIX"
                  style={{ maxWidth: '200px', height: 'auto' }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Código PIX (Copia e Cola)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    flex: 1,
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: 'grey.50',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {pixData.payload}
                </Box>
                <Tooltip title="Copiar código PIX">
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(pixData.payload, 'Código PIX')}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Vencimento:</strong> {format(new Date(pixData.expirationDate), 'dd/MM/yyyy HH:mm')}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  const renderBoletoDetails = () => {
    if (payment.paymentMethod !== PaymentMethod.BOLETO || !payment.asaasPaymentData?.boletoData) {
      return null;
    }

    const { boletoData } = payment.asaasPaymentData;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ReceiptIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Dados do Boleto</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Código de Barras
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    flex: 1,
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: 'grey.50',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    letterSpacing: '0.1em',
                  }}
                >
                  {boletoData.bankSlipBarCode}
                </Box>
                <Tooltip title="Copiar código de barras">
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(boletoData.bankSlipBarCode, 'Código de barras')}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Número do Código de Barras
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    flex: 1,
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: 'grey.50',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    letterSpacing: '0.1em',
                  }}
                >
                  {boletoData.bankSlipBarCodeNumber}
                </Box>
                <Tooltip title="Copiar número do código de barras">
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(boletoData.bankSlipBarCodeNumber, 'Número do código de barras')}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              href={boletoData.bankSlipUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Baixar Boleto
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderCreditCardDetails = () => {
    if (payment.paymentMethod !== PaymentMethod.CREDIT_CARD || !payment.asaasPaymentData?.creditCardData) {
      return null;
    }

    const { creditCardData } = payment.asaasPaymentData;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CreditCardIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Dados do Cartão</Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Nome no Cartão
              </Typography>
              <Typography variant="body1">
                {creditCardData.holderName}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Número do Cartão
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                **** **** **** {creditCardData.number.slice(-4)}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Validade
              </Typography>
              <Typography variant="body1">
                {creditCardData.expiryMonth}/{creditCardData.expiryYear}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderReceipts = () => {
    if (!payment.asaasPaymentData) return null;

    const { invoiceUrl, transactionReceiptUrl } = payment.asaasPaymentData;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Comprovantes</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {invoiceUrl && (
              <Button
                variant="outlined"
                startIcon={<ReceiptIcon />}
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Informações sobre a compra
              </Button>
            )}
            
            {transactionReceiptUrl && (
              <Button
                variant="outlined"
                startIcon={<ReceiptIcon />}
                href={transactionReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Comprovante de Transação
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Detalhes do Pagamento
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Informações Básicas */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Informações do Pagamento
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  ID do Pagamento
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {payment.id}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={getStatusLabel(payment.status)}
                  color={getStatusColor(payment.status) as any}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Método de Pagamento
                </Typography>
                <Typography variant="body1">
                  {getMethodLabel(payment.paymentMethod)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Valor
                </Typography>
                <Typography variant="h6" color="primary">
                  R$ {payment.amount.toFixed(2)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Data de Vencimento
                </Typography>
                <Typography variant="body1">
                  {format(new Date(payment.dueDate), 'dd/MM/yyyy')}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Data de Pagamento
                </Typography>
                <Typography variant="body1">
                  {payment.paidAt ? format(new Date(payment.paidAt), 'dd/MM/yyyy') : '-'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Detalhes específicos por método de pagamento */}
        {renderPixDetails()}
        {renderBoletoDetails()}
        {renderCreditCardDetails()}
        
        {/* Comprovantes */}
        {renderReceipts()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDetailsModal;
