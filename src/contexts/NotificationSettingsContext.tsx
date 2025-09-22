'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { enduranceApi } from '../services/enduranceApi';
import {
  NotificationSettings,
  CreateNotificationSettingsRequest,
  UpdateNotificationSettingsRequest,
  DEFAULT_STUDENT_NOTIFICATION_SETTINGS,
  DEFAULT_COACH_NOTIFICATION_SETTINGS,
  DEFAULT_ADMIN_NOTIFICATION_SETTINGS,
} from '../types/api';

interface NotificationSettingsContextType {
  settings: NotificationSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Métodos
  loadSettings: () => Promise<void>;
  saveSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  updateSetting: (key: string, value: boolean) => void;
  
  // Métodos auxiliares
  isNotificationEnabled: (eventType: string) => boolean;
  isSoundEnabled: () => boolean;
  isDesktopEnabled: () => boolean;
  isEmailEnabled: () => boolean;
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType>({
  settings: null,
  isLoading: false,
  isSaving: false,
  error: null,
  loadSettings: async () => {},
  saveSettings: async () => {},
  resetToDefaults: async () => {},
  updateSetting: () => {},
  isNotificationEnabled: () => true,
  isSoundEnabled: () => true,
  isDesktopEnabled: () => true,
  isEmailEnabled: () => true,
});

export const useNotificationSettings = () => useContext(NotificationSettingsContext);

interface NotificationSettingsProviderProps {
  children: React.ReactNode;
}

export const NotificationSettingsProvider: React.FC<NotificationSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isAuthenticated } = useAuth();

  // Obter configurações padrão baseadas no tipo de usuário
  const getDefaultSettings = useCallback((): NotificationSettings => {
    if (!user) return DEFAULT_STUDENT_NOTIFICATION_SETTINGS;
    
    const defaultSettings = {
      [DEFAULT_STUDENT_NOTIFICATION_SETTINGS.userType]: DEFAULT_STUDENT_NOTIFICATION_SETTINGS,
      [DEFAULT_COACH_NOTIFICATION_SETTINGS.userType]: DEFAULT_COACH_NOTIFICATION_SETTINGS,
      [DEFAULT_ADMIN_NOTIFICATION_SETTINGS.userType]: DEFAULT_ADMIN_NOTIFICATION_SETTINGS,
    }[user.userType] || DEFAULT_STUDENT_NOTIFICATION_SETTINGS;
    
    return {
      ...defaultSettings,
      id: '',
      userId: user.id,
    };
  }, [user]);

  // Carregar configurações do servidor
  const loadSettings = useCallback(async () => {
    if (!user || !isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await enduranceApi.get(`/notification-settings/user/${user.id}`);
      
      if (response.data.success) {
        setSettings(response.data.data);
      } else {
        // Se não existir configurações, usar padrões localmente
        const defaultSettings = getDefaultSettings();
        setSettings(defaultSettings);
      }
    } catch (error: any) {
      console.warn('Endpoint de configurações não disponível, usando configurações padrão localmente:', error.message);
      
      // Se a API não estiver disponível, usar padrões localmente
      const defaultSettings = getDefaultSettings();
      setSettings(defaultSettings);
      
      // Não mostrar erro para o usuário se for apenas que a API não existe ainda
      if (error.response?.status === 404) {
        console.info('Sistema de configurações funcionando em modo offline');
      } else {
        setError('Erro ao carregar configurações. Usando configurações padrão.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, getDefaultSettings]);

  // Criar novas configurações
  const createSettings = useCallback(async (newSettings: NotificationSettings) => {
    if (!user) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const requestData: CreateNotificationSettingsRequest = {
        enabled: newSettings.enabled,
        soundEnabled: newSettings.soundEnabled,
        desktopEnabled: newSettings.desktopEnabled,
        emailEnabled: newSettings.emailEnabled,
        studentSettings: newSettings.studentSettings,
        coachSettings: newSettings.coachSettings,
        adminSettings: newSettings.adminSettings,
      };
      
      const response = await enduranceApi.post('/notification-settings', requestData);
      
      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Configurações de notificações criadas com sucesso!');
      } else {
        throw new Error(response.data.message || 'Erro ao criar configurações');
      }
    } catch (error: any) {
      console.warn('API não disponível, salvando configurações localmente:', error.message);
      
      // Funcionar offline - apenas atualizar o estado local
      const settingsWithId = {
        ...newSettings,
        id: `local_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setSettings(settingsWithId);
      
      if (error.response?.status === 404) {
        toast.info('Configurações salvas localmente (API em desenvolvimento)');
      } else {
        setError(error.message || 'Erro ao criar configurações');
        toast.error('Erro ao criar configurações de notificações');
      }
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  // Salvar configurações
  const saveSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!settings || !user) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const requestData: UpdateNotificationSettingsRequest = {
        id: settings.id,
        enabled: newSettings.enabled,
        soundEnabled: newSettings.soundEnabled,
        desktopEnabled: newSettings.desktopEnabled,
        emailEnabled: newSettings.emailEnabled,
        studentSettings: newSettings.studentSettings,
        coachSettings: newSettings.coachSettings,
        adminSettings: newSettings.adminSettings,
      };
      
      const response = await enduranceApi.put(`/notification-settings/${settings.id}`, requestData);
      
      if (response.data.success) {
        setSettings(response.data.data);
        toast.success('Configurações salvas com sucesso!');
      } else {
        throw new Error(response.data.message || 'Erro ao salvar configurações');
      }
    } catch (error: any) {
      console.warn('API não disponível, salvando configurações localmente:', error.message);
      
      // Funcionar offline - apenas atualizar o estado local
      const updatedSettings = {
        ...settings,
        ...newSettings,
        updatedAt: new Date().toISOString(),
      };
      
      setSettings(updatedSettings);
      
      if (error.response?.status === 404) {
        toast.success('Configurações salvas localmente (API em desenvolvimento)');
      } else {
        setError(error.message || 'Erro ao salvar configurações');
        toast.error('Erro ao salvar configurações de notificações');
      }
    } finally {
      setIsSaving(false);
    }
  }, [settings, user]);

  // Resetar para configurações padrão
  const resetToDefaults = useCallback(async () => {
    if (!user) return;
    
    const defaultSettings = getDefaultSettings();
    
    if (!settings || !settings.id) {
      // Criar novas configurações
      await createSettings(defaultSettings);
    } else {
      // Atualizar configurações existentes
      await saveSettings(defaultSettings);
    }
  }, [user, settings, getDefaultSettings, createSettings, saveSettings]);

  // Atualizar uma configuração específica
  const updateSetting = useCallback((key: string, value: boolean) => {
    if (!settings) return;
    
    const newSettings = { ...settings };
    
    // Atualizar configurações gerais
    if (key === 'enabled' || key === 'soundEnabled' || key === 'desktopEnabled' || key === 'emailEnabled') {
      newSettings[key] = value;
    }
    
    // Atualizar configurações específicas por tipo de usuário
    if (key.startsWith('studentSettings.')) {
      const settingKey = key.replace('studentSettings.', '') as keyof NonNullable<NotificationSettings['studentSettings']>;
      if (newSettings.studentSettings) {
        newSettings.studentSettings[settingKey] = value;
      }
    }
    
    if (key.startsWith('coachSettings.')) {
      const settingKey = key.replace('coachSettings.', '') as keyof NonNullable<NotificationSettings['coachSettings']>;
      if (newSettings.coachSettings) {
        newSettings.coachSettings[settingKey] = value;
      }
    }
    
    if (key.startsWith('adminSettings.')) {
      const settingKey = key.replace('adminSettings.', '') as keyof NonNullable<NotificationSettings['adminSettings']>;
      if (newSettings.adminSettings) {
        newSettings.adminSettings[settingKey] = value;
      }
    }
    
    if (key.startsWith('adminSettings.asaasWebhookTypes.')) {
      const settingKey = key.replace('adminSettings.asaasWebhookTypes.', '') as keyof NonNullable<NotificationSettings['adminSettings']>['asaasWebhookTypes'];
      if (newSettings.adminSettings?.asaasWebhookTypes) {
        newSettings.adminSettings.asaasWebhookTypes[settingKey] = value;
      }
    }
    
    setSettings(newSettings);
    
    // Salvar automaticamente após 500ms de inatividade
    setTimeout(() => {
      saveSettings(newSettings);
    }, 500);
  }, [settings, saveSettings]);

  // Verificar se uma notificação específica está habilitada
  const isNotificationEnabled = useCallback((eventType: string): boolean => {
    if (!settings || !settings.enabled) return false;
    
    // Verificar configurações específicas por tipo de usuário
    if (settings.studentSettings) {
      switch (eventType) {
        case 'coach:exam-result:registered':
          return settings.studentSettings.examResultRegistered;
        case 'coach:test-result:registered':
          return settings.studentSettings.testResultRegistered;
        case 'coach:test-report:added':
          return settings.studentSettings.testReportAdded;
        case 'coach:student-status:changed':
          return settings.studentSettings.studentStatusChanged;
        case 'coach:student-data:updated':
          return settings.studentSettings.studentDataUpdated;
      }
    }
    
    if (settings.coachSettings) {
      switch (eventType) {
        case 'student:external-exam:created':
          return settings.coachSettings.externalExamCreated;
        case 'student:exam:registered':
          return settings.coachSettings.examRegistered;
        case 'student:test-report:requested':
          return settings.coachSettings.testReportRequested;
        case 'student:subscription:created':
          return settings.coachSettings.subscriptionCreated;
        case 'student:feature:purchased':
          return settings.coachSettings.featurePurchased;
        case 'student:plan:cancelled':
          return settings.coachSettings.planCancelled;
      }
    }
    
    if (settings.adminSettings) {
      switch (eventType) {
        case 'admin:user:registered':
          return settings.adminSettings.userRegistered;
        case 'admin:subscription:created':
          return settings.adminSettings.subscriptionCreated;
        case 'admin:leave:requested':
          return settings.adminSettings.leaveRequested;
        case 'admin:plan:changed':
          return settings.adminSettings.planChanged;
        case 'admin:cancellation:requested':
          return settings.adminSettings.cancellationRequested;
        case 'admin:asaas:webhook':
          return settings.adminSettings.asaasWebhook;
      }
    }
    
    // Para eventos de webhook Asaas específicos
    if (eventType === 'admin:asaas:webhook' && settings.adminSettings?.asaasWebhookTypes) {
      // Esta verificação será feita no contexto WebSocket com os dados específicos do evento
      return settings.adminSettings.asaasWebhook;
    }
    
    return true; // Por padrão, permitir se não especificado
  }, [settings]);

  // Verificar se som está habilitado
  const isSoundEnabled = useCallback((): boolean => {
    return settings?.soundEnabled ?? true;
  }, [settings]);

  // Verificar se notificações desktop estão habilitadas
  const isDesktopEnabled = useCallback((): boolean => {
    return settings?.desktopEnabled ?? true;
  }, [settings]);

  // Verificar se email está habilitado
  const isEmailEnabled = useCallback((): boolean => {
    return settings?.emailEnabled ?? false;
  }, [settings]);

  // Carregar configurações quando o usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSettings();
    } else {
      setSettings(null);
    }
  }, [isAuthenticated, user, loadSettings]);

  const value: NotificationSettingsContextType = {
    settings,
    isLoading,
    isSaving,
    error,
    loadSettings,
    saveSettings,
    resetToDefaults,
    updateSetting,
    isNotificationEnabled,
    isSoundEnabled,
    isDesktopEnabled,
    isEmailEnabled,
  };

  return (
    <NotificationSettingsContext.Provider value={value}>
      {children}
    </NotificationSettingsContext.Provider>
  );
};
