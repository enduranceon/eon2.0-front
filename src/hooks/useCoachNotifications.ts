import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotificationSettings } from '../contexts/NotificationSettingsContext';
import { useStoredNotifications } from '../contexts/StoredNotificationsContext';
import {
  StudentExternalExamCreatedEvent,
  StudentExamRegisteredEvent,
  StudentTestReportRequestedEvent,
  StudentSubscriptionCreatedEvent,
  StudentFeaturePurchasedEvent,
  StudentPlanCancelledEvent
} from '../types/api';

/**
 * Hook especializado para notificações de treinadores
 * Escuta eventos enviados pelos alunos para os treinadores
 */
export const useCoachNotifications = () => {
  const { user } = useAuth();
  const {
    isConnected,
    socket,
    lastStudentExternalExam,
    lastStudentExamRegistration,
    lastStudentTestReportRequest,
    lastStudentSubscription,
    lastStudentFeaturePurchase,
    lastStudentPlanCancellation
  } = useWebSocket();
  const { isNotificationEnabled, isSoundEnabled } = useNotificationSettings();
  const { createWebSocketNotification } = useStoredNotifications();

  // Handler para prova externa criada
  const handleExternalExamCreated = useCallback((data: StudentExternalExamCreatedEvent) => {
    if (user?.userType === 'COACH' && data.coachId === user?.id) {
      // Armazenar notificação
      createWebSocketNotification(
        'student:external-exam:created',
        `${data.studentName} criou prova externa`,
        `Prova "${data.examName}" - ${new Date(data.examDate).toLocaleDateString()} em ${data.location}`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('student:external-exam:created')) {
        toast.info(`🏃‍♂️ ${data.studentName} criou prova externa: ${data.examName}`, {
          duration: 5000,
          position: 'top-right',
          description: `Data: ${new Date(data.examDate).toLocaleDateString()} - ${data.location}`,
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.userType, user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para inscrição em prova
  const handleExamRegistered = useCallback((data: StudentExamRegisteredEvent) => {
    if (user?.userType === 'COACH' && data.coachId === user?.id) {
      // Armazenar notificação
      createWebSocketNotification(
        'student:exam:registered',
        `${data.studentName} se inscreveu na prova`,
        `Inscrição na prova "${data.examName}" - ${new Date(data.examDate).toLocaleDateString()} em ${data.location}`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('student:exam:registered')) {
        toast.success(`✅ ${data.studentName} se inscreveu na prova: ${data.examName}`, {
          duration: 5000,
          position: 'top-right',
          description: `Data: ${new Date(data.examDate).toLocaleDateString()} - ${data.location}`,
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.userType, user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para solicitação de relatório
  const handleTestReportRequested = useCallback((data: StudentTestReportRequestedEvent) => {
    if (user?.userType === 'COACH' && data.coachId === user?.id) {
      const paymentText = data.requiresPayment ? ' (pago)' : ' (gratuito)';
      
      // Armazenar notificação
      createWebSocketNotification(
        'student:test-report:requested',
        `${data.studentName} solicitou relatório de teste`,
        `Solicitação de relatório${paymentText} - ${data.reason || 'Solicitação de relatório de teste'}`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('student:test-report:requested')) {
        const emoji = data.requiresPayment ? '💰' : '📄';
        
        toast.info(`${emoji} ${data.studentName} solicitou relatório de teste${paymentText}`, {
          duration: 5000,
          position: 'top-right',
          description: data.reason || 'Solicitação de relatório de teste',
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.userType, user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para nova assinatura
  const handleSubscriptionCreated = useCallback((data: StudentSubscriptionCreatedEvent) => {
    if (user?.userType === 'COACH' && data.coachId === user?.id) {
      // Armazenar notificação
      createWebSocketNotification(
        'student:subscription:created',
        `${data.studentName} assinou plano`,
        `Assinatura do plano "${data.planName}" - R$ ${data.value} (${data.period})`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('student:subscription:created')) {
        toast.success(`💰 ${data.studentName} assinou "${data.planName}"`, {
          duration: 6000,
          position: 'top-right',
          description: `Valor: R$ ${data.value} - Período: ${data.period}`,
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.userType, user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para compra de feature
  const handleFeaturePurchased = useCallback((data: StudentFeaturePurchasedEvent) => {
    if (user?.userType === 'COACH' && data.coachId === user?.id) {
      // Armazenar notificação
      createWebSocketNotification(
        'student:feature:purchased',
        `${data.studentName} comprou feature`,
        `Feature "${data.featureName}" adquirida por R$ ${data.value}`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('student:feature:purchased')) {
        toast.success(`🎯 ${data.studentName} comprou feature: ${data.featureName}`, {
          duration: 5000,
          position: 'top-right',
          description: `Valor: R$ ${data.value}`,
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.userType, user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para cancelamento de plano
  const handlePlanCancelled = useCallback((data: StudentPlanCancelledEvent) => {
    if (user?.userType === 'COACH' && data.coachId === user?.id) {
      // Armazenar notificação
      createWebSocketNotification(
        'student:plan:cancelled',
        `${data.studentName} cancelou plano`,
        `Cancelamento do plano "${data.planName}" - ${data.cancellationReason || 'Cancelamento de plano'}`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('student:plan:cancelled')) {
        toast.warning(`❌ ${data.studentName} cancelou o plano "${data.planName}"`, {
          duration: 6000,
          position: 'top-right',
          description: data.cancellationReason || 'Cancelamento de plano',
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.userType, user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Registrar event listeners quando conectado
  useEffect(() => {
    if (!socket || !isConnected || user?.userType !== 'COACH') return;

    // Registrar todos os event listeners
    socket.on('student:external-exam:created', handleExternalExamCreated);
    socket.on('student:exam:registered', handleExamRegistered);
    socket.on('student:test-report:requested', handleTestReportRequested);
    socket.on('student:subscription:created', handleSubscriptionCreated);
    socket.on('student:feature:purchased', handleFeaturePurchased);
    socket.on('student:plan:cancelled', handlePlanCancelled);

    return () => {
      // Cleanup
      socket.off('student:external-exam:created', handleExternalExamCreated);
      socket.off('student:exam:registered', handleExamRegistered);
      socket.off('student:test-report:requested', handleTestReportRequested);
      socket.off('student:subscription:created', handleSubscriptionCreated);
      socket.off('student:feature:purchased', handleFeaturePurchased);
      socket.off('student:plan:cancelled', handlePlanCancelled);
    };
  }, [
    socket, 
    isConnected, 
    user?.userType,
    handleExternalExamCreated,
    handleExamRegistered,
    handleTestReportRequested,
    handleSubscriptionCreated,
    handleFeaturePurchased,
    handlePlanCancelled
  ]);

  return {
    // Estados de conectividade
    isConnected,
    isCoach: user?.userType === 'COACH',
    
    // Últimos eventos recebidos
    lastStudentExternalExam,
    lastStudentExamRegistration,
    lastStudentTestReportRequest,
    lastStudentSubscription,
    lastStudentFeaturePurchase,
    lastStudentPlanCancellation,

    // Métodos para ações manuais
    onExternalExamCreated: handleExternalExamCreated,
    onExamRegistered: handleExamRegistered,
    onTestReportRequested: handleTestReportRequested,
    onSubscriptionCreated: handleSubscriptionCreated,
    onFeaturePurchased: handleFeaturePurchased,
    onPlanCancelled: handlePlanCancelled,
  };
};
