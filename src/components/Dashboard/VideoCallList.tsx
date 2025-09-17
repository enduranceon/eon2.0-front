'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Link,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  AccessTime as ClockIcon,
  Person as UserIcon,
  Videocam as VideoCameraIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as XCircleIcon,
  Warning as ExclamationTriangleIcon,
  MoreVert as EllipsisVerticalIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { videoCallService, VideoCallService } from '@/services/videoCallService';
import { VideoCall, VideoCallStatus, User, UserType } from '@/types/api';
import VideoCallHistory from './VideoCallHistory';

interface VideoCallListProps {
  userType: UserType;
  currentUser: User;
  onRefresh?: () => void;
  variant?: 'standalone' | 'embedded';
}

export default function VideoCallList({ userType, currentUser, onRefresh, variant = 'standalone' }: VideoCallListProps) {
  const [videoCalls, setVideoCalls] = useState<VideoCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedVideoCall, setSelectedVideoCall] = useState<VideoCall | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    loadVideoCalls();
  }, [selectedStatus]);

  const loadVideoCalls = async () => {
    try {
      setLoading(true);
      const filters = selectedStatus ? { status: selectedStatus as VideoCallStatus } : undefined;
      
      let response;
      if (userType === UserType.FITNESS_STUDENT) {
        response = await videoCallService.getMyVideoCalls(filters);
      } else if (userType === UserType.COACH) {
        response = await videoCallService.getCoachVideoCalls(filters);
      } else {
        response = await videoCallService.getAllVideoCalls(filters);
      }
      
      setVideoCalls(response.data);
    } catch (error: any) {
      setError('Erro ao carregar videochamadas');
      console.error('Erro ao carregar videochamadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, videoCall: VideoCall, data?: any) => {
    try {
      switch (action) {
        case 'accept':
          await videoCallService.acceptVideoCall(videoCall.id);
          break;
        case 'deny':
          await videoCallService.denyVideoCall(videoCall.id, data.reason);
          break;
        case 'complete':
          await videoCallService.completeVideoCall(videoCall.id);
          break;
        case 'cancel':
          await videoCallService.cancelMyVideoCall(videoCall.id, data.reason);
          break;
        case 'reschedule':
          await videoCallService.rescheduleMyVideoCall(videoCall.id, data.scheduledAt, data.notes);
          break;
      }
      
      loadVideoCalls();
      onRefresh?.();
    } catch (error: any) {
      console.error('Erro ao executar ação:', error);
      alert('Erro ao executar ação: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: VideoCallStatus) => {
    switch (status) {
      case VideoCallStatus.COMPLETED:
        return <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />;
      case VideoCallStatus.CANCELLED:
      case VideoCallStatus.DENIED:
        return <XCircleIcon color="error" sx={{ fontSize: 20 }} />;
      case VideoCallStatus.REQUESTED:
        return <ExclamationTriangleIcon color="warning" sx={{ fontSize: 20 }} />;
      default:
        return <VideoCameraIcon color="primary" sx={{ fontSize: 20 }} />;
    }
  };

  const getStatusColor = (status: VideoCallStatus) => {
    switch (status) {
      case VideoCallStatus.COMPLETED:
        return 'success';
      case VideoCallStatus.CANCELLED:
      case VideoCallStatus.DENIED:
        return 'error';
      case VideoCallStatus.REQUESTED:
        return 'warning';
      case VideoCallStatus.SCHEDULED:
        return 'info';
      case VideoCallStatus.WAITING:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: VideoCallStatus) => {
    switch (status) {
      case VideoCallStatus.REQUESTED:
        return 'Solicitada';
      case VideoCallStatus.SCHEDULED:
        return 'Agendada';
      case VideoCallStatus.WAITING:
        return 'Em Espera';
      case VideoCallStatus.COMPLETED:
        return 'Concluída';
      case VideoCallStatus.CANCELLED:
        return 'Cancelada';
      case VideoCallStatus.DENIED:
        return 'Negada';
      default:
        return status;
    }
  };

  const canPerformAction = (videoCall: VideoCall, action: string): boolean => {
    if (userType === UserType.FITNESS_STUDENT) {
      if (videoCall.studentId !== currentUser.id) return false;
      
      switch (action) {
        case 'cancel':
          return videoCallService.canStudentCancel(videoCall.status);
        case 'reschedule':
          return videoCallService.canStudentReschedule(videoCall.status);
        default:
          return false;
      }
    } else if (userType === UserType.COACH) {
      if (videoCall.coachId !== currentUser.id) return false;
      
      switch (action) {
        case 'accept':
          return videoCallService.canCoachAccept(videoCall.status);
        case 'deny':
          return videoCallService.canCoachDeny(videoCall.status);
        case 'complete':
          return videoCallService.canCoachComplete(videoCall.status);
        case 'update':
          return videoCallService.canCoachUpdate(videoCall.status);
        default:
          return false;
      }
    }
    
    return userType === UserType.ADMIN;
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        py: variant === 'embedded' ? 2 : 4 
      }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ 
      ...(variant === 'embedded' ? {} : { '& > * + *': { mt: 2 } })
    }}>
      {/* Filtros */}
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={selectedStatus}
          label="Status"
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <MenuItem value="">Todos os status</MenuItem>
          <MenuItem value={VideoCallStatus.REQUESTED}>Solicitadas</MenuItem>
          <MenuItem value={VideoCallStatus.SCHEDULED}>Agendadas</MenuItem>
          <MenuItem value={VideoCallStatus.WAITING}>Em Espera</MenuItem>
          <MenuItem value={VideoCallStatus.COMPLETED}>Concluídas</MenuItem>
          <MenuItem value={VideoCallStatus.CANCELLED}>Canceladas</MenuItem>
          <MenuItem value={VideoCallStatus.DENIED}>Negadas</MenuItem>
        </Select>
      </FormControl>

      {/* Lista de Videochamadas */}
      {videoCalls.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: variant === 'embedded' ? 2 : 4,
          color: 'text.secondary'
        }}>
          <VideoCameraIcon sx={{ fontSize: 48, mb: 2, color: 'text.disabled' }} />
          <Typography variant="body1">
            Nenhuma videochamada encontrada
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          ...(variant === 'embedded' ? {} : { '& > * + *': { mt: 2 } })
        }}>
          {videoCalls.map((videoCall) => (
            <Card 
              key={videoCall.id}
              sx={{ 
                ...(variant === 'embedded' 
                  ? { boxShadow: 'none', border: '1px solid', borderColor: 'divider' }
                  : { '&:hover': { boxShadow: 2 } }
                )
              }}
            >
              <CardContent sx={{ p: variant === 'embedded' ? 2 : 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {getStatusIcon(videoCall.status)}
                      <Chip 
                        label={getStatusLabel(videoCall.status)}
                        color={getStatusColor(videoCall.status) as any}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ '& > * + *': { mt: 1 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UserIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {userType === UserType.FITNESS_STUDENT 
                            ? `Treinador: ${videoCall.coach?.name || 'N/A'}`
                            : `Aluno: ${videoCall.student?.name || 'N/A'}`
                          }
                        </Typography>
                      </Box>

                      {videoCall.scheduledAt && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDateTime(videoCall.scheduledAt)}
                          </Typography>
                        </Box>
                      )}

                      {videoCall.duration && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ClockIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {videoCall.duration} minutos
                          </Typography>
                        </Box>
                      )}

                      {videoCall.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {videoCall.notes}
                        </Typography>
                      )}

                      {videoCall.meetingLink && (
                        <Link
                          href={videoCall.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' }
                          }}
                        >
                          <VideoCameraIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">
                            Acessar reunião
                          </Typography>
                        </Link>
                      )}
                    </Box>
                  </Box>

                  {/* Ações */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                    {canPerformAction(videoCall, 'accept') && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleAction('accept', videoCall)}
                      >
                        Aceitar
                      </Button>
                    )}

                    {canPerformAction(videoCall, 'deny') && (
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => {
                          const reason = prompt('Motivo da negação:');
                          if (reason) {
                            handleAction('deny', videoCall, { reason });
                          }
                        }}
                      >
                        Negar
                      </Button>
                    )}

                    {canPerformAction(videoCall, 'complete') && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleAction('complete', videoCall)}
                      >
                        Concluir
                      </Button>
                    )}

                    {canPerformAction(videoCall, 'cancel') && (
                      <Button
                        size="small"
                        variant="contained"
                        color="inherit"
                        onClick={() => {
                          const reason = prompt('Motivo do cancelamento:');
                          if (reason) {
                            handleAction('cancel', videoCall, { reason });
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                    )}

                    {canPerformAction(videoCall, 'reschedule') && (
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => {
                          const newDateTime = prompt('Nova data e hora (YYYY-MM-DDTHH:MM):');
                          if (newDateTime) {
                            const notes = prompt('Observações (opcional):');
                            handleAction('reschedule', videoCall, { scheduledAt: newDateTime, notes });
                          }
                        }}
                      >
                        Reagendar
                      </Button>
                    )}

                    {/* Botão de Histórico */}
                    <Tooltip title="Ver histórico">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => {
                          setSelectedVideoCall(videoCall);
                          setIsHistoryOpen(true);
                        }}
                      >
                        <HistoryIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Modal de Histórico */}
      <VideoCallHistory
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedVideoCall(null);
        }}
        videoCall={selectedVideoCall}
      />
    </Box>
  );
}