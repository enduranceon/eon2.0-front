'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import {
  BugReport as BugIcon,
} from '@mui/icons-material';
import { useNotificationHighlight } from '../../hooks/useNotificationHighlight';
import { useSearchParams } from 'next/navigation';

interface HighlightDebuggerProps {
  availableItems?: Array<{ 
    id: string; 
    name: string; 
    type: string; 
    resultId?: string; 
    testId?: string; 
  }>;
}

/**
 * Componente para debuggar o sistema de destaque
 */
export const HighlightDebugger: React.FC<HighlightDebuggerProps> = ({ availableItems = [] }) => {
  const { highlightInfo, shouldHighlight, clearHighlight, isHighlighting } = useNotificationHighlight();
  const searchParams = useSearchParams();

  // Obter todos os parâmetros da URL
  const allParams = Object.fromEntries(searchParams.entries());

  return (
    <Card sx={{ mb: 2, border: '2px dashed purple' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <BugIcon sx={{ mr: 1 }} />
          🔍 Debug - Sistema de Destaque
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Este componente mostra informações sobre o sistema de destaque de itens.
        </Typography>

        {/* Status do Hook */}
        <Alert severity={isHighlighting ? 'success' : 'info'} sx={{ mb: 2 }}>
          <strong>Status do Hook:</strong>
          <br />
          • Destaque ativo: {isHighlighting ? '✅ Sim' : '❌ Não'}
          <br />
          • Tipo: {highlightInfo.type || 'Nenhum'}
          <br />
          • ID: {highlightInfo.id || 'Nenhum'}
          <br />
          • Nome: {highlightInfo.name || 'Nenhum'}
          <br />
          • Timestamp: {highlightInfo.timestamp || 'Nenhum'}
        </Alert>

        {/* Parâmetros da URL */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            📋 Parâmetros da URL:
          </Typography>
          {Object.keys(allParams).length > 0 ? (
            Object.entries(allParams).map(([key, value]) => (
              <Chip
                key={key}
                label={`${key}: ${value}`}
                size="small"
                sx={{ mr: 1, mb: 1 }}
                color={key.startsWith('highlight') ? 'primary' : 'default'}
              />
            ))
          ) : (
            <Typography variant="caption" color="text.disabled">
              Nenhum parâmetro na URL
            </Typography>
          )}
        </Box>

        {/* Teste de Destaque */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            🧪 Teste de Destaque:
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Typography variant="caption">
              shouldHighlight('test_123_vo2_max', 'test'): 
            </Typography>
            <Chip
              label={shouldHighlight('test_123_vo2_max', 'test') ? 'TRUE' : 'FALSE'}
              color={shouldHighlight('test_123_vo2_max', 'test') ? 'success' : 'error'}
              size="small"
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Typography variant="caption">
              shouldHighlight('exam_456_maratona_sp', 'exam'): 
            </Typography>
            <Chip
              label={shouldHighlight('exam_456_maratona_sp', 'exam') ? 'TRUE' : 'FALSE'}
              color={shouldHighlight('exam_456_maratona_sp', 'exam') ? 'success' : 'error'}
              size="small"
            />
          </Box>
        </Box>

        {/* Teste Visual */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            🎨 Teste Visual:
          </Typography>
          
          <Box
            sx={{
              p: 2,
              border: '1px solid #ccc',
              borderRadius: 1,
              mb: 1,
              ...(shouldHighlight('test_123_vo2_max', 'test') ? {
                backgroundColor: 'rgba(255, 128, 18, 0.1)',
                border: '2px solid #FF8012',
                boxShadow: '0 0 20px rgba(255, 128, 18, 0.3)',
                animation: 'highlight-pulse 2s ease-in-out infinite',
              } : {})
            }}
          >
            <Typography variant="body2">
              Teste Simulado: VO2 Máximo (ID: test_123_vo2_max)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Este item deve estar destacado se o parâmetro highlightTest=test_123_vo2_max estiver na URL
            </Typography>
          </Box>
          
          <Box
            sx={{
              p: 2,
              border: '1px solid #ccc',
              borderRadius: 1,
              ...(shouldHighlight('exam_456_maratona_sp', 'exam') ? {
                backgroundColor: 'rgba(255, 128, 18, 0.1)',
                border: '2px solid #FF8012',
                boxShadow: '0 0 20px rgba(255, 128, 18, 0.3)',
                animation: 'highlight-pulse 2s ease-in-out infinite',
              } : {})
            }}
          >
            <Typography variant="body2">
              Prova Simulada: Maratona SP (ID: exam_456_maratona_sp)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Este item deve estar destacado se o parâmetro highlightExam=exam_456_maratona_sp estiver na URL
            </Typography>
          </Box>
        </Box>

        {/* Ações */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={clearHighlight}
            disabled={!isHighlighting}
            size="small"
          >
            Limpar Destaque
          </Button>
          
          {availableItems.length > 0 && (
            <Button
              variant="contained"
              onClick={() => {
                const firstItem = availableItems[0];
                const url = new URL(window.location.href);
                url.searchParams.set('highlightTest', firstItem.id);
                url.searchParams.set('testName', firstItem.name);
                url.searchParams.set('notificationTime', Date.now().toString());
                window.history.pushState({}, '', url.toString());
                window.location.reload();
              }}
              size="small"
              color="success"
            >
              Testar com 1º Item Real
            </Button>
          )}
        </Box>

        {/* Lista de itens disponíveis */}
        {availableItems.length > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              📋 Itens Disponíveis na Página ({availableItems.length}):
            </Typography>
            {availableItems.slice(0, 5).map((item, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="caption" display="block">
                  <strong>ID usado para comparação:</strong> {item.id}
                </Typography>
                {item.resultId && (
                  <Typography variant="caption" display="block">
                    <strong>ID do resultado:</strong> {item.resultId}
                  </Typography>
                )}
                {item.testId && (
                  <Typography variant="caption" display="block">
                    <strong>ID do teste:</strong> {item.testId}
                  </Typography>
                )}
                <Typography variant="caption" display="block">
                  <strong>Nome:</strong> {item.name}
                </Typography>
                <Typography variant="caption" display="block">
                  <strong>Deveria destacar:</strong> {shouldHighlight(item.id, item.type, item.name) ? '✅ SIM' : '❌ NÃO'}
                </Typography>
                <Divider sx={{ my: 0.5 }} />
              </Box>
            ))}
            {availableItems.length > 5 && (
              <Typography variant="caption" color="text.secondary">
                ... e mais {availableItems.length - 5} itens
              </Typography>
            )}
          </Box>
        )}

        {/* Verificação de Match */}
        {highlightInfo.isActive && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>🔍 Verificação de Match:</strong>
            <br />
            • Procurando por ID: <code>{highlightInfo.id}</code>
            <br />
            • Procurando por nome: <code>{highlightInfo.name}</code>
            <br />
            • Tipo esperado: <code>{highlightInfo.type}</code>
            <br />
            • Itens encontrados: {availableItems.filter(item => 
              shouldHighlight(item.id, item.type, item.name)
            ).length}
          </Alert>
        )}

        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>Para testar:</strong>
          <br />
          1. Acesse: <code>/dashboard/aluno/testes?highlightTest=test_123_vo2_max&testName=VO2%20Máximo</code>
          <br />
          2. Ou use o testador de eventos WebSocket para gerar uma notificação
          <br />
          3. Verifique se o status mostra "Destaque ativo: ✅ Sim"
          <br />
          4. Veja se algum item da lista "Itens Disponíveis" mostra "✅ SIM"
        </Alert>
      </CardContent>
    </Card>
  );
};

export default HighlightDebugger;
