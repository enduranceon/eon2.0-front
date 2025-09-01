'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const SimpleHookTest: React.FC = () => {
  const { user } = useAuth();

  console.log('🧪 SimpleHookTest: Componente renderizado', {
    userId: user?.id,
    hasUser: !!user,
    timestamp: new Date().toISOString()
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
        Teste Simples do Hook
      </h2>

      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Usuário:</strong> {user.id}</p>
          <p><strong>Status:</strong> Componente renderizado com sucesso</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Este componente deve aparecer no console com o log: 🧪 SimpleHookTest: Componente renderizado
      </p>
    </div>
  );
};
