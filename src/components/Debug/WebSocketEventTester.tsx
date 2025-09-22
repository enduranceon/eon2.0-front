'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import {
  BugReport as BugIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useStoredNotifications } from '../../contexts/StoredNotificationsContext';

/**
 * Componente para testar eventos WebSocket e verificar se estão sendo armazenados
 * Este componente simula eventos WebSocket reais para debug
 */
export const WebSocketEventTester: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const { notifications, unreadCount, stats, createWebSocketNotification } = useStoredNotifications();

  // Simular evento de resultado de teste (treinador → aluno)
  const simulateTestResultEvent = () => {
    
    // Simular evento que seria enviado pelo servidor
    const mockEvent = {
      userId: user?.id,
      studentName: user?.name || 'Alex Sander Correa Martins',
      studentEmail: user?.email || 'alexscm1@gmail.com',
      coachId: 'cmfmm4huh000cqvri57slis43',
      coachName: 'Bruno Jeremias',
      testId: 'cmfncw8270009ievx3i91ctxn', // ID do template do teste
      testName: 'Teste com campos dinamicos',
      testType: 'PERFORMANCE',
      result: {
        id: 'cmfu7cumr000pyc39dp7yk11s', // ID específico do resultado (primeiro da lista da API)
        testId: 'cmfncw8270009ievx3i91ctxn',
        userId: user?.id,
        timeSeconds: 584,
        notes: 'Excelente resultado! Melhora de 8% em relação ao teste anterior.',
        recordedAt: new Date().toISOString(),
        status: 'COMPLETED'
      },
      notes: 'Excelente resultado! Melhora de 8% em relação ao teste anterior.',
      timestamp: new Date().toISOString()
    };

    console.log('🧪 Simulando evento: coach:test-result:registered', mockEvent);

    // Criar notificação diretamente (simula o que o hook faria)
    createWebSocketNotification(
      'coach:test-result:registered',
      `${mockEvent.coachName} registrou resultado do teste`,
      `Teste "${mockEvent.testName}" - ${mockEvent.result}`,
      mockEvent
    );
  };

  // Simular evento de resultado de prova (treinador → aluno)
  const simulateExamResultEvent = () => {
    const mockEvent = {
      userId: user?.id,
      studentName: user?.name || 'Alex Sander Correa Martins',
      studentEmail: user?.email || 'alexscm1@gmail.com',
      examId: 'cmfmm4i4v00mjqvrim2qsa1to',
      examName: 'Ironman 70.3 Florianópolis',
      modalidade: 'Triathlon',
      examDate: '2025-09-25T00:00:00.000Z',
      result: null, // Não usado - dados estão nos campos específicos
      timeSeconds: 13530, // 3h45m30s
      generalRank: 145,
      categoryRank: 23,
      coachId: 'cmfmm4huh000cqvri57slis43',
      coachName: 'Bruno Jeremias',
      timestamp: new Date().toISOString()
    };

    console.log('🧪 Simulando evento: coach:exam-result:registered', mockEvent);

    createWebSocketNotification(
      'coach:exam-result:registered',
      `${mockEvent.coachName} registrou resultado da prova`,
      `Prova "${mockEvent.examName}" - Tempo: 3h45m30s, Geral: 145º, Categoria: 23º`,
      mockEvent
    );
  };

  // Simular evento de confirmação de presença (treinador → aluno)
  const simulateExamAttendanceEvent = () => {
    const mockEvent = {
      userId: user?.id,
      studentName: user?.name || 'Alex Sander Correa Martins',
      studentEmail: user?.email || 'alexscm1@gmail.com',
      examId: 'exam_456_maratona_sp',
      examName: 'Maratona de São Paulo 2024',
      modalidade: 'Corrida',
      examDate: '2024-05-15T08:00:00Z',
      examLocation: 'Ibirapuera, São Paulo - SP',
      registrationId: 'reg_123_exam_456',
      coachId: 'cmfmm4huh000cqvri57slis43',
      coachName: 'Bruno Jeremias',
      timestamp: new Date().toISOString()
    };

    console.log('🧪 Simulando evento: coach:exam-attendance:confirmed', mockEvent);

    createWebSocketNotification(
      'coach:exam-attendance:confirmed',
      `${mockEvent.coachName} confirmou sua presença na prova`,
      `Prova "${mockEvent.examName}" - ${new Date(mockEvent.examDate).toLocaleDateString('pt-BR')}`,
      mockEvent
    );
  };

  // Simular evento de prova externa (aluno → treinador)  
  const simulateExamEvent = () => {
    const mockEvent = {
      studentId: user?.id,
      studentName: user?.name || 'Maria Santos',
      coachId: 'coach123',
      examId: 'exam_456_maratona_sp', // ID específico da prova
      examName: 'Maratona de São Paulo 2024',
      examDate: '2024-05-15T08:00:00Z',
      location: 'São Paulo, SP',
      timestamp: new Date().toISOString()
    };

    console.log('🧪 Simulando evento: student:external-exam:created', mockEvent);
    
    // Criar notificação diretamente (simula o que o hook faria)
    createWebSocketNotification(
      'student:external-exam:created',
      `${mockEvent.studentName} criou prova externa`,
      `Prova "${mockEvent.examName}" - ${new Date(mockEvent.examDate).toLocaleDateString()} em ${mockEvent.location}`,
      mockEvent
    );
  };

  return (
    <Card sx={{ mb: 2, border: '2px dashed orange' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <BugIcon sx={{ mr: 1 }} />
          🧪 Debug - Testador de Eventos WebSocket
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Use este componente para testar se os eventos WebSocket estão sendo interceptados e armazenados corretamente.
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Status atual:</strong>
          <br />
          • Socket conectado: {socket ? '✅ Sim' : '❌ Não'}
          <br />
          • Usuário: {user?.name} ({user?.userType})
          <br />
          • Notificações armazenadas: {stats.total}
          <br />
          • Não lidas: {unreadCount}
        </Alert>

        <Stack spacing={2}>
          <Button
            variant="contained"
            onClick={simulateTestResultEvent}
            disabled={!socket}
          >
            Simular: Resultado de Teste (Com Destaque)
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={simulateExamResultEvent}
            disabled={!socket}
          >
            Simular: Resultado de Prova
          </Button>

          <Button
            variant="contained"
            color="info"
            onClick={simulateExamAttendanceEvent}
            disabled={!socket}
          >
            Simular: Confirmação de Presença
          </Button>
          
          <Button
            variant="outlined"
            onClick={simulateExamEvent}
            disabled={!socket}
          >
            Simular: Prova Externa (Com Destaque)
          </Button>
        </Stack>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            📋 Últimas 3 notificações:
          </Typography>
          {notifications.slice(0, 3).map((notification, index) => (
            <Typography key={index} variant="caption" display="block">
              • {notification.title} ({notification.isRead ? 'Lida' : 'Não lida'})
            </Typography>
          ))}
          {notifications.length === 0 && (
            <Typography variant="caption" color="text.disabled">
              Nenhuma notificação armazenada
            </Typography>
          )}
        </Box>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Como testar o sistema completo:</strong>
          <br />
          1. Clique em "Simular: Resultado de Teste (Com Destaque)"
          <br />
          2. Veja o badge no header aumentar
          <br />
          3. Clique no badge → Central de notificações abre
          <br />
          4. Clique na notificação → Redireciona para /dashboard/aluno/testes
          <br />
          5. Veja o teste destacado com borda laranja pulsante
          <br />
          6. Alerta explicativo aparece no topo da página
        </Alert>
      </CardContent>
    </Card>
  );
};

export default WebSocketEventTester;
