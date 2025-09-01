'use client';

import React from 'react';
import { WebSocketTestComponent } from '@/components/WebSocketTestComponent';

export default function WebSocketTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Teste de WebSocket
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Página de teste para verificar a funcionalidade do WebSocket e atualização de fotos em tempo real.
          </p>
        </div>

        <WebSocketTestComponent />
      </div>
    </div>
  );
}
