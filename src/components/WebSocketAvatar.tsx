'use client';

import React, { useState, useCallback } from 'react';
import { Avatar as MuiAvatar, AvatarProps as MuiAvatarProps } from '@mui/material';
import { useRealTimePhoto } from '../hooks/useRealTimePhoto';
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
  
  // Callback estável para evitar loops
  const handlePhotoUpdate = useCallback((newPhotoUrl: string) => {
    // Resetar erro de imagem quando receber nova foto
    setImageError(false);
    console.log('🖼️ WebSocketAvatar: Nova foto recebida:', newPhotoUrl);
  }, []);
  
  // Hook para atualização em tempo real
  const { currentPhoto, isPhotoUpdated } = useRealTimePhoto({
    userId,
    defaultPhoto: userPhoto,
    onPhotoUpdate: handlePhotoUpdate,
  });

  // Determinar qual foto usar e processar URL
  const rawPhotoUrl = currentPhoto || userPhoto;
  const photoUrl = getAbsoluteImageUrl(rawPhotoUrl);
  
  // Texto de fallback baseado no nome do usuário
  const fallbackText = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  // Estilos customizados para indicador de atualização
  const avatarSx = {
    ...sx,
    position: 'relative',
    ...(showUpdateIndicator && isPhotoUpdated && {
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '-2px',
        right: '-2px',
        width: '12px',
        height: '12px',
        backgroundColor: '#4CAF50',
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
      sx={avatarSx}
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
