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
  LeaveRequestEvent,
  // Novos eventos Aluno → Treinador
  StudentExternalExamCreatedEvent,
  StudentExamRegisteredEvent,
  StudentTestReportRequestedEvent,
  StudentSubscriptionCreatedEvent,
  StudentFeaturePurchasedEvent,
  StudentPlanCancelledEvent,
  // Novos eventos Treinador → Aluno
  CoachExamResultRegisteredEvent,
  CoachExamAttendanceConfirmedEvent,
  CoachTestResultRegisteredEvent,
  CoachTestReportAddedEvent,
  CoachStudentStatusChangedEvent,
  CoachStudentDataUpdatedEvent,
  // Novos eventos Sistema → Administrador
  AdminUserRegisteredEvent,
  AdminSubscriptionCreatedEvent,
  AdminLeaveRequestedEvent,
  AdminPlanChangedEvent,
  AdminCancellationRequestedEvent,
  AdminAsaasWebhookEvent
} from '../types/api';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: WebSocketConnectionStatus;
  // Eventos existentes
  lastPhotoUpdate: UserPhotoUpdateEvent | null;
  lastProfileUpdate: UserProfileUpdateEvent | null;
  lastStatusChange: UserStatusChangeEvent | null;
  lastExamResult: ExamResultRegisteredEvent | null;
  lastTestResult: TestResultRegisteredEvent | null;
  lastNewExam: NewExamCreatedEvent | null;
  lastPlanChange: PlanChangeEvent | null;
  lastStudentAccount: StudentAccountCreatedEvent | null;
  lastLeaveRequest: LeaveRequestEvent | null;
  // Novos eventos Aluno → Treinador
  lastStudentExternalExam: StudentExternalExamCreatedEvent | null;
  lastStudentExamRegistration: StudentExamRegisteredEvent | null;
  lastStudentTestReportRequest: StudentTestReportRequestedEvent | null;
  lastStudentSubscription: StudentSubscriptionCreatedEvent | null;
  lastStudentFeaturePurchase: StudentFeaturePurchasedEvent | null;
  lastStudentPlanCancellation: StudentPlanCancelledEvent | null;
  // Novos eventos Treinador → Aluno
  lastCoachExamResult: CoachExamResultRegisteredEvent | null;
  lastCoachExamAttendanceConfirmed: CoachExamAttendanceConfirmedEvent | null;
  lastCoachTestResult: CoachTestResultRegisteredEvent | null;
  lastCoachTestReport: CoachTestReportAddedEvent | null;
  lastCoachStudentStatusChange: CoachStudentStatusChangedEvent | null;
  lastCoachStudentDataUpdate: CoachStudentDataUpdatedEvent | null;
  // Novos eventos Sistema → Administrador
  lastAdminUserRegistration: AdminUserRegisteredEvent | null;
  lastAdminSubscription: AdminSubscriptionCreatedEvent | null;
  lastAdminLeaveRequest: AdminLeaveRequestedEvent | null;
  lastAdminPlanChange: AdminPlanChangedEvent | null;
  lastAdminCancellationRequest: AdminCancellationRequestedEvent | null;
  lastAdminAsaasWebhook: AdminAsaasWebhookEvent | null;
  // Métodos
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
  // Eventos existentes
  lastPhotoUpdate: null,
  lastProfileUpdate: null,
  lastStatusChange: null,
  lastExamResult: null,
  lastTestResult: null,
  lastNewExam: null,
  lastPlanChange: null,
  lastStudentAccount: null,
  lastLeaveRequest: null,
  // Novos eventos Aluno → Treinador
  lastStudentExternalExam: null,
  lastStudentExamRegistration: null,
  lastStudentTestReportRequest: null,
  lastStudentSubscription: null,
  lastStudentFeaturePurchase: null,
  lastStudentPlanCancellation: null,
  // Novos eventos Treinador → Aluno
  lastCoachExamResult: null,
  lastCoachExamAttendanceConfirmed: null,
  lastCoachTestResult: null,
  lastCoachTestReport: null,
  lastCoachStudentStatusChange: null,
  lastCoachStudentDataUpdate: null,
  // Novos eventos Sistema → Administrador
  lastAdminUserRegistration: null,
  lastAdminSubscription: null,
  lastAdminLeaveRequest: null,
  lastAdminPlanChange: null,
  lastAdminCancellationRequest: null,
  lastAdminAsaasWebhook: null,
  // Métodos
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
  
  // Estados existentes
  const [lastPhotoUpdate, setLastPhotoUpdate] = useState<UserPhotoUpdateEvent | null>(null);
  const [lastProfileUpdate, setLastProfileUpdate] = useState<UserProfileUpdateEvent | null>(null);
  const [lastStatusChange, setLastStatusChange] = useState<UserStatusChangeEvent | null>(null);
  const [lastExamResult, setLastExamResult] = useState<ExamResultRegisteredEvent | null>(null);
  const [lastTestResult, setLastTestResult] = useState<TestResultRegisteredEvent | null>(null);
  const [lastNewExam, setLastNewExam] = useState<NewExamCreatedEvent | null>(null);
  const [lastPlanChange, setLastPlanChange] = useState<PlanChangeEvent | null>(null);
  const [lastStudentAccount, setLastStudentAccount] = useState<StudentAccountCreatedEvent | null>(null);
  const [lastLeaveRequest, setLastLeaveRequest] = useState<LeaveRequestEvent | null>(null);
  
  // Novos estados Aluno → Treinador
  const [lastStudentExternalExam, setLastStudentExternalExam] = useState<StudentExternalExamCreatedEvent | null>(null);
  const [lastStudentExamRegistration, setLastStudentExamRegistration] = useState<StudentExamRegisteredEvent | null>(null);
  const [lastStudentTestReportRequest, setLastStudentTestReportRequest] = useState<StudentTestReportRequestedEvent | null>(null);
  const [lastStudentSubscription, setLastStudentSubscription] = useState<StudentSubscriptionCreatedEvent | null>(null);
  const [lastStudentFeaturePurchase, setLastStudentFeaturePurchase] = useState<StudentFeaturePurchasedEvent | null>(null);
  const [lastStudentPlanCancellation, setLastStudentPlanCancellation] = useState<StudentPlanCancelledEvent | null>(null);
  
  // Novos estados Treinador → Aluno
  const [lastCoachExamResult, setLastCoachExamResult] = useState<CoachExamResultRegisteredEvent | null>(null);
  const [lastCoachExamAttendanceConfirmed, setLastCoachExamAttendanceConfirmed] = useState<CoachExamAttendanceConfirmedEvent | null>(null);
  const [lastCoachTestResult, setLastCoachTestResult] = useState<CoachTestResultRegisteredEvent | null>(null);
  const [lastCoachTestReport, setLastCoachTestReport] = useState<CoachTestReportAddedEvent | null>(null);
  const [lastCoachStudentStatusChange, setLastCoachStudentStatusChange] = useState<CoachStudentStatusChangedEvent | null>(null);
  const [lastCoachStudentDataUpdate, setLastCoachStudentDataUpdate] = useState<CoachStudentDataUpdatedEvent | null>(null);
  
  // Novos estados Sistema → Administrador
  const [lastAdminUserRegistration, setLastAdminUserRegistration] = useState<AdminUserRegisteredEvent | null>(null);
  const [lastAdminSubscription, setLastAdminSubscription] = useState<AdminSubscriptionCreatedEvent | null>(null);
  const [lastAdminLeaveRequest, setLastAdminLeaveRequest] = useState<AdminLeaveRequestedEvent | null>(null);
  const [lastAdminPlanChange, setLastAdminPlanChange] = useState<AdminPlanChangedEvent | null>(null);
  const [lastAdminCancellationRequest, setLastAdminCancellationRequest] = useState<AdminCancellationRequestedEvent | null>(null);
  const [lastAdminAsaasWebhook, setLastAdminAsaasWebhook] = useState<AdminAsaasWebhookEvent | null>(null);
  
  const { user, token, isAuthenticated } = useAuth();

  // URL do servidor WebSocket - pode ser configurado via variável de ambiente
  const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

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

      // ===== NOVOS EVENTOS ALUNO → TREINADOR =====
      
      // 1. Prova Externa Criada pelo Aluno
      newSocket.on('student:external-exam:created', (data: StudentExternalExamCreatedEvent) => {
        setLastStudentExternalExam(data);
        // Toast e armazenamento gerenciados pelo useCoachNotifications
      });

      // 2. Aluno se Inscreveu em Prova
      newSocket.on('student:exam:registered', (data: StudentExamRegisteredEvent) => {
        setLastStudentExamRegistration(data);
        // Toast e armazenamento gerenciados pelo useCoachNotifications
      });

      // 3. Solicitação de Relatório de Teste
      newSocket.on('student:test-report:requested', (data: StudentTestReportRequestedEvent) => {
        setLastStudentTestReportRequest(data);
        // Toast e armazenamento gerenciados pelo useCoachNotifications
      });

      // 4. Assinatura de Plano (Checkout)
      newSocket.on('student:subscription:created', (data: StudentSubscriptionCreatedEvent) => {
        setLastStudentSubscription(data);
        // Toast e armazenamento gerenciados pelo useCoachNotifications
      });

      // 5. Compra de Feature de Plano
      newSocket.on('student:feature:purchased', (data: StudentFeaturePurchasedEvent) => {
        setLastStudentFeaturePurchase(data);
        // Toast e armazenamento gerenciados pelo useCoachNotifications
      });

      // 6. Cancelamento de Plano
      newSocket.on('student:plan:cancelled', (data: StudentPlanCancelledEvent) => {
        setLastStudentPlanCancellation(data);
        // Toast e armazenamento gerenciados pelo useCoachNotifications
      });

      // ===== NOVOS EVENTOS TREINADOR → ALUNO =====
      
      // 1. Resultado de Prova Registrado pelo Treinador
      newSocket.on('coach:exam-result:registered', (data: CoachExamResultRegisteredEvent) => {
        setLastCoachExamResult(data);
        // Toast e armazenamento gerenciados pelo useStudentNotifications
      });

      // 2. Presença em Prova Confirmada pelo Treinador
      newSocket.on('coach:exam-attendance:confirmed', (data: CoachExamAttendanceConfirmedEvent) => {
        setLastCoachExamAttendanceConfirmed(data);
        // Toast e armazenamento gerenciados pelo useStudentNotifications
      });

      // 3. Resultado de Teste Registrado pelo Treinador
      newSocket.on('coach:test-result:registered', (data: CoachTestResultRegisteredEvent) => {
        setLastCoachTestResult(data);
        // Toast e armazenamento gerenciados pelo useStudentNotifications
      });

      // 3. Relatório de Teste Adicionado pelo Treinador
      newSocket.on('coach:test-report:added', (data: CoachTestReportAddedEvent) => {
        setLastCoachTestReport(data);
        // Toast e armazenamento gerenciados pelo useStudentNotifications
      });

      // 4. Status do Aluno Alterado pelo Treinador
      newSocket.on('coach:student-status:changed', (data: CoachStudentStatusChangedEvent) => {
        setLastCoachStudentStatusChange(data);
        // Toast e armazenamento gerenciados pelo useStudentNotifications
      });

      // 5. Dados do Aluno Atualizados pelo Treinador
      newSocket.on('coach:student-data:updated', (data: CoachStudentDataUpdatedEvent) => {
        setLastCoachStudentDataUpdate(data);
        // Toast e armazenamento gerenciados pelo useStudentNotifications
      });

      // ===== NOVOS EVENTOS SISTEMA → ADMINISTRADOR =====
      
      // 1. Novo Usuário Registrado
      newSocket.on('admin:user:registered', (data: AdminUserRegisteredEvent) => {
        setLastAdminUserRegistration(data);
        // Toast e armazenamento gerenciados pelo useAdminNotifications
      });

      // 2. Usuário Assinou Plano
      newSocket.on('admin:subscription:created', (data: AdminSubscriptionCreatedEvent) => {
        setLastAdminSubscription(data);
        // Toast e armazenamento gerenciados pelo useAdminNotifications
      });

      // 3. Solicitação de Licença para Admin
      newSocket.on('admin:leave:requested', (data: AdminLeaveRequestedEvent) => {
        setLastAdminLeaveRequest(data);
        // Toast e armazenamento gerenciados pelo useAdminNotifications
      });

      // 4. Alteração de Plano para Admin
      newSocket.on('admin:plan:changed', (data: AdminPlanChangedEvent) => {
        setLastAdminPlanChange(data);
        // Toast e armazenamento gerenciados pelo useAdminNotifications
      });

      // 5. Solicitação de Cancelamento para Admin
      newSocket.on('admin:cancellation:requested', (data: AdminCancellationRequestedEvent) => {
        setLastAdminCancellationRequest(data);
        // Toast e armazenamento gerenciados pelo useAdminNotifications
      });

      // 6. Eventos do Webhook Asaas
      newSocket.on('admin:asaas:webhook', (data: AdminAsaasWebhookEvent) => {
        setLastAdminAsaasWebhook(data);
        
        if (user?.userType === 'ADMIN') {
          // Filtrar eventos importantes para mostrar notificação
          const importantEvents = [
            'PAYMENT_RECEIVED',
            'PAYMENT_OVERDUE', 
            'PAYMENT_REFUNDED',
            'SUBSCRIPTION_CREATED',
            'PAYMENT_CHARGEBACK_REQUESTED'
          ];

          if (importantEvents.includes(data.eventType)) {
            const userText = data.userName ? ` - ${data.userName}` : '';
            const emoji = data.eventType === 'PAYMENT_RECEIVED' ? '✅' : 
                         data.eventType === 'PAYMENT_OVERDUE' ? '⚠️' : 
                         data.eventType === 'PAYMENT_CHARGEBACK_REQUESTED' ? '🚨' : '🔔';
            
            toast.info(`${emoji} Asaas: ${data.description}${userText}`, {
              duration: 4000,
              position: 'top-right'
            });
          }
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
      // Estados existentes
      setLastPhotoUpdate(null);
      setLastProfileUpdate(null);
      setLastStatusChange(null);
      setLastExamResult(null);
      setLastTestResult(null);
      setLastNewExam(null);
      setLastPlanChange(null);
      setLastStudentAccount(null);
      setLastLeaveRequest(null);
      
      // Novos estados Aluno → Treinador
      setLastStudentExternalExam(null);
      setLastStudentExamRegistration(null);
      setLastStudentTestReportRequest(null);
      setLastStudentSubscription(null);
      setLastStudentFeaturePurchase(null);
      setLastStudentPlanCancellation(null);
      
      // Novos estados Treinador → Aluno
      setLastCoachExamResult(null);
      setLastCoachTestResult(null);
      setLastCoachTestReport(null);
      setLastCoachStudentStatusChange(null);
      setLastCoachStudentDataUpdate(null);
      
      // Novos estados Sistema → Administrador
      setLastAdminUserRegistration(null);
      setLastAdminSubscription(null);
      setLastAdminLeaveRequest(null);
      setLastAdminPlanChange(null);
      setLastAdminCancellationRequest(null);
      setLastAdminAsaasWebhook(null);
    }
  }, [isConnected]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    // Estados existentes
    lastPhotoUpdate,
    lastProfileUpdate,
    lastStatusChange,
    lastExamResult,
    lastTestResult,
    lastNewExam,
    lastPlanChange,
    lastStudentAccount,
    lastLeaveRequest,
    // Novos estados Aluno → Treinador
    lastStudentExternalExam,
    lastStudentExamRegistration,
    lastStudentTestReportRequest,
    lastStudentSubscription,
        lastStudentFeaturePurchase,
        lastStudentPlanCancellation,
        // Novos estados Treinador → Aluno
        lastCoachExamResult,
        lastCoachExamAttendanceConfirmed,
        lastCoachTestResult,
    lastCoachTestReport,
    lastCoachStudentStatusChange,
    lastCoachStudentDataUpdate,
    // Novos estados Sistema → Administrador
    lastAdminUserRegistration,
    lastAdminSubscription,
    lastAdminLeaveRequest,
    lastAdminPlanChange,
    lastAdminCancellationRequest,
    lastAdminAsaasWebhook,
    // Métodos
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