'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRealTimePhoto } from '../hooks/useRealTimePhoto';
import { User } from '../types/api';

interface AvatarProps {
  userId: string;
  user?: User;
  defaultPhoto?: string;
  size?: number;
  className?: string;
  showOnlineStatus?: boolean;
  showUpdateIndicator?: boolean;
  fallbackText?: string;
  onClick?: () => void;
  priority?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  userId,
  user,
  defaultPhoto,
  size = 40,
  className = '',
  showOnlineStatus = false,
  showUpdateIndicator = true,
  fallbackText,
  onClick,
  priority = false,
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Usar foto do usuário ou foto padrão
  const userPhoto = user?.image || defaultPhoto;
  
  // Hook para atualização em tempo real
  const { currentPhoto, isPhotoUpdated } = useRealTimePhoto({
    userId,
    defaultPhoto: userPhoto,
    onPhotoUpdate: (newPhotoUrl) => {
      // Resetar erro de imagem quando receber nova foto
      setImageError(false);
      console.log('🖼️ Avatar: Nova foto recebida:', newPhotoUrl);
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
            key={photoUrl} // Força re-render quando a URL mudar
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

      {/* Status online (placeholder para futura implementação) */}
      {showOnlineStatus && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900">
        </div>
      )}
    </div>
  );
};

// Componente Avatar simples para casos básicos
export const SimpleAvatar: React.FC<{
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}> = ({ src, alt = 'Avatar', size = 40, className = '' }) => {
  const [imageError, setImageError] = useState(false);

  const avatarClasses = `
    relative inline-flex items-center justify-center rounded-full overflow-hidden
    bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300
    font-medium select-none
    ${className}
  `.trim();

  const avatarStyle = {
    width: size,
    height: size,
    fontSize: size * 0.4,
  };

  return (
    <div className={avatarClasses} style={avatarStyle}>
      {src && !imageError ? (
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="object-cover w-full h-full"
          onError={() => setImageError(true)}
          unoptimized={src.startsWith('blob:') || src.startsWith('data:')}
        />
      ) : (
        <span className="text-current">?</span>
      )}
    </div>
  );
};

// Componente Avatar com loading state
export const AvatarWithLoading: React.FC<AvatarProps & {
  isLoading?: boolean;
}> = ({ isLoading = false, ...props }) => {
  if (isLoading) {
    return (
      <div 
        className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse ${props.className || ''}`}
        style={{ width: props.size || 40, height: props.size || 40 }}
      >
        <div className="w-full h-full bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
    );
  }

  return <Avatar {...props} />;
};
