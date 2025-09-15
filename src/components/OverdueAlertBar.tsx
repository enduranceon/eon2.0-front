'use client';

import React from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  Typography,
  Button,
  Link as MuiLink,
  IconButton,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { OverdueInfo } from '../types/api';
import { useAuth } from '../contexts/AuthContext';

interface OverdueAlertBarProps {
  overdueInfo: OverdueInfo;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function OverdueAlertBar({ 
  overdueInfo, 
  onClose, 
  showCloseButton = true 
}: OverdueAlertBarProps) {
  const theme = useTheme();
  const { overdueBarVisible, closeOverdueBar } = useAuth();

  const handleClose = () => {
    closeOverdueBar();
    onClose?.();
  };

  if (!overdueInfo.isOverdue || !overdueBarVisible) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getAlertSeverity = () => {
    if (overdueInfo.isAccessBlocked) {
      return 'error';
    }
    if (overdueInfo.daysRemaining && overdueInfo.daysRemaining <= 3) {
      return 'warning';
    }
    return 'info';
  };

  const getAlertTitle = () => {
    if (overdueInfo.isAccessBlocked) {
      return 'Pagamento em Atraso - Acesso Bloqueado';
    }
    if (overdueInfo.daysRemaining && overdueInfo.daysRemaining > 0) {
      return `Pagamento em Atraso - ${overdueInfo.daysRemaining} dias restante${overdueInfo.daysRemaining > 1 ? 's' : ''}`;
    }
    return 'Pagamento em Atraso';
  };

  const getAlertMessage = () => {
    if (overdueInfo.message) {
      return overdueInfo.message;
    }

    if (overdueInfo.isAccessBlocked) {
      return `Seu acesso foi bloqueado devido ao pagamento em atraso. Entre em contato para regularizar sua situação.`;
    }

    if (overdueInfo.daysRemaining && overdueInfo.daysRemaining > 0) {
      return `Você tem ${overdueInfo.daysRemaining} dias restantes de acesso. Regularize seu pagamento para continuar usando a plataforma.`;
    }

    return 'Seu pagamento está em atraso. Regularize sua situação para continuar usando a plataforma.';
  };

  return (
    <Collapse in={overdueBarVisible}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1300, // Z-index maior que o AppBar (que é 1100)
          width: '100%',
          height: '64px', // Altura fixa de 64px
        }}
      >
        <Alert
          severity={getAlertSeverity()}
          icon={<WarningIcon />}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                component={Link}
                href="/dashboard/aluno/meu-plano"
                variant="contained"
                size="small"
                startIcon={<PaymentIcon />}
                sx={{
                  backgroundColor: 'white',
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  },
                  fontWeight: 'bold',
                }}
              >
                Regularizar Pagamento
              </Button>
              {showCloseButton && (
                <IconButton
                  aria-label="fechar"
                  color="inherit"
                  size="small"
                  onClick={handleClose}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              )}
            </Box>
          }
          sx={{
            borderRadius: 0,
            backgroundColor: theme.palette.error.main,
            color: 'white',
            height: '64px', // Altura fixa de 64px
            display: 'flex',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              color: 'white',
            },
            '& .MuiAlert-action': {
              alignItems: 'center',
            },
            '& .MuiAlert-message': {
              display: 'flex',
              alignItems: 'center',
              flex: 1,
            },
          }}
        >
          <AlertTitle sx={{ color: 'white', fontWeight: 'bold' }}>
            {getAlertTitle()}
          </AlertTitle>
          <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
            {getAlertMessage()}
          </Typography>
        </Alert>
      </Box>
    </Collapse>
  );
}
