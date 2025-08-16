import { enduranceApi } from './enduranceApi';
import { LeaveApprovalRequest, LeaveReasonType, PlanPeriod, PaymentMethod, AsaasCreditCardDto, AsaasCreditCardHolderInfoDto } from '@/types/api';

export interface PlanQuote {
  currentPlanValue: number;
  newPlanValue: number;
  daysUsed: number;
  totalDays: number;
  remainingBalance: number;
  amountToPay: number;
  description: string;
}

export interface SubscriptionRequest {
  id: string;
  userId: string;
  type: 'PAUSE' | 'CANCEL' | 'LEAVE';
  reason: string;
  leaveReasonType?: LeaveReasonType;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  subscription: {
    id: string;
    plan: {
      id: string;
      name: string;
      price: number;
    };
  };
}

export interface PlanChangeRequest {
  newPlanId: string;
  newPeriod?: PlanPeriod;
  confirmChange?: boolean;
  differenceAmount?: number;
  billingType?: PaymentMethod;
  creditCard?: AsaasCreditCardDto;
  creditCardHolderInfo?: AsaasCreditCardHolderInfoDto;
  remoteIp?: string;
}

export interface SubscriptionRequestCreate {
  reason: string;
}

export interface AdminRequestAction {
  adminNotes: string;
}

class SubscriptionService {
  // Alteração de Planos
  async getPlanQuote(planId: string, period?: PlanPeriod): Promise<PlanQuote> {
    const params = period ? { period } : undefined;
    return await enduranceApi.get<PlanQuote>(`/subscriptions/change-plan/${planId}/quote`, params);
  }

  async changePlan(data: PlanChangeRequest): Promise<void> {
    return await enduranceApi.patch<void>('/subscriptions/change-plan', data);
  }

  async changePlanAdvanced(data: PlanChangeRequest): Promise<void> {
    return await enduranceApi.patch<void>('/subscriptions/change-plan-advanced', data);
  }

  // Solicitações de Pausa
  async requestPause(data: SubscriptionRequestCreate): Promise<SubscriptionRequest> {
    return await enduranceApi.post<SubscriptionRequest>('/subscriptions/request-pause', data);
  }

  // Solicitações de Cancelamento
  async requestCancel(data: SubscriptionRequestCreate): Promise<SubscriptionRequest> {
    return await enduranceApi.post<SubscriptionRequest>('/subscriptions/request-cancel', data);
  }

  // Administração (apenas para admins)
  async getSubscriptionRequests(
    status?: 'PENDING' | 'APPROVED' | 'REJECTED',
    type?: 'PAUSE' | 'CANCEL' | 'LEAVE'
  ): Promise<SubscriptionRequest[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (type) params.type = type;
    return await enduranceApi.get<SubscriptionRequest[]>('/subscriptions/requests', params);
  }

  async approvePause(requestId: string, data: AdminRequestAction): Promise<void> {
    return await enduranceApi.patch<void>(`/subscriptions/requests/${requestId}/approve-pause`, data);
  }

  async approveCancel(requestId: string, data: AdminRequestAction): Promise<void> {
    return await enduranceApi.patch<void>(`/subscriptions/requests/${requestId}/approve-cancel`, data);
  }

  async approveLeave(requestId: string, data: LeaveApprovalRequest): Promise<void> {
    return await enduranceApi.approveLeave(requestId, data as any);
  }

  async rejectRequest(requestId: string, data: AdminRequestAction): Promise<void> {
    return await enduranceApi.patch<void>(`/subscriptions/requests/${requestId}/reject`, data);
  }

  // Obter planos disponíveis
  async getAvailablePlans(): Promise<any[]> {
    const response = await enduranceApi.get<any>('/plans');
    // A resposta vem como { data: [...], pagination: {...} }
    // Precisamos extrair apenas o array de planos
    return response.data || response;
  }

  // Verificar se usuário tem solicitação pendente
  async hasActivePendingRequest(type?: 'PAUSE' | 'CANCEL' | 'LEAVE'): Promise<boolean> {
    try {
      const requests = await this.getSubscriptionRequests('PENDING', type);
      if (type) {
        return requests.some(request => request.type === type);
      }
      return requests.length > 0;
    } catch (error) {
      console.error('Erro ao verificar solicitações pendentes:', error);
      return false;
    }
  }
}

export const subscriptionService = new SubscriptionService(); 