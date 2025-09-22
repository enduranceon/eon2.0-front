'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Button,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  MarkEmailRead as MarkReadIcon,
  MarkEmailUnread as MarkUnreadIcon,
  Delete as DeleteIcon,
  Clear as ClearAllIcon,
  FilterList as FilterIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { useStoredNotifications } from '../../contexts/StoredNotificationsContext';
import { StoredNotification } from '../../types/api';

interface NotificationCenterProps {
  maxHeight?: number;
  maxNotifications?: number;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  maxHeight = 400,
  maxNotifications = 50
}) => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<StoredNotification | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const {
    notifications,
    unreadCount,
    stats,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getFilteredNotifications,
    getUnreadNotifications,
  } = useStoredNotifications();

  const open = Boolean(anchorEl);
  const menuOpen = Boolean(menuAnchorEl);

  // Abrir/fechar popover
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMenuAnchorEl(null);
    setSelectedNotification(null);
  };

  // Abrir menu de ações
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, notification: StoredNotification) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedNotification(null);
  };

  // Marcar como lida ao clicar na notificação e redirecionar
  const handleNotificationClick = useCallback((notification: StoredNotification) => {
    // Marcar como lida
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Fechar popover
    handleClose();
    
    // Redirecionar para a página correspondente
    if (notification.actionUrl) {
      // Se for URL externa (http/https), abrir em nova aba
      if (notification.actionUrl.startsWith('http')) {
        window.open(notification.actionUrl, '_blank');
      } else {
        // Se for rota interna, navegar usando Next.js router
        router.push(notification.actionUrl);
      }
    }
  }, [markAsRead, router]);

  // Ações do menu
  const handleMarkAsRead = () => {
    if (selectedNotification) {
      markAsRead(selectedNotification.id);
    }
    handleMenuClose();
  };

  const handleMarkAsUnread = () => {
    if (selectedNotification) {
      markAsUnread(selectedNotification.id);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedNotification) {
      deleteNotification(selectedNotification.id);
    }
    handleMenuClose();
  };

  // Obter notificações filtradas
  const getDisplayNotifications = () => {
    let filtered: StoredNotification[] = [];
    
    switch (filter) {
      case 'unread':
        filtered = getUnreadNotifications();
        break;
      case 'read':
        filtered = getFilteredNotifications({ isRead: true });
        break;
      default:
        filtered = notifications;
    }
    
    return filtered.slice(0, maxNotifications);
  };

  const displayNotifications = getDisplayNotifications();

  // Formatação de tempo
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return 'há pouco tempo';
    }
  };

  // Cor da prioridade
  const getPriorityColor = (priority: StoredNotification['priority']) => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#9E9E9E';
      default: return '#2196F3';
    }
  };

  // Renderizar item da notificação
  const renderNotificationItem = (notification: StoredNotification) => (
    <ListItem
      key={notification.id}
      button
      onClick={() => handleNotificationClick(notification)}
      sx={{
        backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
        borderLeft: `4px solid ${notification.color || getPriorityColor(notification.priority)}`,
        mb: 0.5,
        cursor: notification.actionUrl ? 'pointer' : 'default',
        '&:hover': {
          backgroundColor: 'action.selected',
          transform: notification.actionUrl ? 'translateX(4px)' : 'none',
          transition: 'all 0.2s ease',
        },
      }}
    >
      <ListItemIcon>
        <Avatar
          sx={{
            bgcolor: notification.color || getPriorityColor(notification.priority),
            width: 40,
            height: 40,
            fontSize: '1.2rem',
          }}
        >
          {notification.icon || '🔔'}
        </Avatar>
      </ListItemIcon>
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Título e indicadores */}
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <Typography
            variant="subtitle2"
            fontWeight={notification.isRead ? 'normal' : 'bold'}
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px',
            }}
          >
            {notification.title}
          </Typography>
          
          {!notification.isRead && (
            <CircleIcon sx={{ fontSize: 8, color: 'primary.main' }} />
          )}
        </Box>
        
        {/* Chips de categoria e ação */}
        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
          <Chip
            label={notification.category}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: '20px' }}
          />
          
          {notification.actionUrl && (
            <Chip
              label="Clique para ver"
              size="small"
              color="primary"
              sx={{ 
                fontSize: '0.6rem', 
                height: '18px',
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }}
            />
          )}
        </Box>
        
        {/* Mensagem */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontSize: '0.8rem',
            mb: 0.5,
          }}
        >
          {notification.message}
        </Typography>
        
        {/* Timestamp */}
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontSize: '0.7rem' }}
        >
          {formatTime(notification.createdAt)}
        </Typography>
      </Box>
      
      <ListItemSecondaryAction>
        <IconButton
          size="small"
          onClick={(e) => handleMenuClick(e, notification)}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );

  return (
    <>
      <Tooltip title="Notificações">
        <IconButton
          size="large"
          aria-label="notificações"
          color="inherit"
          onClick={handleClick}
          sx={{
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'rgba(255, 128, 18, 0.1)',
              color: '#FF8012',
            },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#FF8012',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem',
              },
            }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 380, maxHeight: maxHeight + 100 },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h6" fontWeight="bold">
              Notificações
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<FilterIcon />}
                onClick={() => {
                  const nextFilter = filter === 'all' ? 'unread' : filter === 'unread' ? 'read' : 'all';
                  setFilter(nextFilter);
                }}
              >
                {filter === 'all' ? 'Todas' : filter === 'unread' ? 'Não lidas' : 'Lidas'}
              </Button>
            </Stack>
          </Box>
          
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              {stats.total} total • {unreadCount} não lidas
            </Typography>
            
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<MarkReadIcon />}
                onClick={markAllAsRead}
              >
                Marcar todas como lidas
              </Button>
            )}
          </Box>
        </Box>

        {/* Lista de Notificações */}
        <Box sx={{ maxHeight, overflow: 'auto' }}>
          {displayNotifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {filter === 'unread' ? 'Nenhuma notificação não lida' : 
                 filter === 'read' ? 'Nenhuma notificação lida' : 
                 'Nenhuma notificação'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {displayNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {renderNotificationItem(notification)}
                  {index < displayNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {stats.total > 0 && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearAllIcon />}
              onClick={clearAllNotifications}
              color="error"
              size="small"
            >
              Limpar todas as notificações
            </Button>
          </Box>
        )}
      </Popover>

      {/* Menu de Ações */}
      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
      >
        {selectedNotification && (
          [
            <MenuItem key="read" onClick={selectedNotification.isRead ? handleMarkAsUnread : handleMarkAsRead}>
              {selectedNotification.isRead ? (
                <>
                  <MarkUnreadIcon sx={{ mr: 1 }} />
                  Marcar como não lida
                </>
              ) : (
                <>
                  <MarkReadIcon sx={{ mr: 1 }} />
                  Marcar como lida
                </>
              )}
            </MenuItem>,
            <MenuItem key="delete" onClick={handleDelete}>
              <DeleteIcon sx={{ mr: 1 }} />
              Excluir notificação
            </MenuItem>
          ]
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter;
