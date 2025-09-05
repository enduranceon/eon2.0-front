'use client';

import React, { useState, useEffect } from 'react';
import { Avatar as MuiAvatar, AvatarProps as MuiAvatarProps, Box } from '@mui/material';
import { User } from '../types/api';

interface WebSocketAvatarProps extends Omit<MuiAvatarProps, 'src'> {
  userId: string;
  user?: User;
  defaultPhoto?: string;
  showUpdateIndicator?: boolean;
  indicatorPosition?: 'top' | 'bottom';
  indicatorSize?: 'small' | 'medium' | 'large';
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
  indicatorPosition = 'top',
  indicatorSize = 'medium',
  sx,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Forçar re-renderização quando o usuário ou a imagem mudarem
  useEffect(() => {
    // Reset states when user changes
    setImageError(false);
    setIsImageLoaded(false);
    setRetryCount(0);
    
    // Aguardar um pequeno delay para garantir que os dados do usuário estejam consistentes
    if (user?.id && user?.image) {
      const timer = setTimeout(() => {
        setForceUpdate(prev => prev + 1);
      }, 100); // Pequeno delay de 100ms para evitar condição de corrida
      
      return () => clearTimeout(timer);
    }
  }, [user?.image, user?.id]);

  // Sistema de retry para carregar a imagem
  useEffect(() => {
    if (user?.image && imageError && retryCount < 3) {
      const timer = setTimeout(() => {
        setImageError(false);
        setForceUpdate(prev => prev + 1);
        setRetryCount(prev => prev + 1);
      }, 1000 * (retryCount + 1)); // Delay crescente: 1s, 2s, 3s
      
      return () => clearTimeout(timer);
    }
  }, [user?.image, imageError, retryCount]);
  
  // Função para obter URL absoluta da imagem
  const getAbsoluteImageUrl = (url: string | undefined | null): string | undefined => {
    if (!url) return undefined;
    
    // Se já é uma URL completa (http/https), retornar diretamente
    if (/^(https?|blob):/.test(url)) {
      return url;
    }

    // Se é um caminho relativo, processar
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
  const basePhotoUrl = getAbsoluteImageUrl(userPhoto);
  const photoUrl = basePhotoUrl ? `${basePhotoUrl}${basePhotoUrl.includes('?') ? '&' : '?'}v=${forceUpdate}` : undefined;
  
  // Se a imagem do usuário já é uma URL completa, usar diretamente
  const finalImageUrl = user?.image && /^(https?|blob):/.test(user.image) 
    ? `${user.image}${user.image.includes('?') ? '&' : '?'}v=${forceUpdate}`
    : photoUrl;
  

  // Debug: log da URL da imagem
  useEffect(() => {
    if (user?.image) {
      // Image URL is available
    }
  }, [user?.image, finalImageUrl]);
  
  
  // Texto de fallback baseado no nome do usuário
  const fallbackText = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  const handleImageError = () => {
    setImageError(true);
    setIsImageLoaded(false);
  };

  const handleImageLoad = () => {
    setImageError(false);
    setIsImageLoaded(true);
    setRetryCount(0); // Reset retry count on successful load
  };

  // Estilos do avatar
  const avatarSx = {
    ...sx,
  };

  // Calcular estilos do indicador baseado nas props
  const getIndicatorStyles = () => {
    const sizeMap = {
      small: { width: '12px', height: '12px' },
      medium: { width: '16px', height: '16px' },
      large: { width: '20px', height: '20px' },
    };

    const positionMap = {
      top: { top: '-4px', right: '-4px' },
      bottom: { bottom: '-4px', right: '-4px' },
    };

    return {
      ...sizeMap[indicatorSize],
      ...positionMap[indicatorPosition],
    };
  };

  // Se não tiver dados do usuário, mostrar fallback
  if (!user?.id) {
    return (
      <MuiAvatar
        {...props}
        sx={avatarSx as any}
      >
        {fallbackText}
      </MuiAvatar>
    );
  }

  // Verificar se os dados do usuário estão consistentes antes de renderizar
  const isUserDataConsistent = user?.id && user?.name;
  
  if (!isUserDataConsistent) {
    return (
      <MuiAvatar
        {...props}
        sx={avatarSx as any}
      >
        {fallbackText}
      </MuiAvatar>
    );
  }

  // Se a imagem está undefined ou null, mostrar fallback até que seja carregada
  if (!user?.image || user?.image === undefined || user?.image === null) {
    return (
      <MuiAvatar
        {...props}
        sx={avatarSx as any}
      >
        {fallbackText}
      </MuiAvatar>
    );
  }

  const indicatorStyles = getIndicatorStyles();

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-block',
        ...(showUpdateIndicator && {
          '&::after': {
            content: '""',
            position: 'absolute',
            ...indicatorStyles,
            backgroundColor: '#4ade80',
            borderRadius: '50%',
            border: '2px solid white',
            animation: 'pulse 2s infinite',
            zIndex: 10,
            boxShadow: '0 0 0 2px rgba(74, 222, 128, 0.3)',
          },
        }),
      }}
    >
      <MuiAvatar
        {...props}
        key={`${userId}-${forceUpdate}`}
        src={finalImageUrl && !imageError ? finalImageUrl : undefined}
        sx={avatarSx as any}
        imgProps={{
          onError: handleImageError,
          onLoad: handleImageLoad,
          ...props.imgProps,
        }}
      >
        {!finalImageUrl || imageError ? fallbackText : props.children}
      </MuiAvatar>
    </Box>
  );
};

export default WebSocketAvatar;