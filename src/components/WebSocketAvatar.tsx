'use client';

import React, { useState } from 'react';
import { Avatar as MuiAvatar, AvatarProps as MuiAvatarProps } from '@mui/material';
import { User } from '../types/api';

interface WebSocketAvatarProps extends Omit<MuiAvatarProps, 'src'> {
  userId: string;
  user?: User;
  defaultPhoto?: string;
  showUpdateIndicator?: boolean;
}

/**
 * Componente Avatar que integra com WebSocket para atualizações em tempo real
 * Substitui o Avatar do Material-UI com funcionalidade de atualização automática
 */
export const WebSocketAvatar: React.FC<WebSocketAvatarProps> = ({
  userId,
  user,
  defaultPhoto,
  showUpdateIndicator = true,
  sx,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  
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
  
  // Usar foto do usuário ou foto padrão
  const userPhoto = user?.image || defaultPhoto;
  const photoUrl = getAbsoluteImageUrl(userPhoto);
  
  // Texto de fallback baseado no nome do usuário
  const fallbackText = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  // Estilos do avatar com indicador de atualização
  const avatarSx = {
    ...sx,
    position: 'relative' as const,
    ...(showUpdateIndicator && {
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: '20%',
        height: '20%',
        backgroundColor: '#4ade80',
        borderRadius: '50%',
        border: '2px solid white',
        animation: 'pulse 2s infinite',
        zIndex: 1,
      },
    }),
  };

  return (
    <MuiAvatar
      {...props}
      src={photoUrl && !imageError ? photoUrl : undefined}
      sx={avatarSx as any}
      imgProps={{
        onError: handleImageError,
        onLoad: handleImageLoad,
        ...props.imgProps,
      }}
    >
      {!photoUrl || imageError ? fallbackText : props.children}
    </MuiAvatar>
  );
};

export default WebSocketAvatar;