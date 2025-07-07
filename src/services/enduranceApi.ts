import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  User,
  Plan,
  Modalidade,
  CheckoutRequest,
  CheckoutResponse,
  CheckoutStatusResponse,
  ActivateSubaccountRequest,
  ActivateSubaccountResponse,
  SubaccountStatus,
  SubaccountStats,
  DashboardStats,
  ApiResponse,
  PaginatedResponse,
  UserFilters,
  PaymentFilters,
  SubaccountFilters,
  Subscription,
  RevenueReport,
  PerformanceMetrics,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  Verify2FARequest,
  Verify2FAResponse,
  AvailableTest,
  UserTest,
  Wallet,
  WalletTransaction,
  WalletBalance,
  Payment,
} from '../types/api';

export class EnduranceApiClient {
  private api: AxiosInstance;
  private token?: string;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') {
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptador para adicionar token automaticamente
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptador para tratamento de erros
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado ou inválido
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Gerenciamento de Token
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('endurance_token', token);
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('endurance_token');
    }
    return null;
  }

  clearToken(): void {
    this.token = undefined;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('endurance_token');
    }
  }

  // Métodos HTTP Auxiliares
  async get<T>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.get(url, { params });
    // Se a resposta tem a estrutura ApiResponse, extrair os dados
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data;
    }
    // Fallback para respostas que não seguem a estrutura ApiResponse
    return response.data as unknown as T;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.post(url, data);
    // Se a resposta tem a estrutura ApiResponse, extrair os dados
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data;
    }
    // Fallback para respostas que não seguem a estrutura ApiResponse
    return response.data as unknown as T;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.put(url, data);
    // Se a resposta tem a estrutura ApiResponse, extrair os dados
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data;
    }
    // Fallback para respostas que não seguem a estrutura ApiResponse
    return response.data as unknown as T;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.delete(url);
    // Se a resposta tem a estrutura ApiResponse, extrair os dados
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data;
    }
    // Fallback para respostas que não seguem a estrutura ApiResponse
    return response.data as unknown as T;
  }

  // AUTENTICAÇÃO
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/auth/login', credentials);
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    return response;
  }

  async getProfile(): Promise<User> {
    return this.get<User>('/auth/me');
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  async register(userData: RegisterRequest): Promise<void> {
    return this.post('/auth/register', userData);
  }

  async verifyEmail(token: string): Promise<void> {
    return this.post('/auth/verify-email', { token });
  }

  async forgotPassword(email: string): Promise<void> {
    return this.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    return this.post('/auth/reset-password', { token, password });
  }

  async verify2FA(code: string): Promise<Verify2FAResponse> {
    return this.post<Verify2FAResponse>('/auth/verify-2fa', { code });
  }

  async resend2FA(): Promise<void> {
    return this.post('/auth/resend-2fa');
  }

  async resendVerificationEmail(): Promise<void> {
    return this.post('/auth/resend-verification');
  }

  async getActiveSubscription(): Promise<Subscription | null> {
    try {
      return this.get<Subscription>('/subscriptions/active');
    } catch (error) {
      return null;
    }
  }

  // PLANOS E MODALIDADES
  async getPlans(): Promise<PaginatedResponse<Plan> | Plan[]> {
    return this.get<PaginatedResponse<Plan> | Plan[]>('/plans');
  }

  async getModalidades(): Promise<PaginatedResponse<Modalidade> | Modalidade[]> {
    return this.get<PaginatedResponse<Modalidade> | Modalidade[]>('/modalidades');
  }

  async getPlan(id: string): Promise<Plan> {
    return this.get<Plan>(`/plans/${id}`);
  }

  async getModalidade(id: string): Promise<Modalidade> {
    return this.get<Modalidade>(`/modalidades/${id}`);
  }

  // PROVAS / EVENTOS
  async getExams(page: number = 1, limit: number = 10): Promise<PaginatedResponse<any> | any[]> {
    return this.get<PaginatedResponse<any> | any[]>('/exams', { page, limit });
  }

  async registerForExam(examId: string): Promise<any> {
    return this.post<any>(`/exams/${examId}/register`);
  }

  async cancelExamRegistration(examId: string): Promise<any> {
    return this.delete<any>(`/exams/${examId}/register`);
  }

  // TESTES
  async getAvailableTests(page: number = 1, limit: number = 100): Promise<PaginatedResponse<AvailableTest> | AvailableTest[]> {
    return this.get<PaginatedResponse<AvailableTest> | AvailableTest[]>('/tests', { page, limit });
  }

  async getTestAppointments(userId: string): Promise<PaginatedResponse<UserTest> | UserTest[]> {
    return this.get<PaginatedResponse<UserTest> | UserTest[]>(`/tests/appointments/list`, { userId });
  }

  async requestTest(testId: string, notes?: string): Promise<UserTest> {
    return this.post<UserTest>(`/tests/${testId}/request`, { notes });
  }

  async getUserTests(userId: string): Promise<PaginatedResponse<UserTest> | UserTest[]> {
    return this.get<PaginatedResponse<UserTest> | UserTest[]>(`/tests/user/${userId}`);
  }

  // CHECKOUT E PAGAMENTOS
  async checkout(data: CheckoutRequest): Promise<CheckoutResponse> {
    return this.post<CheckoutResponse>('/checkout', data);
  }

  async getPaymentStatus(paymentId: string): Promise<CheckoutStatusResponse> {
    return this.get<CheckoutStatusResponse>(`/checkout/${paymentId}/status`);
  }

  async getPayments(filters?: PaymentFilters): Promise<PaginatedResponse<Payment>> {
    return this.get<PaginatedResponse<Payment>>('/payments', filters);
  }

  async getPaymentMethods(): Promise<any[]> {
    try {
      return this.get<any[]>('/payment-methods');
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
      return [];
    }
  }

  async addCreditCard(cardData: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string; isDefault?: boolean; }): Promise<any> {
    return this.post<any>('/payment-methods/card', cardData);
  }

  // SUBCONTAS DE TREINADORES
  async activateSubaccount(coachId: string, data: ActivateSubaccountRequest): Promise<ActivateSubaccountResponse> {
    return this.post<ActivateSubaccountResponse>(`/subaccounts/coach/${coachId}/activate`, data);
  }

  async getSubaccountStatus(coachId: string): Promise<SubaccountStatus> {
    return this.get<SubaccountStatus>(`/subaccounts/coach/${coachId}/status`);
  }

  async getCoachesSubaccounts(filters?: SubaccountFilters): Promise<PaginatedResponse<User & { subaccountStatus: SubaccountStatus }>> {
    return this.get<PaginatedResponse<User & { subaccountStatus: SubaccountStatus }>>('/subaccounts/coaches', filters);
  }

  async getSubaccountStats(): Promise<SubaccountStats> {
    return this.get<SubaccountStats>('/subaccounts/stats');
  }

  // USUÁRIOS
  async getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    return this.get<PaginatedResponse<User>>('/users', filters);
  }

  async getUser(id: string): Promise<User> {
    return this.get<User>(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.put<User>(`/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete<void>(`/users/${id}`);
  }

  // COACHES
  async getCoaches(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    const response = await this.get<PaginatedResponse<User> | User[]>('/coaches', {
      ...filters,
      userType: 'COACH',
    });

    // Se a API retornar um array simples de usuários, embrulhar em estrutura paginada padrão
    if (Array.isArray(response)) {
      return {
        data: response,
        total: response.length,
        page: 1,
        limit: response.length,
        totalPages: 1,
      } as PaginatedResponse<User>;
    }

    // Caso já venha na estrutura paginada, apenas retornar
    return response as PaginatedResponse<User>;
  }

  async getCoach(id: string): Promise<User> {
    return this.get<User>(`/coaches/${id}`);
  }

  async updateCoach(id: string, data: Partial<User>): Promise<User> {
    return this.put<User>(`/coaches/${id}`, data);
  }

  // SUBSCRIPTIONS
  async getSubscriptions(filters?: any): Promise<PaginatedResponse<Subscription>> {
    return this.get<PaginatedResponse<Subscription>>('/subscriptions', filters);
  }

  async getSubscription(id: string): Promise<Subscription> {
    return this.get<Subscription>(`/subscriptions/${id}`);
  }

  async cancelSubscription(id: string): Promise<void> {
    return this.post<void>(`/subscriptions/${id}/cancel`);
  }

  async reactivateSubscription(id: string): Promise<void> {
    return this.post<void>(`/subscriptions/${id}/reactivate`);
  }

  // DASHBOARD E ESTATÍSTICAS
  async getDashboardStats(): Promise<DashboardStats> {
    return this.get<DashboardStats>('/dashboard/stats');
  }

  async getRevenueReport(period: string): Promise<RevenueReport> {
    return this.get<RevenueReport>(`/reports/revenue`, { period });
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.get<PerformanceMetrics>('/reports/performance');
  }

  // RELATÓRIOS FINANCEIROS
  async getFinancialSummary(startDate: string, endDate: string): Promise<any> {
    return this.get<any>('/reports/financial', {
      startDate,
      endDate,
    });
  }

  async getCoachEarnings(coachId: string, startDate: string, endDate: string): Promise<any> {
    return this.get<any>(`/reports/coach/${coachId}/earnings`, {
      startDate,
      endDate,
    });
  }

  // CARTEIRA (MOEDAS)
  async getWalletBalance(): Promise<WalletBalance> {
    return this.get<WalletBalance>('/virtual-coins/balance');
  }

  async getWalletHistory(): Promise<WalletTransaction[]> {
    return this.get<WalletTransaction[]>('/virtual-coins/history');
  }

  // ADMINISTRAÇÃO
  async createPlan(data: Partial<Plan>): Promise<Plan> {
    return this.post<Plan>('/admin/plans', data);
  }

  async updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
    return this.put<Plan>(`/admin/plans/${id}`, data);
  }

  async deletePlan(id: string): Promise<void> {
    return this.delete<void>(`/admin/plans/${id}`);
  }

  async createModalidade(data: Partial<Modalidade>): Promise<Modalidade> {
    return this.post<Modalidade>('/admin/modalidades', data);
  }

  async updateModalidade(id: string, data: Partial<Modalidade>): Promise<Modalidade> {
    return this.put<Modalidade>(`/admin/modalidades/${id}`, data);
  }

  async deleteModalidade(id: string): Promise<void> {
    return this.delete<void>(`/admin/modalidades/${id}`);
  }

  // UTILITÁRIOS
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>('/health');
  }

  async uploadFile(file: File, path: string): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // WEBHOOKS (para debug/admin)
  async getWebhookEvents(filters?: any): Promise<PaginatedResponse<any>> {
    return this.get<PaginatedResponse<any>>('/admin/webhooks', filters);
  }

  async retryWebhook(eventId: string): Promise<void> {
    return this.post<void>(`/admin/webhooks/${eventId}/retry`);
  }
}

// Instância singleton
export const enduranceApi = new EnduranceApiClient();

// Hook para usar em React components
export const useEnduranceApi = () => {
  return enduranceApi;
};

export default enduranceApi; 