'use client';

import React from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { 
  WifiIcon, 
  WifiSlashIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface WebSocketStatusIndicatorProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const WebSocketStatusIndicator: React.FC<WebSocketStatusIndicatorProps> = ({
  className = '',
  showText = true,
  size = 'md',
}) => {
  const { isConnected, connectionStatus } = useWebSocket();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-4 h-4';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-base';
      default:
        return 'text-sm';
    }
  };

  const getStatusInfo = () => {
    if (isConnected) {
      return {
        icon: WifiIcon,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        text: 'Conectado',
        description: 'Conexão em tempo real ativa'
      };
    }

    if (connectionStatus.reconnectAttempts > 0) {
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'Reconectando',
        description: `Tentativa ${connectionStatus.reconnectAttempts}/${connectionStatus.maxReconnectAttempts}`
      };
    }

    return {
      icon: WifiSlashIcon,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      text: 'Desconectado',
      description: 'Conexão em tempo real inativa'
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`p-1 rounded-full ${statusInfo.bgColor}`}>
        <Icon className={`${getSizeClasses()} ${statusInfo.color}`} />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-medium ${getTextSizeClasses()} ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
          <span className={`text-xs text-gray-500 dark:text-gray-400`}>
            {statusInfo.description}
          </span>
        </div>
      )}
    </div>
  );
};
