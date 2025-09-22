import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useNotificationSettings } from '../contexts/NotificationSettingsContext';
import { useStoredNotifications } from '../contexts/StoredNotificationsContext';
import {
  CoachExamResultRegisteredEvent,
  CoachExamAttendanceConfirmedEvent,
  CoachTestResultRegisteredEvent,
  CoachTestReportAddedEvent,
  CoachStudentStatusChangedEvent,
  CoachStudentDataUpdatedEvent
} from '../types/api';

/**
 * Hook especializado para notificações de alunos
 * Escuta eventos enviados pelos treinadores para os alunos
 */
export const useStudentNotifications = () => {
  const { user } = useAuth();
  const {
    isConnected,
    socket,
    lastCoachExamResult,
    lastCoachExamAttendanceConfirmed,
    lastCoachTestResult,
    lastCoachTestReport,
    lastCoachStudentStatusChange,
    lastCoachStudentDataUpdate
  } = useWebSocket();
  const { isNotificationEnabled, isSoundEnabled } = useNotificationSettings();
  const { createWebSocketNotification } = useStoredNotifications();

  // Handler para resultado de prova registrado
  const handleExamResultRegistered = useCallback((data: CoachExamResultRegisteredEvent) => {
    if (data.userId === user?.id) {
      // Formatar resultado baseado nos campos disponíveis
      const resultParts = [];
      if (data.timeSeconds) {
        const hours = Math.floor(data.timeSeconds / 3600);
        const minutes = Math.floor((data.timeSeconds % 3600) / 60);
        const seconds = data.timeSeconds % 60;
        resultParts.push(`Tempo: ${hours}h${minutes.toString().padStart(2, '0')}m${seconds.toString().padStart(2, '0')}s`);
      }
      if (data.generalRank) resultParts.push(`Geral: ${data.generalRank}º`);
      if (data.categoryRank) resultParts.push(`Categoria: ${data.categoryRank}º`);
      
      const resultText = resultParts.length > 0 ? resultParts.join(', ') : 'Resultado registrado';
      
      // Armazenar notificação
      createWebSocketNotification(
        'coach:exam-result:registered',
        `${data.coachName} registrou resultado da prova`,
        `Prova "${data.examName}" - ${resultText}`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('coach:exam-result:registered')) {
        toast.success(`✅ ${data.coachName} registrou resultado da prova: ${data.examName}`, {
          duration: 5000,
          position: 'top-right',
          description: resultText,
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para presença em prova confirmada
  const handleExamAttendanceConfirmed = useCallback((data: CoachExamAttendanceConfirmedEvent) => {
    if (data.userId === user?.id) {
      // Armazenar notificação
      createWebSocketNotification(
        'coach:exam-attendance:confirmed',
        `${data.coachName} confirmou sua presença na prova`,
        `Prova "${data.examName}" - ${new Date(data.examDate).toLocaleDateString('pt-BR')}`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('coach:exam-attendance:confirmed')) {
        toast.success(`✅ ${data.coachName} confirmou sua presença na prova: ${data.examName}`, {
          duration: 5000,
          position: 'top-right',
          description: `Data: ${new Date(data.examDate).toLocaleDateString('pt-BR')}`,
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para resultado de teste registrado
  const handleTestResultRegistered = useCallback((data: CoachTestResultRegisteredEvent) => {
    if (data.userId === user?.id) {
      // Armazenar notificação
      createWebSocketNotification(
        'coach:test-result:registered',
        `${data.coachName} registrou resultado do teste`,
        `Teste "${data.testName}" - ${data.notes || 'Confira os detalhes na área de testes'}`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('coach:test-result:registered')) {
        toast.success(`📊 ${data.coachName} registrou resultado do teste: ${data.testName}`, {
          duration: 5000,
          position: 'top-right',
          description: data.notes || 'Confira os detalhes na área de testes',
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para relatório de teste adicionado
  const handleTestReportAdded = useCallback((data: CoachTestReportAddedEvent) => {
    if (data.userId === user?.id) {
      // Armazenar notificação
      createWebSocketNotification(
        'coach:test-report:added',
        `${data.coachName} adicionou relatório do teste`,
        `Relatório do teste "${data.testName}" está disponível`,
        { ...data, actionUrl: data.reportUrl, actionLabel: 'Ver Relatório' }
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('coach:test-report:added')) {
        toast.info(`📄 ${data.coachName} adicionou relatório do teste: ${data.testName}`, {
          duration: 6000,
          position: 'top-right',
          description: 'Clique para visualizar o relatório',
          action: {
            label: 'Ver Relatório',
            onClick: () => window.open(data.reportUrl, '_blank')
          },
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para alteração de status
  const handleStatusChanged = useCallback((data: CoachStudentStatusChangedEvent) => {
    if (data.userId === user?.id) {
      const statusText = data.newStatus ? 'ativou' : 'desativou';
      
      // Armazenar notificação
      createWebSocketNotification(
        'coach:student-status:changed',
        `${data.coachName} ${statusText} sua conta`,
        data.reason || 'Alteração de status da conta',
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('coach:student-status:changed')) {
        const emoji = data.newStatus ? '✅' : '⚠️';
        const toastType = data.newStatus ? 'success' : 'warning';
        
        toast[toastType](`${emoji} ${data.coachName} ${statusText} sua conta`, {
          duration: 5000,
          position: 'top-right',
          description: data.reason || 'Alteração de status da conta',
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Handler para dados atualizados
  const handleDataUpdated = useCallback((data: CoachStudentDataUpdatedEvent) => {
    if (data.userId === user?.id) {
      const fieldsText = data.updatedFields.join(', ');
      
      // Armazenar notificação
      createWebSocketNotification(
        'coach:student-data:updated',
        `${data.coachName} atualizou seus dados`,
        `Campos alterados: ${fieldsText}`,
        data
      );
      
      // Mostrar toast se habilitado
      if (isNotificationEnabled('coach:student-data:updated')) {
        toast.info(`✏️ ${data.coachName} atualizou seus dados`, {
          duration: 4000,
          position: 'top-right',
          description: `Campos alterados: ${fieldsText}`,
          ...(isSoundEnabled() && { important: true })
        });
      }
    }
  }, [user?.id, isNotificationEnabled, isSoundEnabled, createWebSocketNotification]);

  // Efeitos para escutar mudanças de estado do WebSocketContext
  useEffect(() => {
    if (lastCoachExamResult && user?.userType === 'FITNESS_STUDENT') {
      handleExamResultRegistered(lastCoachExamResult);
    }
  }, [lastCoachExamResult, handleExamResultRegistered, user?.userType]);

  useEffect(() => {
    if (lastCoachExamAttendanceConfirmed && user?.userType === 'FITNESS_STUDENT') {
      handleExamAttendanceConfirmed(lastCoachExamAttendanceConfirmed);
    }
  }, [lastCoachExamAttendanceConfirmed, handleExamAttendanceConfirmed, user?.userType]);

  useEffect(() => {
    if (lastCoachTestResult && user?.userType === 'FITNESS_STUDENT') {
      handleTestResultRegistered(lastCoachTestResult);
    }
  }, [lastCoachTestResult, handleTestResultRegistered, user?.userType]);

  useEffect(() => {
    if (lastCoachTestReport && user?.userType === 'FITNESS_STUDENT') {
      handleTestReportAdded(lastCoachTestReport);
    }
  }, [lastCoachTestReport, handleTestReportAdded, user?.userType]);

  useEffect(() => {
    if (lastCoachStudentStatusChange && user?.userType === 'FITNESS_STUDENT') {
      handleStatusChanged(lastCoachStudentStatusChange);
    }
  }, [lastCoachStudentStatusChange, handleStatusChanged, user?.userType]);

  useEffect(() => {
    if (lastCoachStudentDataUpdate && user?.userType === 'FITNESS_STUDENT') {
      handleDataUpdated(lastCoachStudentDataUpdate);
    }
  }, [lastCoachStudentDataUpdate, handleDataUpdated, user?.userType]);

  return {
    // Estados de conectividade
    isConnected,
    isStudent: user?.userType === 'FITNESS_STUDENT',
    
    // Últimos eventos recebidos
    lastCoachExamResult,
    lastCoachTestResult,
    lastCoachTestReport,
    lastCoachStudentStatusChange,
    lastCoachStudentDataUpdate,

    // Métodos para ações manuais
    onExamResult: handleExamResultRegistered,
    onTestResult: handleTestResultRegistered,
    onTestReport: handleTestReportAdded,
    onStatusChange: handleStatusChanged,
    onDataUpdate: handleDataUpdated,
  };
};
