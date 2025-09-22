'use client';

import { useEffect, useCallback, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para gerenciar atualizações em tempo real baseadas em eventos WebSocket
 */
export const useRealtimeUpdates = () => {
  const { user } = useAuth();
  const {
    lastCoachExamResult,
    lastCoachExamAttendanceConfirmed,
    lastCoachTestResult,
    lastCoachTestReport,
    lastStudentExternalExam,
    lastStudentExamRegistration,
    lastStudentTestReportRequest,
  } = useWebSocket();

  // Callbacks para diferentes tipos de atualizações
  const [updateCallbacks, setUpdateCallbacks] = useState<{
    exams?: () => void;
    tests?: () => void;
    examRegistrations?: () => void;
    testResults?: () => void;
  }>({});

  // Registrar callback para atualização de listagens
  const registerUpdateCallback = useCallback((type: 'exams' | 'tests' | 'examRegistrations' | 'testResults', callback: () => void) => {
    setUpdateCallbacks(prev => ({
      ...prev,
      [type]: callback
    }));
  }, []);

  // Limpar callback
  const unregisterUpdateCallback = useCallback((type: 'exams' | 'tests' | 'examRegistrations' | 'testResults') => {
    setUpdateCallbacks(prev => {
      const newCallbacks = { ...prev };
      delete newCallbacks[type];
      return newCallbacks;
    });
  }, []);

  // Efeito para resultado de prova registrado (treinador → aluno)
  useEffect(() => {
    if (lastCoachExamResult && user?.userType === 'FITNESS_STUDENT') {
      updateCallbacks.exams?.();
    }
  }, [lastCoachExamResult, user?.userType, updateCallbacks.exams]);

  // Efeito para presença confirmada (treinador → aluno)
  useEffect(() => {
    if (lastCoachExamAttendanceConfirmed && user?.userType === 'FITNESS_STUDENT') {
      updateCallbacks.exams?.();
    }
  }, [lastCoachExamAttendanceConfirmed, user?.userType, updateCallbacks.exams]);

  // Efeito para resultado de teste registrado (treinador → aluno)
  useEffect(() => {
    if (lastCoachTestResult && user?.userType === 'FITNESS_STUDENT') {
      updateCallbacks.tests?.();
    }
  }, [lastCoachTestResult, user?.userType, updateCallbacks.tests]);

  // Efeito para relatório de teste adicionado (treinador → aluno)
  useEffect(() => {
    if (lastCoachTestReport && user?.userType === 'FITNESS_STUDENT') {
      updateCallbacks.tests?.();
    }
  }, [lastCoachTestReport, user?.userType, updateCallbacks.tests]);

  // Efeito para prova externa criada (aluno → treinador)
  useEffect(() => {
    if (lastStudentExternalExam && user?.userType === 'COACH') {
      updateCallbacks.exams?.();
    }
  }, [lastStudentExternalExam, user?.userType, updateCallbacks.exams]);

  // Efeito para inscrição em prova (aluno → treinador)
  useEffect(() => {
    if (lastStudentExamRegistration && user?.userType === 'COACH') {
      updateCallbacks.examRegistrations?.();
    }
  }, [lastStudentExamRegistration, user?.userType, updateCallbacks.examRegistrations]);

  // Efeito para solicitação de relatório de teste (aluno → treinador)
  useEffect(() => {
    if (lastStudentTestReportRequest && user?.userType === 'COACH') {
      updateCallbacks.tests?.();
    }
  }, [lastStudentTestReportRequest, user?.userType, updateCallbacks.tests]);

  return {
    registerUpdateCallback,
    unregisterUpdateCallback,
  };
};
