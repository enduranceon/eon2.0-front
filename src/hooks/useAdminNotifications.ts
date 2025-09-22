import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotificationSettings } from '../contexts/NotificationSettingsContext';
import { useStoredNotifications } from '../contexts/StoredNotificationsContext';
import {
  AdminUserRegisteredEvent,
  AdminSubscriptionCreatedEvent,
  AdminLeaveRequestedEvent,
  AdminPlanChangedEvent,
  AdminCancellationRequestedEvent,
  AdminAsaasWebhookEvent
} from '../types/api';

/**
 * Hook especializado para notificações de administradores
 * Escuta eventos do sistema para os administradores
 */
export const useAdminNotifications = () => {
  const { user } = useAuth();
  const {
    isConnected,
    socket,
    lastAdminUserRegistration,
    lastAdminSubscription,
    lastAdminLeaveRequest,
    lastAdminPlanChange,
    lastAdminCancellationRequest,
    lastAdminAsaasWebhook
  } = useWebSocket();
  const { isNotificationEnabled, isSoundEnabled } = useNotificationSettings();
  const { createWebSocketNotification } = useStoredNotifications();

  // Handler para novo usuário registrado
  const handleUserRegistered = useCallback((data: AdminUserRegisteredEvent) => {
    if (user?.userType === 'ADMIN') {
      // Armazenar notificação
      createWebSocketNotification(
        'admin:user:registered',
        `Novo ${data.userType.toLowerCase()} registrado`,
        `${data.userName} (${data.userEmail}) se registrou na plataforma`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('admin:user:registered')) {
        const emoji = data.userType === 'COACH' ? '🏃‍♂️' : '👤';
        toast.info(`${emoji} Novo ${data.userType.toLowerCase()}: ${data.userName}`, {
          duration: 4000,
          position: 'top-right',
          description: `Email: ${data.userEmail}`,
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.userType, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para nova assinatura
  const handleSubscriptionCreated = useCallback((data: AdminSubscriptionCreatedEvent) => {
    if (user?.userType === 'ADMIN') {
      const coachText = data.coachName ? ` com ${data.coachName}` : '';
      
      // Armazenar notificação
      createWebSocketNotification(
        'admin:subscription:created',
        `Nova assinatura criada`,
        `${data.userName} assinou "${data.planName}" (R$ ${data.value})${coachText} - Período: ${data.period}`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('admin:subscription:created')) {
        toast.success(`💰 ${data.userName} assinou "${data.planName}" (R$ ${data.value})${coachText}`, {
          duration: 6000,
          position: 'top-right',
          description: `Período: ${data.period}`,
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.userType, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para solicitação de licença
  const handleLeaveRequested = useCallback((data: AdminLeaveRequestedEvent) => {
    if (user?.userType === 'ADMIN' && isNotificationEnabled('admin:leave:requested')) {
      const startDate = new Date(data.startDate).toLocaleDateString();
      const endDate = new Date(data.endDate).toLocaleDateString();
      
      toast.warning(`🏖️ ${data.userName} solicitou licença`, {
        duration: 6000,
        position: 'top-right',
        description: `${data.reason} (${startDate} - ${endDate})`,
        ...(isSoundEnabled() && { important: true })
      });
    }
  }, [user?.userType, isNotificationEnabled, isSoundEnabled]);

  // Handler para mudança de plano
  const handlePlanChanged = useCallback((data: AdminPlanChangedEvent) => {
    if (user?.userType === 'ADMIN' && isNotificationEnabled('admin:plan:changed')) {
      toast.info(`🔄 ${data.userName} mudou de plano`, {
        duration: 5000,
        position: 'top-right',
        description: `De "${data.oldPlanName}" para "${data.newPlanName}"`,
        ...(isSoundEnabled() && { important: true })
      });
    }
  }, [user?.userType]);

  // Handler para solicitação de cancelamento
  const handleCancellationRequested = useCallback((data: AdminCancellationRequestedEvent) => {
    if (user?.userType === 'ADMIN' && isNotificationEnabled('admin:cancellation:requested')) {
      toast.error(`❌ ${data.userName} solicitou cancelamento do "${data.planName}"`, {
        duration: 6000,
        position: 'top-right',
        description: data.cancellationReason || 'Solicitação de cancelamento',
        ...(isSoundEnabled() && { important: true })
      });
    }
  }, [user?.userType, isNotificationEnabled, isSoundEnabled]);

  // Handler para webhook do Asaas
  const handleAsaasWebhook = useCallback((data: AdminAsaasWebhookEvent) => {
    if (user?.userType === 'ADMIN') {
      const userText = data.userName ? ` - ${data.userName}` : '';
      
      // Armazenar notificação
      createWebSocketNotification(
        'admin:asaas:webhook',
        `Asaas: ${data.description}`,
        `Evento ${data.eventType}${userText}`,
        data
      );
      
      // Mostrar toast se habilitado e for evento importante
      if (isNotificationEnabled('admin:asaas:webhook')) {
        const importantEvents = [
          'PAYMENT_RECEIVED',
          'PAYMENT_OVERDUE', 
          'PAYMENT_REFUNDED',
          'SUBSCRIPTION_CREATED',
          'PAYMENT_CHARGEBACK_REQUESTED'
        ];

        if (importantEvents.includes(data.eventType)) {
          const emoji = getAsaasEventEmoji(data.eventType);
          const toastType = getAsaasEventToastType(data.eventType);
          
          toast[toastType](`${emoji} Asaas: ${data.description}${userText}`, {
            duration: 5000,
            position: 'top-right',
            description: `Evento: ${data.eventType}`,
            ...(isSoundEnabled() && { important: true })
          });
        }
      }
    }
  }, [user?.userType, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Função auxiliar para emoji do evento Asaas
  const getAsaasEventEmoji = (eventType: string): string => {
    switch (eventType) {
      case 'PAYMENT_RECEIVED': return '✅';
      case 'PAYMENT_OVERDUE': return '⚠️';
      case 'PAYMENT_REFUNDED': return '💸';
      case 'SUBSCRIPTION_CREATED': return '🆕';
      case 'PAYMENT_CHARGEBACK_REQUESTED': return '🚨';
      default: return '🔔';
    }
  };

  // Função auxiliar para tipo de toast do evento Asaas
  const getAsaasEventToastType = (eventType: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (eventType) {
      case 'PAYMENT_RECEIVED':
      case 'SUBSCRIPTION_CREATED':
        return 'success';
      case 'PAYMENT_OVERDUE':
        return 'warning';
      case 'PAYMENT_CHARGEBACK_REQUESTED':
      case 'PAYMENT_REFUNDED':
        return 'error';
      default:
        return 'info';
    }
  };

  // Registrar event listeners quando conectado
  useEffect(() => {
    if (!socket || !isConnected || user?.userType !== 'ADMIN') return;

    // Registrar todos os event listeners
    socket.on('admin:user:registered', handleUserRegistered);
    socket.on('admin:subscription:created', handleSubscriptionCreated);
    socket.on('admin:leave:requested', handleLeaveRequested);
    socket.on('admin:plan:changed', handlePlanChanged);
    socket.on('admin:cancellation:requested', handleCancellationRequested);
    socket.on('admin:asaas:webhook', handleAsaasWebhook);

    return () => {
      // Cleanup
      socket.off('admin:user:registered', handleUserRegistered);
      socket.off('admin:subscription:created', handleSubscriptionCreated);
      socket.off('admin:leave:requested', handleLeaveRequested);
      socket.off('admin:plan:changed', handlePlanChanged);
      socket.off('admin:cancellation:requested', handleCancellationRequested);
      socket.off('admin:asaas:webhook', handleAsaasWebhook);
    };
  }, [
    socket, 
    isConnected, 
    user?.userType,
    handleUserRegistered,
    handleSubscriptionCreated,
    handleLeaveRequested,
    handlePlanChanged,
    handleCancellationRequested,
    handleAsaasWebhook
  ]);

  return {
    // Estados de conectividade
    isConnected,
    isAdmin: user?.userType === 'ADMIN',
    
    // Últimos eventos recebidos
    lastAdminUserRegistration,
    lastAdminSubscription,
    lastAdminLeaveRequest,
    lastAdminPlanChange,
    lastAdminCancellationRequest,
    lastAdminAsaasWebhook,

    // Métodos para ações manuais
    onUserRegistered: handleUserRegistered,
    onSubscriptionCreated: handleSubscriptionCreated,
    onLeaveRequested: handleLeaveRequested,
    onPlanChanged: handlePlanChanged,
    onCancellationRequested: handleCancellationRequested,
    onAsaasWebhook: handleAsaasWebhook,
  };
};
