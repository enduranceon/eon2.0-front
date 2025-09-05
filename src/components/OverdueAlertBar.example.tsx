'use client';

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import OverdueAlertBar from './OverdueAlertBar';
import { OverdueInfo } from '../types/api';

// Exemplo de uso do componente OverdueAlertBar
export default function OverdueAlertBarExample() {
  // Exemplo 1: Aluno com pagamento vencido há 5 dias (dentro do prazo de tolerância)
  const overdueInfo1: OverdueInfo = {
    isOverdue: true,
    overdueAmount: 99.90,
    dueDate: '2024-01-15T00:00:00.000Z',
    daysRemaining: 5,
    accessLimitDate: '2024-01-25T00:00:00.000Z',
    isAccessBlocked: false,
    message: 'Sua assinatura venceu em 15/01/2024. Você tem 5 dias restantes de acesso.'
  };

  // Exemplo 2: Aluno com acesso bloqueado (prazo de tolerância expirado)
  const overdueInfo2: OverdueInfo = {
    isOverdue: true,
    overdueAmount: 99.90,
    dueDate: '2024-01-10T00:00:00.000Z',
    daysRemaining: 0,
    accessLimitDate: '2024-01-20T00:00:00.000Z',
    isAccessBlocked: true,
    message: 'Sua assinatura venceu em 10/01/2024. Seu acesso foi bloqueado. Entre em contato para regularizar sua situação.'
  };

  // Exemplo 3: Aluno sem inadimplência
  const overdueInfo3: OverdueInfo = {
    isOverdue: false,
    isAccessBlocked: false
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Exemplos do Componente OverdueAlertBar
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        A barra de inadimplência é posicionada fixamente no topo da tela (z-index: 10000) 
        e fica acima do header, que é reposicionado para ficar logo abaixo dela.
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Exemplo 1: Aluno com pagamento vencido há 5 dias (dentro do prazo de tolerância)
        </Typography>
        <OverdueAlertBar overdueInfo={overdueInfo1} />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Exemplo 2: Aluno com acesso bloqueado (prazo de tolerância expirado)
        </Typography>
        <OverdueAlertBar overdueInfo={overdueInfo2} />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Exemplo 3: Aluno sem inadimplência (não exibe barra)
        </Typography>
        <OverdueAlertBar overdueInfo={overdueInfo3} />
        <Typography variant="body2" color="text.secondary">
          Nenhuma barra é exibida quando isOverdue é false
        </Typography>
      </Paper>
    </Box>
  );
}
