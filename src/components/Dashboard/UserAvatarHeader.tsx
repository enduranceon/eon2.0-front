'use client';

import React from 'react';
import { Avatar } from '@/components/Avatar';
import { WebSocketStatusIndicator } from './WebSocketStatusIndicator';
import { useAuth } from '@/contexts/AuthContext';
// Hook removido - usando apenas Avatar simples
import { 
  UserCircleIcon,
  BellIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

interface UserAvatarHeaderProps {
  className?: string;
  showStatus?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
}

export const UserAvatarHeader: React.FC<UserAvatarHeaderProps> = ({
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
          {/* Indicador de notificação (pode ser expandido futuramente) */}
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

      {/* Avatar do usuário */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {user.userType === 'FITNESS_STUDENT' ? 'Aluno' : 
             user.userType === 'COACH' ? 'Treinador' : 'Admin'}
          </p>
        </div>
        
        <button
          onClick={onProfileClick}
          className="relative group"
          aria-label="Perfil do usuário"
        >
          <Avatar
            userId={user.id}
            user={user}
            size={40}
            showUpdateIndicator={true}
            className="ring-2 ring-transparent group-hover:ring-blue-200 dark:group-hover:ring-blue-800 transition-all"
          />
          
          {/* Indicador de foto atualizada removido para produção */}
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
