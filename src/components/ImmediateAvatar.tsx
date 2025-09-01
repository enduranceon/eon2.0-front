'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useImmediatePhotoUpdate } from '../hooks/useImmediatePhotoUpdate';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/api';

interface ImmediateAvatarProps {
  userId: string;
  user?: User;
  defaultPhoto?: string;
  size?: number;
  className?: string;
  showUpdateIndicator?: boolean;
  fallbackText?: string;
  onClick?: () => void;
  priority?: boolean;
}

export const ImmediateAvatar: React.FC<ImmediateAvatarProps> = ({
  userId,
  user,
  defaultPhoto,
  size = 40,
  className = '',
  showUpdateIndicator = true,
  fallbackText,
  onClick,
  priority = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(user?.image || defaultPhoto || null);
  const [isPhotoUpdated, setIsPhotoUpdated] = useState(false);
  const [updateTimestamp, setUpdateTimestamp] = useState<number>(0);
  
  // Usar foto do usuário ou foto padrão
  const userPhoto = user?.image || defaultPhoto;
  
  // Hook para atualização imediata
  const { forceUpdate, isConnected } = useImmediatePhotoUpdate({
    userId,
    onPhotoUpdate: (newPhotoUrl) => {
      console.log('⚡ Avatar: Atualização imediata recebida:', newPhotoUrl);
      
      // Atualizar imediatamente
      setCurrentPhoto(newPhotoUrl);
      setImageError(false);
      setIsPhotoUpdated(true);
      setUpdateTimestamp(Date.now());
      
      // Resetar indicador após 2 segundos
      setTimeout(() => {
        setIsPhotoUpdated(false);
      }, 2000);
    },
  });

  // Determinar qual foto usar
  const photoUrl = currentPhoto || userPhoto;
  
  // Texto de fallback baseado no nome do usuário
  const fallback = fallbackText || (user?.name ? user.name.charAt(0).toUpperCase() : '?');

  // Classes CSS
  const avatarClasses = `
    relative inline-flex items-center justify-center rounded-full overflow-hidden
    bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300
    font-medium select-none
    ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
    ${className}
  `.trim();

  // Estilos inline para tamanho
  const avatarStyle = {
    width: size,
    height: size,
    fontSize: size * 0.4, // Tamanho da fonte baseado no tamanho do avatar
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  // Forçar atualização quando a conexão for restabelecida
  useEffect(() => {
    if (isConnected && userId) {
      // Pequeno delay para garantir que a conexão esteja estável
      const timer = setTimeout(() => {
        forceUpdate();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, userId]); // Removido forceUpdate das dependências

  return (
    <div className="relative">
      <div
        className={avatarClasses}
        style={avatarStyle}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        } : undefined}
      >
        {photoUrl && !imageError ? (
          <Image
            key={`${photoUrl}-${updateTimestamp}`} // Key única para forçar re-render
            src={photoUrl}
            alt={`Avatar de ${user?.name || 'usuário'}`}
            width={size}
            height={size}
            className="object-cover w-full h-full"
            onError={handleImageError}
            onLoad={handleImageLoad}
            priority={priority}
            unoptimized={photoUrl.startsWith('blob:') || photoUrl.startsWith('data:')}
          />
        ) : (
          <span className="text-current">
            {fallback}
          </span>
        )}
      </div>

      {/* Indicador de atualização em tempo real */}
      {showUpdateIndicator && isPhotoUpdated && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse">
          <div className="w-full h-full bg-green-400 rounded-full animate-ping"></div>
        </div>
      )}

      {/* Indicador de conexão WebSocket */}
      {!isConnected && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900">
        </div>
      )}
    </div>
  );
};
