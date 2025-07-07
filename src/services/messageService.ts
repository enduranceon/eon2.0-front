// Sistema de Mensagens - Endurance On
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'COACH' | 'FITNESS_STUDENT';
  receiverId: string;
  receiverName: string;
  subject: string;
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    type: 'COACH' | 'FITNESS_STUDENT';
    avatar?: string;
  }[];
  lastMessage: Message;
  unreadCount: number;
  updatedAt: Date;
}

class MessageService {
  private messages: Message[] = [];
  private listeners: Array<(messages: Message[]) => void> = [];

  constructor() {
    this.initializeMockMessages();
  }

  // Inicializar mensagens mock para demonstração
  private initializeMockMessages(): void {
    const now = new Date();
    
    this.messages = [
      {
        id: '1',
        senderId: 'coach1',
        senderName: 'Maria Santos',
        senderType: 'COACH',
        receiverId: 'student1',
        receiverName: 'João Silva',
        subject: 'Ajuste no treino de corrida',
        content: 'Olá João! Vi que você teve dificuldades no treino de ontem. Vamos ajustar a intensidade para a próxima semana. O importante é manter a consistência.',
        timestamp: new Date(now.getTime() - 2 * 60 * 60000), // 2h atrás
        read: false,
      },
      {
        id: '2',
        senderId: 'student1',
        senderName: 'João Silva',
        senderType: 'FITNESS_STUDENT',
        receiverId: 'coach1',
        receiverName: 'Maria Santos',
        subject: 'Dúvida sobre hidratação',
        content: 'Oi Maria! Tenho uma dúvida sobre a hidratação durante os treinos longos. Quanto devo beber e com que frequência? Obrigado!',
        timestamp: new Date(now.getTime() - 4 * 60 * 60000), // 4h atrás
        read: true,
      },
      {
        id: '3',
        senderId: 'coach1',
        senderName: 'Maria Santos',
        senderType: 'COACH',
        receiverId: 'student2',
        receiverName: 'Ana Costa',
        subject: 'Parabéns pelo progresso!',
        content: 'Ana, estou muito orgulhosa do seu progresso! Você conseguiu baixar 2 minutos no seu tempo de 10K. Continue assim!',
        timestamp: new Date(now.getTime() - 6 * 60 * 60000), // 6h atrás
        read: false,
      },
      {
        id: '4',
        senderId: 'student2',
        senderName: 'Ana Costa',
        senderType: 'FITNESS_STUDENT',
        receiverId: 'coach1',
        receiverName: 'Maria Santos',
        subject: 'Reagendamento de sessão',
        content: 'Maria, preciso reagendar nossa sessão de amanhã. Surgiu um compromisso de trabalho. Podemos para quinta-feira no mesmo horário?',
        timestamp: new Date(now.getTime() - 8 * 60 * 60000), // 8h atrás
        read: true,
      },
      {
        id: '5',
        senderId: 'coach1',
        senderName: 'Maria Santos',
        senderType: 'COACH',
        receiverId: 'student1',
        receiverName: 'João Silva',
        subject: 'Plano nutricional',
        content: 'João, preparei algumas sugestões de alimentação pré e pós-treino. Lembre-se: carboidratos antes, proteínas depois. Te envio o detalhamento por email.',
        timestamp: new Date(now.getTime() - 24 * 60 * 60000), // 1 dia atrás
        read: true,
      },
    ];
  }

  // Buscar mensagens para um usuário específico
  getMessages(userId: string): Message[] {
    return this.messages
      .filter(m => m.senderId === userId || m.receiverId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Buscar conversas do usuário
  getConversations(userId: string): Conversation[] {
    const userMessages = this.getMessages(userId);
    const conversationMap = new Map<string, Conversation>();

    userMessages.forEach(message => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      const partnerName = message.senderId === userId ? message.receiverName : message.senderName;
      const partnerType = message.senderId === userId ? 
        (message.receiverId === 'coach1' ? 'COACH' : 'FITNESS_STUDENT') :
        message.senderType;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          id: partnerId,
          participants: [
            {
              id: userId,
              name: message.senderId === userId ? message.senderName : message.receiverName,
              type: message.senderId === userId ? message.senderType : 
                (message.receiverId === 'coach1' ? 'COACH' : 'FITNESS_STUDENT'),
            },
            {
              id: partnerId,
              name: partnerName,
              type: partnerType,
            }
          ],
          lastMessage: message,
          unreadCount: 0,
          updatedAt: message.timestamp,
        });
      }

      const conversation = conversationMap.get(partnerId)!;
      
      // Atualizar última mensagem se for mais recente
      if (message.timestamp > conversation.lastMessage.timestamp) {
        conversation.lastMessage = message;
        conversation.updatedAt = message.timestamp;
      }

      // Contar mensagens não lidas
      if (!message.read && message.receiverId === userId) {
        conversation.unreadCount++;
      }
    });

    return Array.from(conversationMap.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Buscar mensagens de uma conversa específica
  getConversationMessages(userId: string, partnerId: string): Message[] {
    return this.messages
      .filter(m => 
        (m.senderId === userId && m.receiverId === partnerId) ||
        (m.senderId === partnerId && m.receiverId === userId)
      )
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Enviar nova mensagem
  sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'read'>): Message {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    this.messages.unshift(newMessage);
    this.notifyListeners();

    return newMessage;
  }

  // Marcar mensagem como lida
  markAsRead(messageId: string): void {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.read = true;
      this.notifyListeners();
    }
  }

  // Marcar todas as mensagens de uma conversa como lidas
  markConversationAsRead(userId: string, partnerId: string): void {
    this.messages
      .filter(m => 
        m.senderId === partnerId && 
        m.receiverId === userId && 
        !m.read
      )
      .forEach(m => m.read = true);
    
    this.notifyListeners();
  }

  // Contar mensagens não lidas
  getUnreadCount(userId: string): number {
    return this.messages
      .filter(m => m.receiverId === userId && !m.read)
      .length;
  }

  // Buscar mensagens por termo
  searchMessages(userId: string, searchTerm: string): Message[] {
    const userMessages = this.getMessages(userId);
    const term = searchTerm.toLowerCase();
    
    return userMessages.filter(m =>
      m.subject.toLowerCase().includes(term) ||
      m.content.toLowerCase().includes(term) ||
      m.senderName.toLowerCase().includes(term) ||
      m.receiverName.toLowerCase().includes(term)
    );
  }

  // Obter estatísticas de mensagens
  getMessageStats(userId: string): {
    total: number;
    unread: number;
    sent: number;
    received: number;
    conversationsCount: number;
  } {
    const messages = this.getMessages(userId);
    const conversations = this.getConversations(userId);
    
    return {
      total: messages.length,
      unread: this.getUnreadCount(userId),
      sent: messages.filter(m => m.senderId === userId).length,
      received: messages.filter(m => m.receiverId === userId).length,
      conversationsCount: conversations.length,
    };
  }

  // Sistema de listeners para updates em tempo real
  subscribe(callback: (messages: Message[]) => void): () => void {
    this.listeners.push(callback);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.messages));
  }

  // Simular chegada de nova mensagem (para demonstração)
  simulateIncomingMessage(receiverId: string): void {
    const mockMessages = [
      {
        senderId: 'coach1',
        senderName: 'Maria Santos',
        senderType: 'COACH' as const,
        receiverId,
        receiverName: 'Você',
        subject: 'Lembrete de treino',
        content: 'Não esqueça do treino de amanhã às 7h! Vamos trabalhar resistência.',
      },
      {
        senderId: 'student_demo',
        senderName: 'Carlos Demo',
        senderType: 'FITNESS_STUDENT' as const,
        receiverId,
        receiverName: 'Você',
        subject: 'Dúvida sobre exercício',
        content: 'Tenho uma dúvida sobre a execução do exercício de prancha. Pode me ajudar?',
      }
    ];

    const randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];
    this.sendMessage(randomMessage);
  }

  // Formatar data da mensagem
  formatMessageTime(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return timestamp.toLocaleDateString('pt-BR');
  }
}

export const messageService = new MessageService(); 