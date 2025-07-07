// Sistema de Agenda - Endurance On
export interface Session {
  id: string;
  coachId: string;
  coachName: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  date: Date;
  duration: number; // em minutos
  type: 'PRESENCIAL' | 'ONLINE' | 'AVALIACAO' | 'CONSULTORIA';
  status: 'AGENDADA' | 'CONFIRMADA' | 'CANCELADA' | 'CONCLUIDA' | 'EM_ANDAMENTO';
  location?: string;
  meetingLink?: string;
  notes?: string;
  price: number;
  studentNotes?: string;
  coachNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  id: string;
  coachId: string;
  dayOfWeek: number; // 0-6 (domingo-sábado)
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  isAvailable: boolean;
  recurringWeeks?: number; // quantas semanas esse slot se repete
}

export interface CoachAvailability {
  coachId: string;
  timeSlots: TimeSlot[];
  blackoutDates: Date[]; // datas indisponíveis
  minNoticeHours: number; // mínimo de horas de antecedência
  maxAdvanceDays: number; // máximo de dias que pode agendar no futuro
}

class ScheduleService {
  private sessions: Session[] = [];
  private availability: Map<string, CoachAvailability> = new Map();
  private listeners: Array<(sessions: Session[]) => void> = [];

  constructor() {
    this.initializeMockData();
  }

  // Inicializar dados mock
  private initializeMockData(): void {
    const now = new Date();
    
    // Sessões mock
    this.sessions = [
      {
        id: '1',
        coachId: 'coach1',
        coachName: 'Maria Santos',
        studentId: 'student1',
        studentName: 'João Silva',
        title: 'Treino de Corrida - Iniciante',
        description: 'Sessão focada em técnica de corrida e resistência básica',
        date: new Date(now.getTime() + 24 * 60 * 60000), // amanhã
        duration: 60,
        type: 'PRESENCIAL',
        status: 'CONFIRMADA',
        location: 'Parque Ibirapuera',
        price: 80,
        notes: 'Trazer roupa adequada e água',
        createdAt: new Date(now.getTime() - 48 * 60 * 60000),
        updatedAt: new Date(now.getTime() - 24 * 60 * 60000),
      },
      {
        id: '2',
        coachId: 'coach1',
        coachName: 'Maria Santos',
        studentId: 'student2',
        studentName: 'Ana Costa',
        title: 'Consultoria Nutricional',
        description: 'Revisão do plano alimentar e ajustes para performance',
        date: new Date(now.getTime() + 2 * 24 * 60 * 60000), // depois de amanhã
        duration: 45,
        type: 'ONLINE',
        status: 'AGENDADA',
        meetingLink: 'https://meet.google.com/xxx-xxxx-xxx',
        price: 60,
        notes: 'Preparar relatório de alimentação da semana',
        createdAt: new Date(now.getTime() - 72 * 60 * 60000),
        updatedAt: new Date(now.getTime() - 12 * 60 * 60000),
      },
      {
        id: '3',
        coachId: 'coach1',
        coachName: 'Maria Santos',
        studentId: 'student1',
        studentName: 'João Silva',
        title: 'Avaliação Física',
        description: 'Avaliação completa de composição corporal e testes físicos',
        date: new Date(now.getTime() + 7 * 24 * 60 * 60000), // próxima semana
        duration: 90,
        type: 'PRESENCIAL',
        status: 'AGENDADA',
        location: 'Academia Fit Plus',
        price: 120,
        notes: 'Jejum de 12h. Trazer exames recentes.',
        createdAt: new Date(now.getTime() - 24 * 60 * 60000),
        updatedAt: new Date(now.getTime() - 24 * 60 * 60000),
      },
      {
        id: '4',
        coachId: 'coach1',
        coachName: 'Maria Santos',
        studentId: 'student3',
        studentName: 'Carlos Lima',
        title: 'Treino HIIT',
        description: 'Treino intervalado de alta intensidade',
        date: new Date(now.getTime() - 24 * 60 * 60000), // ontem
        duration: 45,
        type: 'PRESENCIAL',
        status: 'CONCLUIDA',
        location: 'Academia Endurance',
        price: 70,
        coachNotes: 'Excelente evolução na resistência',
        studentNotes: 'Treino muito desafiador, mas gostei!',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60000),
        updatedAt: new Date(now.getTime() - 23 * 60 * 60000),
      },
    ];

    // Disponibilidade mock para o coach
    this.availability.set('coach1', {
      coachId: 'coach1',
      minNoticeHours: 4,
      maxAdvanceDays: 30,
      blackoutDates: [
        new Date(now.getTime() + 14 * 24 * 60 * 60000), // feriado em 2 semanas
      ],
      timeSlots: [
        // Segunda-feira
        { id: 'slot1', coachId: 'coach1', dayOfWeek: 1, startTime: '07:00', endTime: '08:00', isAvailable: true },
        { id: 'slot2', coachId: 'coach1', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', isAvailable: true },
        { id: 'slot3', coachId: 'coach1', dayOfWeek: 1, startTime: '18:00', endTime: '19:00', isAvailable: true },
        
        // Terça-feira
        { id: 'slot4', coachId: 'coach1', dayOfWeek: 2, startTime: '07:00', endTime: '08:00', isAvailable: true },
        { id: 'slot5', coachId: 'coach1', dayOfWeek: 2, startTime: '15:00', endTime: '16:00', isAvailable: true },
        { id: 'slot6', coachId: 'coach1', dayOfWeek: 2, startTime: '19:00', endTime: '20:00', isAvailable: true },
        
        // Quarta-feira
        { id: 'slot7', coachId: 'coach1', dayOfWeek: 3, startTime: '08:00', endTime: '09:00', isAvailable: true },
        { id: 'slot8', coachId: 'coach1', dayOfWeek: 3, startTime: '17:00', endTime: '18:00', isAvailable: true },
        
        // Quinta-feira
        { id: 'slot9', coachId: 'coach1', dayOfWeek: 4, startTime: '07:00', endTime: '08:00', isAvailable: true },
        { id: 'slot10', coachId: 'coach1', dayOfWeek: 4, startTime: '16:00', endTime: '17:00', isAvailable: true },
        { id: 'slot11', coachId: 'coach1', dayOfWeek: 4, startTime: '18:00', endTime: '19:00', isAvailable: true },
        
        // Sexta-feira
        { id: 'slot12', coachId: 'coach1', dayOfWeek: 5, startTime: '09:00', endTime: '10:00', isAvailable: true },
        { id: 'slot13', coachId: 'coach1', dayOfWeek: 5, startTime: '18:00', endTime: '19:00', isAvailable: true },
        
        // Sábado
        { id: 'slot14', coachId: 'coach1', dayOfWeek: 6, startTime: '08:00', endTime: '09:00', isAvailable: true },
        { id: 'slot15', coachId: 'coach1', dayOfWeek: 6, startTime: '10:00', endTime: '11:00', isAvailable: true },
      ],
    });
  }

  // Buscar sessões do coach
  getCoachSessions(coachId: string, startDate?: Date, endDate?: Date): Session[] {
    let sessions = this.sessions.filter(s => s.coachId === coachId);
    
    if (startDate && endDate) {
      sessions = sessions.filter(s => s.date >= startDate && s.date <= endDate);
    }
    
    return sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Buscar sessões do aluno
  getStudentSessions(studentId: string, startDate?: Date, endDate?: Date): Session[] {
    let sessions = this.sessions.filter(s => s.studentId === studentId);
    
    if (startDate && endDate) {
      sessions = sessions.filter(s => s.date >= startDate && s.date <= endDate);
    }
    
    return sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Buscar próximas sessões
  getUpcomingSessions(userId: string, isCoach: boolean = false): Session[] {
    const now = new Date();
    const sessions = isCoach 
      ? this.getCoachSessions(userId, now)
      : this.getStudentSessions(userId, now);
    
    return sessions
      .filter(s => s.date > now && s.status !== 'CANCELADA')
      .slice(0, 5);
  }

  // Buscar sessões por status
  getSessionsByStatus(userId: string, status: Session['status'], isCoach: boolean = false): Session[] {
    const sessions = isCoach 
      ? this.getCoachSessions(userId)
      : this.getStudentSessions(userId);
    
    return sessions.filter(s => s.status === status);
  }

  // Agendar nova sessão
  scheduleSession(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Session {
    const newSession: Session = {
      ...session,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.unshift(newSession);
    this.notifyListeners();

    return newSession;
  }

  // Atualizar sessão
  updateSession(sessionId: string, updates: Partial<Session>): Session | null {
    const sessionIndex = this.sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) return null;

    this.sessions[sessionIndex] = {
      ...this.sessions[sessionIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.notifyListeners();
    return this.sessions[sessionIndex];
  }

  // Cancelar sessão
  cancelSession(sessionId: string, canceledBy: string, reason?: string): boolean {
    const existingSession = this.sessions.find(s => s.id === sessionId);
    const session = this.updateSession(sessionId, {
      status: 'CANCELADA',
      notes: `${existingSession?.notes || ''}\nCancelado por: ${canceledBy}${reason ? `. Motivo: ${reason}` : ''}`,
    });

    return !!session;
  }

  // Confirmar sessão
  confirmSession(sessionId: string): boolean {
    const session = this.updateSession(sessionId, { status: 'CONFIRMADA' });
    return !!session;
  }

  // Concluir sessão
  completeSession(sessionId: string, coachNotes?: string, studentNotes?: string): boolean {
    const session = this.updateSession(sessionId, {
      status: 'CONCLUIDA',
      coachNotes,
      studentNotes,
    });

    return !!session;
  }

  // Verificar disponibilidade
  getAvailableSlots(coachId: string, date: Date): TimeSlot[] {
    const availability = this.availability.get(coachId);
    if (!availability) return [];

    const dayOfWeek = date.getDay();
    const daySlots = availability.timeSlots.filter(slot => 
      slot.dayOfWeek === dayOfWeek && slot.isAvailable
    );

    // Filtrar slots já ocupados
    const existingSessions = this.getCoachSessions(coachId, date, date);
    const occupiedTimes = existingSessions.map(s => s.date.toTimeString().slice(0, 5));

    return daySlots.filter(slot => !occupiedTimes.includes(slot.startTime));
  }

  // Verificar se coach está disponível em uma data/hora específica
  isSlotAvailable(coachId: string, date: Date): boolean {
    const availability = this.availability.get(coachId);
    if (!availability) return false;

    // Verificar se está dentro do prazo mínimo de antecedência
    const now = new Date();
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours < availability.minNoticeHours) return false;

    // Verificar se está dentro do prazo máximo
    const diffDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > availability.maxAdvanceDays) return false;

    // Verificar blackout dates
    const isBlackout = availability.blackoutDates.some(blackoutDate => 
      blackoutDate.toDateString() === date.toDateString()
    );
    if (isBlackout) return false;

    // Verificar slots disponíveis
    const availableSlots = this.getAvailableSlots(coachId, date);
    const requestedTime = date.toTimeString().slice(0, 5);
    
    return availableSlots.some(slot => slot.startTime === requestedTime);
  }

  // Estatísticas de agenda
  getScheduleStats(userId: string, isCoach: boolean = false): {
    totalSessions: number;
    upcomingSessions: number;
    completedSessions: number;
    canceledSessions: number;
    monthlyRevenue?: number;
    averageRating?: number;
  } {
    const sessions = isCoach 
      ? this.getCoachSessions(userId)
      : this.getStudentSessions(userId);

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const monthlySessions = sessions.filter(s => 
      s.date >= currentMonth && s.date < nextMonth && s.status === 'CONCLUIDA'
    );

    const stats = {
      totalSessions: sessions.length,
      upcomingSessions: sessions.filter(s => s.date > now && s.status !== 'CANCELADA').length,
      completedSessions: sessions.filter(s => s.status === 'CONCLUIDA').length,
      canceledSessions: sessions.filter(s => s.status === 'CANCELADA').length,
    };

    if (isCoach) {
      return {
        ...stats,
        monthlyRevenue: monthlySessions.reduce((sum, s) => sum + s.price, 0),
        averageRating: 4.8, // Mock rating
      };
    }

    return stats;
  }

  // Sistema de listeners
  subscribe(callback: (sessions: Session[]) => void): () => void {
    this.listeners.push(callback);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.sessions));
  }

  // Formatação de data e hora
  formatSessionDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatSessionTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatSessionDateTime(date: Date): string {
    return `${this.formatSessionDate(date)} às ${this.formatSessionTime(date)}`;
  }

  // Calcular próximos horários disponíveis
  getNextAvailableSlots(coachId: string, days: number = 7): Array<{date: Date, slots: TimeSlot[]}> {
    const result: Array<{date: Date, slots: TimeSlot[]}> = [];
    const startDate = new Date();
    
    for (let i = 1; i <= days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60000);
      const availableSlots = this.getAvailableSlots(coachId, date);
      
      if (availableSlots.length > 0) {
        result.push({ date, slots: availableSlots });
      }
    }

    return result;
  }
}

export const scheduleService = new ScheduleService(); 