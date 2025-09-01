'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useImmediatePhotoUpdate } from '../hooks/useImmediatePhotoUpdate';
import { ImmediateAvatar } from './ImmediateAvatar';

export const PhotoUpdateTester: React.FC = () => {
  const { user } = useAuth();
  const { lastPhotoUpdate, isConnected } = useWebSocket();
  const [testLog, setTestLog] = useState<string[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(user?.image || null);

  // Hook para atualização imediata
  const { forceUpdate } = useImmediatePhotoUpdate({
    userId: user?.id || '',
    onPhotoUpdate: (newPhotoUrl) => {
      const logMessage = `🔄 Foto atualizada via hook: ${newPhotoUrl}`;
      console.log(logMessage);
      setTestLog(prev => [logMessage, ...prev.slice(0, 9)]);
      setCurrentPhoto(newPhotoUrl);
    }
  });

  // Monitorar eventos WebSocket
  useEffect(() => {
    if (lastPhotoUpdate) {
      const logMessage = `📸 Evento WebSocket recebido: ${JSON.stringify(lastPhotoUpdate, null, 2)}`;
      console.log(logMessage);
      setTestLog(prev => [logMessage, ...prev.slice(0, 9)]);
    }
  }, [lastPhotoUpdate]);

  // Log de mudanças de conexão
  useEffect(() => {
    const logMessage = `🔗 Conexão WebSocket: ${isConnected ? 'Conectado' : 'Desconectado'}`;
    console.log(logMessage);
    setTestLog(prev => [logMessage, ...prev.slice(0, 9)]);
  }, [isConnected]);

  const clearLog = () => {
    setTestLog([]);
  };

  const testForceUpdate = () => {
    console.log('🧪 Testando atualização forçada...');
    setTestLog(prev => ['🧪 Testando atualização forçada...', ...prev.slice(0, 9)]);
    forceUpdate();
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Usuário não autenticado</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Teste de Atualização de Foto
      </h2>

      {/* Informações do usuário */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Informações do Usuário
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Nome:</strong> {user.name}</p>
          <p><strong>Foto atual:</strong> {user.image || 'Nenhuma'}</p>
          <p><strong>Status WebSocket:</strong> {isConnected ? '✅ Conectado' : '❌ Desconectado'}</p>
        </div>
      </div>

      {/* Avatar de teste */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Avatar de Teste
        </h3>
        <div className="flex items-center gap-4">
          <ImmediateAvatar
            userId={user.id}
            user={user}
            size={80}
            showUpdateIndicator={true}
            className="ring-2 ring-green-200 dark:ring-green-800"
          />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Foto atual:</strong> {currentPhoto || 'Nenhuma'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Este avatar deve atualizar automaticamente quando receber eventos WebSocket
            </p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={testForceUpdate}
          disabled={!isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Forçar Atualização
        </button>
        <button
          onClick={clearLog}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Limpar Log
        </button>
      </div>

      {/* Log de eventos */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Log de Eventos ({testLog.length})
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {testLog.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhum evento registrado ainda
            </p>
          ) : (
            testLog.map((log, index) => (
              <div
                key={index}
                className="p-2 bg-white dark:bg-gray-800 rounded border text-xs font-mono"
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instruções */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Como testar:
        </h3>
        <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
          <li>Altere uma foto pelo app móvel</li>
          <li>Verifique se o evento aparece no log acima</li>
          <li>Verifique se o avatar é atualizado automaticamente</li>
          <li>Use o botão "Forçar Atualização" para testar manualmente</li>
        </ol>
      </div>
    </div>
  );
};
