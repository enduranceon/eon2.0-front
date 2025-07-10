'use client';

import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { 
  CreditCard as CardIcon,
  Schedule as ScheduleIcon 
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { clearStorageAndRedirectToLogin } from '../../utils/paymentUtils';

export default function PaymentProcessingPage() {
  const theme = useTheme();
  const router = useRouter();

  const clearStorageAndRedirect = () => {
    clearStorageAndRedirectToLogin(router);
  };

  useEffect(() => {
    // Redirecionar após 3 segundos
    const timer = setTimeout(() => {
      clearStorageAndRedirect();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[10] }}>
          <CardContent sx={{ textAlign: 'center', py: 6, px: 4 }}>
            {/* Ícone animado */}
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
              <CircularProgress
                size={80}
                thickness={4}
                sx={{ color: 'primary.main' }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CardIcon sx={{ fontSize: 36, color: 'primary.main' }} />
              </Box>
            </Box>

            {/* Título */}
            <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
              Processando seu Pagamento
            </Typography>

            {/* Descrição */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              Estamos processando seu pagamento com cartão de crédito.
              <br />
              Este processo pode levar alguns instantes.
            </Typography>

            {/* Informação adicional */}
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                p: 3,
                mb: 3,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: theme.shadows[1],
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  O que acontece agora?
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Você será redirecionado para fazer login novamente.
                Após o login, verificaremos o status do seu pagamento automaticamente.
              </Typography>
            </Box>

            {/* Status */}
            <Typography variant="body2" color="text.secondary">
              Redirecionando em alguns segundos...
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
} 