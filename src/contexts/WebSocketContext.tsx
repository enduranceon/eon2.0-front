'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { 
  WebSocketEvent, 
  UserPhotoUpdateEvent, 
  UserProfileUpdateEvent, 
  UserStatusChangeEvent,
  WebSocketConnectionStatus,
  ExamResultRegisteredEvent,
  TestResultRegisteredEvent,
  NewExamCreatedEvent,
  PlanChangeEvent,
  StudentAccountCreatedEvent,
  LeaveRequestEvent
} from '../types/api';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: WebSocketConnectionStatus;
  lastPhotoUpdate: UserPhotoUpdateEvent | null;
  lastProfileUpdate: UserProfileUpdateEvent | null;
  lastStatusChange: UserStatusChangeEvent | null;
  lastExamResult: ExamResultRegisteredEvent | null;
  lastTestResult: TestResultRegisteredEvent | null;
  lastNewExam: NewExamCreatedEvent | null;
  lastPlanChange: PlanChangeEvent | null;
  lastStudentAccount: StudentAccountCreatedEvent | null;
  lastLeaveRequest: LeaveRequestEvent | null;
  connect: () => void;
  disconnect: () => void;
  ping: () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  connectionStatus: {
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
  },
  lastPhotoUpdate: null,
  lastProfileUpdate: null,
  lastStatusChange: null,
  lastExamResult: null,
  lastTestResult: null,
  lastNewExam: null,
  lastPlanChange: null,
  lastStudentAccount: null,
  lastLeaveRequest: null,
  connect: () => {},
  disconnect: () => {},
  ping: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketConnectionStatus>({
    isConnected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
  });
  const [lastPhotoUpdate, setLastPhotoUpdate] = useState<UserPhotoUpdateEvent | null>(null);
  const [lastProfileUpdate, setLastProfileUpdate] = useState<UserProfileUpdateEvent | null>(null);
  const [lastStatusChange, setLastStatusChange] = useState<UserStatusChangeEvent | null>(null);
  const [lastExamResult, setLastExamResult] = useState<ExamResultRegisteredEvent | null>(null);
  const [lastTestResult, setLastTestResult] = useState<TestResultRegisteredEvent | null>(null);
  const [lastNewExam, setLastNewExam] = useState<NewExamCreatedEvent | null>(null);
  const [lastPlanChange, setLastPlanChange] = useState<PlanChangeEvent | null>(null);
  const [lastStudentAccount, setLastStudentAccount] = useState<StudentAccountCreatedEvent | null>(null);
  const [lastLeaveRequest, setLastLeaveRequest] = useState<LeaveRequestEvent | null>(null);
  
  const { user, token, isAuthenticated } = useAuth();

  // URL do servidor WebSocket - pode ser configurado via variável de ambiente
  const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';

  const connect = useCallback(() => {
    if (!token || !isAuthenticated || socket?.connected) {
      return;
    }

    try {
      const newSocket = io(WEBSOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: connectionStatus.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // Event listeners
      newSocket.on('connect', () => {
        setIsConnected(true);
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: true,
          lastConnected: new Date().toISOString(),
          reconnectAttempts: 0,
        }));
        
        // Entrar na sala do usuário
        if (user?.id) {
          newSocket.emit('join:user:room', { userId: user.id });
        }
      });

      newSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: false,
          lastDisconnected: new Date().toISOString(),
        }));
      });

      newSocket.on('connect_error', (error) => {
        setConnectionStatus(prev => ({
          ...prev,
          reconnectAttempts: prev.reconnectAttempts + 1,
        }));
      });

      newSocket.on('reconnect', (attemptNumber) => {
        setConnectionStatus(prev => ({
          ...prev,
          reconnectAttempts: 0,
        }));
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('❌ Erro de reconexão WebSocket:', error);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('❌ Falha na reconexão WebSocket após todas as tentativas');
        toast.error('Conexão com o servidor perdida. Recarregue a página.');
      });

      // Eventos de foto
      newSocket.on('user:photo:updated', (data: UserPhotoUpdateEvent) => {
        // Atualizar imediatamente com timestamp para cache busting
        // Processar URL da imagem para garantir que use a porta correta
        const getAbsoluteImageUrl = (url: string): string => {
          if (/^(https?|blob):/.test(url)) {
            return url;
          }

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const origin = new URL(apiUrl).origin;

          let imagePath = url;
          
          if (imagePath.startsWith('/api/')) {
            imagePath = imagePath.substring(5);
          }
          if (imagePath.startsWith('/')) {
            imagePath = imagePath.substring(1);
          }
          
          const finalPath = `/api/${imagePath.startsWith('uploads') ? '' : 'uploads/'}${imagePath}`;
          
          return `${origin}${finalPath.replace('/api//', '/api/')}`;
        };

        const photoDataWithTimestamp = {
          ...data,
          imageUrl: `${getAbsoluteImageUrl(data.imageUrl)}?t=${Date.now()}`,
          receivedAt: new Date().toISOString()
        };
        
        setLastPhotoUpdate(photoDataWithTimestamp);
        
        // Mostrar notificação se for do usuário atual
        if (data.userId === user?.id) {
          toast.success('Sua foto foi atualizada!', {
            duration: 2000,
            position: 'top-right'
          });
        }
      });

      newSocket.on('user:photo:updated:notification', (data: UserPhotoUpdateEvent) => {
        // Só processar se tiver imageUrl válida
        if (data.imageUrl && data.imageUrl !== 'undefined') {
          // Atualizar imediatamente com timestamp para cache busting
          const photoDataWithTimestamp = {
            ...data,
            imageUrl: `${data.imageUrl}?t=${Date.now()}`,
            receivedAt: new Date().toISOString()
          };
          
          setLastPhotoUpdate(photoDataWithTimestamp);
        }
      });

      // Eventos de perfil
      newSocket.on('user:profile:updated', (data: UserProfileUpdateEvent) => {
        setLastProfileUpdate(data);
        
        // Mostrar notificação se for do usuário atual
        if (data.userId === user?.id) {
          toast.success('Seu perfil foi atualizado!');
        }
      });

      // Eventos de status
      newSocket.on('user:status:changed', (data: UserStatusChangeEvent) => {
        setLastStatusChange(data);
      });

      // Eventos de sistema
      newSocket.on('user:connected', (data) => {
        // Usuário conectado
      });

      newSocket.on('user:disconnected', (data) => {
        // Usuário desconectado
      });

      newSocket.on('pong', (data) => {
        // Pong recebido
      });

      // Eventos de resultado de prova
      newSocket.on('exam:result:registered', (data: ExamResultRegisteredEvent) => {
        setLastExamResult(data);
        
        if (data.userId === user?.id) {
          toast.success(`Resultado da prova "${data.examName}" foi registrado!`, {
            duration: 3000,
            position: 'top-right'
          });
        }
      });

      newSocket.on('exam:result:registered:coach', (data: ExamResultRegisteredEvent) => {
        setLastExamResult(data);
        
        if (user?.userType === 'COACH') {
          toast.success(`Resultado da prova "${data.examName}" registrado para ${data.userId}`, {
            duration: 3000,
            position: 'top-right'
          });
        }
      });

      // Eventos de resultado de teste
      newSocket.on('test:result:registered', (data: TestResultRegisteredEvent) => {
        setLastTestResult(data);
        
        if (data.userId === user?.id) {
          toast.success(`Resultado do teste "${data.testName}" foi registrado!`, {
            duration: 3000,
            position: 'top-right'
          });
        }
      });

      newSocket.on('test:result:registered:coach', (data: TestResultRegisteredEvent) => {
        setLastTestResult(data);
        
        if (user?.userType === 'COACH') {
          toast.success(`Resultado do teste "${data.testName}" registrado para ${data.userId}`, {
            duration: 3000,
            position: 'top-right'
          });
        }
      });

      // Eventos de nova prova criada
      newSocket.on('exam:created', (data: NewExamCreatedEvent) => {
        setLastNewExam(data);
        
        if (data.students.includes(user?.id || '')) {
          toast.success(`Nova prova "${data.examName}" disponível!`, {
            duration: 4000,
            position: 'top-right'
          });
        }
      });

      newSocket.on('exam:created:coach', (data: NewExamCreatedEvent) => {
        setLastNewExam(data);
        
        if (user?.userType === 'COACH') {
          toast.success(`Prova "${data.examName}" criada com sucesso!`, {
            duration: 3000,
            position: 'top-right'
          });
        }
      });

      // Eventos de mudança de plano
      newSocket.on('plan:changed', (data: PlanChangeEvent) => {
        setLastPlanChange(data);
        
        if (data.userId === user?.id) {
          toast.success(`Seu plano foi alterado para ${data.newPlanName}`, {
            duration: 4000,
            position: 'top-right'
          });
        }
      });

      newSocket.on('plan:changed:coach', (data: PlanChangeEvent) => {
        setLastPlanChange(data);
        
        if (user?.userType === 'COACH') {
          toast.success(`${data.studentName} alterou o plano para ${data.newPlanName}`, {
            duration: 4000,
            position: 'top-right'
          });
        }
      });

      // Eventos de conta de aluno criada
      newSocket.on('account:created', (data: StudentAccountCreatedEvent) => {
        setLastStudentAccount(data);
        
        if (data.userId === user?.id) {
          toast.success('Sua conta foi criada com sucesso!', {
            duration: 3000,
            position: 'top-right'
          });
        }
      });

      newSocket.on('student:account:created', (data: StudentAccountCreatedEvent) => {
        setLastStudentAccount(data);
        
        if (user?.userType === 'COACH') {
          toast.success(`Novo aluno: ${data.studentName}`, {
            duration: 4000,
            position: 'top-right'
          });
        }
      });

      // Eventos de solicitação de licença
      newSocket.on('leave:requested', (data: LeaveRequestEvent) => {
        setLastLeaveRequest(data);
        
        if (data.userId === user?.id) {
          toast.success('Sua solicitação de licença foi enviada!', {
            duration: 3000,
            position: 'top-right'
          });
        }
      });

      newSocket.on('leave:requested:coach', (data: LeaveRequestEvent) => {
        setLastLeaveRequest(data);
        
        if (user?.userType === 'COACH') {
          toast.success(`${data.studentName} solicitou licença`, {
            duration: 4000,
            position: 'top-right'
          });
        }
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('❌ Erro ao conectar WebSocket:', error);
      toast.error('Erro ao conectar com o servidor em tempo real');
    }
  }, [token, isAuthenticated, user?.id, WEBSOCKET_URL, connectionStatus.maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: false,
        lastDisconnected: new Date().toISOString(),
      }));
    }
  }, [socket]);

  const ping = useCallback(() => {
    if (socket && socket.connected) {
      socket.emit('ping', { timestamp: new Date().toISOString() });
    }
  }, [socket]);

  // Conectar quando o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated && token && user?.id) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, token, user?.id]);

  // Limpar estado quando desconectar
  useEffect(() => {
    if (!isConnected) {
      setLastPhotoUpdate(null);
      setLastProfileUpdate(null);
      setLastStatusChange(null);
      setLastExamResult(null);
      setLastTestResult(null);
      setLastNewExam(null);
      setLastPlanChange(null);
      setLastStudentAccount(null);
      setLastLeaveRequest(null);
    }
  }, [isConnected]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    lastPhotoUpdate,
    lastProfileUpdate,
    lastStatusChange,
    lastExamResult,
    lastTestResult,
    lastNewExam,
    lastPlanChange,
    lastStudentAccount,
    lastLeaveRequest,
    connect,
    disconnect,
    ping,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};