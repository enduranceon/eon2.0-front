'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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

/**
 * Componente Avatar otimizado para Next.js com suporte a WebSocket
 * Usa Next.js Image para otimização automática
 */
export const Avatar: React.FC<AvatarProps> = ({
  userId,
  user,
  defaultPhoto,
  size = 40,
  className = '',
  showOnlineStatus = false,
  showUpdateIndicator = false,
  fallbackText,
  onClick,
  priority = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Função para obter URL absoluta da imagem
  const getAbsoluteImageUrl = (url: string | undefined | null): string | undefined => {
    if (!url) return undefined;
    if (/^(https?|blob):/.test(url)) {
      return url;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const origin = new URL(apiUrl).origin;

    let imagePath = url;
    
    if (imagePath.startsWith('/api/')) {
      imagePath = imagePath.substring(5);
    }
    if (imagePath.startsWith('/')) {
      imagePath = imagePath.substring(1);
    }
    
    const finalPath = `/api/${imagePath.startsWith('uploads') ? '' : 'uploads/'}${imagePath}`;
    
    return `${origin}${finalPath.replace('/api//', '/api/')}`;
  };

  // Determinar qual foto usar
  const userPhoto = user?.image || defaultPhoto;
  const photoUrl = getAbsoluteImageUrl(userPhoto);
  
  // Texto de fallback
  const displayFallbackText = fallbackText || (user?.name ? user.name.charAt(0).toUpperCase() : '?');

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleImageLoad = () => {
    setImageError(false);
    setImageLoaded(true);
  };

  const avatarSize = size;
  const indicatorSize = Math.max(8, size * 0.2);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Avatar principal */}
      <div 
        className="relative overflow-hidden rounded-full bg-gray-200 flex items-center justify-center"
        style={{ width: avatarSize, height: avatarSize }}
      >
        {photoUrl && !imageError ? (
          <Image
            src={photoUrl}
            alt={user?.name || 'Avatar'}
            width={avatarSize}
            height={avatarSize}
            className="object-cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
            priority={priority}
            unoptimized={photoUrl.startsWith('blob:')}
          />
        ) : (
          <div 
            className="flex items-center justify-center text-gray-600 font-medium"
            style={{ fontSize: avatarSize * 0.4 }}
          >
            {displayFallbackText}
          </div>
        )}

        {/* Indicador de atualização */}
        {showUpdateIndicator && imageLoaded && (
          <div 
            className="absolute top-0 right-0 bg-green-500 rounded-full border-2 border-white animate-pulse"
            style={{ 
              width: indicatorSize, 
              height: indicatorSize,
              animation: 'pulse 2s infinite'
            }}
          />
        )}
      </div>

      {/* Status online */}
      {showOnlineStatus && (
        <div 
          className="absolute bottom-0 right-0 bg-green-500 rounded-full border-2 border-white"
          style={{ 
            width: indicatorSize, 
            height: indicatorSize 
          }}
        />
      )}
    </div>
  );
};

export default Avatar;