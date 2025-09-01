'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';

interface WebSocketEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
}

export const WebSocketDebugger: React.FC = () => {
  const { user } = useAuth();
  const { 
    isConnected, 
    connectionStatus, 
    lastPhotoUpdate, 
    lastProfileUpdate, 
    lastStatusChange,
    socket 
  } = useWebSocket();
  
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Adicionar evento ao log
  const addEvent = (type: string, data: any, userId?: string) => {
    const newEvent: WebSocketEvent = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      userId
    };
    
    setEvents(prev => [newEvent, ...prev.slice(0, 19)]); // Manter apenas os últimos 20 eventos
  };

  // Monitorar mudanças de conexão
  useEffect(() => {
    if (isConnected) {
      addEvent('connection', { status: 'connected' });
    } else {
      addEvent('connection', { status: 'disconnected' });
    }
  }, [isConnected]);

  // Monitorar atualizações de foto
  useEffect(() => {
    if (lastPhotoUpdate) {
      addEvent('photo_update', lastPhotoUpdate, lastPhotoUpdate.userId);
    }
  }, [lastPhotoUpdate]);

  // Monitorar atualizações de perfil
  useEffect(() => {
    if (lastProfileUpdate) {
      addEvent('profile_update', lastProfileUpdate, lastProfileUpdate.userId);
    }
  }, [lastProfileUpdate]);

  // Monitorar mudanças de status
  useEffect(() => {
    if (lastStatusChange) {
      addEvent('status_change', lastStatusChange, lastStatusChange.userId);
    }
  }, [lastStatusChange]);

  // Interceptar todos os eventos do socket
  useEffect(() => {
    if (socket) {
      const originalEmit = socket.emit;
      const originalOn = socket.on;

      // Interceptar eventos emitidos
      socket.emit = function(event: string, ...args: any[]) {
        addEvent(`emit_${event}`, args);
        return originalEmit.call(this, event, ...args);
      };

      // Interceptar eventos recebidos
      socket.on = function(event: string, callback: any) {
        const wrappedCallback = (...args: any[]) => {
          addEvent(`receive_${event}`, args);
          return callback(...args);
        };
        return originalOn.call(this, event, wrappedCallback);
      };

      return () => {
        // Restaurar métodos originais
        socket.emit = originalEmit;
        socket.on = originalOn;
      };
    }
  }, [socket]);

  const clearEvents = () => {
    setEvents([]);
  };

  const getEventColor = (type: string) => {
    if (type.includes('photo')) return 'text-blue-600 bg-blue-50';
    if (type.includes('profile')) return 'text-purple-600 bg-purple-50';
    if (type.includes('status')) return 'text-green-600 bg-green-50';
    if (type.includes('connection')) return 'text-orange-600 bg-orange-50';
    if (type.includes('emit')) return 'text-red-600 bg-red-50';
    if (type.includes('receive')) return 'text-indigo-600 bg-indigo-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Abrir Debugger WebSocket"
      >
        🔍
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            WebSocket Debugger
          </h3>
          <div className="flex gap-2">
            <button
              onClick={clearEvents}
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
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Usuário: {user?.id || 'N/A'}
          </div>
        </div>
      </div>

      <div className="p-4 max-h-64 overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Nenhum evento registrado
          </p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className={`p-2 rounded text-xs ${getEventColor(event.type)}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{event.type}</span>
                  <span className="text-gray-500">{event.timestamp}</span>
                </div>
                {event.userId && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    UserID: {event.userId}
                  </div>
                )}
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                    Ver dados
                  </summary>
                  <pre className="text-xs mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
