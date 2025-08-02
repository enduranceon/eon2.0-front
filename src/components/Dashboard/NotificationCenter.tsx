'use client';

import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItem,
  Chip,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
  MarkEmailRead as MarkReadIcon,
} from '@mui/icons-material';
import { notificationService, Notification } from '../../services/notificationService';
import { useRouter } from 'next/navigation';
import { UserType } from '../../types/api';

interface NotificationCenterProps {
  userType: UserType;
  userId: string;
}

export default function NotificationCenter({ userType, userId }: NotificationCenterProps) {
  const theme = useTheme();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Carregar notificações iniciais
    loadNotifications();

    // Configurar listener para updates em tempo real
    const unsubscribe = notificationService.subscribe(() => {
      loadNotifications();
    });

    // Iniciar simulação de notificações (apenas para demo)
    // notificationService.startRealTimeSimulation(userType, userId);

    return unsubscribe;
  }, [userType, userId]);

  const loadNotifications = () => {
    const userNotifications = notificationService.getNotifications(userType, userId);
    const unread = notificationService.getUnreadCount(userId);
    
    setNotifications(userNotifications);
    setUnreadCount(unread);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como lida
    if (!notification.read) {
      notificationService.markAsRead(notification.id);
    }

    // Navegar para a URL se existir
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }

    handleClose();
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead(userId);
    handleClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
      case 'warning':
        return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
      case 'error':
        return <ErrorIcon sx={{ color: theme.palette.error.main }} />;
      default:
        return <InfoIcon sx={{ color: theme.palette.info.main }} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return timestamp.toLocaleDateString('pt-BR');
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            overflow: 'hidden',
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="bold">
              Notificações
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<MarkReadIcon />}
                onClick={handleMarkAllAsRead}
                sx={{ fontSize: '0.75rem' }}
              >
                Marcar todas como lidas
              </Button>
            )}
          </Box>
          {unreadCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Lista de Notificações */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Nenhuma notificação encontrada
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      cursor: 'pointer',
                      py: 1.5,
                      px: 2,
                      backgroundColor: notification.read ? 'transparent' : theme.palette.action.selected,
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      borderLeft: 4,
                      borderLeftColor: notification.read ? 'transparent' : getNotificationColor(notification.type),
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={notification.read ? 'normal' : 'bold'}
                            sx={{ lineHeight: 1.2, flex: 1 }}
                          >
                            {notification.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                            {!notification.read && (
                              <CircleIcon sx={{ fontSize: 8, color: 'primary.main', mr: 0.5 }} />
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {formatTimeAgo(notification.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component="div"
                          sx={{
                            mt: 0.5,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {notification.message}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              size="small"
              onClick={() => {
                // Aqui poderia navegar para uma página completa de notificações
                handleClose();
              }}
              sx={{ textTransform: 'none' }}
            >
              Ver todas as notificações
            </Button>
          </Box>
        )}
      </Menu>
    </>
  );
} 