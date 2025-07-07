'use client';

import React from 'react';
import { Box, Button, Card, CardContent, Container, Typography } from '@mui/material';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import { useAuth } from '../../../contexts/AuthContext';

export default function SubscriptionPendingPage() {
  const auth = useAuth();

  const handleLogout = () => {
    auth.logout();
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', p: 6 }}>
          <HourglassTopIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Pagamento em Processamento
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Recebemos sua solicitação de assinatura e o pagamento está sendo processado.
            Assim que for confirmado você poderá acessar seu dashboard.
          </Typography>
          <Button variant="contained" onClick={handleLogout}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
} 