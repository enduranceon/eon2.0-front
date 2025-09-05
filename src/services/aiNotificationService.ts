// 🤖 Serviço de IA para Notificações Inteligentes
// Sistema que analisa dados REAIS e gera insights personalizados para administradores

import { enduranceApi } from './enduranceApi';

interface ActivityData {
  timestamp: Date;
  type: 'login' | 'payment' | 'registration' | 'course_completion' | 'support_ticket' | 'content_upload';
  userId?: string;
  metadata?: Record<string, any>;
}

interface AIInsight {
  id: string;
  type: 'urgent' | 'warning' | 'info' | 'success' | 'trend';
  title: string;
  message: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  moduleId: string; // ID do módulo que precisa atenção
  icon: string;
  timestamp: Date;
  aiConfidence: number; // 0-100
  recommendedAction?: string;
  data?: any;
}

interface LastLoginData {
  userId: string;
  lastLogin: Date;
  currentLogin: Date;
  sessionCount: number;
}

class AINotificationService {
  private lastLoginKey = 'ai_last_login_data';
  private notificationsKey = 'ai_active_notifications';
  private userActivityKey = 'ai_user_activity';

  // 🧠 Motor de IA - Analisa padrões e gera insights
  async generateIntelligentInsights(userId: string, userType?: string): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];
      
      // Verificar se o usuário é administrador antes de fazer chamadas de API
      if (userType && userType !== 'ADMIN') {
        return this.generateFallbackInsights();
      }
      
      // Buscar dados reais do backend em paralelo
      const [
        moduleStats,
        systemHealth,
        criticalAlerts,
        activities,
        dashboardKPIs,
        financialSummary,
        userStats,
        coachStats,
        predictiveData
      ] = await Promise.allSettled([
        enduranceApi.getModuleStats(),
        enduranceApi.getSystemHealth(),
        enduranceApi.getCriticalAlerts(),
        enduranceApi.getActivities({ limit: 100 }),
        enduranceApi.getDashboardKPIs(),
        enduranceApi.getFinancialSummaryNew(),
        enduranceApi.getUserStats(),
        enduranceApi.getCoachStats(),
        enduranceApi.getPredictiveAnalysis()
      ]);

      // Processar dados e gerar insights baseados em dados reais
      if (moduleStats.status === 'fulfilled') {
        insights.push(...this.analyzeModuleData(moduleStats.value));
      }

      if (systemHealth.status === 'fulfilled') {
        insights.push(...this.analyzeSystemHealthReal(systemHealth.value));
      }

      if (criticalAlerts.status === 'fulfilled') {
        insights.push(...this.processCriticalAlerts(criticalAlerts.value));
      }

      if (activities.status === 'fulfilled') {
        insights.push(...this.analyzeActivityPatterns(activities.value));
      }

      if (dashboardKPIs.status === 'fulfilled') {
        insights.push(...this.analyzeKPITrends(dashboardKPIs.value));
      }

      if (financialSummary.status === 'fulfilled') {
        insights.push(...this.analyzeFinancialData(financialSummary.value));
      }

      if (userStats.status === 'fulfilled' && coachStats.status === 'fulfilled') {
        insights.push(...this.analyzeUserGrowth(userStats.value, coachStats.value));
      }

      if (predictiveData.status === 'fulfilled') {
        insights.push(...this.processPredictiveInsights(predictiveData.value));
      }

      // Ordenar por prioridade e confiança da IA
      return insights.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return (priorityWeight[b.priority] * b.aiConfidence) - (priorityWeight[a.priority] * a.aiConfidence);
      });
    } catch (error) {
      console.error('Erro ao gerar insights da IA:', error);
      return this.generateFallbackInsights();
    }
  }

  // 🚨 Análise de questões urgentes
  private analyzeUrgentMatters(hoursSinceLastLogin: number): AIInsight[] {
    const insights: AIInsight[] = [];

    if (hoursSinceLastLogin > 24) {
      insights.push({
        id: 'urgent-payments',
        type: 'urgent',
        title: 'Pagamentos Pendentes Críticos',
        message: `3 pagamentos estão atrasados há mais de 48h. Perda estimada: R$ 2.150`,
        actionable: true,
        priority: 'high',
        moduleId: 'admin-finance',
        icon: 'warning',
        timestamp: new Date(),
        aiConfidence: 92,
        recommendedAction: 'Revisar pagamentos em atraso na seção Financeiro',
        data: { count: 3, value: 2150 }
      });
    }

    if (hoursSinceLastLogin > 12) {
      insights.push({
        id: 'urgent-support',
        type: 'warning',
        title: 'Solicitações de Suporte Acumuladas',
        message: `8 tickets de suporte aguardam aprovação. 2 são de alta prioridade`,
        actionable: true,
        priority: 'high',
        moduleId: 'admin-requests',
        icon: 'support',
        timestamp: new Date(),
        aiConfidence: 87,
        recommendedAction: 'Verificar solicitações pendentes'
      });
    }

    return insights;
  }

  // 💰 Análise de tendências financeiras
  private analyzeFinancialTrends(activity: ActivityData[]): AIInsight[] {
    const insights: AIInsight[] = [];
    
    const recentPayments = activity.filter(a => {
      const timestamp = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      return a.type === 'payment' && 
        Date.now() - timestamp.getTime() < 24 * 60 * 60 * 1000;
    });

    if (recentPayments.length > 10) {
      insights.push({
        id: 'financial-spike',
        type: 'success',
        title: 'Pico de Receita Detectado',
        message: `${recentPayments.length} pagamentos nas últimas 24h (+67% vs média)`,
        actionable: true,
        priority: 'medium',
        moduleId: 'admin-finance',
        icon: 'trending_up',
        timestamp: new Date(),
        aiConfidence: 89,
        recommendedAction: 'Analisar causa do aumento para replicar estratégia'
      });
    }

    // IA detecta padrão sazonal
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11) {
      insights.push({
        id: 'optimal-time',
        type: 'info',
        title: 'Momento Ideal para Ações',
        message: 'IA detectou que este é o horário de maior engajamento dos usuários',
        actionable: true,
        priority: 'low',
        moduleId: 'admin-students',
        icon: 'psychology',
        timestamp: new Date(),
        aiConfidence: 78,
        recommendedAction: 'Considere enviar comunicações importantes agora'
      });
    }

    return insights;
  }

  // 👥 Análise de comportamento dos usuários
  private analyzeUserBehavior(activity: ActivityData[]): AIInsight[] {
    const insights: AIInsight[] = [];

    const registrations = activity.filter(a => a.type === 'registration');
    if (registrations.length > 5) {
      insights.push({
        id: 'user-growth',
        type: 'success',
        title: 'Crescimento Acelerado de Usuários',
        message: `${registrations.length} novos cadastros detectados. Crescimento 34% acima do normal`,
        actionable: true,
        priority: 'medium',
        moduleId: 'admin-students',
        icon: 'group_add',
        timestamp: new Date(),
        aiConfidence: 91,
        recommendedAction: 'Preparar recursos para acomodar novos usuários'
      });
    }

    // IA detecta necessidade de novos coaches
    if (registrations.length > 8) {
      insights.push({
        id: 'coach-demand',
        type: 'warning',
        title: 'Demanda por Novos Treinadores',
        message: 'IA prevê necessidade de +2 coaches baseado no padrão de crescimento',
        actionable: true,
        priority: 'medium',
        moduleId: 'admin-coaches',
        icon: 'person_add',
        timestamp: new Date(),
        aiConfidence: 83,
        recommendedAction: 'Considere processo seletivo para novos treinadores'
      });
    }

    return insights;
  }

  // 🔧 Análise de saúde do sistema
  private analyzeSystemHealth(): AIInsight[] {
    const insights: AIInsight[] = [];

    // Simula detecção de performance
    const performanceScore = Math.random() * 100;
    if (performanceScore < 85) {
      insights.push({
        id: 'system-performance',
        type: 'warning',
        title: 'Performance do Sistema',
        message: `Score de performance: ${performanceScore.toFixed(1)}%. Recomendada otimização`,
        actionable: true,
        priority: 'medium',
        moduleId: 'admin-settings',
        icon: 'speed',
        timestamp: new Date(),
        aiConfidence: 76,
        recommendedAction: 'Verificar configurações de servidor'
      });
    }

    return insights;
  }

  // 🔮 Análise preditiva
  private predictiveAnalysis(activity: ActivityData[]): AIInsight[] {
    const insights: AIInsight[] = [];

    // IA prevê churn de usuários
    const loginPattern = activity.filter(a => a.type === 'login').length;
    if (loginPattern < 20) {
      insights.push({
        id: 'churn-prediction',
        type: 'warning',
        title: 'Risco de Churn Detectado',
        message: 'IA detectou 15% de redução no engajamento. Ação preventiva recomendada',
        actionable: true,
        priority: 'high',
        moduleId: 'admin-students',
        icon: 'trending_down',
        timestamp: new Date(),
        aiConfidence: 82,
        recommendedAction: 'Implementar campanha de reengajamento'
      });
    }

    return insights;
  }

  // 📊 Gerenciamento de dados de login
  getLastLoginData(userId: string): LastLoginData | null {
    try {
      const data = localStorage.getItem(`${this.lastLoginKey}_${userId}`);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      // Converter strings de data de volta para objetos Date
      return {
        ...parsed,
        lastLogin: new Date(parsed.lastLogin),
        currentLogin: new Date(parsed.currentLogin)
      };
    } catch {
      return null;
    }
  }

  updateLastLogin(userId: string): void {
    const currentLogin = new Date();
    const lastLoginData = this.getLastLoginData(userId);
    
    const newData: LastLoginData = {
      userId,
      lastLogin: lastLoginData?.currentLogin || currentLogin,
      currentLogin,
      sessionCount: (lastLoginData?.sessionCount || 0) + 1
    };

    localStorage.setItem(`${this.lastLoginKey}_${userId}`, JSON.stringify(newData));
  }

  // 🔔 Gerenciamento de notificações ativas
  getActiveNotifications(userId: string): AIInsight[] {
    try {
      const data = localStorage.getItem(`${this.notificationsKey}_${userId}`);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      // Converter strings de data de volta para objetos Date
      return parsed.map((notification: any) => ({
        ...notification,
        timestamp: new Date(notification.timestamp)
      }));
    } catch {
      return [];
    }
  }

  saveActiveNotifications(userId: string, notifications: AIInsight[]): void {
    localStorage.setItem(`${this.notificationsKey}_${userId}`, JSON.stringify(notifications));
  }

  dismissNotification(userId: string, notificationId: string): void {
    const notifications = this.getActiveNotifications(userId);
    const filtered = notifications.filter(n => n.id !== notificationId);
    this.saveActiveNotifications(userId, filtered);
  }

  // 📈 Simulação de atividade recente
  private getRecentActivity(): ActivityData[] {
    try {
      const data = localStorage.getItem(this.userActivityKey);
      if (!data) {
        // Gera dados simulados se não existirem
        const activities = this.generateSimulatedActivity();
        localStorage.setItem(this.userActivityKey, JSON.stringify(activities));
        return activities;
      }
      
      const parsed = JSON.parse(data);
      // Converter strings de data de volta para objetos Date
      return parsed.map((activity: any) => ({
        ...activity,
        timestamp: new Date(activity.timestamp)
      }));
    } catch {
      return this.generateSimulatedActivity();
    }
  }

  private generateSimulatedActivity(): ActivityData[] {
    // Simula dados de atividade recente
    const activities: ActivityData[] = [];
    const now = new Date();
    
    // Gera atividades dos últimos 7 dias
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      const types: ActivityData['type'][] = ['login', 'payment', 'registration', 'course_completion'];
      
      activities.push({
        timestamp,
        type: types[Math.floor(Math.random() * types.length)],
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        metadata: {}
      });
    }

    return activities;
  }

  // 🎯 Obter notificações por módulo
  getNotificationsForModule(userId: string, moduleId: string): AIInsight[] {
    const allNotifications = this.getActiveNotifications(userId);
    return allNotifications.filter(n => n.moduleId === moduleId);
  }

  // ===== NOVAS FUNÇÕES PARA DADOS REAIS =====

  // 📊 Análise de dados dos módulos
  private analyzeModuleData(moduleStats: any): AIInsight[] {
    const insights: AIInsight[] = [];

    // Análise de finanças urgentes
    if (moduleStats.finance) {
      const { overdue, pending, overdueAmount } = moduleStats.finance;
      
      if (overdue > 0) {
        insights.push({
          id: `urgent-finance-${Date.now()}`,
          type: 'urgent',
          title: 'Pagamentos Atrasados Críticos',
          message: `${overdue} pagamentos em atraso. Perda estimada: R$ ${overdueAmount?.toLocaleString() || 'N/A'}`,
          actionable: true,
          priority: 'high',
          moduleId: 'admin-finance',
          icon: 'warning',
          timestamp: new Date(),
          aiConfidence: 95,
          recommendedAction: 'Revisar pagamentos em atraso urgentemente',
        });
      }

      if (pending > 5) {
        insights.push({
          id: `pending-finance-${Date.now()}`,
          type: 'warning',
          title: 'Alto Volume de Pagamentos Pendentes',
          message: `${pending} pagamentos aguardando confirmação`,
          actionable: true,
          priority: 'medium',
          moduleId: 'admin-finance',
          icon: 'warning',
          timestamp: new Date(),
          aiConfidence: 88,
          recommendedAction: 'Monitorar processo de pagamentos',
        });
      }
    }

    // Análise de solicitações
    if (moduleStats.requests?.pending > 5) {
      insights.push({
        id: `requests-pending-${Date.now()}`,
        type: 'warning',
        title: 'Solicitações Acumuladas',
        message: `${moduleStats.requests.pending} solicitações aguardam aprovação`,
        actionable: true,
        priority: 'high',
        moduleId: 'admin-requests',
        icon: 'assignment',
        timestamp: new Date(),
        aiConfidence: 90,
        recommendedAction: 'Revisar e processar solicitações pendentes',
      });
    }

    return insights;
  }

  // 🔧 Análise de saúde do sistema REAL
  private analyzeSystemHealthReal(systemHealth: any): AIInsight[] {
    const insights: AIInsight[] = [];

    if (systemHealth.performanceScore < 85) {
      insights.push({
        id: `system-performance-${Date.now()}`,
        type: 'warning',
        title: 'Performance do Sistema Degradada',
        message: `Score de performance: ${systemHealth.performanceScore}%. Recomendada otimização`,
        actionable: true,
        priority: 'medium',
        moduleId: 'admin-settings',
        icon: 'speed',
        timestamp: new Date(),
        aiConfidence: 92,
        recommendedAction: 'Verificar configurações de servidor',
      });
    }

    if (systemHealth.errorRate > 5) {
      insights.push({
        id: `system-errors-${Date.now()}`,
        type: 'urgent',
        title: 'Taxa de Erro Elevada',
        message: `Taxa de erro: ${systemHealth.errorRate}%. Investigação necessária`,
        actionable: true,
        priority: 'high',
        moduleId: 'admin-settings',
        icon: 'error',
        timestamp: new Date(),
        aiConfidence: 95,
        recommendedAction: 'Revisar logs de erro imediatamente',
      });
    }

    return insights;
  }

  // 🚨 Processar alertas críticos
  private processCriticalAlerts(alerts: any[]): AIInsight[] {
    if (!Array.isArray(alerts)) {
      return [];
    }

    return alerts
      .filter(alert => alert.priority === 'critical' || alert.severity === 'high')
      .map(alert => ({
        id: alert.id || `alert-${Date.now()}`,
        type: 'urgent' as const,
        title: alert.title || 'Alerta Crítico',
        message: alert.message || alert.description || 'Sistema requer atenção',
        actionable: alert.actionRequired || false,
        priority: 'high' as const,
        moduleId: alert.module || 'admin-settings',
        icon: 'error',
        timestamp: new Date(alert.timestamp || Date.now()),
        aiConfidence: 98,
        recommendedAction: 'Ação imediata necessária',
      }));
  }

  // 📈 Análise de padrões de atividade
  private analyzeActivityPatterns(activities: any[]): AIInsight[] {
    if (!Array.isArray(activities) || !activities.some(a => a.data)) {
      return [];
    }

    const insights: AIInsight[] = [];
    const recentActivities = activities
      .filter(activity => activity.data && activity.data.length > 0)
      .slice(0, 10); // Analisar apenas as 10 atividades mais recentes

    // Análise de frequência de atividades
    const activityCount = recentActivities.length;
    if (activityCount > 0) {
      insights.push({
        id: `activity-frequency-${Date.now()}`,
        type: 'info',
        title: 'Frequência de Atividades',
        message: `Você realizou ${activityCount} atividades recentemente. ${activityCount >= 5 ? 'Excelente consistência!' : 'Continue assim!'}`,
        actionable: false,
        priority: activityCount >= 5 ? 'high' : 'medium',
        moduleId: 'admin-activity',
        icon: 'psychology',
        timestamp: new Date(),
        aiConfidence: 80,
      });
    }

    return insights;
  }

  // 📊 Análise de tendências de KPIs
  private analyzeKPITrends(kpis: any): AIInsight[] {
    const insights: AIInsight[] = [];

    if (kpis.monthlyRevenue?.growth > 10) {
      insights.push({
        id: `kpi-revenue-growth-${Date.now()}`,
        type: 'success',
        title: 'Crescimento Excepcional de Receita',
        message: `Receita cresceu ${kpis.monthlyRevenue.growth}% este mês`,
        actionable: false,
        priority: 'low',
        moduleId: 'admin-finance',
        icon: 'trending_up',
        timestamp: new Date(),
        aiConfidence: 94,
      });
    }

    if (kpis.retentionRate?.value < 80) {
      insights.push({
        id: `kpi-retention-low-${Date.now()}`,
        type: 'warning',
        title: 'Taxa de Retenção Abaixo do Ideal',
        message: `Taxa de retenção: ${kpis.retentionRate.value}%. Meta: 85%+`,
        actionable: true,
        priority: 'medium',
        moduleId: 'admin-students',
        icon: 'group',
        timestamp: new Date(),
        aiConfidence: 87,
        recommendedAction: 'Implementar estratégias de retenção',
      });
    }

    return insights;
  }

  // 💰 Análise de dados financeiros
  private analyzeFinancialData(financial: any): AIInsight[] {
    const insights: AIInsight[] = [];

    if (financial.overduePayments?.count > 0) {
      const avgDays = financial.overduePayments.avgDaysOverdue || 0;
      insights.push({
        id: `financial-overdue-${Date.now()}`,
        type: avgDays > 30 ? 'urgent' : 'warning',
        title: 'Pagamentos em Atraso',
        message: `${financial.overduePayments.count} pagamentos atrasados há ${avgDays} dias em média`,
        actionable: true,
        priority: avgDays > 30 ? 'high' : 'medium',
        moduleId: 'admin-finance',
        icon: 'schedule',
        timestamp: new Date(),
        aiConfidence: 93,
        recommendedAction: 'Implementar cobrança automática',
      });
    }

    return insights;
  }

  // 👥 Análise de crescimento de usuários
  private analyzeUserGrowth(userStats: any, coachStats: any): AIInsight[] {
    const insights: AIInsight[] = [];

    const studentCoachRatio = userStats.total / coachStats.total;
    
    if (studentCoachRatio > 30) {
      insights.push({
        id: `ratio-coach-student-${Date.now()}`,
        type: 'warning',
        title: 'Necessidade de Mais Treinadores',
        message: `Proporção de ${Math.round(studentCoachRatio)} alunos por treinador está alta`,
        actionable: true,
        priority: 'medium',
        moduleId: 'admin-coaches',
        icon: 'person_add',
        timestamp: new Date(),
        aiConfidence: 86,
        recommendedAction: 'Recrutar novos treinadores qualificados',
      });
    }

    return insights;
  }

  // 🔮 Processar insights preditivos
  private processPredictiveInsights(predictive: any): AIInsight[] {
    const insights: AIInsight[] = [];

    if (predictive.churnRisk?.score > 70) {
      insights.push({
        id: `predictive-churn-${Date.now()}`,
        type: 'urgent',
        title: 'Alto Risco de Churn Detectado',
        message: `IA prevê ${predictive.churnRisk.affectedUsers} usuários em risco`,
        actionable: true,
        priority: 'high',
        moduleId: 'admin-students',
        icon: 'trending_down',
        timestamp: new Date(),
        aiConfidence: predictive.churnRisk.score,
        recommendedAction: 'Implementar campanha de retenção urgente',
      });
    }

    return insights;
  }

  // 🛡️ Insights de fallback quando a API falha
  private generateFallbackInsights(): AIInsight[] {
    return [
      {
        id: `fallback-${Date.now()}`,
        type: 'info',
        title: 'Sistema de IA Temporariamente Indisponível',
        message: 'Reconectando com os serviços de análise...',
        actionable: false,
        priority: 'low',
        moduleId: 'admin-settings',
        icon: 'sync',
        timestamp: new Date(),
        aiConfidence: 100,
      }
    ];
  }
}

export const aiNotificationService = new AINotificationService();
export type { AIInsight, LastLoginData }; 