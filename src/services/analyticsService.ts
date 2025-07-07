// Sistema de Analytics - Endurance On
export interface MetricData {
  date: string;
  value: number;
  label?: string;
  category?: string;
}

export interface ChartData {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
  commissions: number;
  growth: number;
}

export interface UserGrowthData {
  month: string;
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  churnRate: number;
}

export interface SessionData {
  date: string;
  completed: number;
  canceled: number;
  revenue: number;
  avgRating: number;
}

export interface CoachPerformanceData {
  coachId: string;
  coachName: string;
  totalSessions: number;
  completedSessions: number;
  revenue: number;
  avgRating: number;
  studentsCount: number;
  retentionRate: number;
}

class AnalyticsService {
  // Dados mock para demonstração
  private mockRevenueData: RevenueData[] = [
    { month: 'Jan', revenue: 45000, subscriptions: 120, commissions: 12000, growth: 15 },
    { month: 'Fev', revenue: 52000, subscriptions: 140, commissions: 14500, growth: 18 },
    { month: 'Mar', revenue: 48000, subscriptions: 135, commissions: 13200, growth: 12 },
    { month: 'Abr', revenue: 58000, subscriptions: 155, commissions: 16800, growth: 22 },
    { month: 'Mai', revenue: 62000, subscriptions: 168, commissions: 18200, growth: 8 },
    { month: 'Jun', revenue: 67000, subscriptions: 180, commissions: 19500, growth: 15 },
    { month: 'Jul', revenue: 71000, subscriptions: 195, commissions: 21200, growth: 12 },
    { month: 'Ago', revenue: 75000, subscriptions: 210, commissions: 22800, growth: 8 },
    { month: 'Set', revenue: 82000, subscriptions: 225, commissions: 25100, growth: 18 },
    { month: 'Out', revenue: 88000, subscriptions: 240, commissions: 27300, growth: 12 },
    { month: 'Nov', revenue: 95000, subscriptions: 260, commissions: 29800, growth: 15 },
    { month: 'Dez', revenue: 102000, subscriptions: 280, commissions: 32500, growth: 8 },
  ];

  private mockUserGrowthData: UserGrowthData[] = [
    { month: 'Jan', totalUsers: 450, newUsers: 65, activeUsers: 380, churnRate: 3.2 },
    { month: 'Fev', totalUsers: 520, newUsers: 85, activeUsers: 445, churnRate: 2.8 },
    { month: 'Mar', totalUsers: 580, newUsers: 75, activeUsers: 495, churnRate: 3.1 },
    { month: 'Abr', totalUsers: 665, newUsers: 95, activeUsers: 570, churnRate: 2.4 },
    { month: 'Mai', totalUsers: 730, newUsers: 80, activeUsers: 625, churnRate: 2.9 },
    { month: 'Jun', totalUsers: 810, newUsers: 95, activeUsers: 695, churnRate: 2.6 },
    { month: 'Jul', totalUsers: 890, newUsers: 90, activeUsers: 765, churnRate: 2.8 },
    { month: 'Ago', totalUsers: 980, newUsers: 100, activeUsers: 840, churnRate: 2.3 },
    { month: 'Set', totalUsers: 1065, newUsers: 95, activeUsers: 915, churnRate: 2.7 },
    { month: 'Out', totalUsers: 1150, newUsers: 105, activeUsers: 995, churnRate: 2.5 },
    { month: 'Nov', totalUsers: 1240, newUsers: 110, activeUsers: 1070, churnRate: 2.4 },
    { month: 'Dez', totalUsers: 1335, newUsers: 115, activeUsers: 1155, churnRate: 2.2 },
  ];

  private mockSessionData: SessionData[] = [];
  private mockCoachPerformance: CoachPerformanceData[] = [
    {
      coachId: 'coach1',
      coachName: 'Maria Santos',
      totalSessions: 156,
      completedSessions: 142,
      revenue: 47320,
      avgRating: 4.8,
      studentsCount: 28,
      retentionRate: 92,
    },
    {
      coachId: 'coach2',
      coachName: 'João Oliveira',
      totalSessions: 134,
      completedSessions: 125,
      revenue: 38750,
      avgRating: 4.6,
      studentsCount: 22,
      retentionRate: 88,
    },
    {
      coachId: 'coach3',
      coachName: 'Ana Silva',
      totalSessions: 98,
      completedSessions: 89,
      revenue: 28960,
      avgRating: 4.7,
      studentsCount: 18,
      retentionRate: 85,
    },
    {
      coachId: 'coach4',
      coachName: 'Pedro Costa',
      totalSessions: 176,
      completedSessions: 168,
      revenue: 52340,
      avgRating: 4.9,
      studentsCount: 35,
      retentionRate: 95,
    },
  ];

  constructor() {
    this.generateSessionData();
  }

  // Gerar dados de sessão para os últimos 30 dias
  private generateSessionData(): void {
    const today = new Date();
    this.mockSessionData = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const completed = Math.floor(Math.random() * 15) + 5; // 5-20 sessões
      const canceled = Math.floor(Math.random() * 3); // 0-3 cancelamentos
      const revenue = completed * (Math.random() * 50 + 50); // R$ 50-100 por sessão
      const avgRating = 4.0 + Math.random() * 1.0; // 4.0-5.0

      this.mockSessionData.push({
        date: date.toISOString().split('T')[0],
        completed,
        canceled,
        revenue: Math.round(revenue),
        avgRating: Math.round(avgRating * 10) / 10,
      });
    }
  }

  // Obter dados de receita por período
  getRevenueData(months: number = 12): RevenueData[] {
    return this.mockRevenueData.slice(-months);
  }

  // Obter dados de crescimento de usuários
  getUserGrowthData(months: number = 12): UserGrowthData[] {
    return this.mockUserGrowthData.slice(-months);
  }

  // Obter dados de sessões diárias
  getSessionData(days: number = 30): SessionData[] {
    return this.mockSessionData.slice(-days);
  }

  // Obter performance dos coaches
  getCoachPerformanceData(): CoachPerformanceData[] {
    return [...this.mockCoachPerformance];
  }

  // Obter dados para gráfico de pizza - distribuição de planos
  getSubscriptionDistribution(): ChartData[] {
    return [
      { name: 'Básico', value: 45, percentage: 32, color: '#8884d8' },
      { name: 'Premium', value: 85, percentage: 60, color: '#82ca9d' },
      { name: 'Elite', value: 12, percentage: 8, color: '#ffc658' },
    ];
  }

  // Obter dados de retenção de usuários
  getUserRetentionData(): ChartData[] {
    return [
      { name: '1 mês', value: 85, color: '#8884d8' },
      { name: '3 meses', value: 68, color: '#82ca9d' },
      { name: '6 meses', value: 52, color: '#ffc658' },
      { name: '1 ano', value: 34, color: '#ff7c7c' },
    ];
  }

  // Obter top coaches por receita
  getTopCoachesByRevenue(limit: number = 5): CoachPerformanceData[] {
    return this.mockCoachPerformance
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  // Obter dados de satisfação por mês
  getSatisfactionData(): MetricData[] {
    return [
      { date: 'Jan', value: 4.2, label: 'Janeiro' },
      { date: 'Fev', value: 4.3, label: 'Fevereiro' },
      { date: 'Mar', value: 4.1, label: 'Março' },
      { date: 'Abr', value: 4.5, label: 'Abril' },
      { date: 'Mai', value: 4.4, label: 'Maio' },
      { date: 'Jun', value: 4.6, label: 'Junho' },
      { date: 'Jul', value: 4.5, label: 'Julho' },
      { date: 'Ago', value: 4.7, label: 'Agosto' },
      { date: 'Set', value: 4.6, label: 'Setembro' },
      { date: 'Out', value: 4.8, label: 'Outubro' },
      { date: 'Nov', value: 4.7, label: 'Novembro' },
      { date: 'Dez', value: 4.9, label: 'Dezembro' },
    ];
  }

  // Obter métricas consolidadas para dashboards
  getDashboardMetrics(userType: 'ADMIN' | 'COACH' | 'FITNESS_STUDENT', userId?: string): {
    kpis: { label: string; value: string | number; trend: number; color: string }[];
    chartData: any[];
    insights: string[];
  } {
    if (userType === 'ADMIN') {
      return {
        kpis: [
          { label: 'Receita Mensal', value: 'R$ 102.000', trend: 8, color: 'success' },
          { label: 'Usuários Ativos', value: 1155, trend: 12, color: 'primary' },
          { label: 'Taxa de Churn', value: '2.2%', trend: -0.3, color: 'success' },
          { label: 'NPS Score', value: 8.4, trend: 0.2, color: 'info' },
        ],
        chartData: this.getRevenueData(6),
        insights: [
          'Crescimento de 8% na receita comparado ao mês anterior',
          'Taxa de retenção melhorou em 15% nos últimos 3 meses',
          'Plano Premium representa 60% das assinaturas ativas',
          '95% dos usuários avaliam a plataforma com 4+ estrelas',
        ],
      };
    }

    if (userType === 'COACH') {
      const coachData = this.mockCoachPerformance[0]; // Mock para coach atual
      return {
        kpis: [
          { label: 'Receita Mensal', value: 'R$ 8.750', trend: 6.7, color: 'success' },
          { label: 'Alunos Ativos', value: coachData.studentsCount, trend: 3, color: 'primary' },
          { label: 'Avaliação Média', value: coachData.avgRating, trend: 0.1, color: 'warning' },
          { label: 'Taxa de Retenção', value: `${coachData.retentionRate}%`, trend: 2, color: 'info' },
        ],
        chartData: this.getSessionData(14),
        insights: [
          'Sua avaliação média subiu 0.1 pontos este mês',
          'Taxa de cancelamento diminuiu 15% comparado ao mês anterior',
          '3 novos alunos se inscreveram nos seus planos',
          'Receita por sessão aumentou 8% devido aos novos planos',
        ],
      };
    }

    // FITNESS_STUDENT
    return {
      kpis: [
        { label: 'Sessões Concluídas', value: 24, trend: 4, color: 'success' },
        { label: 'Meta Mensal', value: '80%', trend: 12, color: 'primary' },
        { label: 'Tempo de Treino', value: '18.5h', trend: 2.3, color: 'info' },
        { label: 'Próxima Meta', value: '5 dias', trend: -2, color: 'warning' },
      ],
      chartData: this.getSessionData(30).map(d => ({ date: d.date, sessions: d.completed })),
      insights: [
        'Você está 20% acima da sua meta mensal de treinos',
        'Sua consistência melhorou 15% este mês',
        'Próxima avaliação física agendada para próxima semana',
        'Seu coach destacou melhora na resistência cardiovascular',
      ],
    };
  }

  // Calcular tendências
  calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previous = data.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
    
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  }

  // Formatar números para exibição
  formatNumber(value: number, type: 'currency' | 'percentage' | 'decimal' = 'decimal'): string {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value);
      
      case 'percentage':
        return new Intl.NumberFormat('pt-BR', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(value / 100);
      
      default:
        return new Intl.NumberFormat('pt-BR').format(value);
    }
  }

  // Gerar relatório mensal
  generateMonthlyReport(userType: 'ADMIN' | 'COACH', month: string): {
    summary: string;
    highlights: string[];
    recommendations: string[];
    data: any;
  } {
    if (userType === 'ADMIN') {
      return {
        summary: `Relatório de ${month}: A plataforma teve um crescimento sólido com aumento de 8% na receita e redução de 0.3% na taxa de churn.`,
        highlights: [
          'Receita mensal atingiu R$ 102.000 (+8%)',
          'Base de usuários ativos cresceu para 1.155 (+12%)',
          'Taxa de retenção melhorou para 97.8%',
          'NPS Score atingiu 8.4 (+0.2)',
          'Novos coaches: 3 aprovados',
        ],
        recommendations: [
          'Investir em marketing para acelerar aquisição de usuários',
          'Implementar programa de fidelidade para melhorar retenção',
          'Expandir catálogo de treinos especializados',
          'Desenvolver funcionalidades mobile avançadas',
        ],
        data: this.getRevenueData(1)[0],
      };
    }

    // COACH
    return {
      summary: `Relatório de ${month}: Excelente performance com aumento de 6.7% na receita e melhoria na satisfação dos alunos.`,
      highlights: [
        'Receita mensal: R$ 8.750 (+6.7%)',
        'Novos alunos: 3 inscrições',
        'Avaliação média: 4.8/5.0 (+0.1)',
        'Taxa de retenção: 92% (+2%)',
        'Sessões concluídas: 142 (+8)',
      ],
      recommendations: [
        'Considerar aumentar preço dos planos premium',
        'Desenvolver conteúdo específico para retenção',
        'Agendar mais sessões de avaliação física',
        'Implementar programa de referência para alunos',
      ],
      data: this.mockCoachPerformance[0],
    };
  }
}

export const analyticsService = new AnalyticsService(); 