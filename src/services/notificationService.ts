// Sistema de Notificações - Endurance On
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId: string;
  actionUrl?: string;
  metadata?: any;
}

export interface NotificationConfig {
  enablePush: boolean;
  enableEmail: boolean;
  enableInApp: boolean;
  categories: {
    payments: boolean;
    sessions: boolean;
    messages: boolean;
    system: boolean;
  };
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];
  private config: NotificationConfig = {
    enablePush: true,
    enableEmail: true,
    enableInApp: true,
    categories: {
      payments: true,
      sessions: true,
      messages: true,
      system: true,
    },
  };

  // Gerar notificações mock baseadas no tipo de usuário
  private generateMockNotifications(userType: string): Notification[] {
    const now = new Date();
    const baseNotifications: Notification[] = [];

    if (userType === 'ADMIN') {
      baseNotifications.push(
        {
          id: '1',
          type: 'warning',
          title: 'Pagamentos Pendentes',
          message: '5 pagamentos estão vencidos e precisam de atenção',
          timestamp: new Date(now.getTime() - 30 * 60000), // 30 min atrás
          read: false,
          userId: 'admin',
          actionUrl: '/dashboard/admin',
          metadata: { count: 5 }
        },
        {
          id: '2',
          type: 'success',
          title: 'Meta de Receita Atingida',
          message: 'Parabéns! A meta mensal foi superada em 15%',
          timestamp: new Date(now.getTime() - 2 * 60 * 60000), // 2h atrás
          read: true,
          userId: 'admin',
          metadata: { percentage: 115 }
        },
        {
          id: '3',
          type: 'info',
          title: 'Novo Treinador Cadastrado',
          message: 'Maria Silva completou o cadastro como treinadora',
          timestamp: new Date(now.getTime() - 4 * 60 * 60000), // 4h atrás
          read: false,
          userId: 'admin',
          actionUrl: '/dashboard/admin',
          metadata: { coachName: 'Maria Silva' }
        }
      );
    } else if (userType === 'COACH') {
      baseNotifications.push(
        {
          id: '4',
          type: 'info',
          title: 'Nova Mensagem de Aluno',
          message: 'João Silva enviou uma mensagem sobre o treino de hoje',
          timestamp: new Date(now.getTime() - 15 * 60000), // 15 min atrás
          read: false,
          userId: 'coach',
          actionUrl: '/dashboard/coach',
          metadata: { studentName: 'João Silva' }
        },
        {
          id: '5',
          type: 'success',
          title: 'Pagamento Recebido',
          message: 'Você recebeu R$ 210,00 de comissão do plano Premium',
          timestamp: new Date(now.getTime() - 60 * 60000), // 1h atrás
          read: false,
          userId: 'coach',
          metadata: { amount: 210 }
        },
        {
          id: '6',
          type: 'warning',
          title: 'Sessão Cancelada',
          message: 'Ana Santos cancelou a sessão de amanhã às 07:00',
          timestamp: new Date(now.getTime() - 3 * 60 * 60000), // 3h atrás
          read: true,
          userId: 'coach',
          actionUrl: '/dashboard/coach',
          metadata: { studentName: 'Ana Santos', sessionDate: 'amanhã 07:00' }
        }
      );
    } else if (userType === 'FITNESS_STUDENT') {
      baseNotifications.push(
        {
          id: '7',
          type: 'info',
          title: 'Treino de Hoje',
          message: 'Seu treino de corrida está agendado para às 18:00',
          timestamp: new Date(now.getTime() - 10 * 60000), // 10 min atrás
          read: false,
          userId: 'student',
          actionUrl: '/dashboard',
          metadata: { sessionTime: '18:00', type: 'corrida' }
        },
        {
          id: '8',
          type: 'success',
          title: 'Meta Atingida! 🎉',
          message: 'Parabéns! Você completou 75% da sua meta mensal',
          timestamp: new Date(now.getTime() - 2 * 60 * 60000), // 2h atrás
          read: false,
          userId: 'student',
          metadata: { progress: 75 }
        },
        {
          id: '9',
          type: 'warning',
          title: 'Pagamento Vence Amanhã',
          message: 'Sua assinatura Premium vence amanhã. Renove agora!',
          timestamp: new Date(now.getTime() - 24 * 60 * 60000), // 1 dia atrás
          read: true,
          userId: 'student',
          actionUrl: '/dashboard',
          metadata: { planType: 'Premium' }
        }
      );
    }

    return baseNotifications;
  }

  // Carregar notificações para um usuário específico
  getNotifications(userType: string, userId: string): Notification[] {
    if (this.notifications.length === 0) {
      this.notifications = this.generateMockNotifications(userType);
    }
    
    return this.notifications
      .filter(n => n.userId === userType.toLowerCase() || n.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Marcar notificação como lida
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Marcar todas como lidas
  markAllAsRead(userId: string): void {
    this.notifications
      .filter(n => n.userId === userId)
      .forEach(n => n.read = true);
    this.notifyListeners();
  }

  // Adicionar nova notificação
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    this.notifications.unshift(newNotification);
    this.notifyListeners();

    // Simular notificação push no browser
    if (this.config.enablePush && 'Notification' in window) {
      this.showBrowserNotification(newNotification);
    }
  }

  // Contar notificações não lidas
  getUnreadCount(userId: string): number {
    return this.notifications
      .filter(n => n.userId === userId && !n.read)
      .length;
  }

  // Sistema de listeners para updates em tempo real
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.push(callback);
    
    // Retorna função de unsubscribe
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Notificação push no browser
  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window)) return;

    // Solicitar permissão se necessário
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.type === 'error' || notification.type === 'warning',
      });

      // Auto-close após 5 segundos (exceto para avisos importantes)
      if (notification.type === 'info' || notification.type === 'success') {
        setTimeout(() => browserNotification.close(), 5000);
      }

      // Clique na notificação
      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };
    }
  }

  // Configurações do usuário
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): NotificationConfig {
    return { ...this.config };
  }

  // Simular notificações em tempo real (para demonstração)
  startRealTimeSimulation(userType: string, userId: string): void {
    const notifications = [
      {
        type: 'info' as const,
        title: 'Nova Atualização',
        message: 'Confira as novas funcionalidades na plataforma!',
        userId,
        read: false,
      },
      {
        type: 'success' as const,
        title: 'Backup Realizado',
        message: 'Seus dados foram salvos com segurança',
        userId,
        read: false,
      },
    ];

    // Enviar notificação a cada 30 segundos (apenas para demo)
    let index = 0;
    const interval = setInterval(() => {
      if (index < notifications.length) {
        this.addNotification(notifications[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 30000);
  }
}

export const notificationService = new NotificationService(); 