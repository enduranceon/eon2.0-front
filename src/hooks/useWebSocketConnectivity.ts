import { useEffect, useState } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';

interface ConnectivityStatus {
  isConnected: boolean;
  socketId: string | null;
  lastConnected: string | null;
  lastDisconnected: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  userId: string | null;
  websocketUrl: string;
}

/**
 * Hook para monitorar a conectividade WebSocket em tempo real
 */
export const useWebSocketConnectivity = () => {
  const { user } = useAuth();
  const { 
    isConnected, 
    connectionStatus, 
    socket 
  } = useWebSocket();
  
  const [connectivityStatus, setConnectivityStatus] = useState<ConnectivityStatus>({
    isConnected: false,
    socketId: null,
    lastConnected: null,
    lastDisconnected: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    userId: null,
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001'
  });

  // Atualizar status de conectividade
  useEffect(() => {
    const newStatus: ConnectivityStatus = {
      isConnected,
      socketId: socket?.id || null,
      lastConnected: connectionStatus.lastConnected || null,
      lastDisconnected: connectionStatus.lastDisconnected || null,
      reconnectAttempts: connectionStatus.reconnectAttempts,
      maxReconnectAttempts: connectionStatus.maxReconnectAttempts,
      userId: user?.id || null,
      websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001'
    };

    setConnectivityStatus(newStatus);

    // Log detalhado de mudanças de conectividade
    console.log('📡 Status de Conectividade WebSocket:', {
      ...newStatus,
      timestamp: new Date().toISOString(),
      socketConnected: socket?.connected,
      socketDisconnected: socket?.disconnected
    });
  }, [
    isConnected, 
    socket?.id, 
    socket?.connected, 
    socket?.disconnected,
    connectionStatus.lastConnected, 
    connectionStatus.lastDisconnected, 
    connectionStatus.reconnectAttempts, 
    connectionStatus.maxReconnectAttempts,
    user?.id
  ]);

  // Verificar se há problemas de conectividade
  const hasConnectivityIssues = () => {
    if (!isConnected) return true;
    if (connectionStatus.reconnectAttempts > 0) return true;
    if (!socket?.connected) return true;
    return false;
  };

  // Obter status de saúde da conexão
  const getHealthStatus = () => {
    if (!isConnected) return 'disconnected';
    if (connectionStatus.reconnectAttempts > 0) return 'reconnecting';
    if (socket?.connected) return 'healthy';
    return 'unhealthy';
  };

  // Verificar se o usuário está na sala correta
  const isUserInCorrectRoom = () => {
    return isConnected && socket?.connected && user?.id;
  };

  return {
    connectivityStatus,
    hasConnectivityIssues: hasConnectivityIssues(),
    healthStatus: getHealthStatus(),
    isUserInCorrectRoom: isUserInCorrectRoom(),
    socket,
    user
  };
};
