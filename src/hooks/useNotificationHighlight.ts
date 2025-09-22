'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export interface HighlightInfo {
  type: 'test' | 'exam' | 'plan' | 'user' | 'payment' | 'subscription' | null;
  id: string | null;
  name: string | null;
  timestamp: number | null;
  isActive: boolean;
}

/**
 * Hook para gerenciar destaque de itens baseado em notificações
 * Detecta parâmetros da URL vindos de redirecionamentos de notificações
 */
export const useNotificationHighlight = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [highlightInfo, setHighlightInfo] = useState<HighlightInfo>({
    type: null,
    id: null,
    name: null,
    timestamp: null,
    isActive: false,
  });

  // Detectar parâmetros de destaque na URL
  useEffect(() => {
    const highlightTest = searchParams.get('highlightTest');
    const highlightTestByTime = searchParams.get('highlightTestByTime');
    const testTimestamp = searchParams.get('testTimestamp');
    const highlightExam = searchParams.get('highlightExam');
    const highlightPlan = searchParams.get('highlightPlan');
    const highlightUser = searchParams.get('highlightUser');
    const highlightPayment = searchParams.get('highlightPayment');
    const highlightSubscription = searchParams.get('highlightSubscription');
    
    const testName = searchParams.get('testName');
    const examName = searchParams.get('examName');
    const planName = searchParams.get('planName');
    const userName = searchParams.get('userName');
    const notificationTime = searchParams.get('notificationTime');

    let newHighlightInfo: HighlightInfo = {
      type: null,
      id: null,
      name: null,
      timestamp: null,
      isActive: false,
    };

    if (highlightTest) {
      newHighlightInfo = {
        type: 'test',
        id: highlightTest,
        name: testName,
        timestamp: notificationTime ? parseInt(notificationTime) : null,
        isActive: true,
      };
    } else if (highlightTestByTime) {
      newHighlightInfo = {
        type: 'test',
        id: highlightTestByTime, // testId para filtrar
        name: testName,
        timestamp: testTimestamp ? new Date(testTimestamp).getTime() : null,
        isActive: true,
      };
    } else if (highlightExam) {
      newHighlightInfo = {
        type: 'exam',
        id: highlightExam,
        name: examName,
        timestamp: notificationTime ? parseInt(notificationTime) : null,
        isActive: true,
      };
    } else if (highlightPlan) {
      newHighlightInfo = {
        type: 'plan',
        id: highlightPlan,
        name: planName,
        timestamp: notificationTime ? parseInt(notificationTime) : null,
        isActive: true,
      };
    } else if (highlightUser) {
      newHighlightInfo = {
        type: 'user',
        id: highlightUser,
        name: userName,
        timestamp: notificationTime ? parseInt(notificationTime) : null,
        isActive: true,
      };
    } else if (highlightPayment) {
      newHighlightInfo = {
        type: 'payment',
        id: highlightPayment,
        name: null,
        timestamp: notificationTime ? parseInt(notificationTime) : null,
        isActive: true,
      };
    } else if (highlightSubscription) {
      newHighlightInfo = {
        type: 'subscription',
        id: highlightSubscription,
        name: null,
        timestamp: notificationTime ? parseInt(notificationTime) : null,
        isActive: true,
      };
    }

    setHighlightInfo(newHighlightInfo);

    // Auto-remover destaque após 10 segundos
    if (newHighlightInfo.isActive) {
      const timer = setTimeout(() => {
        clearHighlight();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Limpar destaque e remover parâmetros da URL
  const clearHighlight = useCallback(() => {
    setHighlightInfo({
      type: null,
      id: null,
      name: null,
      timestamp: null,
      isActive: false,
    });

    // Remover parâmetros da URL sem recarregar a página
    const currentUrl = new URL(window.location.href);
    const params = currentUrl.searchParams;
    
    // Lista de parâmetros relacionados a notificações
    const notificationParams = [
      'highlightTest',
      'highlightTestByTime',
      'testTimestamp',
      'highlightExam', 
      'highlightPlan',
      'highlightUser',
      'highlightPayment',
      'highlightSubscription',
      'testName',
      'examName',
      'planName',
      'userName',
      'notificationTime'
    ];

    let hasChanges = false;
    notificationParams.forEach(param => {
      if (params.has(param)) {
        params.delete(param);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      const newUrl = `${currentUrl.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      router.replace(newUrl);
    }
  }, [router]);

  // Verificar se um item específico deve ser destacado
  const shouldHighlight = useCallback((itemId: string, itemType?: string, itemName?: string) => {
    if (!highlightInfo.isActive) return false;
    
    // Verificar tipo se especificado
    if (itemType && highlightInfo.type !== itemType) return false;
    
    // Verificar ID específico (match exato) - agora usando result.id
    if (highlightInfo.id && highlightInfo.id === itemId) {
      return true;
    }
    
    // Se temos um ID específico mas não houve match, NÃO usar fallback por nome
    if (highlightInfo.id) {
      return false;
    }
    
    // Fallback por nome APENAS quando NÃO temos ID específico (casos de debug/teste)
    if (!highlightInfo.id && highlightInfo.name && itemName && highlightInfo.name.toLowerCase().includes(itemName.toLowerCase())) {
      return true;
    }
    
    return false;
  }, [highlightInfo]);

  // Verificar se um teste deve ser destacado por timestamp (resultado mais recente)
  const shouldHighlightTestByTime = useCallback((testId: string, testName: string, itemTimestamp?: string | Date, testResults?: any[]) => {
    if (!highlightInfo.isActive || highlightInfo.type !== 'test') return false;
    
    // Se não é destaque por tempo, usar lógica normal
    if (!searchParams.get('highlightTestByTime')) {
      return shouldHighlight(testId, 'test', testName);
    }
    
    // Verificar se é o testId correto
    if (highlightInfo.id !== testId) return false;
    
    // Se temos timestamp do evento, encontrar o resultado mais recente deste teste
    if (highlightInfo.timestamp && testResults) {
      const eventTime = highlightInfo.timestamp;
      const tolerance = 60000; // 1 minuto de tolerância
      
      // Encontrar resultado criado próximo ao timestamp do evento
      const matchingResult = testResults.find((result: any) => {
        const resultTime = new Date(result.recordedAt || result.createdAt || result.timestamp).getTime();
        return Math.abs(resultTime - eventTime) <= tolerance;
      });
      
      // Se encontrou resultado correspondente, verificar se este item é o resultado
      if (matchingResult && itemTimestamp) {
        const itemTime = new Date(itemTimestamp).getTime();
        const matchTime = new Date(matchingResult.recordedAt || matchingResult.createdAt || matchingResult.timestamp).getTime();
        return Math.abs(itemTime - matchTime) <= 1000; // 1 segundo de tolerância
      }
    }
    
    return false;
  }, [highlightInfo, searchParams, shouldHighlight]);

  // Obter estilos de destaque para um item
  const getHighlightStyles = useCallback((itemId: string, itemType?: string) => {
    if (!shouldHighlight(itemId, itemType)) return {};

    return {
      backgroundColor: 'rgba(255, 128, 18, 0.1)', // Cor laranja suave
      border: '2px solid #FF8012', // Borda laranja
      borderRadius: '8px',
      boxShadow: '0 0 20px rgba(255, 128, 18, 0.3)',
      transition: 'all 0.3s ease',
      animation: 'highlight-pulse 2s ease-in-out infinite',
      position: 'relative' as const,
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '-2px',
        left: '-2px',
        right: '-2px',
        bottom: '-2px',
        background: 'linear-gradient(45deg, #FF8012, #FF6B00, #FF8012)',
        borderRadius: '10px',
        zIndex: -1,
        animation: 'highlight-border 3s ease-in-out infinite',
      }
    };
  }, [shouldHighlight]);

  // Obter props para componentes Material-UI
  const getHighlightProps = useCallback((itemId: string, itemType?: string) => {
    if (!shouldHighlight(itemId, itemType)) return {};

    return {
      sx: getHighlightStyles(itemId, itemType),
      'data-highlighted': 'true',
      'data-highlight-type': highlightInfo.type,
      'data-highlight-id': highlightInfo.id,
    };
  }, [shouldHighlight, getHighlightStyles, highlightInfo]);

  return {
    highlightInfo,
    shouldHighlight,
    shouldHighlightTestByTime,
    getHighlightStyles,
    getHighlightProps,
    clearHighlight,
    isHighlighting: highlightInfo.isActive,
  };
};

// CSS para animações (adicionar ao globals.css ou usar styled-components)
export const highlightAnimationCSS = `
  @keyframes highlight-pulse {
    0%, 100% { 
      box-shadow: 0 0 20px rgba(255, 128, 18, 0.3);
      transform: scale(1);
    }
    50% { 
      box-shadow: 0 0 30px rgba(255, 128, 18, 0.5);
      transform: scale(1.02);
    }
  }

  @keyframes highlight-border {
    0%, 100% { 
      background-position: 0% 50%;
    }
    50% { 
      background-position: 100% 50%;
    }
  }

  [data-highlighted="true"] {
    scroll-margin-top: 100px; /* Para scroll automático considerando header fixo */
  }
`;

export default useNotificationHighlight;
