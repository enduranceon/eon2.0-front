import React, { useState } from 'react';
import {
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Pix as PixIcon,
  Receipt as BoletoIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Payment, PaymentStatus, PaymentMethod } from '@/types/api';
import { format } from 'date-fns';
import PaymentDetailsModal from './PaymentDetailsModal';

const StatusChip = ({ status }: { status: PaymentStatus }) => {
  const statusMap = {
    [PaymentStatus.CONFIRMED]: { label: 'Confirmado', color: 'success', icon: <ActiveIcon /> },
    [PaymentStatus.PENDING]: { label: 'Pendente', color: 'warning', icon: <PendingIcon /> },
    [PaymentStatus.OVERDUE]: { label: 'Vencido', color: 'error', icon: <InactiveIcon /> },
    [PaymentStatus.CANCELLED]: { label: 'Cancelado', color: 'default', icon: <InactiveIcon /> },
  };
  const { label, color, icon } = statusMap[status] || statusMap[PaymentStatus.PENDING];
  return <Chip label={label} color={color as any} icon={icon} size="small" />;
};

const PaymentMethodIcon = ({ method }: { method: PaymentMethod }) => {
  const methodMap = {
    [PaymentMethod.CREDIT_CARD]: <CreditCardIcon />,
    [PaymentMethod.PIX]: <PixIcon />,
    [PaymentMethod.BOLETO]: <BoletoIcon />,
  };
  return methodMap[method] || null;
};

interface PaymentHistoryProps {
  payments: Payment[];
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments }) => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const processPayments = (payments: Payment[]) => {
    const paidPayments = payments.filter(payment => payment.status === 'CONFIRMED');
    const otherPayments = payments.filter(payment => payment.status !== 'CONFIRMED');
    
    return { paidPayments, otherPayments };
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPayment(null);
  };

  const { paidPayments, otherPayments } = processPayments(payments);

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Histórico de Faturas
        </Typography>
        
        {/* Mostrar estatísticas resumidas */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Total de faturas: {payments.length} | Pagas: {paidPayments.length} | Pendentes/Outras: {otherPayments.length}
          </Typography>
        </Box>

        {/* Alerta se não há faturas pagas */}
        {payments.length > 0 && paidPayments.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Não há faturas pagas no momento. Todas as faturas estão com status diferente de "Confirmado".
            </Typography>
          </Alert>
        )}

        {/* Diagnóstico quando não há dados da API */}
        {payments.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Nenhum pagamento encontrado.</strong> Possíveis causas:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ ml: 2 }}>
              <li>• A API <code>/payments</code> não está retornando dados</li>
              <li>• O usuário não possui pagamentos cadastrados no banco</li>
              <li>• Problema na autenticação/autorização da API</li>
              <li>• Filtros incorretos sendo aplicados na busca</li>
            </Typography>
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Método</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Data Vencimento</TableCell>
                <TableCell>Data Pagamento</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow 
                    key={payment.id} 
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      backgroundColor: payment.status === PaymentStatus.CONFIRMED ? 'rgba(76, 175, 80, 0.08)' : 'transparent'
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {format(new Date(payment.createdAt), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell><StatusChip status={payment.status} /></TableCell>
                    <TableCell><PaymentMethodIcon method={payment.paymentMethod} /></TableCell>
                    <TableCell align="right">{`R$ ${payment.amount.toFixed(2)}`}</TableCell>
                    <TableCell>
                      {payment.dueDate ? format(new Date(payment.dueDate), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {payment.paidAt ? format(new Date(payment.paidAt), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalhes do pagamento">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(payment)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      Nenhum pagamento encontrado.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Isso pode indicar que ainda não há faturas geradas ou há um problema na conexão com o servidor.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
      
      {/* Modal de detalhes do pagamento */}
      <PaymentDetailsModal
        open={modalOpen}
        onClose={handleCloseModal}
        payment={selectedPayment}
      />
    </Card>
  );
};

export default PaymentHistory;