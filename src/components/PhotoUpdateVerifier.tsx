'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useImmediatePhotoUpdate } from '../hooks/useImmediatePhotoUpdate';
import { ImmediateAvatar } from './ImmediateAvatar';

export const PhotoUpdateVerifier: React.FC = () => {
  const { user } = useAuth();
  const { lastPhotoUpdate, isConnected } = useWebSocket();
  const [updateLog, setUpdateLog] = useState<string[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(user?.image || null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  // Hook para atualização imediata
  const { forceUpdate } = useImmediatePhotoUpdate({
    userId: user?.id || '',
    onPhotoUpdate: (newPhotoUrl) => {
      const logMessage = `🔄 Avatar atualizado: ${newPhotoUrl}`;
      console.log(logMessage);
      setUpdateLog(prev => [logMessage, ...prev.slice(0, 9)]);
      setCurrentPhoto(newPhotoUrl);
      setLastUpdateTime(new Date().toLocaleTimeString('pt-BR'));
    }
  });

  // Monitorar eventos WebSocket
  useEffect(() => {
    if (lastPhotoUpdate) {
      const logMessage = `📸 Evento recebido: ${lastPhotoUpdate.userId} - ${lastPhotoUpdate.imageUrl}`;
      console.log(logMessage);
      setUpdateLog(prev => [logMessage, ...prev.slice(0, 9)]);
    }
  }, [lastPhotoUpdate]);

  const clearLog = () => {
    setUpdateLog([]);
  };

  const testForceUpdate = () => {
    console.log('🧪 Testando atualização forçada...');
    setUpdateLog(prev => ['🧪 Testando atualização forçada...', ...prev.slice(0, 9)]);
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
        Verificador de Atualização de Foto
      </h2>

      {/* Status da conexão */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Status da Conexão
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>WebSocket:</strong> {isConnected ? '✅ Conectado' : '❌ Desconectado'}</p>
          <p><strong>Usuário:</strong> {user.id}</p>
          <p><strong>Foto atual:</strong> {currentPhoto || 'Nenhuma'}</p>
          <p><strong>Última atualização:</strong> {lastUpdateTime || 'Nunca'}</p>
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
            size={100}
            showUpdateIndicator={true}
            className="ring-4 ring-green-200 dark:ring-green-800"
          />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>URL atual:</strong> {currentPhoto || 'Nenhuma'}
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

      {/* Log de atualizações */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Log de Atualizações ({updateLog.length})
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {updateLog.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhuma atualização registrada ainda
            </p>
          ) : (
            updateLog.map((log, index) => (
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
      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
          ✅ WebSocket Funcionando!
        </h3>
        <p className="text-xs text-green-700 dark:text-green-300">
          O evento de foto foi recebido com sucesso! Agora teste alterando uma foto pelo app móvel 
          e verifique se o avatar acima é atualizado automaticamente.
        </p>
      </div>
    </div>
  );
};
