import { io, Socket } from 'socket.io-client';

/**
 * Serviço WebSocket para simular emissão de eventos
 * Em um ambiente real, isso seria feito pelo backend
 */
class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    
    try {
      this.socket = io(WEBSOCKET_URL, {
        transports: ['websocket'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        this.isConnected = false;
      });

    } catch (error) {
      // Erro ao inicializar socket
    }
  }

  /**
   * Emitir evento de resultado de teste registrado
   */
  emitTestResultRegistered(data: {
    userId: string;
    testId: string;
    testName: string;
    result: any;
    coachId: string;
    coachName: string;
  }) {
    const eventData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    if (this.socket && this.isConnected) {
      // Emitir para o aluno
      this.socket.emit('test:result:registered', eventData);
      
      // Emitir para o treinador
      this.socket.emit('test:result:registered:coach', eventData);
    }
  }

  /**
   * Emitir evento de resultado de prova registrado
   */
  emitExamResultRegistered(data: {
    userId: string;
    examId: string;
    examName: string;
    result: any;
    coachId: string;
    coachName: string;
  }) {
    const eventData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    if (this.socket && this.isConnected) {
      // Emitir para o aluno
      this.socket.emit('exam:result:registered', eventData);
      
      // Emitir para o treinador
      this.socket.emit('exam:result:registered:coach', eventData);
    }
  }

  /**
   * Emitir evento de nova prova criada
   */
  emitNewExamCreated(data: {
    examId: string;
    examName: string;
    modalidade: string;
    coachId: string;
    coachName: string;
    students: string[];
  }) {
    const eventData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    if (this.socket && this.isConnected) {
      // Emitir para os alunos
      this.socket.emit('exam:created', eventData);
      
      // Emitir para o treinador
      this.socket.emit('exam:created:coach', eventData);
    }
  }

  /**
   * Emitir evento de mudança de plano
   */
  emitPlanChange(data: {
    userId: string;
    studentName: string;
    oldPlanId: string;
    oldPlanName: string;
    newPlanId: string;
    newPlanName: string;
    coachId: string;
    coachName: string;
  }) {
    const eventData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    if (this.socket && this.isConnected) {
      // Emitir para o aluno
      this.socket.emit('plan:changed', eventData);
      
      // Emitir para o treinador
      this.socket.emit('plan:changed:coach', eventData);
    }
  }

  /**
   * Emitir evento de conta de aluno criada
   */
  emitStudentAccountCreated(data: {
    userId: string;
    studentName: string;
    studentEmail: string;
    coachId: string;
    coachName: string;
  }) {
    const eventData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    if (this.socket && this.isConnected) {
      // Emitir para o aluno
      this.socket.emit('account:created', eventData);
      
      // Emitir para o treinador
      this.socket.emit('student:account:created', eventData);
    }
  }

  /**
   * Emitir evento de solicitação de licença
   */
  emitLeaveRequest(data: {
    userId: string;
    studentName: string;
    requestId: string;
    reason: string;
    startDate: string;
    endDate: string;
    coachId: string;
    coachName: string;
  }) {
    const eventData = {
      ...data,
      timestamp: new Date().toISOString()
    };

    if (this.socket && this.isConnected) {
      // Emitir para o aluno
      this.socket.emit('leave:requested', eventData);
      
      // Emitir para o treinador
      this.socket.emit('leave:requested:coach', eventData);
    }
  }

  /**
   * Verificar se está conectado
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }

  /**
   * Desconectar
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Exportar instância singleton
export const websocketService = new WebSocketService();
