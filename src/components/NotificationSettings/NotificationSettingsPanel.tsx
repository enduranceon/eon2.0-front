'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Button,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  VolumeUp as VolumeUpIcon,
  DesktopWindows as DesktopIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotificationSettings } from '../../contexts/NotificationSettingsContext';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationSettingsPanelProps {
  onClose?: () => void;
}

export const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({ onClose }) => {
  const { user } = useAuth();
  const {
    settings,
    isLoading,
    isSaving,
    error,
    updateSetting,
    resetToDefaults,
  } = useNotificationSettings();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Carregando configurações...
        </Typography>
      </Box>
    );
  }

  if (!settings) {
    return (
      <Alert severity="error">
        Não foi possível carregar as configurações de notificações.
      </Alert>
    );
  }

  const renderGeneralSettings = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
          <NotificationsIcon sx={{ mr: 1 }} />
          Configurações Gerais
        </Typography>
        
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) => updateSetting('enabled', e.target.checked)}
                disabled={isSaving}
              />
            }
            label="Habilitar notificações"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.soundEnabled}
                onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                <VolumeUpIcon sx={{ mr: 1, fontSize: 20 }} />
                Som nas notificações
              </Box>
            }
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.desktopEnabled}
                onChange={(e) => updateSetting('desktopEnabled', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                <DesktopIcon sx={{ mr: 1, fontSize: 20 }} />
                Notificações desktop
              </Box>
            }
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.emailEnabled}
                onChange={(e) => updateSetting('emailEnabled', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                <EmailIcon sx={{ mr: 1, fontSize: 20 }} />
                Notificações por email
              </Box>
            }
          />
        </Stack>
      </CardContent>
    </Card>
  );

  const renderStudentSettings = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">📚 Notificações do Aluno</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" paragraph>
          Receba notificações quando seu treinador:
        </Typography>
        
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.studentSettings?.examResultRegistered ?? true}
                onChange={(e) => updateSetting('studentSettings.examResultRegistered', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Registrar resultado de prova"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.studentSettings?.testResultRegistered ?? true}
                onChange={(e) => updateSetting('studentSettings.testResultRegistered', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Registrar resultado de teste"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.studentSettings?.testReportAdded ?? true}
                onChange={(e) => updateSetting('studentSettings.testReportAdded', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Adicionar relatório de teste"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.studentSettings?.studentStatusChanged ?? true}
                onChange={(e) => updateSetting('studentSettings.studentStatusChanged', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Alterar status da conta"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.studentSettings?.studentDataUpdated ?? true}
                onChange={(e) => updateSetting('studentSettings.studentDataUpdated', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Atualizar dados pessoais"
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  const renderCoachSettings = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">🏃‍♂️ Notificações do Treinador</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" paragraph>
          Receba notificações quando seus alunos:
        </Typography>
        
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.coachSettings?.externalExamCreated ?? true}
                onChange={(e) => updateSetting('coachSettings.externalExamCreated', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Criarem prova externa"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.coachSettings?.examRegistered ?? true}
                onChange={(e) => updateSetting('coachSettings.examRegistered', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Se inscreverem em prova"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.coachSettings?.testReportRequested ?? true}
                onChange={(e) => updateSetting('coachSettings.testReportRequested', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Solicitarem relatório de teste"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.coachSettings?.subscriptionCreated ?? true}
                onChange={(e) => updateSetting('coachSettings.subscriptionCreated', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Assinarem plano"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.coachSettings?.featurePurchased ?? true}
                onChange={(e) => updateSetting('coachSettings.featurePurchased', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Comprarem feature adicional"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.coachSettings?.planCancelled ?? true}
                onChange={(e) => updateSetting('coachSettings.planCancelled', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Cancelarem plano"
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  const renderAdminSettings = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">👑 Notificações do Administrador</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" paragraph>
          Receba notificações sobre eventos do sistema:
        </Typography>
        
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.adminSettings?.userRegistered ?? true}
                onChange={(e) => updateSetting('adminSettings.userRegistered', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Novos usuários registrados"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.adminSettings?.subscriptionCreated ?? true}
                onChange={(e) => updateSetting('adminSettings.subscriptionCreated', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Novas assinaturas"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.adminSettings?.leaveRequested ?? true}
                onChange={(e) => updateSetting('adminSettings.leaveRequested', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Solicitações de licença"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.adminSettings?.planChanged ?? true}
                onChange={(e) => updateSetting('adminSettings.planChanged', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Mudanças de plano"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.adminSettings?.cancellationRequested ?? true}
                onChange={(e) => updateSetting('adminSettings.cancellationRequested', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Solicitações de cancelamento"
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Webhooks Asaas:
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.adminSettings?.asaasWebhook ?? true}
                onChange={(e) => updateSetting('adminSettings.asaasWebhook', e.target.checked)}
                disabled={isSaving || !settings.enabled}
              />
            }
            label="Eventos do webhook Asaas"
          />
          
          {settings.adminSettings?.asaasWebhook && (
            <Box sx={{ ml: 4 }}>
              <Grid container spacing={1}>
                {Object.entries(settings.adminSettings.asaasWebhookTypes || {}).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={value}
                          onChange={(e) => updateSetting(`adminSettings.asaasWebhookTypes.${key}`, e.target.checked)}
                          disabled={isSaving || !settings.enabled}
                          size="small"
                        />
                      }
                      label={key.replace('_', ' ').toLowerCase()}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        🔔 Configurações de Notificações
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure quais notificações você deseja receber em tempo real.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {renderGeneralSettings()}
      
      {user?.userType === 'FITNESS_STUDENT' && renderStudentSettings()}
      {user?.userType === 'COACH' && renderCoachSettings()}
      {user?.userType === 'ADMIN' && renderAdminSettings()}
      
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Ações
          </Typography>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={resetToDefaults}
              disabled={isSaving}
            >
              Restaurar Padrões
            </Button>
            
            {onClose && (
              <Button
                variant="contained"
                onClick={onClose}
                disabled={isSaving}
              >
                Fechar
              </Button>
            )}
          </Stack>
          
          {isSaving && (
            <Box display="flex" alignItems="center" mt={2}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">
                Salvando configurações...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationSettingsPanel;
