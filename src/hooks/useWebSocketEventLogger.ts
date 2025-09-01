import { useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para logar todos os eventos WebSocket recebidos
 * Útil para debug e monitoramento
 */
export const useWebSocketEventLogger = () => {
  const { user } = useAuth();
  const { 
    lastPhotoUpdate, 
    lastProfileUpdate, 
    lastStatusChange,
    lastExamResult,
    lastTestResult,
    lastNewExam,
    lastPlanChange,
    lastStudentAccount,
    lastLeaveRequest,
    socket,
    isConnected 
  } = useWebSocket();

  useEffect(() => {
    console.log('🔌 WebSocket Logger: Hook inicializado', {
      userId: user?.id,
      isConnected,
      socketConnected: socket?.connected
    });
  }, [user?.id, isConnected, socket?.connected]);

  // Log de eventos de foto
  useEffect(() => {
    if (lastPhotoUpdate) {
      console.log('📸 WebSocket Logger: Evento de foto recebido', {
        event: lastPhotoUpdate,
        currentUserId: user?.id,
        isForCurrentUser: lastPhotoUpdate.userId === user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [lastPhotoUpdate, user?.id]);

  // Log de eventos de perfil
  useEffect(() => {
    if (lastProfileUpdate) {
      console.log('👤 WebSocket Logger: Evento de perfil recebido', {
        event: lastProfileUpdate,
        currentUserId: user?.id,
        isForCurrentUser: lastProfileUpdate.userId === user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [lastProfileUpdate, user?.id]);

  // Log de eventos de status
  useEffect(() => {
    if (lastStatusChange) {
      console.log('📊 WebSocket Logger: Evento de status recebido', {
        event: lastStatusChange,
        currentUserId: user?.id,
        isForCurrentUser: lastStatusChange.userId === user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [lastStatusChange, user?.id]);

  // Log de eventos de resultado de prova
  useEffect(() => {
    if (lastExamResult) {
      console.log('📊 WebSocket Logger: Evento de resultado de prova recebido', {
        event: lastExamResult,
        currentUserId: user?.id,
        isForCurrentUser: lastExamResult.userId === user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [lastExamResult, user?.id]);

  // Log de eventos de resultado de teste
  useEffect(() => {
    if (lastTestResult) {
      console.log('🧪 WebSocket Logger: Evento de resultado de teste recebido', {
        event: lastTestResult,
        currentUserId: user?.id,
        isForCurrentUser: lastTestResult.userId === user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [lastTestResult, user?.id]);

  // Log de eventos de nova prova
  useEffect(() => {
    if (lastNewExam) {
      console.log('📝 WebSocket Logger: Evento de nova prova recebido', {
        event: lastNewExam,
        currentUserId: user?.id,
        isForCurrentUser: lastNewExam.students.includes(user?.id || ''),
        timestamp: new Date().toISOString()
      });
    }
  }, [lastNewExam, user?.id]);

  // Log de eventos de mudança de plano
  useEffect(() => {
    if (lastPlanChange) {
      console.log('🔄 WebSocket Logger: Evento de mudança de plano recebido', {
        event: lastPlanChange,
        currentUserId: user?.id,
        isForCurrentUser: lastPlanChange.userId === user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [lastPlanChange, user?.id]);

  // Log de eventos de conta criada
  useEffect(() => {
    if (lastStudentAccount) {
      console.log('👤 WebSocket Logger: Evento de conta criada recebido', {
        event: lastStudentAccount,
        currentUserId: user?.id,
        isForCurrentUser: lastStudentAccount.userId === user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [lastStudentAccount, user?.id]);

  // Log de eventos de solicitação de licença
  useEffect(() => {
    if (lastLeaveRequest) {
      console.log('🏖️ WebSocket Logger: Evento de solicitação de licença recebido', {
        event: lastLeaveRequest,
        currentUserId: user?.id,
        isForCurrentUser: lastLeaveRequest.userId === user?.id,
        timestamp: new Date().toISOString()
      });
    }
  }, [lastLeaveRequest, user?.id]);

  // Log de mudanças de conexão
  useEffect(() => {
    console.log('🔗 WebSocket Logger: Status de conexão alterado', {
      isConnected,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
  }, [isConnected, user?.id]);

  return {
    lastPhotoUpdate,
    lastProfileUpdate,
    lastStatusChange,
    lastExamResult,
    lastTestResult,
    lastNewExam,
    lastPlanChange,
    lastStudentAccount,
    lastLeaveRequest,
    isConnected,
    userId: user?.id
  };
};
