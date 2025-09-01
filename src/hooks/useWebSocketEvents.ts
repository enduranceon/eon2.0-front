import { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ExamResultRegisteredEvent,
  TestResultRegisteredEvent,
  NewExamCreatedEvent,
  PlanChangeEvent,
  StudentAccountCreatedEvent,
  LeaveRequestEvent
} from '../types/api';

/**
 * Hook personalizado para facilitar o uso dos novos eventos WebSocket
 * Fornece métodos convenientes para escutar eventos específicos
 */
export const useWebSocketEvents = () => {
  const { user } = useAuth();
  const {
    isConnected,
    lastExamResult,
    lastTestResult,
    lastNewExam,
    lastPlanChange,
    lastStudentAccount,
    lastLeaveRequest,
    socket
  } = useWebSocket();

  // Estados para eventos específicos do usuário atual
  const [userExamResults, setUserExamResults] = useState<ExamResultRegisteredEvent[]>([]);
  const [userTestResults, setUserTestResults] = useState<TestResultRegisteredEvent[]>([]);
  const [userNewExams, setUserNewExams] = useState<NewExamCreatedEvent[]>([]);
  const [userPlanChanges, setUserPlanChanges] = useState<PlanChangeEvent[]>([]);
  const [userLeaveRequests, setUserLeaveRequests] = useState<LeaveRequestEvent[]>([]);

  // Estados para eventos de treinador
  const [coachExamResults, setCoachExamResults] = useState<ExamResultRegisteredEvent[]>([]);
  const [coachTestResults, setCoachTestResults] = useState<TestResultRegisteredEvent[]>([]);
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

  // Eventos para treinadores
  useEffect(() => {
    if (lastExamResult && user?.userType === 'COACH') {
      setCoachExamResults(prev => [lastExamResult, ...prev.slice(0, 9)]);
    }
  }, [lastExamResult, user?.userType]);

  useEffect(() => {
    if (lastTestResult && user?.userType === 'COACH') {
      setCoachTestResults(prev => [lastTestResult, ...prev.slice(0, 9)]);
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
    
    // Últimos eventos recebidos
    lastExamResult,
    lastTestResult,
    lastNewExam,
    lastPlanChange,
    lastStudentAccount,
    lastLeaveRequest,
    
    // Histórico de eventos do usuário
    userExamResults,
    userTestResults,
    userNewExams,
    userPlanChanges,
    userLeaveRequests,
    
    // Histórico de eventos do treinador
    coachExamResults,
    coachTestResults,
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
