'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNotificationSettings } from '../../contexts/NotificationSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import NotificationSettingsPanel from './NotificationSettingsPanel';

interface NotificationSettingsCardProps {
  compact?: boolean;
}

export const NotificationSettingsCard: React.FC<NotificationSettingsCardProps> = ({ compact = false }) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { settings, updateSetting, isSaving } = useNotificationSettings();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const getEnabledNotificationsCount = () => {
    if (!settings || !settings.enabled) return 0;
    
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

  const getTotalNotificationsCount = () => {
    if (user?.userType === 'FITNESS_STUDENT') return 5;
    if (user?.userType === 'COACH') return 6;
    if (user?.userType === 'ADMIN') return 6;
    return 0;
  };

  const getNotificationTypeLabel = () => {
    switch (user?.userType) {
      case 'FITNESS_STUDENT': return 'Aluno';
      case 'COACH': return 'Treinador';
      case 'ADMIN': return 'Administrador';
      default: return 'Usuário';
    }
  };

  if (compact) {
    return (
      <>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">
                    Notificações
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {settings?.enabled ? 'Ativadas' : 'Desativadas'} • {getNotificationTypeLabel()}
                  </Typography>
                </Box>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                {settings?.enabled && (
                  <Chip
                    label={`${getEnabledNotificationsCount()}/${getTotalNotificationsCount()}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                
                <IconButton
                  onClick={handleOpen}
                  size="small"
                  disabled={isSaving}
                >
                  <SettingsIcon />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">
                Configurações de Notificações
              </Typography>
              <IconButton onClick={handleClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent dividers>
            <NotificationSettingsPanel />
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleClose}>
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Notificações em Tempo Real
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={handleOpen}
            disabled={isSaving}
          >
            Configurar
          </Button>
        </Box>
        
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="body2">
              Status das notificações:
            </Typography>
            <Chip
              label={settings?.enabled ? 'Ativadas' : 'Desativadas'}
              color={settings?.enabled ? 'success' : 'default'}
              size="small"
            />
          </Box>
          
          {settings?.enabled && (
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">
                Notificações ativas:
              </Typography>
              <Chip
                label={`${getEnabledNotificationsCount()}/${getTotalNotificationsCount()}`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>
          )}
          
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="body2">
              Som:
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.soundEnabled ?? false}
                  onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                  disabled={isSaving || !settings?.enabled}
                  size="small"
                />
              }
              label=""
            />
          </Box>
          
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="body2">
              Desktop:
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.desktopEnabled ?? false}
                  onChange={(e) => updateSetting('desktopEnabled', e.target.checked)}
                  disabled={isSaving || !settings?.enabled}
                  size="small"
                />
              }
              label=""
            />
          </Box>
          
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="body2">
              Email:
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings?.emailEnabled ?? false}
                  onChange={(e) => updateSetting('emailEnabled', e.target.checked)}
                  disabled={isSaving || !settings?.enabled}
                  size="small"
                />
              }
              label=""
            />
          </Box>
        </Stack>
        
        <Typography variant="caption" color="text.secondary" display="block" mt={2}>
          Clique em "Configurar" para personalizar quais eventos você deseja receber.
        </Typography>
      </CardContent>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Configurações de Notificações
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <NotificationSettingsPanel />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default NotificationSettingsCard;
