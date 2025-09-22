'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
} from '@mui/material';
import {
  Highlight as HighlightIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

/**
 * Componente para testar o destaque diretamente via URL
 */
export const HighlightTester: React.FC = () => {
  const router = useRouter();

  const testHighlightTest = () => {
    const url = '/dashboard/aluno/testes?highlightTest=test_123_vo2_max&testName=Teste%20de%20VO2%20Máximo&notificationTime=' + Date.now();
    console.log('🎯 Testando destaque de teste:', url);
    router.push(url);
  };

  const testHighlightExam = () => {
    const url = '/dashboard/aluno/eventos?highlightExam=exam_456_maratona_sp&examName=Maratona%20de%20São%20Paulo&notificationTime=' + Date.now();
    console.log('🎯 Testando destaque de prova:', url);
    router.push(url);
  };

  const testCurrentPageTest = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('highlightTest', 'test_123_vo2_max');
    currentUrl.searchParams.set('testName', 'Teste de VO2 Máximo');
    currentUrl.searchParams.set('notificationTime', Date.now().toString());
    
    console.log('🎯 Adicionando parâmetros à página atual:', currentUrl.toString());
    router.replace(currentUrl.pathname + '?' + currentUrl.searchParams.toString());
  };

  const clearParams = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('highlightTest');
    currentUrl.searchParams.delete('highlightExam');
    currentUrl.searchParams.delete('testName');
    currentUrl.searchParams.delete('examName');
    currentUrl.searchParams.delete('notificationTime');
    
    console.log('🧹 Limpando parâmetros da URL');
    router.replace(currentUrl.pathname + (currentUrl.searchParams.toString() ? '?' + currentUrl.searchParams.toString() : ''));
  };

  return (
    <Card sx={{ mb: 2, border: '2px dashed green' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <HighlightIcon sx={{ mr: 1 }} />
          🎯 Testador de Destaque Manual
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Use estes botões para testar o sistema de destaque diretamente.
        </Typography>

        <Stack spacing={2}>
          <Button
            variant="contained"
            onClick={testHighlightTest}
            color="primary"
          >
            Ir para Testes com Destaque
          </Button>
          
          <Button
            variant="contained"
            onClick={testHighlightExam}
            color="secondary"
          >
            Ir para Eventos com Destaque
          </Button>
          
          <Button
            variant="outlined"
            onClick={testCurrentPageTest}
            color="warning"
          >
            Adicionar Destaque à Página Atual
          </Button>
          
          <Button
            variant="outlined"
            onClick={clearParams}
            color="error"
          >
            Limpar Parâmetros da URL
          </Button>
        </Stack>

        <Box sx={{ mt: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="caption" color="info.dark">
            💡 Este testador permite verificar se o problema está na criação da URL ou na detecção dos parâmetros.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HighlightTester;
