'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';

export const DirectPhotoTest: React.FC = () => {
  const { user } = useAuth();
  const { lastPhotoUpdate, isConnected } = useWebSocket();
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(user?.image || null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  // Monitorar lastPhotoUpdate diretamente
  useEffect(() => {
    if (lastPhotoUpdate) {
      addLog(`📸 lastPhotoUpdate recebido: ${lastPhotoUpdate.userId} - ${lastPhotoUpdate.imageUrl}`);
      
      // Verificar se é para o usuário atual
      if (lastPhotoUpdate.userId === user?.id) {
        addLog(`✅ Evento é para o usuário atual!`);
        addLog(`🔄 Atualizando foto para: ${lastPhotoUpdate.imageUrl}`);
        setCurrentPhoto(lastPhotoUpdate.imageUrl);
      } else {
        addLog(`❌ Evento é para outro usuário: ${lastPhotoUpdate.userId}`);
      }
    }
  }, [lastPhotoUpdate, user?.id]);

  const clearLogs = () => {
    setLogs([]);
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
        Teste Direto de Foto
      </h2>

      {/* Status */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>WebSocket:</strong> {isConnected ? '✅ Conectado' : '❌ Desconectado'}</p>
          <p><strong>Usuário:</strong> {user.id}</p>
          <p><strong>Foto atual:</strong> {currentPhoto || 'Nenhuma'}</p>
          <p><strong>lastPhotoUpdate:</strong> {lastPhotoUpdate ? 'Sim' : 'Não'}</p>
        </div>
      </div>

      {/* Avatar simples */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Avatar Atual
        </h3>
        {currentPhoto ? (
          <img
            src={currentPhoto}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover border-2 border-green-500"
            onError={() => addLog('❌ Erro ao carregar imagem')}
            onLoad={() => addLog('✅ Imagem carregada com sucesso')}
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600">?</span>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Limpar Logs
        </button>
      </div>

      {/* Logs */}
      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Logs ({logs.length})
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhum log ainda
            </p>
          ) : (
            logs.map((log, index) => (
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
    </div>
  );
};
