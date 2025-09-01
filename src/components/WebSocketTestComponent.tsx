'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocketEventLogger } from '../hooks/useWebSocketEventLogger';
import { Avatar } from './Avatar';
import { ImmediateAvatar } from './ImmediateAvatar';
import { PhotoUpdateTester } from './PhotoUpdateTester';
import { WebSocketDiagnostic } from './WebSocketDiagnostic';
import { WebSocketConnectionTest } from './WebSocketConnectionTest';
import { PhotoUpdateVerifier } from './PhotoUpdateVerifier';
import { SimplePhotoTest } from './SimplePhotoTest';
import { DirectPhotoTest } from './DirectPhotoTest';
import { HookTest } from './HookTest';
import { SimpleHookTest } from './SimpleHookTest';
import { DirectHookTest } from './DirectHookTest';
import { 
  WifiIcon, 
  SignalSlashIcon, 
  PhotoIcon, 
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface WebSocketTestComponentProps {
  className?: string;
  showAvatar?: boolean;
  showConnectionDetails?: boolean;
  showEventLog?: boolean;
  showPhotoTester?: boolean;
  showDiagnostic?: boolean;
  showConnectionTest?: boolean;
  showPhotoVerifier?: boolean;
  showSimpleTest?: boolean;
  showDirectTest?: boolean;
  showHookTest?: boolean;
  showSimpleHookTest?: boolean;
  showDirectHookTest?: boolean;
}

export const WebSocketTestComponent: React.FC<WebSocketTestComponentProps> = ({
  className = '',
  showAvatar = true,
  showConnectionDetails = true,
  showEventLog = true,
  showPhotoTester = true,
  showDiagnostic = true,
  showConnectionTest = true,
  showPhotoVerifier = true,
  showSimpleTest = true,
  showDirectTest = true,
  showHookTest = true,
  showSimpleHookTest = true,
  showDirectHookTest = true,
}) => {
  const { user } = useAuth();
  const { 
    isConnected, 
    connectionStatus, 
    lastPhotoUpdate, 
    lastProfileUpdate, 
    lastStatusChange,
    ping,
    connect,
    disconnect 
  } = useWebSocket();

  // Ativar logger de eventos
  useWebSocketEventLogger();

  const [eventLog, setEventLog] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    data?: any;
  }>>([]);

  const [pingResponse, setPingResponse] = useState<string | null>(null);

  // Adicionar eventos ao log
  const addToEventLog = (type: string, message: string, data?: any) => {
    const newEvent = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      data,
    };
    setEventLog(prev => [newEvent, ...prev.slice(0, 9)]); // Manter apenas os últimos 10 eventos
  };

  // Monitorar mudanças de conexão
  useEffect(() => {
    if (isConnected) {
      addToEventLog('connection', 'WebSocket conectado', { status: 'connected' });
    } else {
      addToEventLog('connection', 'WebSocket desconectado', { status: 'disconnected' });
    }
  }, [isConnected]);

  // Monitorar atualizações de foto
  useEffect(() => {
    if (lastPhotoUpdate) {
      addToEventLog('photo', 'Foto atualizada', lastPhotoUpdate);
    }
  }, [lastPhotoUpdate]);

  // Monitorar atualizações de perfil
  useEffect(() => {
    if (lastProfileUpdate) {
      addToEventLog('profile', 'Perfil atualizado', lastProfileUpdate);
    }
  }, [lastProfileUpdate]);

  // Monitorar mudanças de status
  useEffect(() => {
    if (lastStatusChange) {
      addToEventLog('status', 'Status alterado', lastStatusChange);
    }
  }, [lastStatusChange]);

  const handlePing = () => {
    ping();
    addToEventLog('ping', 'Ping enviado');
    setPingResponse('Aguardando resposta...');
    
    // Simular resposta (em uma implementação real, isso viria do servidor)
    setTimeout(() => {
      setPingResponse('Pong recebido!');
      addToEventLog('pong', 'Pong recebido');
    }, 1000);
  };

  const handleReconnect = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  const clearEventLog = () => {
    setEventLog([]);
  };

  const getConnectionStatusColor = () => {
    if (isConnected) return 'text-green-600 dark:text-green-400';
    if (connectionStatus.reconnectAttempts > 0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getConnectionStatusIcon = () => {
    if (isConnected) return <WifiIcon className="w-5 h-5" />;
    return <SignalSlashIcon className="w-5 h-5" />;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Teste de WebSocket
        </h2>
        <div className={`flex items-center gap-2 ${getConnectionStatusColor()}`}>
          {getConnectionStatusIcon()}
          <span className="text-sm font-medium">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Avatar com atualização em tempo real */}
      {showAvatar && user && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Avatar em Tempo Real
          </h3>
                     <div className="flex items-center gap-4">
             <div className="flex flex-col items-center gap-2">
               <ImmediateAvatar
                 userId={user.id}
                 user={user}
                 size={60}
                 showUpdateIndicator={true}
                 className="ring-2 ring-green-200 dark:ring-green-800"
               />
               <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                 Avatar Otimizado
               </span>
             </div>
             <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Usuário:</strong> {user.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>ID:</strong> {user.id}
              </p>
              {lastPhotoUpdate && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  <CheckCircleIcon className="w-4 h-4 inline mr-1" />
                  Última atualização: {new Date(lastPhotoUpdate.updatedAt).toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detalhes da conexão */}
      {showConnectionDetails && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Status da Conexão
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`ml-2 font-medium ${getConnectionStatusColor()}`}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Tentativas de reconexão:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {connectionStatus.reconnectAttempts}/{connectionStatus.maxReconnectAttempts}
              </span>
            </div>
            {connectionStatus.lastConnected && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Última conexão:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {new Date(connectionStatus.lastConnected).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
            {connectionStatus.lastDisconnected && (
              <div>
                <span className="text-gray-600 dark:text-gray-400">Última desconexão:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {new Date(connectionStatus.lastDisconnected).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={handlePing}
          disabled={!isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Enviar Ping
        </button>
        <button
          onClick={handleReconnect}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {isConnected ? 'Desconectar' : 'Conectar'}
        </button>
        {showEventLog && (
          <button
            onClick={clearEventLog}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Limpar Log
          </button>
        )}
      </div>

      {/* Resposta do ping */}
      {pingResponse && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <ClockIcon className="w-4 h-4 inline mr-1" />
            {pingResponse}
          </p>
        </div>
      )}

      {/* Log de eventos */}
      {showEventLog && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Log de Eventos ({eventLog.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {eventLog.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Nenhum evento registrado ainda
              </p>
            ) : (
              eventLog.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-2 bg-white dark:bg-gray-800 rounded border"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {event.type === 'connection' && (
                      isConnected ? 
                        <CheckCircleIcon className="w-4 h-4 text-green-500" /> :
                        <XCircleIcon className="w-4 h-4 text-red-500" />
                    )}
                    {event.type === 'photo' && <PhotoIcon className="w-4 h-4 text-blue-500" />}
                    {event.type === 'profile' && <UserIcon className="w-4 h-4 text-purple-500" />}
                    {event.type === 'ping' && <ClockIcon className="w-4 h-4 text-yellow-500" />}
                    {event.type === 'pong' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {event.timestamp}
                    </p>
                    {event.data && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                          Ver dados
                        </summary>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Teste específico de atualização de foto */}
      {showPhotoTester && (
        <div className="mt-6">
          <PhotoUpdateTester />
        </div>
      )}

      {/* Teste de Conexão WebSocket */}
      {showConnectionTest && (
        <div className="mt-6">
          <WebSocketConnectionTest />
        </div>
      )}

      {/* Teste Simples do Hook */}
      {showSimpleHookTest && (
        <div className="mt-6">
          <SimpleHookTest />
        </div>
      )}

      {/* Teste Direto do Hook */}
      {showDirectHookTest && (
        <div className="mt-6">
          <DirectHookTest />
        </div>
      )}

      {/* Teste do Hook */}
      {showHookTest && (
        <div className="mt-6">
          <HookTest />
        </div>
      )}

      {/* Teste Direto de Foto */}
      {showDirectTest && (
        <div className="mt-6">
          <DirectPhotoTest />
        </div>
      )}

      {/* Teste Simples de Foto */}
      {showSimpleTest && (
        <div className="mt-6">
          <SimplePhotoTest />
        </div>
      )}

      {/* Verificador de Atualização de Foto */}
      {showPhotoVerifier && (
        <div className="mt-6">
          <PhotoUpdateVerifier />
        </div>
      )}

      {/* Diagnóstico WebSocket */}
      {showDiagnostic && (
        <div className="mt-6">
          <WebSocketDiagnostic />
        </div>
      )}
    </div>
  );
};
