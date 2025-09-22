'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Divider,
  Chip,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useStoredNotifications } from '../../contexts/StoredNotificationsContext';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Componente para testar o sistema de notificações armazenadas
 * Remove este componente quando a API estiver pronta
 */
export const NotificationTester: React.FC = () => {
  const { user } = useAuth();
  const { 
    createWebSocketNotification, 
    notifications, 
    unreadCount, 
    stats,
    markAllAsRead,
    clearAllNotifications 
  } = useStoredNotifications();

  // Simular diferentes tipos de notificações
  const testNotifications = [
    {
      eventType: 'coach:exam-result:registered',
      title: 'João Silva registrou resultado da prova',
      message: 'Resultado da prova "Maratona de São Paulo": 1º lugar - 2h45min',
      data: { coachName: 'João Silva', examName: 'Maratona de São Paulo', result: '1º lugar' }
    },
    {
      eventType: 'student:external-exam:created',
      title: 'Maria Santos criou prova externa',
      message: 'Prova "Corrida da Primavera" criada para 15/04/2024 em São Paulo',
      data: { studentName: 'Maria Santos', examName: 'Corrida da Primavera' }
    },
    {
      eventType: 'coach:test-report:added',
      title: 'Dr. Carlos adicionou relatório',
      message: 'Relatório do teste de VO2 máximo está disponível para download',
      data: { coachName: 'Dr. Carlos', testName: 'VO2 Máximo', reportUrl: '#' }
    },
    {
      eventType: 'admin:user:registered',
      title: 'Novo treinador registrado',
      message: 'Pedro Oliveira (pedro@email.com) se registrou como treinador',
      data: { userName: 'Pedro Oliveira', userEmail: 'pedro@email.com', userType: 'COACH' }
    },
    {
      eventType: 'student:subscription:created',
      title: 'Ana Costa assinou plano',
      message: 'Assinatura do plano "Premium" - R$ 199,90 (mensal)',
      data: { studentName: 'Ana Costa', planName: 'Premium', value: '199.90', period: 'mensal' }
    },
    {
      eventType: 'admin:asaas:webhook',
      title: 'Pagamento recebido',
      message: 'Pagamento de R$ 199,90 confirmado - Cliente: Ana Costa',
      data: { eventType: 'PAYMENT_RECEIVED', amount: 199.90, userName: 'Ana Costa' }
    }
  ];

  const createTestNotification = (index: number) => {
    const notification = testNotifications[index];
    createWebSocketNotification(
      notification.eventType,
      notification.title,
      notification.message,
      notification.data
    );
  };

  const createRandomNotification = () => {
    const randomIndex = Math.floor(Math.random() * testNotifications.length);
    createTestNotification(randomIndex);
  };

  const createBulkNotifications = () => {
    testNotifications.forEach((_, index) => {
      setTimeout(() => {
        createTestNotification(index);
      }, index * 500); // Delay de 500ms entre cada notificação
    });
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🧪 Testador de Notificações (Desenvolvimento)
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Use este painel para testar o sistema de notificações armazenadas enquanto a API está em desenvolvimento.
        </Typography>

        {/* Estatísticas */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            📊 Estatísticas Atuais
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip label={`Total: ${stats.total}`} size="small" />
            <Chip label={`Não lidas: ${unreadCount}`} color="primary" size="small" />
            <Chip label={`Recentes: ${stats.recentCount}`} size="small" />
            <Chip label={`Provas: ${stats.byCategory.exam}`} size="small" />
            <Chip label={`Testes: ${stats.byCategory.test}`} size="small" />
            <Chip label={`Assinaturas: ${stats.byCategory.subscription}`} size="small" />
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Botões de Teste */}
        <Typography variant="subtitle2" gutterBottom>
          🎯 Testes Rápidos
        </Typography>
        
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={createRandomNotification}
            size="small"
          >
            Notificação Aleatória
          </Button>
          
          <Button
            variant="outlined"
            onClick={createBulkNotifications}
            size="small"
          >
            Criar Várias (6)
          </Button>
          
          <Button
            variant="outlined"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            size="small"
          >
            Marcar Todas Lidas
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<StopIcon />}
            onClick={clearAllNotifications}
            disabled={stats.total === 0}
            size="small"
          >
            Limpar Todas
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Testes Específicos */}
        <Typography variant="subtitle2" gutterBottom>
          🎪 Testes Específicos por Tipo
        </Typography>
        
        <Stack spacing={1}>
          {testNotifications.map((notification, index) => (
            <Box key={index} display="flex" alignItems="center" justifyContent="space-between">
              <Box flex={1}>
                <Typography variant="body2" fontWeight="bold">
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notification.eventType}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => createTestNotification(index)}
              >
                Testar
              </Button>
            </Box>
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Informações do Sistema */}
        <Typography variant="subtitle2" gutterBottom>
          ℹ️ Informações do Sistema
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          <strong>Usuário:</strong> {user?.name || 'Não autenticado'} ({user?.userType || 'N/A'})
          <br />
          <strong>ID:</strong> {user?.id || 'N/A'}
          <br />
          <strong>Status:</strong> Sistema funcionando em modo offline (LocalStorage)
          <br />
          <strong>Armazenamento:</strong> {notifications.length > 0 ? 'Ativo' : 'Vazio'}
        </Typography>

        <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography variant="caption" color="warning.dark">
            ⚠️ Este componente é apenas para desenvolvimento. Remova quando a API estiver pronta.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationTester;
