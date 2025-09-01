'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';

export const DirectHookTest: React.FC = () => {
  const { user } = useAuth();
  const { lastPhotoUpdate, isConnected } = useWebSocket();

  console.log('🔧 DirectHookTest: Componente renderizado', {
    userId: user?.id,
    hasUser: !!user,
    hasLastPhotoUpdate: !!lastPhotoUpdate,
    isConnected,
    timestamp: new Date().toISOString()
  });

  // Teste direto do hook
  useEffect(() => {
    console.log('🔧 DirectHookTest: useEffect executado', {
      hasLastPhotoUpdate: !!lastPhotoUpdate,
      lastPhotoUpdateUserId: lastPhotoUpdate?.userId,
      targetUserId: user?.id,
      isMatch: lastPhotoUpdate?.userId === user?.id,
      timestamp: new Date().toISOString()
    });

    if (lastPhotoUpdate && lastPhotoUpdate.userId === user?.id) {
      console.log('🎯 DirectHookTest: Evento de foto recebido para usuário correto:', user?.id);
      console.log('📋 DirectHookTest: Dados do evento:', lastPhotoUpdate);
    } else if (lastPhotoUpdate) {
      console.log('🔍 DirectHookTest: Evento de foto recebido, mas para outro usuário:', {
        eventUserId: lastPhotoUpdate.userId,
        targetUserId: user?.id
      });
    } else {
      console.log('🔍 DirectHookTest: Nenhum lastPhotoUpdate disponível');
    }
  }, [lastPhotoUpdate, user?.id]);

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
        Teste Direto do Hook
      </h2>

      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Usuário:</strong> {user.id}</p>
          <p><strong>WebSocket:</strong> {isConnected ? '✅ Conectado' : '❌ Desconectado'}</p>
          <p><strong>lastPhotoUpdate:</strong> {lastPhotoUpdate ? 'Sim' : 'Não'}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Este componente testa o hook diretamente sem usar o useImmediatePhotoUpdate.
        Verifique os logs no console.
      </p>
    </div>
  );
};
