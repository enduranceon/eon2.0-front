import { useCallback, useRef, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { UserPhotoUpdateEvent } from '../types/api';

interface UseImmediatePhotoUpdateOptions {
  userId: string;
  onPhotoUpdate?: (photoUrl: string) => void;
}

/**
 * Hook para forçar atualização imediata de foto via WebSocket
 * Este hook é otimizado para atualizações instantâneas
 */
export const useImmediatePhotoUpdate = (options: UseImmediatePhotoUpdateOptions) => {
  const { userId, onPhotoUpdate } = options;
  const { lastPhotoUpdate, socket } = useWebSocket();
  const lastProcessedUpdate = useRef<string | null>(null);

  console.log('🔧 useImmediatePhotoUpdate: Hook inicializado', {
    userId,
    hasOnPhotoUpdate: !!onPhotoUpdate,
    hasLastPhotoUpdate: !!lastPhotoUpdate,
    timestamp: new Date().toISOString()
  });



  // Processar atualização quando receber evento (usando useEffect)
  useEffect(() => {
    console.log('🔧 useImmediatePhotoUpdate: useEffect executado', {
      hasLastPhotoUpdate: !!lastPhotoUpdate,
      lastPhotoUpdateUserId: lastPhotoUpdate?.userId,
      targetUserId: userId,
      isMatch: lastPhotoUpdate?.userId === userId,
      timestamp: new Date().toISOString()
    });

    if (lastPhotoUpdate && lastPhotoUpdate.userId === userId) {
      console.log('🎯 Evento de foto recebido para usuário correto:', userId);
      console.log('📋 Dados do evento:', lastPhotoUpdate);
      
      // Evitar processamento duplicado
      const updateKey = `${lastPhotoUpdate.userId}-${lastPhotoUpdate.updatedAt}`;
      if (lastProcessedUpdate.current === updateKey) {
        console.log('⚠️ Atualização duplicada ignorada:', updateKey);
        return;
      }
      
      lastProcessedUpdate.current = updateKey;
      
      console.log('⚡ Atualização imediata de foto processada:', lastPhotoUpdate);
      
      // Chamar callback imediatamente
      if (onPhotoUpdate) {
        console.log('📞 Chamando callback onPhotoUpdate com URL:', lastPhotoUpdate.imageUrl);
        onPhotoUpdate(lastPhotoUpdate.imageUrl);
      } else {
        console.log('⚠️ Nenhum callback onPhotoUpdate definido');
      }
    } else if (lastPhotoUpdate) {
      console.log('🔍 Evento de foto recebido, mas para outro usuário:', {
        eventUserId: lastPhotoUpdate.userId,
        targetUserId: userId
      });
    } else {
      console.log('🔍 Nenhum lastPhotoUpdate disponível');
    }
  }, [lastPhotoUpdate, userId, onPhotoUpdate]);

  // Função para forçar atualização manual
  const forceUpdate = useCallback(() => {
    if (socket && socket.connected) {
      console.log('🔄 Forçando atualização de foto para usuário:', userId);
      socket.emit('request:photo:update', { userId });
    } else {
      console.log('❌ Socket não conectado - não é possível forçar atualização');
    }
  }, [socket, userId]);

  return {
    forceUpdate,
    isConnected: socket?.connected || false,
  };
};
