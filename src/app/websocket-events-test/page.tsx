'use client';

import React from 'react';
import { WebSocketEventMonitor } from '@/components/WebSocketEventMonitor';
import { WebSocketEventSimulator } from '@/components/WebSocketEventSimulator';
import { useWebSocketEventLogger } from '@/hooks/useWebSocketEventLogger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Users, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function WebSocketEventsTestPage() {
  const { user } = useAuth();
  const { isConnected, connectionStatus, ping } = useWebSocket();
  
  // Ativar logging automático
  useWebSocketEventLogger();

  const getConnectionStatusColor = () => {
    if (isConnected) return 'text-green-600';
    if (connectionStatus.reconnectAttempts > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConnectionStatusIcon = () => {
    if (isConnected) return <Wifi className="h-4 w-4" />;
    if (connectionStatus.reconnectAttempts > 0) return <Activity className="h-4 w-4" />;
    return <WifiOff className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teste de Eventos WebSocket</h1>
          <p className="text-gray-600 mt-2">
            Página para testar e monitorar os novos eventos WebSocket implementados
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className="flex items-center gap-2"
          >
            {getConnectionStatusIcon()}
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
          <Button 
            onClick={ping} 
            variant="outline" 
            size="sm"
            disabled={!isConnected}
          >
            Testar Conexão
          </Button>
        </div>
      </div>

      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status da Conexão WebSocket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getConnectionStatusColor()}`}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {connectionStatus.reconnectAttempts}
              </div>
              <div className="text-sm text-gray-600">Tentativas de Reconexão</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {connectionStatus.maxReconnectAttempts}
              </div>
              <div className="text-sm text-gray-600">Máximo de Tentativas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {user?.userType || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Tipo de Usuário</div>
            </div>
          </div>
          
          {connectionStatus.lastConnected && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Última Conexão:</span>
                <span className="text-sm">
                  {new Date(connectionStatus.lastConnected).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          )}

          {connectionStatus.lastDisconnected && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Última Desconexão:</span>
                <span className="text-sm">
                  {new Date(connectionStatus.lastDisconnected).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulador de Eventos */}
      <WebSocketEventSimulator />

      {/* Monitor de Eventos */}
      <WebSocketEventMonitor />

      {/* Instruções de Teste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Como Testar os Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Teste com Simulador</h3>
            <p className="text-sm text-gray-600">
              Use o simulador acima para emitir eventos de teste. Os eventos aparecerão no monitor em tempo real.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">2. Teste Real com Treinador</h3>
            <p className="text-sm text-gray-600">
              Faça login como treinador e registre um resultado de teste para um aluno. O evento deve ser emitido automaticamente.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">3. Verificar Notificações</h3>
            <p className="text-sm text-gray-600">
              Alunos devem receber notificações toast quando seus resultados são registrados.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">4. Monitorar Logs</h3>
            <p className="text-sm text-gray-600">
              Abra o console do navegador para ver logs detalhados de todos os eventos WebSocket.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Eventos Implementados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Eventos Implementados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Para Alunos:</h4>
              <ul className="space-y-1 text-sm">
                <li>• <code>exam:result:registered</code> - Resultado de prova</li>
                <li>• <code>test:result:registered</code> - Resultado de teste</li>
                <li>• <code>exam:created</code> - Nova prova disponível</li>
                <li>• <code>plan:changed</code> - Plano alterado</li>
                <li>• <code>account:created</code> - Conta criada</li>
                <li>• <code>leave:requested</code> - Solicitação de licença</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Para Treinadores:</h4>
              <ul className="space-y-1 text-sm">
                <li>• <code>exam:result:registered:coach</code> - Resultado registrado</li>
                <li>• <code>test:result:registered:coach</code> - Resultado registrado</li>
                <li>• <code>exam:created:coach</code> - Prova criada</li>
                <li>• <code>plan:changed:coach</code> - Aluno alterou plano</li>
                <li>• <code>student:account:created</code> - Novo aluno</li>
                <li>• <code>leave:requested:coach</code> - Aluno solicitou licença</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
