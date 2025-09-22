import { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ExamResultRegisteredEvent,
  TestResultRegisteredEvent,
  NewExamCreatedEvent,
  PlanChangeEvent,
  StudentAccountCreatedEvent,
  LeaveRequestEvent,
  // Novos eventos Aluno → Treinador
  StudentExternalExamCreatedEvent,
  StudentExamRegisteredEvent,
  StudentTestReportRequestedEvent,
  StudentSubscriptionCreatedEvent,
  StudentFeaturePurchasedEvent,
  StudentPlanCancelledEvent,
  // Novos eventos Treinador → Aluno
  CoachExamResultRegisteredEvent,
  CoachTestResultRegisteredEvent,
  CoachTestReportAddedEvent,
  CoachStudentStatusChangedEvent,
  CoachStudentDataUpdatedEvent,
  // Novos eventos Sistema → Administrador
  AdminUserRegisteredEvent,
  AdminSubscriptionCreatedEvent,
  AdminLeaveRequestedEvent,
  AdminPlanChangedEvent,
  AdminCancellationRequestedEvent,
  AdminAsaasWebhookEvent
} from '../types/api';

/**
 * Hook personalizado para facilitar o uso dos novos eventos WebSocket
 * Fornece métodos convenientes para escutar eventos específicos
 */
export const useWebSocketEvents = () => {
  const { user } = useAuth();
  const {
    isConnected,
    socket,
    // Eventos existentes
    lastExamResult,
    lastTestResult,
    lastNewExam,
    lastPlanChange,
    lastStudentAccount,
    lastLeaveRequest,
    // Novos eventos Aluno → Treinador
    lastStudentExternalExam,
    lastStudentExamRegistration,
    lastStudentTestReportRequest,
    lastStudentSubscription,
    lastStudentFeaturePurchase,
    lastStudentPlanCancellation,
    // Novos eventos Treinador → Aluno
    lastCoachExamResult,
    lastCoachTestResult,
    lastCoachTestReport,
    lastCoachStudentStatusChange,
    lastCoachStudentDataUpdate,
    // Novos eventos Sistema → Administrador
    lastAdminUserRegistration,
    lastAdminSubscription,
    lastAdminLeaveRequest,
    lastAdminPlanChange,
    lastAdminCancellationRequest,
    lastAdminAsaasWebhook
  } = useWebSocket();

  // Estados para eventos existentes do usuário atual
  const [userExamResults, setUserExamResults] = useState<ExamResultRegisteredEvent[]>([]);
  const [userTestResults, setUserTestResults] = useState<TestResultRegisteredEvent[]>([]);
  const [userNewExams, setUserNewExams] = useState<NewExamCreatedEvent[]>([]);
  const [userPlanChanges, setUserPlanChanges] = useState<PlanChangeEvent[]>([]);
  const [userLeaveRequests, setUserLeaveRequests] = useState<LeaveRequestEvent[]>([]);

  // Novos estados para eventos Aluno → Treinador
  const [studentExternalExams, setStudentExternalExams] = useState<StudentExternalExamCreatedEvent[]>([]);
  const [studentExamRegistrations, setStudentExamRegistrations] = useState<StudentExamRegisteredEvent[]>([]);
  const [studentTestReportRequests, setStudentTestReportRequests] = useState<StudentTestReportRequestedEvent[]>([]);
  const [studentSubscriptions, setStudentSubscriptions] = useState<StudentSubscriptionCreatedEvent[]>([]);
  const [studentFeaturePurchases, setStudentFeaturePurchases] = useState<StudentFeaturePurchasedEvent[]>([]);
  const [studentPlanCancellations, setStudentPlanCancellations] = useState<StudentPlanCancelledEvent[]>([]);

  // Novos estados para eventos Treinador → Aluno
  const [coachExamResults, setCoachExamResults] = useState<CoachExamResultRegisteredEvent[]>([]);
  const [coachTestResults, setCoachTestResults] = useState<CoachTestResultRegisteredEvent[]>([]);
  const [coachTestReports, setCoachTestReports] = useState<CoachTestReportAddedEvent[]>([]);
  const [coachStudentStatusChanges, setCoachStudentStatusChanges] = useState<CoachStudentStatusChangedEvent[]>([]);
  const [coachStudentDataUpdates, setCoachStudentDataUpdates] = useState<CoachStudentDataUpdatedEvent[]>([]);

  // Novos estados para eventos Sistema → Administrador
  const [adminUserRegistrations, setAdminUserRegistrations] = useState<AdminUserRegisteredEvent[]>([]);
  const [adminSubscriptions, setAdminSubscriptions] = useState<AdminSubscriptionCreatedEvent[]>([]);
  const [adminLeaveRequests, setAdminLeaveRequests] = useState<AdminLeaveRequestedEvent[]>([]);
  const [adminPlanChanges, setAdminPlanChanges] = useState<AdminPlanChangedEvent[]>([]);
  const [adminCancellationRequests, setAdminCancellationRequests] = useState<AdminCancellationRequestedEvent[]>([]);
  const [adminAsaasWebhooks, setAdminAsaasWebhooks] = useState<AdminAsaasWebhookEvent[]>([]);

  // Estados para eventos de treinador (existentes)
  const [coachExamResultsLegacy, setCoachExamResultsLegacy] = useState<ExamResultRegisteredEvent[]>([]);
  const [coachTestResultsLegacy, setCoachTestResultsLegacy] = useState<TestResultRegisteredEvent[]>([]);
  const [coachNewExams, setCoachNewExams] = useState<NewExamCreatedEvent[]>([]);
  const [coachPlanChanges, setCoachPlanChanges] = useState<PlanChangeEvent[]>([]);
  const [coachStudentAccounts, setCoachStudentAccounts] = useState<StudentAccountCreatedEvent[]>([]);
  const [coachLeaveRequests, setCoachLeaveRequests] = useState<LeaveRequestEvent[]>([]);

  // Adicionar novos eventos às listas quando recebidos
  useEffect(() => {
    if (lastExamResult && lastExamResult.userId === user?.id) {
      setUserExamResults(prev => [lastExamResult, ...prev.slice(0, 9)]); // Manter últimos 10
    }
  }, [lastExamResult, user?.id]);

  useEffect(() => {
    if (lastTestResult && lastTestResult.userId === user?.id) {
      setUserTestResults(prev => [lastTestResult, ...prev.slice(0, 9)]);
    }
  }, [lastTestResult, user?.id]);

  useEffect(() => {
    if (lastNewExam && lastNewExam.students.includes(user?.id || '')) {
      setUserNewExams(prev => [lastNewExam, ...prev.slice(0, 9)]);
    }
  }, [lastNewExam, user?.id]);

  useEffect(() => {
    if (lastPlanChange && lastPlanChange.userId === user?.id) {
      setUserPlanChanges(prev => [lastPlanChange, ...prev.slice(0, 9)]);
    }
  }, [lastPlanChange, user?.id]);

  useEffect(() => {
    if (lastLeaveRequest && lastLeaveRequest.userId === user?.id) {
      setUserLeaveRequests(prev => [lastLeaveRequest, ...prev.slice(0, 9)]);
    }
  }, [lastLeaveRequest, user?.id]);

  // ===== NOVOS USEEFFECTS PARA EVENTOS ALUNO → TREINADOR =====
  
  useEffect(() => {
    if (lastStudentExternalExam && user?.userType === 'COACH') {
      setStudentExternalExams(prev => [lastStudentExternalExam, ...prev.slice(0, 9)]);
    }
  }, [lastStudentExternalExam, user?.userType]);

  useEffect(() => {
    if (lastStudentExamRegistration && user?.userType === 'COACH') {
      setStudentExamRegistrations(prev => [lastStudentExamRegistration, ...prev.slice(0, 9)]);
    }
  }, [lastStudentExamRegistration, user?.userType]);

  useEffect(() => {
    if (lastStudentTestReportRequest && user?.userType === 'COACH') {
      setStudentTestReportRequests(prev => [lastStudentTestReportRequest, ...prev.slice(0, 9)]);
    }
  }, [lastStudentTestReportRequest, user?.userType]);

  useEffect(() => {
    if (lastStudentSubscription && user?.userType === 'COACH') {
      setStudentSubscriptions(prev => [lastStudentSubscription, ...prev.slice(0, 9)]);
    }
  }, [lastStudentSubscription, user?.userType]);

  useEffect(() => {
    if (lastStudentFeaturePurchase && user?.userType === 'COACH') {
      setStudentFeaturePurchases(prev => [lastStudentFeaturePurchase, ...prev.slice(0, 9)]);
    }
  }, [lastStudentFeaturePurchase, user?.userType]);

  useEffect(() => {
    if (lastStudentPlanCancellation && user?.userType === 'COACH') {
      setStudentPlanCancellations(prev => [lastStudentPlanCancellation, ...prev.slice(0, 9)]);
    }
  }, [lastStudentPlanCancellation, user?.userType]);

  // ===== NOVOS USEEFFECTS PARA EVENTOS TREINADOR → ALUNO =====
  
  useEffect(() => {
    if (lastCoachExamResult && lastCoachExamResult.userId === user?.id) {
      setCoachExamResults(prev => [lastCoachExamResult, ...prev.slice(0, 9)]);
    }
  }, [lastCoachExamResult, user?.id]);

  useEffect(() => {
    if (lastCoachTestResult && lastCoachTestResult.userId === user?.id) {
      setCoachTestResults(prev => [lastCoachTestResult, ...prev.slice(0, 9)]);
    }
  }, [lastCoachTestResult, user?.id]);

  useEffect(() => {
    if (lastCoachTestReport && lastCoachTestReport.userId === user?.id) {
      setCoachTestReports(prev => [lastCoachTestReport, ...prev.slice(0, 9)]);
    }
  }, [lastCoachTestReport, user?.id]);

  useEffect(() => {
    if (lastCoachStudentStatusChange && lastCoachStudentStatusChange.userId === user?.id) {
      setCoachStudentStatusChanges(prev => [lastCoachStudentStatusChange, ...prev.slice(0, 9)]);
    }
  }, [lastCoachStudentStatusChange, user?.id]);

  useEffect(() => {
    if (lastCoachStudentDataUpdate && lastCoachStudentDataUpdate.userId === user?.id) {
      setCoachStudentDataUpdates(prev => [lastCoachStudentDataUpdate, ...prev.slice(0, 9)]);
    }
  }, [lastCoachStudentDataUpdate, user?.id]);

  // ===== NOVOS USEEFFECTS PARA EVENTOS SISTEMA → ADMINISTRADOR =====
  
  useEffect(() => {
    if (lastAdminUserRegistration && user?.userType === 'ADMIN') {
      setAdminUserRegistrations(prev => [lastAdminUserRegistration, ...prev.slice(0, 9)]);
    }
  }, [lastAdminUserRegistration, user?.userType]);

  useEffect(() => {
    if (lastAdminSubscription && user?.userType === 'ADMIN') {
      setAdminSubscriptions(prev => [lastAdminSubscription, ...prev.slice(0, 9)]);
    }
  }, [lastAdminSubscription, user?.userType]);

  useEffect(() => {
    if (lastAdminLeaveRequest && user?.userType === 'ADMIN') {
      setAdminLeaveRequests(prev => [lastAdminLeaveRequest, ...prev.slice(0, 9)]);
    }
  }, [lastAdminLeaveRequest, user?.userType]);

  useEffect(() => {
    if (lastAdminPlanChange && user?.userType === 'ADMIN') {
      setAdminPlanChanges(prev => [lastAdminPlanChange, ...prev.slice(0, 9)]);
    }
  }, [lastAdminPlanChange, user?.userType]);

  useEffect(() => {
    if (lastAdminCancellationRequest && user?.userType === 'ADMIN') {
      setAdminCancellationRequests(prev => [lastAdminCancellationRequest, ...prev.slice(0, 9)]);
    }
  }, [lastAdminCancellationRequest, user?.userType]);

  useEffect(() => {
    if (lastAdminAsaasWebhook && user?.userType === 'ADMIN') {
      setAdminAsaasWebhooks(prev => [lastAdminAsaasWebhook, ...prev.slice(0, 9)]);
    }
  }, [lastAdminAsaasWebhook, user?.userType]);

  // Eventos para treinadores (existentes)
  useEffect(() => {
    if (lastExamResult && user?.userType === 'COACH') {
      setCoachExamResultsLegacy(prev => [lastExamResult, ...prev.slice(0, 9)]);
    }
  }, [lastExamResult, user?.userType]);

  useEffect(() => {
    if (lastTestResult && user?.userType === 'COACH') {
      setCoachTestResultsLegacy(prev => [lastTestResult, ...prev.slice(0, 9)]);
    }
  }, [lastTestResult, user?.userType]);

  useEffect(() => {
    if (lastNewExam && user?.userType === 'COACH') {
      setCoachNewExams(prev => [lastNewExam, ...prev.slice(0, 9)]);
    }
  }, [lastNewExam, user?.userType]);

  useEffect(() => {
    if (lastPlanChange && user?.userType === 'COACH') {
      setCoachPlanChanges(prev => [lastPlanChange, ...prev.slice(0, 9)]);
    }
  }, [lastPlanChange, user?.userType]);

  useEffect(() => {
    if (lastStudentAccount && user?.userType === 'COACH') {
      setCoachStudentAccounts(prev => [lastStudentAccount, ...prev.slice(0, 9)]);
    }
  }, [lastStudentAccount, user?.userType]);

  useEffect(() => {
    if (lastLeaveRequest && user?.userType === 'COACH') {
      setCoachLeaveRequests(prev => [lastLeaveRequest, ...prev.slice(0, 9)]);
    }
  }, [lastLeaveRequest, user?.userType]);

  // Métodos para escutar eventos específicos
  const onExamResult = (callback: (data: ExamResultRegisteredEvent) => void) => {
    if (!socket) return;

    const handler = (data: ExamResultRegisteredEvent) => {
      if (data.userId === user?.id) {
        callback(data);
      }
    };

    socket.on('exam:result:registered', handler);
    
    return () => {
      socket.off('exam:result:registered', handler);
    };
  };

  const onTestResult = (callback: (data: TestResultRegisteredEvent) => void) => {
    if (!socket) return;

    const handler = (data: TestResultRegisteredEvent) => {
      if (data.userId === user?.id) {
        callback(data);
      }
    };

    socket.on('test:result:registered', handler);
    
    return () => {
      socket.off('test:result:registered', handler);
    };
  };

  const onNewExam = (callback: (data: NewExamCreatedEvent) => void) => {
    if (!socket) return;

    const handler = (data: NewExamCreatedEvent) => {
      if (data.students.includes(user?.id || '')) {
        callback(data);
      }
    };

    socket.on('exam:created', handler);
    
    return () => {
      socket.off('exam:created', handler);
    };
  };

  const onPlanChange = (callback: (data: PlanChangeEvent) => void) => {
    if (!socket) return;

    const handler = (data: PlanChangeEvent) => {
      if (data.userId === user?.id) {
        callback(data);
      }
    };

    socket.on('plan:changed', handler);
    
    return () => {
      socket.off('plan:changed', handler);
    };
  };

  const onLeaveRequest = (callback: (data: LeaveRequestEvent) => void) => {
    if (!socket) return;

    const handler = (data: LeaveRequestEvent) => {
      if (data.userId === user?.id) {
        callback(data);
      }
    };

    socket.on('leave:requested', handler);
    
    return () => {
      socket.off('leave:requested', handler);
    };
  };

  // Métodos para treinadores
  const onCoachExamResult = (callback: (data: ExamResultRegisteredEvent) => void) => {
    if (!socket || user?.userType !== 'COACH') return;

    const handler = (data: ExamResultRegisteredEvent) => {
      callback(data);
    };

    socket.on('exam:result:registered:coach', handler);
    
    return () => {
      socket.off('exam:result:registered:coach', handler);
    };
  };

  const onCoachTestResult = (callback: (data: TestResultRegisteredEvent) => void) => {
    if (!socket || user?.userType !== 'COACH') return;

    const handler = (data: TestResultRegisteredEvent) => {
      callback(data);
    };

    socket.on('test:result:registered:coach', handler);
    
    return () => {
      socket.off('test:result:registered:coach', handler);
    };
  };

  const onCoachNewExam = (callback: (data: NewExamCreatedEvent) => void) => {
    if (!socket || user?.userType !== 'COACH') return;

    const handler = (data: NewExamCreatedEvent) => {
      callback(data);
    };

    socket.on('exam:created:coach', handler);
    
    return () => {
      socket.off('exam:created:coach', handler);
    };
  };

  const onCoachPlanChange = (callback: (data: PlanChangeEvent) => void) => {
    if (!socket || user?.userType !== 'COACH') return;

    const handler = (data: PlanChangeEvent) => {
      callback(data);
    };

    socket.on('plan:changed:coach', handler);
    
    return () => {
      socket.off('plan:changed:coach', handler);
    };
  };

  const onCoachStudentAccount = (callback: (data: StudentAccountCreatedEvent) => void) => {
    if (!socket || user?.userType !== 'COACH') return;

    const handler = (data: StudentAccountCreatedEvent) => {
      callback(data);
    };

    socket.on('student:account:created', handler);
    
    return () => {
      socket.off('student:account:created', handler);
    };
  };

  const onCoachLeaveRequest = (callback: (data: LeaveRequestEvent) => void) => {
    if (!socket || user?.userType !== 'COACH') return;

    const handler = (data: LeaveRequestEvent) => {
      callback(data);
    };

    socket.on('leave:requested:coach', handler);
    
    return () => {
      socket.off('leave:requested:coach', handler);
    };
  };

  return {
    // Estados de conectividade
    isConnected,
    user,
    
    // Últimos eventos recebidos (existentes)
    lastExamResult,
    lastTestResult,
    lastNewExam,
    lastPlanChange,
    lastStudentAccount,
    lastLeaveRequest,
    
    // Últimos eventos recebidos (novos)
    lastStudentExternalExam,
    lastStudentExamRegistration,
    lastStudentTestReportRequest,
    lastStudentSubscription,
    lastStudentFeaturePurchase,
    lastStudentPlanCancellation,
    lastCoachExamResult,
    lastCoachTestResult,
    lastCoachTestReport,
    lastCoachStudentStatusChange,
    lastCoachStudentDataUpdate,
    lastAdminUserRegistration,
    lastAdminSubscription,
    lastAdminLeaveRequest,
    lastAdminPlanChange,
    lastAdminCancellationRequest,
    lastAdminAsaasWebhook,
    
    // Histórico de eventos do usuário (existentes)
    userExamResults,
    userTestResults,
    userNewExams,
    userPlanChanges,
    userLeaveRequests,
    
    // Histórico de eventos Aluno → Treinador
    studentExternalExams,
    studentExamRegistrations,
    studentTestReportRequests,
    studentSubscriptions,
    studentFeaturePurchases,
    studentPlanCancellations,
    
    // Histórico de eventos Treinador → Aluno
    coachExamResults,
    coachTestResults,
    coachTestReports,
    coachStudentStatusChanges,
    coachStudentDataUpdates,
    
    // Histórico de eventos Sistema → Administrador
    adminUserRegistrations,
    adminSubscriptions,
    adminLeaveRequests,
    adminPlanChanges,
    adminCancellationRequests,
    adminAsaasWebhooks,
    
    // Histórico de eventos do treinador (existentes)
    coachExamResultsLegacy,
    coachTestResultsLegacy,
    coachNewExams,
    coachPlanChanges,
    coachStudentAccounts,
    coachLeaveRequests,
    
    // Métodos para escutar eventos específicos (alunos)
    onExamResult,
    onTestResult,
    onNewExam,
    onPlanChange,
    onLeaveRequest,
    
    // Métodos para escutar eventos específicos (treinadores)
    onCoachExamResult,
    onCoachTestResult,
    onCoachNewExam,
    onCoachPlanChange,
    onCoachStudentAccount,
    onCoachLeaveRequest,
  };
};
