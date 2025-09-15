import { EnduranceApiClient } from './enduranceApi';

export interface Feature {
  id: string;
  name: string;
  description: string;
  value: number;
  quantity?: number;
  validUntil?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'DISCONTINUED';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface FeaturePurchaseRequest {
  featureId: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  paymentMethodId?: string; // Para cartão salvo
  creditCardNumber?: string;
  creditCardHolderName?: string;
  creditCardExpiryMonth?: string;
  creditCardExpiryYear?: string;
  creditCardCvv?: string;
  remoteIp?: string;
}

export interface FeaturePurchaseResponse {
  id: string;
  userId: string;
  featureId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  createdAt: string;
  feature: Feature;
  payment?: {
    id: string;
    status: 'PENDING' | 'CONFIRMED' | 'OVERDUE' | 'CANCELLED';
    paymentMethod: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
    pixQrCode?: string;
    pixCopyPaste?: string;
    bankSlipUrl?: string;
    dueDate?: string;
  };
}

export interface UserFeature {
  id: string;
  userId: string;
  featureId: string;
  purchasedAt: string;
  expiresAt?: string;
  isActive: boolean;
  feature: Feature;
}

class FeatureService {
  private api = new EnduranceApiClient();

  // Buscar features disponíveis para compra
  async getFeaturesForSale(): Promise<Feature[]> {
    try {
      const response = await this.api.get<Feature[]>('/features/for-sale');
      return response;
    } catch (error) {
      console.error('Erro ao buscar features disponíveis:', error);
      throw error;
    }
  }

  // Buscar features do usuário
  async getUserFeatures(): Promise<UserFeature[]> {
    try {
      const response = await this.api.get<UserFeature[]>('/user/features');
      return response;
    } catch (error) {
      console.error('Erro ao buscar features do usuário:', error);
      throw error;
    }
  }

  // Comprar feature
  async purchaseFeature(data: FeaturePurchaseRequest): Promise<FeaturePurchaseResponse> {
    try {
      const response = await this.api.post<FeaturePurchaseResponse>('/user/features/purchase', data);
      return response;
    } catch (error) {
      console.error('Erro ao comprar feature:', error);
      throw error;
    }
  }

  // Ativar feature
  async activateFeature(featureId: string): Promise<void> {
    try {
      await this.api.post(`/user/features/${featureId}/activate`);
    } catch (error) {
      console.error('Erro ao ativar feature:', error);
      throw error;
    }
  }

  // Buscar pagamentos pendentes
  async getPendingPayments(): Promise<any[]> {
    try {
      const response = await this.api.getPendingPayments();
      return response;
    } catch (error) {
      console.error('Erro ao buscar pagamentos pendentes:', error);
      throw error;
    }
  }

  // Desativar feature
  async deactivateFeature(featureId: string): Promise<void> {
    try {
      await this.api.post(`/user/features/${featureId}/deactivate`);
    } catch (error) {
      console.error('Erro ao desativar feature:', error);
      throw error;
    }
  }
}

export const featureService = new FeatureService();
