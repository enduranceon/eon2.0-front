import { EnduranceApiClient } from './enduranceApi';
import {
  VideoCall,
  VideoCallStatus,
  VideoCallHistory,
  CreateVideoCallRequest,
  UpdateVideoCallRequest,
  VideoCallFilters,
  VideoCallStats,
  VideoCallsResponse,
} from '../types/api';

export class VideoCallService {
  private api = new EnduranceApiClient();

  // Métodos para alunos
  async requestVideoCall(data: CreateVideoCallRequest): Promise<VideoCall> {
    try {
      return await this.api.createVideoCall(data);
    } catch (error) {
      console.error('Erro ao solicitar videochamada:', error);
      throw error;
    }
  }

  async getMyVideoCalls(filters?: VideoCallFilters): Promise<VideoCallsResponse> {
    try {
      return await this.api.getVideoCalls(filters);
    } catch (error) {
      console.error('Erro ao buscar videochamadas:', error);
      throw error;
    }
  }

  async cancelMyVideoCall(id: string, reason: string): Promise<VideoCall> {
    try {
      return await this.api.cancelVideoCall(id, { cancellationReason: reason });
    } catch (error) {
      console.error('Erro ao cancelar videochamada:', error);
      throw error;
    }
  }

  async rescheduleMyVideoCall(id: string, scheduledAt: string, notes?: string): Promise<VideoCall> {
    try {
      return await this.api.rescheduleVideoCall(id, { scheduledAt, notes });
    } catch (error) {
      console.error('Erro ao reagendar videochamada:', error);
      throw error;
    }
  }

  // Métodos para treinadores
  async getCoachVideoCalls(filters?: VideoCallFilters): Promise<VideoCallsResponse> {
    try {
      return await this.api.getVideoCalls(filters);
    } catch (error) {
      console.error('Erro ao buscar videochamadas do treinador:', error);
      throw error;
    }
  }

  async acceptVideoCall(id: string): Promise<VideoCall> {
    try {
      return await this.api.acceptVideoCall(id);
    } catch (error) {
      console.error('Erro ao aceitar videochamada:', error);
      throw error;
    }
  }

  async denyVideoCall(id: string, reason: string): Promise<VideoCall> {
    try {
      return await this.api.denyVideoCall(id, { cancellationReason: reason });
    } catch (error) {
      console.error('Erro ao negar videochamada:', error);
      throw error;
    }
  }

  async completeVideoCall(id: string): Promise<VideoCall> {
    try {
      return await this.api.completeVideoCall(id);
    } catch (error) {
      console.error('Erro ao marcar videochamada como concluída:', error);
      throw error;
    }
  }

  async updateVideoCall(id: string, data: UpdateVideoCallRequest): Promise<VideoCall> {
    try {
      return await this.api.updateVideoCall(id, data);
    } catch (error) {
      console.error('Erro ao atualizar videochamada:', error);
      throw error;
    }
  }

  // Métodos para administradores
  async getAllVideoCalls(filters?: VideoCallFilters): Promise<VideoCallsResponse> {
    try {
      return await this.api.getVideoCalls(filters);
    } catch (error) {
      console.error('Erro ao buscar todas as videochamadas:', error);
      throw error;
    }
  }

  async deleteVideoCall(id: string): Promise<void> {
    try {
      return await this.api.deleteVideoCall(id);
    } catch (error) {
      console.error('Erro ao excluir videochamada:', error);
      throw error;
    }
  }

  // Métodos gerais
  async getVideoCall(id: string): Promise<VideoCall> {
    try {
      return await this.api.getVideoCall(id);
    } catch (error) {
      console.error('Erro ao buscar videochamada:', error);
      throw error;
    }
  }

  async getVideoCallStats(): Promise<VideoCallStats> {
    try {
      return await this.api.getVideoCallStats();
    } catch (error) {
      console.error('Erro ao buscar estatísticas de videochamadas:', error);
      throw error;
    }
  }

  async getVideoCallHistory(videoCallId: string): Promise<VideoCallHistory[]> {
    try {
      return await this.api.getVideoCallHistory(videoCallId);
    } catch (error) {
      console.error('Erro ao buscar histórico da videochamada:', error);
      throw error;
    }
  }

  // Utilitários
  getStatusLabel(status: VideoCallStatus): string {
    const statusLabels: Record<VideoCallStatus, string> = {
      [VideoCallStatus.REQUESTED]: 'Solicitada',
      [VideoCallStatus.SCHEDULED]: 'Agendada',
      [VideoCallStatus.WAITING]: 'Em Espera',
      [VideoCallStatus.CANCELLED]: 'Cancelada',
      [VideoCallStatus.DENIED]: 'Negada',
      [VideoCallStatus.CHANGED]: 'Alterada',
      [VideoCallStatus.COMPLETED]: 'Concluída',
    };
    return statusLabels[status];
  }

  getStatusColor(status: VideoCallStatus): string {
    const statusColors: Record<VideoCallStatus, string> = {
      [VideoCallStatus.REQUESTED]: 'bg-yellow-100 text-yellow-800',
      [VideoCallStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
      [VideoCallStatus.WAITING]: 'bg-purple-100 text-purple-800',
      [VideoCallStatus.CANCELLED]: 'bg-red-100 text-red-800',
      [VideoCallStatus.DENIED]: 'bg-gray-100 text-gray-800',
      [VideoCallStatus.CHANGED]: 'bg-orange-100 text-orange-800',
      [VideoCallStatus.COMPLETED]: 'bg-green-100 text-green-800',
    };
    return statusColors[status];
  }

  canStudentCancel(status: VideoCallStatus): boolean {
    return [VideoCallStatus.REQUESTED, VideoCallStatus.SCHEDULED].includes(status);
  }

  canStudentReschedule(status: VideoCallStatus): boolean {
    return [VideoCallStatus.SCHEDULED].includes(status);
  }

  canCoachAccept(status: VideoCallStatus): boolean {
    return [VideoCallStatus.REQUESTED].includes(status);
  }

  canCoachDeny(status: VideoCallStatus): boolean {
    return [VideoCallStatus.REQUESTED, VideoCallStatus.SCHEDULED].includes(status);
  }

  canCoachComplete(status: VideoCallStatus): boolean {
    return [VideoCallStatus.SCHEDULED, VideoCallStatus.WAITING].includes(status);
  }

  canCoachUpdate(status: VideoCallStatus): boolean {
    return [VideoCallStatus.SCHEDULED, VideoCallStatus.WAITING].includes(status);
  }
}

export const videoCallService = new VideoCallService(); 