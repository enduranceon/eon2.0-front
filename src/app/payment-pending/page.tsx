'use client';

import React from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  useTheme,
} from '@mui/material';
import { 
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { clearStorageAndRedirectToLogin } from '../../utils/paymentUtils';

export default function PaymentPendingPage() {
  const theme = useTheme();
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = () => {
    // Fazer logout
    auth.logout();
    
    // Limpar todos os dados e redirecionar
    clearStorageAndRedirectToLogin(router);
  };

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
            {/* Ícone */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'grey.100',
                color: 'primary.main',
                mb: 3,
                border: '2px solid',
                borderColor: 'primary.main',
              }}
            >
              <ScheduleIcon sx={{ fontSize: 40 }} />
            </Box>

            {/* Título */}
            <Typography variant="h4" fontWeight="bold" gutterBottom color="primary.main">
              Processando seu Pagamento
            </Typography>

            {/* Descrição */}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              Estamos processando seu pagamento. Este processo pode levar alguns instantes 
              até ser confirmado pelo sistema bancário.
            </Typography>

            {/* Informação sobre notificação */}
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                p: 3,
                mb: 4,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: theme.shadows[1],
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                  Você será notificado
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Assim que seu pagamento for confirmado, enviaremos um e-mail para:
              </Typography>
              
              <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                {auth.user?.email}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Após a confirmação, você poderá acessar seu Dashboard completo.
              </Typography>
            </Box>

            {/* Instruções */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Por favor, aguarde a confirmação. Você pode fechar esta página e 
              aguardar o e-mail de confirmação para acessar sua conta.
            </Typography>

            {/* Botão de logout */}
            <Button
              variant="outlined"
              size="large"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ 
                fontWeight: 'bold',
                px: 4,
                py: 1.5
              }}
            >
              Sair da Conta
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
} 