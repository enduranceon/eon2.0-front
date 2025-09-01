'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useImmediatePhotoUpdate } from '../hooks/useImmediatePhotoUpdate';

export const HookTest: React.FC = () => {
  const { user } = useAuth();

  console.log('🔧 HookTest: Componente renderizado', {
    userId: user?.id,
    hasUser: !!user,
    timestamp: new Date().toISOString()
  });

  // Hook para atualização imediata
  const { forceUpdate, isConnected } = useImmediatePhotoUpdate({
    userId: user?.id || '',
    onPhotoUpdate: (newPhotoUrl) => {
      console.log('🎯 HookTest: Callback executado!', newPhotoUrl);
    }
  });

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
        Teste do Hook
      </h2>

      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Usuário:</strong> {user.id}</p>
          <p><strong>WebSocket:</strong> {isConnected ? '✅ Conectado' : '❌ Desconectado'}</p>
        </div>
      </div>

      <button
        onClick={forceUpdate}
        disabled={!isConnected}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Forçar Atualização
      </button>
    </div>
  );
};
