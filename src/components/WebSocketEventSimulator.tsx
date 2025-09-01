'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { websocketService } from '@/services/websocketService';
import { toast } from 'sonner';
import { 
  Trophy, 
  TestTube, 
  FileText, 
  RefreshCw, 
  UserPlus, 
  Calendar,
  Send
} from 'lucide-react';

/**
 * Componente para simular emissão de eventos WebSocket
 * Útil para testar a funcionalidade dos eventos
 */
export const WebSocketEventSimulator: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<string>('test:result:registered');
  const [isLoading, setIsLoading] = useState(false);

  // Estados para diferentes tipos de eventos
  const [testData, setTestData] = useState({
    userId: 'student-123',
    testId: 'test-456',
    testName: 'Teste de Corrida 5K',
    coachId: 'coach-789',
    coachName: 'João Silva',
    timeSeconds: 1200,
    generalRank: 15,
    categoryRank: 3
  });

  const [examData, setExamData] = useState({
    userId: 'student-123',
    examId: 'exam-456',
    examName: 'Prova de Triathlon',
    coachId: 'coach-789',
    coachName: 'João Silva',
    timeSeconds: 7200,
    generalRank: 8,
    categoryRank: 2
  });

  const [planData, setPlanData] = useState({
    userId: 'student-123',
    studentName: 'Maria Santos',
    oldPlanId: 'plan-basic',
    oldPlanName: 'Plano Básico',
    newPlanId: 'plan-premium',
    newPlanName: 'Plano Premium',
    coachId: 'coach-789',
    coachName: 'João Silva'
  });

  const [accountData, setAccountData] = useState({
    userId: 'student-456',
    studentName: 'Pedro Oliveira',
    studentEmail: 'pedro@email.com',
    coachId: 'coach-789',
    coachName: 'João Silva'
  });

  const [leaveData, setLeaveData] = useState({
    userId: 'student-123',
    studentName: 'Maria Santos',
    requestId: 'leave-789',
    reason: 'Viagem de trabalho',
    startDate: '2024-01-15',
    endDate: '2024-01-30',
    coachId: 'coach-789',
    coachName: 'João Silva'
  });

  const [newExamData, setNewExamData] = useState({
    examId: 'exam-789',
    examName: 'Maratona de São Paulo',
    modalidade: 'Corrida',
    coachId: 'coach-789',
    coachName: 'João Silva',
    students: ['student-123', 'student-456', 'student-789']
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'test:result:registered':
        return <TestTube className="h-4 w-4 text-blue-500" />;
      case 'exam:result:registered':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'exam:created':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'plan:changed':
        return <RefreshCw className="h-4 w-4 text-purple-500" />;
      case 'account:created':
        return <UserPlus className="h-4 w-4 text-indigo-500" />;
      case 'leave:requested':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      default:
        return <Send className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleEmitEvent = async () => {
    setIsLoading(true);
    
    try {
      switch (selectedEvent) {
        case 'test:result:registered':
          websocketService.emitTestResultRegistered({
            userId: testData.userId,
            testId: testData.testId,
            testName: testData.testName,
            result: {
              timeSeconds: testData.timeSeconds,
              generalRank: testData.generalRank,
              categoryRank: testData.categoryRank
            },
            coachId: testData.coachId,
            coachName: testData.coachName
          });
          break;

        case 'exam:result:registered':
          websocketService.emitExamResultRegistered({
            userId: examData.userId,
            examId: examData.examId,
            examName: examData.examName,
            result: {
              timeSeconds: examData.timeSeconds,
              generalRank: examData.generalRank,
              categoryRank: examData.categoryRank
            },
            coachId: examData.coachId,
            coachName: examData.coachName
          });
          break;

        case 'exam:created':
          websocketService.emitNewExamCreated(newExamData);
          break;

        case 'plan:changed':
          websocketService.emitPlanChange(planData);
          break;

        case 'account:created':
          websocketService.emitStudentAccountCreated(accountData);
          break;

        case 'leave:requested':
          websocketService.emitLeaveRequest(leaveData);
          break;

        default:
          toast.error('Tipo de evento não suportado');
          return;
      }

      toast.success(`Evento ${selectedEvent} emitido com sucesso!`);
    } catch (error) {
      console.error('Erro ao emitir evento:', error);
      toast.error('Erro ao emitir evento');
    } finally {
      setIsLoading(false);
    }
  };

  const renderEventForm = () => {
    switch (selectedEvent) {
      case 'test:result:registered':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testUserId">User ID</Label>
                <Input
                  id="testUserId"
                  value={testData.userId}
                  onChange={(e) => setTestData(prev => ({ ...prev, userId: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="testId">Test ID</Label>
                <Input
                  id="testId"
                  value={testData.testId}
                  onChange={(e) => setTestData(prev => ({ ...prev, testId: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="testName">Nome do Teste</Label>
              <Input
                id="testName"
                value={testData.testName}
                onChange={(e) => setTestData(prev => ({ ...prev, testName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="timeSeconds">Tempo (segundos)</Label>
                <Input
                  id="timeSeconds"
                  type="number"
                  value={testData.timeSeconds}
                  onChange={(e) => setTestData(prev => ({ ...prev, timeSeconds: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="generalRank">Classificação Geral</Label>
                <Input
                  id="generalRank"
                  type="number"
                  value={testData.generalRank}
                  onChange={(e) => setTestData(prev => ({ ...prev, generalRank: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="categoryRank">Classificação Categoria</Label>
                <Input
                  id="categoryRank"
                  type="number"
                  value={testData.categoryRank}
                  onChange={(e) => setTestData(prev => ({ ...prev, categoryRank: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coachId">Coach ID</Label>
                <Input
                  id="coachId"
                  value={testData.coachId}
                  onChange={(e) => setTestData(prev => ({ ...prev, coachId: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="coachName">Nome do Coach</Label>
                <Input
                  id="coachName"
                  value={testData.coachName}
                  onChange={(e) => setTestData(prev => ({ ...prev, coachName: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      case 'exam:result:registered':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="examUserId">User ID</Label>
                <Input
                  id="examUserId"
                  value={examData.userId}
                  onChange={(e) => setExamData(prev => ({ ...prev, userId: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="examId">Exam ID</Label>
                <Input
                  id="examId"
                  value={examData.examId}
                  onChange={(e) => setExamData(prev => ({ ...prev, examId: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="examName">Nome da Prova</Label>
              <Input
                id="examName"
                value={examData.examName}
                onChange={(e) => setExamData(prev => ({ ...prev, examName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="examTimeSeconds">Tempo (segundos)</Label>
                <Input
                  id="examTimeSeconds"
                  type="number"
                  value={examData.timeSeconds}
                  onChange={(e) => setExamData(prev => ({ ...prev, timeSeconds: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="examGeneralRank">Classificação Geral</Label>
                <Input
                  id="examGeneralRank"
                  type="number"
                  value={examData.generalRank}
                  onChange={(e) => setExamData(prev => ({ ...prev, generalRank: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="examCategoryRank">Classificação Categoria</Label>
                <Input
                  id="examCategoryRank"
                  type="number"
                  value={examData.categoryRank}
                  onChange={(e) => setExamData(prev => ({ ...prev, categoryRank: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="examCoachId">Coach ID</Label>
                <Input
                  id="examCoachId"
                  value={examData.coachId}
                  onChange={(e) => setExamData(prev => ({ ...prev, coachId: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="examCoachName">Nome do Coach</Label>
                <Input
                  id="examCoachName"
                  value={examData.coachName}
                  onChange={(e) => setExamData(prev => ({ ...prev, coachName: e.target.value }))}
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Formulário para {selectedEvent} será implementado em breve</p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Simulador de Eventos WebSocket
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="eventType">Tipo de Evento</Label>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="test:result:registered">
                <div className="flex items-center gap-2">
                  {getEventIcon('test:result:registered')}
                  Resultado de Teste
                </div>
              </SelectItem>
              <SelectItem value="exam:result:registered">
                <div className="flex items-center gap-2">
                  {getEventIcon('exam:result:registered')}
                  Resultado de Prova
                </div>
              </SelectItem>
              <SelectItem value="exam:created">
                <div className="flex items-center gap-2">
                  {getEventIcon('exam:created')}
                  Nova Prova Criada
                </div>
              </SelectItem>
              <SelectItem value="plan:changed">
                <div className="flex items-center gap-2">
                  {getEventIcon('plan:changed')}
                  Mudança de Plano
                </div>
              </SelectItem>
              <SelectItem value="account:created">
                <div className="flex items-center gap-2">
                  {getEventIcon('account:created')}
                  Conta Criada
                </div>
              </SelectItem>
              <SelectItem value="leave:requested">
                <div className="flex items-center gap-2">
                  {getEventIcon('leave:requested')}
                  Solicitação de Licença
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {renderEventForm()}

        <Button 
          onClick={handleEmitEvent} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Emitindo...' : `Emitir Evento ${selectedEvent}`}
        </Button>

        <div className="text-sm text-gray-600">
          <p><strong>Status da Conexão:</strong> {websocketService.getConnectionStatus().isConnected ? 'Conectado' : 'Desconectado'}</p>
          <p><strong>Socket ID:</strong> {websocketService.getConnectionStatus().socketId || 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  );
};
