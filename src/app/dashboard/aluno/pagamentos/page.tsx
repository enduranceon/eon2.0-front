'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { enduranceApi } from '../../../../services/enduranceApi';
import AddCardIcon from '@mui/icons-material/AddCard';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import HistoryIcon from '@mui/icons-material/History';
import { FaCcVisa, FaCcMastercard, FaCcAmex } from 'react-icons/fa';
import AddCardForm from '../../../../components/Forms/AddCardForm';
import { handleApiError } from '../../../../utils/errors';

const brandIcons: { [key: string]: React.ReactNode } = {
  visa: <FaCcVisa size={32} />,
  mastercard: <FaCcMastercard size={32} />,
  amex: <FaCcAmex size={32} />,
};

export default function StudentPaymentsPage() {
  const auth = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const loadPaymentMethods = React.useCallback(async () => {
    try {
      setLoading(true);
      const methods = await enduranceApi.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar métodos de pagamento');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (auth.user) {
      loadPaymentMethods();
    }
  }, [auth.user, loadPaymentMethods]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleAddCardSubmit = async (values: any, { setSubmitting, setStatus }: any) => {
    try {
      setStatus(null);
      await enduranceApi.addCreditCard(values);
      await loadPaymentMethods();
      handleCloseModal();
    } catch (err) {
      setStatus(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>
      <DashboardLayout user={auth.user!} onLogout={auth.logout} overdueInfo={auth.overdueInfo}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Pagamentos e Faturas
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Paper
              elevation={4}
              sx={{
                p: 2,
              }}
            >
              <Card sx={{ 
          background: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(30, 30, 30, 0.98)' 
            : 'rgba(255, 255, 255, 0.98)', 
          backdropFilter: 'blur(10px)' 
        }}>
                <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                    <Grid container spacing={3} alignItems="flex-start">
                      {/* Payment Methods */}
                      <Grid item xs={12} md={7}>
                        <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                          Meus Métodos de Pagamento
                        </Typography>
                        
                        {paymentMethods.length > 0 ? (
                           paymentMethods.map(method => (
                            <Box key={method.id} sx={{display: 'flex', alignItems: 'center', p: 2, mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2}}>
                               {brandIcons[method.cardBrand.toLowerCase()] || <CreditCardIcon sx={{fontSize: 32}} />}
                               <Box sx={{ml: 2}}>
                                 <Typography variant="body1" fontWeight="medium">
                                    Cartão final •••• {method.last4Digits}
                                 </Typography>
                                 <Typography variant="body2" color="text.secondary">
                                    {method.isDefault ? 'Cartão Padrão' : 'Cartão Secundário'}
                                 </Typography>
                               </Box>
                               {method.isDefault && <Chip label="Padrão" size="small" color="primary" sx={{ml: 'auto'}}/>}
                            </Box>
                           ))
                        ) : (
                            <Alert severity="info" action={
                                <Button color="inherit" size="small" startIcon={<AddCardIcon />} onClick={handleOpenModal}>
                                    Adicionar
                                </Button>
                            }>
                                Nenhum método de pagamento cadastrado.
                            </Alert>
                        )}
                      </Grid>

                      <Grid item xs={12}> <Divider sx={{my: {xs: 1, md: 0}}} /> </Grid>

                      {/* Actions */}
                      <Grid item xs={12} md={5}>
                        <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                            Ações Rápidas
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                          <Button variant="contained" startIcon={<AddCardIcon />} onClick={handleOpenModal}>Adicionar Novo Cartão</Button>
                          <Button variant="outlined" startIcon={<HistoryIcon />}>Histórico de Faturas</Button>
                        </Box>
                      </Grid>
                    </Grid>
                </CardContent>
              </Card>
            </Paper>
          )}
          <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
            <DialogTitle color="text.primary">Adicionar Novo Cartão</DialogTitle>
            <DialogContent>
                <AddCardForm onSubmit={handleAddCardSubmit} onCancel={handleCloseModal} />
            </DialogContent>
          </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 