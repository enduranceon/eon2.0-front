'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  StoredNotification,
  NotificationFilter,
  NotificationStats,
  WEBSOCKET_EVENT_MAPPING
} from '../types/api';

interface StoredNotificationsContextType {
  notifications: StoredNotification[];
  unreadCount: number;
  stats: NotificationStats;
  isLoading: boolean;
  
  // Métodos para gerenciar notificações
  addNotification: (notification: Omit<StoredNotification, 'id' | 'createdAt' | 'userId' | 'userType'>) => void;
  markAsRead: (notificationId: string) => void;
  markAsUnread: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  // Métodos de filtro e busca
  getFilteredNotifications: (filter?: NotificationFilter) => StoredNotification[];
  getNotificationsByCategory: (category: StoredNotification['category']) => StoredNotification[];
  getUnreadNotifications: () => StoredNotification[];
  getRecentNotifications: (hours?: number) => StoredNotification[];
  
  // Utilitários
  createWebSocketNotification: (eventType: string, title: string, message: string, data?: any) => void;
}

const StoredNotificationsContext = createContext<StoredNotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  stats: {
    total: 0,
    unread: 0,
    byCategory: {
      exam: 0,
      test: 0,
      subscription: 0,
      payment: 0,
      system: 0,
      other: 0
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    },
    recentCount: 0
  },
  isLoading: false,
  addNotification: () => {},
  markAsRead: () => {},
  markAsUnread: () => {},
  markAllAsRead: () => {},
  deleteNotification: () => {},
  clearAllNotifications: () => {},
  getFilteredNotifications: () => [],
  getNotificationsByCategory: () => [],
  getUnreadNotifications: () => [],
  getRecentNotifications: () => [],
  createWebSocketNotification: () => {},
});

export const useStoredNotifications = () => useContext(StoredNotificationsContext);

interface StoredNotificationsProviderProps {
  children: React.ReactNode;
}

export const StoredNotificationsProvider: React.FC<StoredNotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const STORAGE_KEY = `notifications_${user?.id || 'anonymous'}`;
  const MAX_NOTIFICATIONS = 1000; // Limite máximo de notificações armazenadas

  // Carregar notificações do localStorage
  const loadNotifications = useCallback(() => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedNotifications: StoredNotification[] = JSON.parse(stored);
        // Ordenar por data de criação (mais recentes primeiro)
        const sortedNotifications = parsedNotifications.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(sortedNotifications);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações do localStorage:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, STORAGE_KEY]);

  // Salvar notificações no localStorage
  const saveNotifications = useCallback((notificationsToSave: StoredNotification[]) => {
    if (!user?.id) return;

    try {
      // Limitar o número de notificações armazenadas
      const limitedNotifications = notificationsToSave.slice(0, MAX_NOTIFICATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('Erro ao salvar notificações no localStorage:', error);
    }
  }, [user?.id, STORAGE_KEY, MAX_NOTIFICATIONS]);

  // Gerar ID único para notificação
  const generateNotificationId = useCallback(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Adicionar nova notificação
  const addNotification = useCallback((notificationData: Omit<StoredNotification, 'id' | 'createdAt' | 'userId' | 'userType'>) => {
    if (!user?.id || !user?.userType) return;

    const newNotification: StoredNotification = {
      ...notificationData,
      id: generateNotificationId(),
      userId: user.id,
      userType: user.userType,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      saveNotifications(updated);
      return updated;
    });
  }, [user?.id, user?.userType, generateNotificationId, saveNotifications]);

  // Criar notificação a partir de evento WebSocket
  const createWebSocketNotification = useCallback((eventType: string, title: string, message: string, data?: any) => {
    const eventMapping = WEBSOCKET_EVENT_MAPPING[eventType];
    
    if (!eventMapping) {
      console.warn(`Mapeamento não encontrado para evento: ${eventType}`);
      return;
    }

    // Construir URL com parâmetros específicos baseados no tipo de evento e dados
    let actionUrl = eventMapping.redirectUrl;
    
    if (actionUrl && data) {
      const params = new URLSearchParams();
      
      // Adicionar parâmetros específicos baseados no tipo de evento
      switch (eventType) {
        case 'coach:test-result:registered':
        case 'coach:test-report:added':
          // Para testes, usar o ID do resultado se disponível no objeto result
          const resultId = data.result?.id;
          if (resultId) {
            params.append('highlightTest', resultId);
            params.append('testName', data.testName);
          } else if (data.testId) {
            // Fallback: usar testId se result.id não estiver disponível
            params.append('highlightTestByTime', data.testId);
            params.append('testTimestamp', data.timestamp);
            params.append('testName', data.testName);
          }
          break;
          
        case 'coach:exam-result:registered':
          if (data.examId) params.append('highlightExam', data.examId);
          if (data.examName) params.append('examName', data.examName);
          break;
          
        case 'coach:exam-attendance:confirmed':
          if (data.examId) params.append('highlightExam', data.examId);
          if (data.examName) params.append('examName', data.examName);
          break;
          
        case 'student:external-exam:created':
        case 'student:exam:registered':
          if (data.examId) params.append('highlightExam', data.examId);
          if (data.examName) params.append('examName', data.examName);
          break;
          
        case 'student:test-report:requested':
          if (data.testId) params.append('highlightTest', data.testId);
          if (data.testName) params.append('testName', data.testName);
          break;
          
        case 'student:subscription:created':
        case 'student:plan:cancelled':
        case 'admin:subscription:created':
        case 'admin:plan:changed':
        case 'admin:cancellation:requested':
          if (data.planId) params.append('highlightPlan', data.planId);
          if (data.planName) params.append('planName', data.planName);
          break;
          
        case 'admin:user:registered':
          if (data.userId) params.append('highlightUser', data.userId);
          if (data.userName) params.append('userName', data.userName);
          break;
          
        case 'admin:asaas:webhook':
          if (data.paymentId) params.append('highlightPayment', data.paymentId);
          if (data.subscriptionId) params.append('highlightSubscription', data.subscriptionId);
          break;
      }
      
      // Adicionar timestamp para garantir destaque único
      params.append('notificationTime', new Date().getTime().toString());
      
      // Construir URL final com parâmetros
      if (params.toString()) {
        actionUrl = `${actionUrl}?${params.toString()}`;
      }
    }

    const notification: Omit<StoredNotification, 'id' | 'createdAt' | 'userId' | 'userType'> = {
      type: 'websocket',
      eventType,
      title,
      message,
      data,
      isRead: false,
      priority: eventMapping.priority,
      category: eventMapping.category,
      timestamp: new Date().toISOString(),
      icon: eventMapping.icon,
      color: eventMapping.color,
      actionUrl, // URL com parâmetros específicos
      actionLabel: 'Ver detalhes',
    };

    addNotification(notification);
  }, [addNotification]);

  // Marcar como lida
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true, readAt: new Date().toISOString() }
          : notification
      );
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Marcar como não lida
  const markAsUnread = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: false, readAt: undefined }
          : notification
      );
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString();
    setNotifications(prev => {
      const updated = prev.map(notification => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt || now
      }));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Deletar notificação
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notification => notification.id !== notificationId);
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  // Limpar todas as notificações
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    if (user?.id) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user?.id, STORAGE_KEY]);

  // Obter notificações filtradas
  const getFilteredNotifications = useCallback((filter?: NotificationFilter) => {
    if (!filter) return notifications;

    return notifications.filter(notification => {
      if (filter.isRead !== undefined && notification.isRead !== filter.isRead) return false;
      if (filter.category && notification.category !== filter.category) return false;
      if (filter.priority && notification.priority !== filter.priority) return false;
      if (filter.eventType && notification.eventType !== filter.eventType) return false;
      
      if (filter.dateFrom) {
        const notificationDate = new Date(notification.createdAt);
        const fromDate = new Date(filter.dateFrom);
        if (notificationDate < fromDate) return false;
      }
      
      if (filter.dateTo) {
        const notificationDate = new Date(notification.createdAt);
        const toDate = new Date(filter.dateTo);
        if (notificationDate > toDate) return false;
      }
      
      return true;
    });
  }, [notifications]);

  // Obter notificações por categoria
  const getNotificationsByCategory = useCallback((category: StoredNotification['category']) => {
    return notifications.filter(notification => notification.category === category);
  }, [notifications]);

  // Obter notificações não lidas
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.isRead);
  }, [notifications]);

  // Obter notificações recentes
  const getRecentNotifications = useCallback((hours: number = 24) => {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    return notifications.filter(notification => {
      const notificationDate = new Date(notification.createdAt);
      return notificationDate >= cutoffTime;
    });
  }, [notifications]);

  // Calcular estatísticas
  const stats: NotificationStats = React.useMemo(() => {
    const unreadNotifications = getUnreadNotifications();
    const recentNotifications = getRecentNotifications(24);
    
    const byCategory = notifications.reduce((acc, notification) => {
      acc[notification.category] = (acc[notification.category] || 0) + 1;
      return acc;
    }, {} as Record<StoredNotification['category'], number>);
    
    const byPriority = notifications.reduce((acc, notification) => {
      acc[notification.priority] = (acc[notification.priority] || 0) + 1;
      return acc;
    }, {} as Record<StoredNotification['priority'], number>);
    
    return {
      total: notifications.length,
      unread: unreadNotifications.length,
      byCategory: {
        exam: byCategory.exam || 0,
        test: byCategory.test || 0,
        subscription: byCategory.subscription || 0,
        payment: byCategory.payment || 0,
        system: byCategory.system || 0,
        other: byCategory.other || 0,
      },
      byPriority: {
        low: byPriority.low || 0,
        medium: byPriority.medium || 0,
        high: byPriority.high || 0,
        urgent: byPriority.urgent || 0,
      },
      recentCount: recentNotifications.length,
    };
  }, [notifications, getUnreadNotifications, getRecentNotifications]);

  const unreadCount = stats.unread;

  // Carregar notificações quando o usuário muda
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadNotifications();
    } else {
      setNotifications([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, loadNotifications]);

  // Limpar notificações antigas automaticamente (manter apenas as últimas 30 dias)
  useEffect(() => {
    if (notifications.length === 0) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentNotifications = notifications.filter(notification => {
      const notificationDate = new Date(notification.createdAt);
      return notificationDate >= thirtyDaysAgo;
    });

    if (recentNotifications.length !== notifications.length) {
      setNotifications(recentNotifications);
      saveNotifications(recentNotifications);
    }
  }, [notifications, saveNotifications]);

  const value: StoredNotificationsContextType = {
    notifications,
    unreadCount,
    stats,
    isLoading,
    addNotification,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getFilteredNotifications,
    getNotificationsByCategory,
    getUnreadNotifications,
    getRecentNotifications,
    createWebSocketNotification,
  };

  return (
    <StoredNotificationsContext.Provider value={value}>
      {children}
    </StoredNotificationsContext.Provider>
  );
};
