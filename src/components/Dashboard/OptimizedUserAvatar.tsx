'use client';

import React from 'react';
import { WebSocketAvatar } from '../WebSocketAvatar';
import { WebSocketStatusIndicator } from './WebSocketStatusIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BellIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

interface OptimizedUserAvatarProps {
  className?: string;
  showStatus?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
}

export const OptimizedUserAvatar: React.FC<OptimizedUserAvatarProps> = ({
  className = '',
  showStatus = true,
  showNotifications = true,
  showSettings = true,
  onProfileClick,
  onNotificationsClick,
  onSettingsClick,
}) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Status do WebSocket */}
      {showStatus && (
        <WebSocketStatusIndicator 
          size="sm" 
          showText={false}
          className="hidden sm:flex"
        />
      )}

      {/* Notificações */}
      {showNotifications && (
        <button
          onClick={onNotificationsClick}
          className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="Notificações"
        >
          <BellIcon className="w-5 h-5" />
          {/* Indicador de notificação */}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>
      )}

      {/* Configurações */}
      {showSettings && (
        <button
          onClick={onSettingsClick}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="Configurações"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      )}

      {/* Avatar do usuário otimizado */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.userType === 'FITNESS_STUDENT' ? 'Aluno' : 
             user.userType === 'COACH' ? 'Treinador' : 'Admin'}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
            ⚡ Atualização Instantânea
          </p>
        </div>
        
        <button
          onClick={onProfileClick}
          className="relative group"
          aria-label="Perfil do usuário"
        >
          <WebSocketAvatar
            userId={user.id}
            user={user}
            showUpdateIndicator={true}
            sx={{ width: 40, height: 40 }}
            className="ring-2 ring-transparent group-hover:ring-green-200 dark:group-hover:ring-green-800 transition-all"
          />
        </button>
      </div>

      {/* Status do WebSocket (versão mobile) */}
      {showStatus && (
        <WebSocketStatusIndicator 
          size="sm" 
          showText={false}
          className="sm:hidden"
        />
      )}
    </div>
  );
};
