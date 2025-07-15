'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aiNotificationService, AIInsight } from '../services/aiNotificationService';
import { useAuth } from './AuthContext';
import { UserType } from '../types/api';
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

  // Inicializar quando usuário estiver disponível E for admin
  useEffect(() => {
    if (user?.id && user?.userType === UserType.ADMIN) {
      initializeAI();
    }
  }, [user?.id, user?.userType]);

  const initializeAI = async () => {
    try {
      setIsLoading(true);
      
      const userId = user?.id || 'admin_user'; // Em produção, usar o ID real do usuário
      
      // Atualiza último login
      aiNotificationService.updateLastLogin(userId);
      
      // Gera insights inteligentes
      const newInsights = await aiNotificationService.generateIntelligentInsights(userId);
      
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
        const userId = user?.id || 'admin_user';
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