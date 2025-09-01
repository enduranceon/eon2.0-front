'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocketConnectivity } from '../hooks/useWebSocketConnectivity';

export const WebSocketDiagnostic: React.FC = () => {
  const { user } = useAuth();
  const { 
    isConnected, 
    connectionStatus, 
    socket,
    lastPhotoUpdate,
    ping,
    connect,
    disconnect 
  } = useWebSocket();
  
  const { 
    connectivityStatus, 
    hasConnectivityIssues, 
    healthStatus, 
    isUserInCorrectRoom 
  } = useWebSocketConnectivity();

  const [diagnosticResults, setDiagnosticResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addDiagnosticResult = (test: string, result: 'pass' | 'fail' | 'warning', details: any) => {
    const diagnostic = {
      test,
      result,
      details,
      timestamp: new Date().toLocaleTimeString('pt-BR')
    };
    setDiagnosticResults(prev => [diagnostic, ...prev.slice(0, 9)]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticResults([]);

    // Teste 1: Verificar autenticação
    addDiagnosticResult(
      'Autenticação do Usuário',
      user?.id ? 'pass' : 'fail',
      { userId: user?.id, isAuthenticated: !!user }
    );

    // Teste 2: Verificar token
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    addDiagnosticResult(
      'Token de Autenticação',
      token ? 'pass' : 'fail',
      { hasToken: !!token, tokenLength: token?.length }
    );

    // Teste 3: Verificar URL do WebSocket
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
    addDiagnosticResult(
      'URL do WebSocket',
      websocketUrl ? 'pass' : 'fail',
      { url: websocketUrl }
    );

    // Teste 4: Verificar conexão WebSocket
    addDiagnosticResult(
      'Conexão WebSocket',
      isConnected ? 'pass' : 'fail',
      { 
        isConnected, 
        socketId: socket?.id,
        socketConnected: socket?.connected,
        healthStatus 
      }
    );

    // Teste 5: Verificar sala do usuário
    addDiagnosticResult(
      'Sala do Usuário',
      isUserInCorrectRoom ? 'pass' : 'warning',
      { 
        isUserInCorrectRoom,
        userId: user?.id,
        socketId: socket?.id
      }
    );

    // Teste 6: Verificar tentativas de reconexão
    addDiagnosticResult(
      'Tentativas de Reconexão',
      connectionStatus.reconnectAttempts === 0 ? 'pass' : 'warning',
      { 
        reconnectAttempts: connectionStatus.reconnectAttempts,
        maxReconnectAttempts: connectionStatus.maxReconnectAttempts
      }
    );

    // Teste 7: Teste de ping
    if (isConnected && socket?.connected) {
      try {
        console.log('🏓 Executando teste de ping...');
        ping();
        addDiagnosticResult(
          'Teste de Ping',
          'pass',
          { pingSent: true, timestamp: new Date().toISOString() }
        );
      } catch (error) {
        addDiagnosticResult(
          'Teste de Ping',
          'fail',
          { error: error.message }
        );
      }
    } else {
      addDiagnosticResult(
        'Teste de Ping',
        'fail',
        { reason: 'WebSocket não conectado' }
      );
    }

    // Teste 8: Verificar último evento recebido
    addDiagnosticResult(
      'Último Evento Recebido',
      lastPhotoUpdate ? 'pass' : 'warning',
      { 
        hasLastPhotoUpdate: !!lastPhotoUpdate,
        lastPhotoUpdate: lastPhotoUpdate ? {
          userId: lastPhotoUpdate.userId,
          timestamp: lastPhotoUpdate.timestamp
        } : null
      }
    );

    setIsRunning(false);
  };

  const getResultColor = (result: 'pass' | 'fail' | 'warning') => {
    switch (result) {
      case 'pass': return 'text-green-600 bg-green-50';
      case 'fail': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getResultIcon = (result: 'pass' | 'fail' | 'warning') => {
    switch (result) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Diagnóstico WebSocket
      </h2>

      {/* Status atual */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status Atual
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Conexão:</span>
            <span className={`ml-2 font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Saúde:</span>
            <span className={`ml-2 font-medium ${
              healthStatus === 'healthy' ? 'text-green-600' : 
              healthStatus === 'reconnecting' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {healthStatus}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Socket ID:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {socket?.id ? `${socket.id.substring(0, 8)}...` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Usuário:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {user?.id ? `${user.id.substring(0, 8)}...` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={runDiagnostic}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? 'Executando...' : 'Executar Diagnóstico'}
        </button>
        <button
          onClick={() => setDiagnosticResults([])}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Limpar
        </button>
        <button
          onClick={isConnected ? disconnect : connect}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {isConnected ? 'Desconectar' : 'Conectar'}
        </button>
      </div>

      {/* Resultados do diagnóstico */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Resultados do Diagnóstico ({diagnosticResults.length})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {diagnosticResults.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Execute o diagnóstico para ver os resultados
            </p>
          ) : (
            diagnosticResults.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${getResultColor(result.result)}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {getResultIcon(result.result)} {result.test}
                  </span>
                  <span className="text-gray-500">{result.timestamp}</span>
                </div>
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                    Ver detalhes
                  </summary>
                  <pre className="text-xs mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
