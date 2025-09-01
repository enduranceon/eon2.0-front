'use client';

import React from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Trophy, 
  TestTube, 
  FileText, 
  RefreshCw, 
  UserPlus, 
  Calendar,
  Clock,
  CheckCircle
} from 'lucide-react';

/**
 * Componente para monitorar e exibir os novos eventos WebSocket em tempo real
 * Útil para debug e demonstração das funcionalidades
 */
export const WebSocketEventMonitor: React.FC = () => {
  const { user } = useAuth();
  const {
    isConnected,
    lastExamResult,
    lastTestResult,
    lastNewExam,
    lastPlanChange,
    lastStudentAccount,
    lastLeaveRequest,
    ping
  } = useWebSocket();

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'exam:result:registered':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'test:result:registered':
        return <TestTube className="h-4 w-4 text-blue-500" />;
      case 'exam:created':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'plan:changed':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      case 'account:created':
        return <UserPlus className="h-4 w-4 text-indigo-500" />;
      case 'leave:requested':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventTitle = (eventType: string) => {
    switch (eventType) {
      case 'exam:result:registered':
        return 'Resultado de Prova';
      case 'test:result:registered':
        return 'Resultado de Teste';
      case 'exam:created':
        return 'Nova Prova';
      case 'plan:changed':
        return 'Mudança de Plano';
      case 'account:created':
        return 'Conta Criada';
      case 'leave:requested':
        return 'Solicitação de Licença';
      default:
        return 'Evento WebSocket';
    }
  };

  const getEventDescription = (event: any) => {
    if (lastExamResult) {
      return `Prova "${event.examName}" - Resultado registrado por ${event.coachName}`;
    }
    if (lastTestResult) {
      return `Teste "${event.testName}" - Resultado registrado por ${event.coachName}`;
    }
    if (lastNewExam) {
      return `Nova prova "${event.examName}" criada por ${event.coachName}`;
    }
    if (lastPlanChange) {
      return `Plano alterado de "${event.oldPlanName}" para "${event.newPlanName}"`;
    }
    if (lastStudentAccount) {
      return `Nova conta criada: ${event.studentName} (${event.studentEmail})`;
    }
    if (lastLeaveRequest) {
      return `Solicitação de licença de ${event.studentName} - ${event.reason}`;
    }
    return 'Evento recebido';
  };

  const events = [
    { type: 'exam:result:registered', data: lastExamResult },
    { type: 'test:result:registered', data: lastTestResult },
    { type: 'exam:created', data: lastNewExam },
    { type: 'plan:changed', data: lastPlanChange },
    { type: 'account:created', data: lastStudentAccount },
    { type: 'leave:requested', data: lastLeaveRequest },
  ].filter(event => event.data);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Monitor de Eventos WebSocket
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-sm text-gray-600">
              Usuário: {user?.name} ({user?.userType})
            </div>
            <Button 
              onClick={ping} 
              size="sm" 
              variant="outline"
              disabled={!isConnected}
            >
              Testar Conexão
            </Button>
          </div>
          
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>Nenhum evento recebido ainda</p>
              <p className="text-sm">Os eventos aparecerão aqui em tempo real</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">
                Eventos Recentes ({events.length})
              </h3>
              {events.map((event, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border"
                >
                  {getEventIcon(event.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">
                        {getEventTitle(event.type)}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {getEventDescription(event.data)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(event.data.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
