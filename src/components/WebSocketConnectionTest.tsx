'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';

export const WebSocketConnectionTest: React.FC = () => {
  const { user } = useAuth();
  const { 
    isConnected, 
    connectionStatus, 
    socket,
    connect,
    disconnect,
    ping 
  } = useWebSocket();
  
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addTestResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setTestResults(prev => [`[${timestamp}] ${result}`, ...prev.slice(0, 9)]);
  };

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    addTestResult('🧪 Iniciando teste de conexão WebSocket...');
    
    // Teste 1: Verificar autenticação
    if (user?.id) {
      addTestResult(`✅ Usuário autenticado: ${user.id.substring(0, 8)}...`);
    } else {
      addTestResult('❌ Usuário não autenticado');
      setIsTesting(false);
      return;
    }

    // Teste 2: Verificar token
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      addTestResult(`✅ Token encontrado: ${token.substring(0, 20)}...`);
    } else {
      addTestResult('❌ Token não encontrado');
      setIsTesting(false);
      return;
    }

    // Teste 3: Verificar URL
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
    addTestResult(`✅ URL WebSocket: ${websocketUrl}`);

    // Teste 4: Tentar conectar
    if (!isConnected) {
      addTestResult('🔄 Tentando conectar...');
      connect();
      
      // Aguardar um pouco para a conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Teste 5: Verificar conexão
    if (isConnected && socket?.connected) {
      addTestResult(`✅ Conectado! Socket ID: ${socket.id?.substring(0, 8)}...`);
      
      // Teste 6: Teste de ping
      addTestResult('🏓 Enviando ping...');
      ping();
      
      // Aguardar resposta
      await new Promise(resolve => setTimeout(resolve, 1000));
      addTestResult('✅ Ping enviado');
      
    } else {
      addTestResult('❌ Falha na conexão');
      addTestResult(`Status: ${isConnected ? 'Conectado' : 'Desconectado'}`);
      addTestResult(`Socket: ${socket?.connected ? 'Ativo' : 'Inativo'}`);
    }

    setIsTesting(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Teste de Conexão WebSocket
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
          <div>
            <span className="text-gray-600 dark:text-gray-400">Tentativas:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {connectionStatus.reconnectAttempts}
            </span>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={runConnectionTest}
          disabled={isTesting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isTesting ? 'Testando...' : 'Executar Teste'}
        </button>
        <button
          onClick={clearResults}
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

      {/* Resultados do teste */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Resultados do Teste ({testResults.length})
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Execute o teste para ver os resultados
            </p>
          ) : (
            testResults.map((result, index) => (
              <div
                key={index}
                className="p-2 bg-white dark:bg-gray-800 rounded border text-xs font-mono"
              >
                {result}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
