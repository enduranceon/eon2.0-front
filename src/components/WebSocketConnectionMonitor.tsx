'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';

interface ConnectionInfo {
  timestamp: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  details: any;
}

export const WebSocketConnectionMonitor: React.FC = () => {
  const { user } = useAuth();
  const { 
    isConnected, 
    connectionStatus, 
    socket,
    lastPhotoUpdate,
    ping 
  } = useWebSocket();
  
  const [connectionLog, setConnectionLog] = useState<ConnectionInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [pingInterval, setPingInterval] = useState<NodeJS.Timeout | null>(null);

  // Adicionar entrada ao log
  const addToLog = (status: ConnectionInfo['status'], details: any) => {
    const entry: ConnectionInfo = {
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      status,
      details
    };
    setConnectionLog(prev => [entry, ...prev.slice(0, 19)]);
  };

  // Monitorar mudanças de conexão
  useEffect(() => {
    if (isConnected) {
      addToLog('connected', {
        socketId: socket?.id,
        userId: user?.id,
        lastConnected: connectionStatus.lastConnected
      });
    } else {
      addToLog('disconnected', {
        lastDisconnected: connectionStatus.lastDisconnected,
        reconnectAttempts: connectionStatus.reconnectAttempts
      });
    }
  }, [isConnected, socket?.id, user?.id, connectionStatus]);

  // Monitorar eventos de foto
  useEffect(() => {
    if (lastPhotoUpdate) {
      addToLog('connected', {
        type: 'photo_update',
        photoData: lastPhotoUpdate,
        isForCurrentUser: lastPhotoUpdate.userId === user?.id
      });
    }
  }, [lastPhotoUpdate, user?.id]);

  // Iniciar ping automático
  const startPing = () => {
    if (pingInterval) {
      clearInterval(pingInterval);
    }
    
    const interval = setInterval(() => {
      if (isConnected && socket?.connected) {
        console.log('🏓 Enviando ping automático...');
        ping();
        addToLog('connected', { type: 'ping_sent', timestamp: new Date().toISOString() });
      }
    }, 10000); // Ping a cada 10 segundos
    
    setPingInterval(interval);
  };

  // Parar ping automático
  const stopPing = () => {
    if (pingInterval) {
      clearInterval(pingInterval);
      setPingInterval(null);
    }
  };

  // Iniciar/parar ping baseado na conexão
  useEffect(() => {
    if (isConnected) {
      startPing();
    } else {
      stopPing();
    }
    
    return () => stopPing();
  }, [isConnected]);

  const clearLog = () => {
    setConnectionLog([]);
  };

  const getStatusColor = (status: ConnectionInfo['status']) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'disconnected': return 'text-red-600 bg-red-50';
      case 'connecting': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: ConnectionInfo['status']) => {
    switch (status) {
      case 'connected': return '✅';
      case 'disconnected': return '❌';
      case 'connecting': return '🔄';
      case 'error': return '⚠️';
      default: return '❓';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Monitor de Conexão WebSocket"
      >
        📡
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Monitor WebSocket
          </h3>
          <div className="flex gap-2">
            <button
              onClick={clearLog}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Limpar
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-sm">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-gray-600 dark:text-gray-400">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            {socket?.id && (
              <span className="text-xs text-gray-500">
                ID: {socket.id.substring(0, 8)}...
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Usuário: {user?.id || 'N/A'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            URL: {process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001'}
          </div>
        </div>
      </div>

      <div className="p-4 max-h-64 overflow-y-auto">
        {connectionLog.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Nenhum evento registrado
          </p>
        ) : (
          <div className="space-y-2">
            {connectionLog.map((entry, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${getStatusColor(entry.status)}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {getStatusIcon(entry.status)} {entry.status}
                  </span>
                  <span className="text-gray-500">{entry.timestamp}</span>
                </div>
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                    Ver detalhes
                  </summary>
                  <pre className="text-xs mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={ping}
            disabled={!isConnected}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Ping
          </button>
          <button
            onClick={isConnected ? stopPing : startPing}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            {pingInterval ? 'Parar Ping' : 'Iniciar Ping'}
          </button>
        </div>
      </div>
    </div>
  );
};
