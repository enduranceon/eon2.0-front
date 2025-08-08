'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aiNotificationService, AIInsight } from '../services/aiNotificationService';
import { useAuth } from './AuthContext';
import { UserType } from '../types/api';
import { enduranceApi } from '@/services/enduranceApi';
import toast from 'react-hot-toast';

interface AINotificationContextType {
  insights: AIInsight[];
  isLoading: boolean;
  refreshInsights: () => Promise<void>;
  dismissInsight: (insightId: string) => void;
  getInsightsForModule: (moduleId: string) => AIInsight[];
  getModuleNotificationCount: (moduleId: string) => number;
}

const AINotificationContext = createContext<AINotificationContextType | undefined>(undefined);

interface AINotificationProviderProps {
  children: ReactNode;
}

export function AINotificationProvider({ children }: AINotificationProviderProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Inicializar quando usuário estiver disponível e for ADMIN ou COACH
  useEffect(() => {
    if (!user?.id || !user?.userType) return;
    initializeAI();
  }, [user?.id, user?.userType]);

  const initializeAI = async () => {
    try {
      setIsLoading(true);
      
      const userId = user?.id || 'user'; // Em produção, usar o ID real do usuário
      
      // Atualiza último login
      aiNotificationService.updateLastLogin(userId);
      
      // Gera insights inteligentes (admin)
      const adminInsightsPromise = aiNotificationService.generateIntelligentInsights(userId);

      // Busca insights reais do coach quando role = COACH
      const coachInsightsPromise = (async () => {
        if (user?.userType !== UserType.COACH) return [] as AIInsight[];
        try {
          const coachResponse = await enduranceApi.getCoachInsights({ period: '1m' });
          const mapped: AIInsight[] = (coachResponse?.insights || []).map((i) => ({
            id: i.id,
            type: i.impact === 'negative' ? 'warning' : i.impact === 'positive' ? 'success' : 'info',
            title: i.title,
            message: i.summary,
            actionable: true,
            priority: i.priority || 'medium',
            // Mapear para módulos do coach
            moduleId: mapCoachInsightToModuleId(i),
            icon: 'psychology',
            timestamp: new Date(i.createdAt || Date.now()),
            aiConfidence: typeof i.confidence === 'number' ? i.confidence : 80,
            recommendedAction: (i.recommendations && i.recommendations[0]) || undefined,
            data: i,
          }));
          return mapped;
        } catch (e) {
          return [] as AIInsight[];
        }
      })();

      const studentInsightsPromise = (async () => {
        if (user?.userType !== UserType.FITNESS_STUDENT) return [] as AIInsight[];
        try {
          const studentResponse = await enduranceApi.getStudentInsights({ period: '1m' });
          const mapped: AIInsight[] = (studentResponse?.insights || []).map((i) => ({
            id: i.id,
            type: i.impact === 'negative' ? 'warning' : i.impact === 'positive' ? 'success' : 'info',
            title: i.title,
            message: i.summary,
            actionable: true,
            priority: i.priority || 'medium',
            moduleId: mapStudentInsightToModuleId(i),
            icon: 'psychology',
            timestamp: new Date(i.createdAt || Date.now()),
            aiConfidence: typeof i.confidence === 'number' ? i.confidence : 80,
            recommendedAction: (i.recommendations && i.recommendations[0]) || undefined,
            data: i,
          }));
          return mapped;
        } catch (e) {
          return [] as AIInsight[];
        }
      })();

      const [adminInsights, coachInsights, studentInsights] = await Promise.all([
        adminInsightsPromise,
        coachInsightsPromise,
        studentInsightsPromise,
      ]);
      const newInsights = (user?.userType === UserType.COACH)
        ? coachInsights
        : (user?.userType === UserType.FITNESS_STUDENT ? studentInsights : adminInsights);
      
      // Mescla com insights existentes
      const existingInsights = aiNotificationService.getActiveNotifications(userId);
      const mergedInsights = [...existingInsights];
      
      // Adiciona novos insights que não existem
      newInsights.forEach(newInsight => {
        if (!mergedInsights.some(existing => existing.id === newInsight.id)) {
          mergedInsights.push(newInsight);
        }
      });
      
      // Limita a 20 insights ativos
      const limitedInsights = mergedInsights.slice(0, 20);
      
      aiNotificationService.saveActiveNotifications(userId, limitedInsights);
      setInsights(limitedInsights);
      
      // Mostra toast apenas para insights críticos
      const criticalInsights = limitedInsights.filter(i => i.type === 'urgent' && i.priority === 'high');
      if (criticalInsights.length > 0) {
        toast.error(`🤖 IA detectou ${criticalInsights.length} item(s) que precisam de atenção urgente!`, {
          duration: 5000
        });
      }
      
    } catch (err) {
      console.error('Erro ao inicializar IA:', err);
      
      // Em caso de erro, carrega insights básicos do localStorage
      try {
        const userId = user?.id || 'user';
        const savedInsights = aiNotificationService.getActiveNotifications(userId);
        setInsights(savedInsights);
      } catch (fallbackErr) {
        console.error('Erro ao carregar insights salvos:', fallbackErr);
        setInsights([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  function mapCoachInsightToModuleId(i: any): string {
    // Heurística simples para mapear categorias de insight do coach para módulos do menu do coach
    const title = (i?.title || '').toLowerCase();
    const type = (i?.type || '').toLowerCase();
    if (title.includes('ganho') || title.includes('finance') || type.includes('financial')) return 'financial';
    if (title.includes('teste') || type.includes('tests')) return 'coach-gerenciar-testes';
    if (title.includes('prova') || title.includes('inscrição') || type.includes('exam')) return 'coach-participantes';
    if (title.includes('aluno') || type.includes('students') || type.includes('alunos')) return 'my-clients';
    if (title.includes('modalidade') || type.includes('modalidades')) return 'coach-modalidades';
    if (title.includes('plano') || type.includes('plans')) return 'coach-planos';
    return 'dashboard-coach';
  }

  function mapStudentInsightToModuleId(i: any): string {
    const title = (i?.title || '').toLowerCase();
    const type = (i?.type || '').toLowerCase();
    if (title.includes('pagamento') || type.includes('payments')) return 'student-payments';
    if (title.includes('teste') || type.includes('tests')) return 'student-tests';
    if (title.includes('prova') || title.includes('inscrição') || type.includes('exams')) return 'student-events';
    if (title.includes('plano') || type.includes('plan')) return 'student-plan';
    if (title.includes('treinador') || type.includes('coach')) return 'student-coach';
    return 'dashboard-student';
  }

  const refreshInsights = async () => {
    await initializeAI();
  };

  const dismissInsight = (insightId: string) => {
    const userId = user?.id || 'admin_user';
    
    // Remover localmente
    const updatedInsights = insights.filter(insight => insight.id !== insightId);
    setInsights(updatedInsights);
    
    // Remover do localStorage
    aiNotificationService.dismissNotification(userId, insightId);
    
    toast.success('Insight removido');
  };

  const getInsightsForModule = (moduleId: string): AIInsight[] => {
    return insights.filter(insight => insight.moduleId === moduleId);
  };

  const getModuleNotificationCount = (moduleId: string): number => {
    return getInsightsForModule(moduleId).length;
  };

  const value: AINotificationContextType = {
    insights,
    isLoading,
    refreshInsights,
    dismissInsight,
    getInsightsForModule,
    getModuleNotificationCount,
  };

  return (
    <AINotificationContext.Provider value={value}>
      {children}
    </AINotificationContext.Provider>
  );
}

export function useAINotifications() {
  const context = useContext(AINotificationContext);
  if (context === undefined) {
    throw new Error('useAINotifications must be used within an AINotificationProvider');
  }
  return context;
} 