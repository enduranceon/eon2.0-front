'use client';

import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  VideoCameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon,
  ClockIcon as HistoryIcon
} from '@heroicons/react/24/outline';
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

  const getStatusIcon = (status: VideoCallStatus, compact: boolean = false) => {
    const size = compact ? 'h-4 w-4' : 'h-5 w-5';
    switch (status) {
      case VideoCallStatus.COMPLETED:
        return <CheckCircleIcon className={`${size} text-green-500 flex-shrink-0`} />;
      case VideoCallStatus.CANCELLED:
      case VideoCallStatus.DENIED:
        return <XCircleIcon className={`${size} text-red-500 flex-shrink-0`} />;
      case VideoCallStatus.REQUESTED:
        return <ExclamationTriangleIcon className={`${size} text-yellow-500 flex-shrink-0`} />;
      default:
        return <VideoCameraIcon className={`${size} text-blue-500 flex-shrink-0`} />;
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
      <div className={variant === 'embedded' ? 'flex justify-center items-center py-4' : 'flex justify-center items-center py-8'}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className={variant === 'embedded' ? 'space-y-0' : 'space-y-4'}>
      {/* Filtros */}
      <div className="flex gap-2">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">Todos os status</option>
          <option value={VideoCallStatus.REQUESTED}>Solicitadas</option>
          <option value={VideoCallStatus.SCHEDULED}>Agendadas</option>
          <option value={VideoCallStatus.WAITING}>Em Espera</option>
          <option value={VideoCallStatus.COMPLETED}>Concluídas</option>
          <option value={VideoCallStatus.CANCELLED}>Canceladas</option>
          <option value={VideoCallStatus.DENIED}>Negadas</option>
        </select>
      </div>

      {/* Lista de Videochamadas */}
      {videoCalls.length === 0 ? (
        <div className={variant === 'embedded' ? 'text-center py-4 text-gray-500' : 'text-center py-8 text-gray-500'}>
          <VideoCameraIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhuma videochamada encontrada</p>
        </div>
      ) : (
        <div className={variant === 'embedded' ? 'divide-y divide-gray-200' : 'space-y-3'}>
          {videoCalls.map((videoCall) => (
            <div
              key={videoCall.id}
              className={
                variant === 'embedded'
                  ? 'py-3'
                  : 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow'
              }
            >
              <div className={variant === 'embedded' ? 'flex items-start justify-between px-1' : 'flex items-start justify-between'}>
                <div className="flex-1">
                  <div className={variant === 'embedded' ? 'flex items-center gap-2 mb-1' : 'flex items-center gap-2 mb-2'}>
                    {getStatusIcon(videoCall.status, variant === 'embedded')}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${videoCallService.getStatusColor(videoCall.status)}`}>
                      {videoCallService.getStatusLabel(videoCall.status)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {userType === UserType.FITNESS_STUDENT 
                          ? `Treinador: ${videoCall.coach?.name || 'N/A'}`
                          : `Aluno: ${videoCall.student?.name || 'N/A'}`
                        }
                      </span>
                    </div>

                    {videoCall.scheduledAt && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{formatDateTime(videoCall.scheduledAt)}</span>
                      </div>
                    )}

                    {videoCall.duration && (
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{videoCall.duration} minutos</span>
                      </div>
                    )}

                    {videoCall.notes && (
                      <p className="text-gray-500 mt-2">{videoCall.notes}</p>
                    )}

                    {videoCall.meetingLink && (
                      <a
                        href={videoCall.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1"
                      >
                        <VideoCameraIcon className="h-4 w-4 flex-shrink-0" />
                        Acessar reunião
                      </a>
                    )}
                  </div>
                </div>

                 {/* Ações */}
                 <div className="flex items-center gap-2">
                   {canPerformAction(videoCall, 'accept') && (
                     <button
                       onClick={() => handleAction('accept', videoCall)}
                       className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                     >
                       Aceitar
                     </button>
                   )}

                   {canPerformAction(videoCall, 'deny') && (
                     <button
                       onClick={() => {
                         const reason = prompt('Motivo da negação:');
                         if (reason) {
                           handleAction('deny', videoCall, { reason });
                         }
                       }}
                       className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                     >
                       Negar
                     </button>
                   )}

                   {canPerformAction(videoCall, 'complete') && (
                     <button
                       onClick={() => handleAction('complete', videoCall)}
                       className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                     >
                       Concluir
                     </button>
                   )}

                   {canPerformAction(videoCall, 'cancel') && (
                     <button
                       onClick={() => {
                         const reason = prompt('Motivo do cancelamento:');
                         if (reason) {
                           handleAction('cancel', videoCall, { reason });
                         }
                       }}
                       className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                     >
                       Cancelar
                     </button>
                   )}

                   {canPerformAction(videoCall, 'reschedule') && (
                     <button
                       onClick={() => {
                         const newDateTime = prompt('Nova data e hora (YYYY-MM-DDTHH:MM):');
                         if (newDateTime) {
                           const notes = prompt('Observações (opcional):');
                           handleAction('reschedule', videoCall, { scheduledAt: newDateTime, notes });
                         }
                       }}
                       className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                     >
                       Reagendar
                     </button>
                   )}

                    {/* Botão de Histórico */}
                   <button
                     onClick={() => {
                       setSelectedVideoCall(videoCall);
                       setIsHistoryOpen(true);
                     }}
                     className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                     title="Ver histórico"
                   >
                     <HistoryIcon className="h-3 w-3" />
                   </button>
                 </div>
              </div>
            </div>
          ))}
        </div>
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
    </div>
  );
} 