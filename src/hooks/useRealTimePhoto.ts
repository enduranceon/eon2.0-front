import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { UserPhotoUpdateEvent } from '../types/api';

interface UseRealTimePhotoOptions {
  userId: string;
  defaultPhoto?: string;
  onPhotoUpdate?: (photoUrl: string) => void;
}

interface UseRealTimePhotoReturn {
  currentPhoto: string | null;
  isPhotoUpdated: boolean;
  lastUpdateTime: string | null;
  refreshPhoto: () => void;
}

/**
 * Hook para gerenciar atualizações de foto em tempo real via WebSocket
 * 
 * @param options - Configurações do hook
 * @returns Objeto com dados da foto atual e métodos de controle
 */
export const useRealTimePhoto = (options: UseRealTimePhotoOptions): UseRealTimePhotoReturn => {
  const { userId, defaultPhoto, onPhotoUpdate } = options;
  const { lastPhotoUpdate, isConnected } = useWebSocket();
  
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(defaultPhoto || null);
  const [isPhotoUpdated, setIsPhotoUpdated] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [lastProcessedUpdate, setLastProcessedUpdate] = useState<string | null>(null);

  // Atualizar foto quando receber evento WebSocket
  useEffect(() => {
    if (lastPhotoUpdate && lastPhotoUpdate.userId === userId) {
      // Criar chave única para evitar processamento duplicado
      const updateKey = `${lastPhotoUpdate.userId}-${lastPhotoUpdate.updatedAt}-${lastPhotoUpdate.imageUrl}`;
      
      // Verificar se já processamos esta atualização
      if (lastProcessedUpdate === updateKey) {
        console.log('⚠️ Atualização duplicada ignorada:', updateKey);
        return;
      }
      
      console.log('🔄 Atualizando foto em tempo real para usuário:', userId);
      
      // Marcar como processada
      setLastProcessedUpdate(updateKey);
      
      // Atualização imediata e síncrona
      setCurrentPhoto(lastPhotoUpdate.imageUrl);
      setIsPhotoUpdated(true);
      setLastUpdateTime(lastPhotoUpdate.updatedAt || lastPhotoUpdate.receivedAt);
      
      // Chamar callback imediatamente se fornecido
      if (onPhotoUpdate) {
        onPhotoUpdate(lastPhotoUpdate.imageUrl);
      }
      
      // Resetar flag de atualização após um tempo mais curto para feedback visual
      setTimeout(() => {
        setIsPhotoUpdated(false);
      }, 2000); // Reduzido de 3000ms para 2000ms
    }
  }, [lastPhotoUpdate, userId, lastProcessedUpdate]); // Adicionado lastProcessedUpdate

  // Função para forçar atualização da foto
  const refreshPhoto = useCallback(() => {
    if (defaultPhoto) {
      setCurrentPhoto(defaultPhoto);
      setIsPhotoUpdated(false);
      setLastUpdateTime(null);
    }
  }, [defaultPhoto]);

  // Resetar estado quando desconectar
  useEffect(() => {
    if (!isConnected) {
      setCurrentPhoto(defaultPhoto || null);
      setIsPhotoUpdated(false);
      setLastUpdateTime(null);
    }
  }, [isConnected, defaultPhoto]);

  return {
    currentPhoto,
    isPhotoUpdated,
    lastUpdateTime,
    refreshPhoto,
  };
};

/**
 * Hook simplificado para obter apenas a URL da foto atualizada
 * 
 * @param userId - ID do usuário
 * @param defaultPhoto - Foto padrão caso não haja atualização
 * @returns URL da foto atual
 */
export const useCurrentPhoto = (userId: string, defaultPhoto?: string): string | null => {
  const { currentPhoto } = useRealTimePhoto({ userId, defaultPhoto });
  return currentPhoto;
};

/**
 * Hook para detectar se uma foto foi atualizada recentemente
 * 
 * @param userId - ID do usuário
 * @returns Objeto com informações sobre atualizações
 */
export const usePhotoUpdateStatus = (userId: string) => {
  const { isPhotoUpdated, lastUpdateTime } = useRealTimePhoto({ userId });
  
  return {
    isPhotoUpdated,
    lastUpdateTime,
    hasRecentUpdate: isPhotoUpdated || (lastUpdateTime && 
      new Date().getTime() - new Date(lastUpdateTime).getTime() < 10000), // 10 segundos
  };
};
