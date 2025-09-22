'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Stack } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentNotifications } from '../../hooks/useStudentNotifications';
import { useCoachNotifications } from '../../hooks/useCoachNotifications';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import { useWebSocket } from '../../contexts/WebSocketContext';

/**
 * Componente de exemplo que demonstra o uso dos novos eventos WebSocket
 * Mostra notificações em tempo real baseadas no tipo de usuário
 */
export const WebSocketNotificationExample: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  
  // Hooks especializados por tipo de usuário
  const studentNotifications = useStudentNotifications();
  const coachNotifications = useCoachNotifications();
  const adminNotifications = useAdminNotifications();

  if (!user) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            Faça login para ver as notificações em tempo real
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const renderConnectionStatus = () => (
    <Box sx={{ mb: 2 }}>
      <Chip
        label={isConnected ? 'WebSocket Conectado' : 'WebSocket Desconectado'}
        color={isConnected ? 'success' : 'error'}
        variant="outlined"
        size="small"
      />
    </Box>
  );

  const renderStudentNotifications = () => {
    if (!studentNotifications.isStudent) return null;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎓 Notificações do Aluno
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Você receberá notificações quando seu treinador:
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">• ✅ Registrar resultado de prova</Typography>
            <Typography variant="body2">• 📊 Registrar resultado de teste</Typography>
            <Typography variant="body2">• 📄 Adicionar relatório de teste</Typography>
            <Typography variant="body2">• 🔄 Alterar status da sua conta</Typography>
            <Typography variant="body2">• ✏️ Atualizar seus dados</Typography>
          </Stack>
          
          {studentNotifications.lastCoachExamResult && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="success.dark">
                Último resultado de prova:
              </Typography>
              <Typography variant="body2">
                {studentNotifications.lastCoachExamResult.examName} - {studentNotifications.lastCoachExamResult.result}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCoachNotifications = () => {
    if (!coachNotifications.isCoach) return null;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🏃‍♂️ Notificações do Treinador
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Você receberá notificações quando seus alunos:
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">• 🏃‍♂️ Criarem prova externa</Typography>
            <Typography variant="body2">• ✅ Se inscreverem em prova</Typography>
            <Typography variant="body2">• 📄 Solicitarem relatório de teste</Typography>
            <Typography variant="body2">• 💰 Assinarem plano</Typography>
            <Typography variant="body2">• 🎯 Comprarem feature</Typography>
            <Typography variant="body2">• ❌ Cancelarem plano</Typography>
          </Stack>
          
          {coachNotifications.lastStudentSubscription && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="success.dark">
                Última assinatura:
              </Typography>
              <Typography variant="body2">
                {coachNotifications.lastStudentSubscription.studentName} assinou {coachNotifications.lastStudentSubscription.planName}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAdminNotifications = () => {
    if (!adminNotifications.isAdmin) return null;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            👑 Notificações do Administrador
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Você receberá notificações sobre:
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">• 👤 Novos usuários registrados</Typography>
            <Typography variant="body2">• 💰 Novas assinaturas</Typography>
            <Typography variant="body2">• 🏖️ Solicitações de licença</Typography>
            <Typography variant="body2">• 🔄 Mudanças de plano</Typography>
            <Typography variant="body2">• ❌ Solicitações de cancelamento</Typography>
            <Typography variant="body2">• 🔔 Eventos do webhook Asaas</Typography>
          </Stack>
          
          {adminNotifications.lastAdminUserRegistration && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="info.dark">
                Último usuário registrado:
              </Typography>
              <Typography variant="body2">
                {adminNotifications.lastAdminUserRegistration.userName} ({adminNotifications.lastAdminUserRegistration.userType})
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        🔔 Sistema de Notificações WebSocket
      </Typography>
      
      {renderConnectionStatus()}
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Tipo de usuário: <strong>{user.userType}</strong>
      </Typography>
      
      {renderStudentNotifications()}
      {renderCoachNotifications()}
      {renderAdminNotifications()}
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ℹ️ Como usar
          </Typography>
          <Typography variant="body2" paragraph>
            As notificações aparecerão automaticamente no canto superior direito da tela quando eventos relevantes acontecerem.
          </Typography>
          <Typography variant="body2" paragraph>
            Para integrar em seus componentes, use os hooks especializados:
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2" component="code">
              • useStudentNotifications() - Para alunos
            </Typography>
            <Typography variant="body2" component="code">
              • useCoachNotifications() - Para treinadores
            </Typography>
            <Typography variant="body2" component="code">
              • useAdminNotifications() - Para administradores
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WebSocketNotificationExample;
