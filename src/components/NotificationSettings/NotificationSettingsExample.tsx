'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  VolumeUp as VolumeUpIcon,
  DesktopWindows as DesktopIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useNotificationSettings } from '../../contexts/NotificationSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Componente de exemplo demonstrando como usar o sistema de configurações de notificações
 * Este componente pode ser usado para testar e demonstrar as funcionalidades
 */
const NotificationSettingsExample: React.FC = () => {
  const { user } = useAuth();
  const {
    settings,
    isLoading,
    isSaving,
    error,
    updateSetting,
    resetToDefaults,
    isNotificationEnabled,
    isSoundEnabled,
    isDesktopEnabled,
    isEmailEnabled,
  } = useNotificationSettings();

  // Função para testar notificações
  const testNotification = (type: 'success' | 'info' | 'warning' | 'error') => {
    const messages = {
      success: '✅ Notificação de sucesso - Resultado de prova registrado!',
      info: '📄 Notificação informativa - Novo relatório disponível',
      warning: '⚠️ Notificação de aviso - Status da conta alterado',
      error: '❌ Notificação de erro - Falha no pagamento'
    };

    toast[type](messages[type], {
      duration: 5000,
      position: 'top-right',
      description: 'Esta é uma notificação de teste',
      ...(isSoundEnabled() && { important: true })
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography>Carregando configurações...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Alert severity="error">
        Erro ao carregar configurações de notificações.
      </Alert>
    );
  }

  const getEnabledCount = () => {
    if (!settings.enabled) return 0;
    
    let count = 0;
    
    if (user?.userType === 'FITNESS_STUDENT' && settings.studentSettings) {
      count += Object.values(settings.studentSettings).filter(Boolean).length;
    } else if (user?.userType === 'COACH' && settings.coachSettings) {
      count += Object.values(settings.coachSettings).filter(Boolean).length;
    } else if (user?.userType === 'ADMIN' && settings.adminSettings) {
      count += Object.values(settings.adminSettings).filter(Boolean).length;
    }
    
    return count;
  };

  const getTotalCount = () => {
    if (user?.userType === 'FITNESS_STUDENT') return 5;
    if (user?.userType === 'COACH') return 6;
    if (user?.userType === 'ADMIN') return 6;
    return 0;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        🔔 Exemplo de Configurações de Notificações
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Este componente demonstra como usar o sistema de configurações de notificações.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Status Atual */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📊 Status Atual das Configurações
          </Typography>
          
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">
                Status geral:
              </Typography>
              <Chip
                label={settings.enabled ? 'Ativadas' : 'Desativadas'}
                color={settings.enabled ? 'success' : 'default'}
                size="small"
              />
            </Box>
            
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">
                Notificações ativas:
              </Typography>
              <Chip
                label={`${getEnabledCount()}/${getTotalCount()}`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>
            
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">
                Som:
              </Typography>
              <Box display="flex" alignItems="center">
                {isSoundEnabled() ? <VolumeUpIcon color="success" /> : <VolumeUpIcon color="disabled" />}
                <Typography variant="caption" sx={{ ml: 1 }}>
                  {isSoundEnabled() ? 'Ativado' : 'Desativado'}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">
                Desktop:
              </Typography>
              <Box display="flex" alignItems="center">
                {isDesktopEnabled() ? <DesktopIcon color="success" /> : <DesktopIcon color="disabled" />}
                <Typography variant="caption" sx={{ ml: 1 }}>
                  {isDesktopEnabled() ? 'Ativado' : 'Desativado'}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">
                Email:
              </Typography>
              <Box display="flex" alignItems="center">
                {isEmailEnabled() ? <EmailIcon color="success" /> : <EmailIcon color="disabled" />}
                <Typography variant="caption" sx={{ ml: 1 }}>
                  {isEmailEnabled() ? 'Ativado' : 'Desativado'}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Teste de Notificações */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🧪 Teste de Notificações
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Clique nos botões abaixo para testar diferentes tipos de notificações.
            Elas só aparecerão se estiverem habilitadas nas configurações.
          </Typography>
          
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="contained"
              color="success"
              onClick={() => testNotification('success')}
              disabled={!isNotificationEnabled('coach:exam-result:registered')}
            >
              Teste Sucesso
            </Button>
            
            <Button
              variant="contained"
              color="info"
              onClick={() => testNotification('info')}
              disabled={!isNotificationEnabled('coach:test-report:added')}
            >
              Teste Info
            </Button>
            
            <Button
              variant="contained"
              color="warning"
              onClick={() => testNotification('warning')}
              disabled={!isNotificationEnabled('coach:student-status:changed')}
            >
              Teste Aviso
            </Button>
            
            <Button
              variant="contained"
              color="error"
              onClick={() => testNotification('error')}
              disabled={!isNotificationEnabled('admin:asaas:webhook')}
            >
              Teste Erro
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Controles Rápidos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ⚡ Controles Rápidos
          </Typography>
          
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="outlined"
              onClick={() => updateSetting('enabled', !settings.enabled)}
              disabled={isSaving}
            >
              {settings.enabled ? 'Desativar' : 'Ativar'} Todas
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
              disabled={isSaving || !settings.enabled}
            >
              {settings.soundEnabled ? 'Desativar' : 'Ativar'} Som
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => updateSetting('desktopEnabled', !settings.desktopEnabled)}
              disabled={isSaving || !settings.enabled}
            >
              {settings.desktopEnabled ? 'Desativar' : 'Ativar'} Desktop
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              onClick={resetToDefaults}
              disabled={isSaving}
            >
              Restaurar Padrões
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Informações de Debug */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔍 Informações de Debug
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Tipo de usuário: <strong>{user?.userType || 'Não autenticado'}</strong>
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            ID do usuário: <strong>{user?.id || 'N/A'}</strong>
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            ID das configurações: <strong>{settings.id || 'N/A'}</strong>
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Última atualização: <strong>{settings.updatedAt || 'N/A'}</strong>
          </Typography>
          
          {isSaving && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Salvando configurações...
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationSettingsExample;
