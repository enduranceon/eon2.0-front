import React from 'react';
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
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Pix as PixIcon,
  Receipt as BoletoIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from '@mui/icons-material';
import { Payment, PaymentStatus, PaymentMethod } from '@/types/api';
import { format } from 'date-fns';

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
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Histórico de Faturas
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Método</TableCell>
                <TableCell align="right">Valor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <TableRow key={payment.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell component="th" scope="row">
                      {format(new Date(payment.createdAt), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell><StatusChip status={payment.status} /></TableCell>
                    <TableCell><PaymentMethodIcon method={payment.paymentMethod} /></TableCell>
                    <TableCell align="right">{`R$ ${payment.amount.toFixed(2)}`}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    Nenhum pagamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default PaymentHistory;