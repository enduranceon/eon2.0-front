import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  User,
  UserType,
  Plan,
  Modalidade,
  Exam,
  Margin,
  SplitResult,
  FinancialRecord,
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
  CoachLevel,
  RecordDynamicTestResultRequest,
  TestResult,
  TestDynamicField,
  RecordTestResultRequest,
  AdminTestResult,
  AdminAllResultsResponse,
  AdminExamRegistration,
  AdminExamRegistrationsResponse,
  TestRequest,
  TestRequestsResponse,
  UpdateTestRequestStatusRequest,
  VideoCall,
  VideoCallStatus,
  VideoCallHistory,
  CreateVideoCallRequest,
  UpdateVideoCallRequest,
  VideoCallFilters,
  VideoCallStats,
  VideoCallsResponse,
  LeaveApprovalRequest,
  LeaveExtendRequest,
  LeaveRequestCreate,
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

    // Carregar token do localStorage durante a inicialização
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('endurance_token');
      if (savedToken) {
        this.token = savedToken;
      }
    }

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
          
          // Não redirecionar automaticamente durante a inicialização
          // Deixar o AuthContext lidar com o redirecionamento
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            // Só redirecionar se não estiver já na página de login
            // e se não for durante a inicialização do AuthContext
            const isInitializing = !localStorage.getItem('auth_initialized');
            const isAuthRoute = window.location.pathname.includes('/login') || 
                               window.location.pathname.includes('/register') || 
                               window.location.pathname.includes('/forgot-password') ||
                               window.location.pathname.includes('/reset-password') ||
                               window.location.pathname.includes('/verify-email') ||
                               window.location.pathname.includes('/2fa');
            
            if (!isInitializing && !isAuthRoute) {
              // Aguardar um pouco antes de redirecionar para evitar loops
              setTimeout(() => {
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                  window.location.href = '/login';
                }
              }, 100);
            }
          }
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

  async patch<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.patch(url, data);
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      return response.data.data;
    }
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
  async getPlans(filters?: any): Promise<PaginatedResponse<Plan>> {
    return this.get<PaginatedResponse<Plan>>('/plans', filters);
  }

  async getModalidades(filters?: any): Promise<PaginatedResponse<Modalidade>> {
    return this.get<PaginatedResponse<Modalidade>>('/modalidades', filters);
  }

  async getPlan(id: string): Promise<Plan> {
    return this.get<Plan>(`/plans/${id}`);
  }

  async getModalidade(id: string): Promise<Modalidade> {
    return this.get<Modalidade>(`/modalidades/${id}`);
  }

  // PROVAS / EVENTOS
  async getExams(filters?: any): Promise<PaginatedResponse<Exam>> {
    return this.get<PaginatedResponse<Exam>>('/exams', filters);
  }
  
  async getExam(id: string): Promise<Exam> {
    return this.get<Exam>(`/exams/${id}`);
  }

  async createExam(data: Partial<Exam>): Promise<Exam> {
    return this.post<Exam>('/exams', data);
  }

  async updateExam(id: string, data: Partial<Exam>): Promise<Exam> {
    return this.patch<Exam>(`/exams/${id}`, data);
  }

  async deleteExam(id: string): Promise<void> {
    return this.delete<void>(`/exams/${id}`);
  }

  async registerForExam(examId: string, data?: { distanceId?: string; categoryId?: string }): Promise<any> {
    return this.post<any>(`/exams/${examId}/register`, data);
  }

  async cancelExamRegistration(examId: string): Promise<any> {
    return this.delete<any>(`/exams/${examId}/register`);
  }

  async getUserExams(userId: string): Promise<PaginatedResponse<Exam>> {
    return this.get<PaginatedResponse<Exam>>(`/exams/user/${userId}`);
  }

  async getExamStats(): Promise<any> {
    return this.get<any>('/exams/stats');
  }

  // TESTES
  async getAvailableTests(filters?: any): Promise<PaginatedResponse<AvailableTest>> {
    return this.get<PaginatedResponse<AvailableTest>>('/tests', filters);
  }

  async getTest(id: string): Promise<AvailableTest> {
    return this.get<AvailableTest>(`/tests/${id}`);
  }

  async createTest(data: Partial<AvailableTest>): Promise<AvailableTest> {
    return this.post<AvailableTest>('/tests', data);
  }

  async updateTest(id: string, data: Partial<AvailableTest>): Promise<AvailableTest> {
    return this.patch<AvailableTest>(`/tests/${id}`, data);
  }

  async deleteTest(id: string): Promise<void> {
    return this.delete<void>(`/tests/${id}`);
  }

  // RESULTADOS DINÂMICOS DE TESTE
  async recordDynamicTestResult(data: RecordDynamicTestResultRequest): Promise<TestResult> {
    return this.post<TestResult>('/tests/dynamic-results/record', data);
  }

  async recordCoachDynamicTestResult(data: RecordDynamicTestResultRequest): Promise<TestResult> {
    return this.post<TestResult>('/coaches/dashboard/record-dynamic-test-result', data);
  }

  // Gerenciamento de Campos Dinâmicos
  async addTestDynamicField(testId: string, data: {
    fieldName: string;
    value: string;
    metric?: string;
  }): Promise<TestDynamicField> {
    return this.post<TestDynamicField>(`/tests/${testId}/dynamic-fields`, data);
  }

  async getTestDynamicFields(testId: string): Promise<TestDynamicField[]> {
    return this.get<TestDynamicField[]>(`/tests/${testId}/dynamic-fields`);
  }

  async updateTestDynamicField(testId: string, fieldId: string, data: {
    fieldName?: string;
    value?: string;
    metric?: string;
  }): Promise<TestDynamicField> {
    return this.patch<TestDynamicField>(`/tests/${testId}/dynamic-fields/${fieldId}`, data);
  }

  async deleteTestDynamicField(testId: string, fieldId: string): Promise<void> {
    return this.delete<void>(`/tests/${testId}/dynamic-fields/${fieldId}`);
  }

  // Registrar Resultado (novo padrão preferencial: timeSeconds/generalRank/categoryRank)
  async recordTestResult(data: Partial<RecordTestResultRequest> & {
    testId: string;
    userId: string;
    timeSeconds?: number;
    generalRank?: number;
    categoryRank?: number;
    notes?: string;
  }): Promise<TestResult> {
    const payload: any = {
      testId: data.testId,
      userId: data.userId,
      timeSeconds: data.timeSeconds,
      generalRank: data.generalRank,
      categoryRank: data.categoryRank,
      notes: data.notes,
    };
    return this.post<TestResult>('/tests/record-result', payload);
  }

  // Registrar Resultado Dinâmico (Global)
  async recordDynamicResult(data: RecordDynamicTestResultRequest): Promise<TestResult> {
    return this.post<TestResult>('/tests/record-dynamic-result', data);
  }

  async getTestResults(testId: string, filters?: {
    page?: number;
    limit?: number;
    userId?: string;
    resultType?: 'SINGLE' | 'MULTIPLE';
  }): Promise<PaginatedResponse<TestResult>> {
    return this.get<PaginatedResponse<TestResult>>(`/tests/${testId}/results`, filters);
  }

  async getUserTestResults(userId: string, filters?: {
    page?: number;
    limit?: number;
    testId?: string;
    resultType?: 'SINGLE' | 'MULTIPLE';
  }): Promise<PaginatedResponse<TestResult>> {
    return this.get<PaginatedResponse<TestResult>>(`/tests/user/${userId}/results`, filters);
  }

  // Dashboard do Coach - Listar Solicitações de Teste
  async getCoachTestRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    testId?: string;
    modalidadeId?: string;
    attended?: boolean;
    startDate?: string;
    endDate?: string;
    search?: string;
    userId?: string;
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary: {
      total: number;
      pending: number;
      scheduled: number;
      completed: number;
      cancelled: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.testId) queryParams.append('testId', params.testId);
    if (params?.modalidadeId) queryParams.append('modalidadeId', params.modalidadeId);
    if (params?.attended !== undefined) queryParams.append('attended', params.attended.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.userId) queryParams.append('userId', params.userId);
    const url = `/coaches/dashboard/all-student-tests${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.get<any>(url);
  }

  // Dashboard do Coach - Listar Todos os Testes dos Alunos (Agendamentos + Resultados)
  async getAllStudentTests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    testId?: string;
    userId?: string;
    modalidadeId?: string;
    attended?: boolean;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary: {
      total: number;
      appointments: number;
      results: number;
      pending: number;
      scheduled: number;
      completed: number;
      cancelled: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.testId) queryParams.append('testId', params.testId);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.modalidadeId) queryParams.append('modalidadeId', params.modalidadeId);
    if (params?.attended !== undefined) queryParams.append('attended', params.attended.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = `/coaches/dashboard/all-student-tests${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.get<any>(url);
  }

  async updateTestRequestStatus(requestId: string, data: UpdateTestRequestStatusRequest): Promise<TestRequest> {
    return this.patch<TestRequest>(`/coaches/tests/requests/${requestId}/status`, data);
  }

  async getTestRequests(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    testId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<TestRequestsResponse> {
    const queryParams = new URLSearchParams();

    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.userId) queryParams.append('userId', filters.userId);
    if (filters?.testId) queryParams.append('testId', filters.testId);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.search) queryParams.append('search', filters.search);

    const url = `/coaches/tests/requests${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.get<TestRequestsResponse>(url);
  }

  async addTestRequestResults(requestId: string, data: {
    results: string;
    notes?: string;
  }): Promise<any> {
    return this.post<any>(`/coaches/tests/requests/${requestId}/results`, data);
  }

  async getTestAppointments(userId: string): Promise<PaginatedResponse<UserTest>> {
    const response = await this.get<PaginatedResponse<UserTest> | UserTest[]>(`/tests/appointments/list`, { userId });
    if(Array.isArray(response)) {
      return { data: response, pagination: { page: 1, limit: response.length, total: response.length, totalPages: 1, hasNext: false, hasPrev: false }};
    }
    return response as PaginatedResponse<UserTest>;
  }

  async requestTest(testId: string, notes?: string): Promise<UserTest> {
    return this.post<UserTest>(`/tests/${testId}/request`, { notes });
  }

  // Dashboard do Aluno - Histórico de Testes
  async getUserTests(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    testId?: string;
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary: {
      total: number;
      results: number;
      appointments: number;
      completed: number;
      pending: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.testId) queryParams.append('testId', filters.testId);
    
    const url = `/users/dashboard/my-tests${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.get<any>(url);
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

  // USUÁRIOS (GERAL)
  async getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    return this.get<PaginatedResponse<User>>('/users', filters);
  }

  async getUser(id: string): Promise<User> {
    return this.get<User>(`/users/${id}`);
  }

  async createUser(data: Partial<User>): Promise<User> {
    return this.post<User>('/users', data);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.put<User>(`/users/${id}`, data);
  }

  async updateUserStatus(id: string, isActive: boolean): Promise<User> {
    return this.api.patch(`/users/${id}/status`, { isActive }).then(res => res.data.data);
  }

  // Alterar treinador de um aluno (ADMIN)
  async changeStudentCoach(
    userId: string,
    coachId: string,
    applyToAllSubscriptions: boolean = true,
  ): Promise<number> {
    const response = await this.patch<any>(`/users/${userId}/change-coach`, {
      coachId,
      applyToAllSubscriptions,
    });
    // Normalizar resposta para número (quantidade de assinaturas alteradas)
    if (typeof response === 'number') return response;
    if (response && typeof response === 'object') {
      const candidates = [
        (response as any).updatedCount,
        (response as any).count,
        (response as any).updated,
        (response as any).total,
      ];
      const numeric = candidates.find(v => typeof v === 'number');
      return typeof numeric === 'number' ? numeric : 0;
    }
    return 0;
  }

  async deleteUser(id: string): Promise<void> {
    return this.delete<void>(`/users/${id}`);
  }

  // TREINADORES (Exemplo de especialização, pode não ser necessário se /users for suficiente)
  async getCoaches(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    const response = await this.get<PaginatedResponse<User> | User[]>('/coaches', {
      ...filters,
    });

    if (Array.isArray(response)) {
      return {
        data: response,
        pagination: { page: 1, limit: response.length, total: response.length, totalPages: 1, hasNext: false, hasPrev: false }
      };
    }
    return response as PaginatedResponse<User>;
  }

  async getCoach(id: string): Promise<User> {
    return this.get<User>(`/coaches/${id}`);
  }

  async linkCoachToPlan(coachId: string, planId: string): Promise<void> {
    return this.post(`/coaches/${coachId}/plans`, { planId });
  }

  async unlinkCoachFromPlan(coachId: string, planId: string): Promise<void> {
    return this.delete(`/coaches/${coachId}/plans/${planId}`);
  }

  async linkCoachToModality(coachId: string, modalityId: string): Promise<void> {
    return this.post(`/coaches/${coachId}/modalidades`, { modalidadeId: modalityId });
  }

  async unlinkCoachFromModality(coachId: string, modalityId: string): Promise<void> {
    return this.delete(`/coaches/${coachId}/modalidades/${modalityId}`);
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

  // Método getCoachEarnings removido - usando novo método nos métodos específicos do coach

  // CARTEIRA (MOEDAS)
  async getWalletBalance(): Promise<WalletBalance> {
    return this.get<WalletBalance>('/virtual-coins/balance');
  }

  async getWalletHistory(): Promise<WalletTransaction[]> {
    return this.get<WalletTransaction[]>('/virtual-coins/history');
  }

  // ADMINISTRAÇÃO
  async createPlan(data: Partial<Plan>): Promise<Plan> {
    return this.post<Plan>('/plans', data);
  }

  async updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
    return this.patch<Plan>(`/plans/${id}`, data);
  }

  async deletePlan(id: string): Promise<void> {
    return this.delete<void>(`/plans/${id}`);
  }

  async createModalidade(data: Partial<Modalidade>): Promise<Modalidade> {
    return this.post<Modalidade>('/admin/modalidades', data);
  }

  async updateModalidade(id: string, data: Partial<Modalidade>): Promise<Modalidade> {
    return this.patch<Modalidade>(`/modalidades/${id}`, data);
  }

  async deleteModalidade(id: string): Promise<void> {
    return this.delete<void>(`/admin/modalidades/${id}`);
  }

  // MARGENS E SPLIT
  async getMargins(filters?: any): Promise<PaginatedResponse<Margin>> {
    return this.get<PaginatedResponse<Margin>>('/margins', filters);
  }

  async createMargin(data: Partial<Margin>): Promise<Margin> {
    return this.post<Margin>('/margins', data);
  }

  async updateMargin(id: string, data: Partial<Margin>): Promise<Margin> {
    return this.patch<Margin>(`/margins/${id}`, data);
  }

  async deleteMargin(id: string): Promise<void> {
    return this.delete<void>(`/margins/${id}`);
  }

  async calculateSplit(params: { planId: string; coachLevel: CoachLevel; amount: number }): Promise<SplitResult> {
    return this.get<SplitResult>('/margins/calculate-split', params);
  }

  // MÓDULO FINANCEIRO
  async getFinancialRecords(endpoint: string, filters?: any): Promise<PaginatedResponse<FinancialRecord>> {
    return this.get<PaginatedResponse<FinancialRecord>>(endpoint, filters);
  }

  async updatePaymentNotes(paymentId: string, notes: string): Promise<FinancialRecord> {
    return this.patch<FinancialRecord>(`/financial/payments/${paymentId}/notes`, { notes });
  }

  async exportFinancialsToPdf(filters?: any): Promise<void> {
    const response = await this.api.get('/financial/export/pdf', {
      params: filters,
      responseType: 'blob', // Importante para receber o arquivo
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }



  // NOVOS ENDPOINTS PARA IA E DASHBOARD ADMINISTRATIVO

  // Sistema de IA e Analytics
  async getActivities(params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    userId?: string;
    limit?: number;
    page?: number;
  }): Promise<any[]> {
    return this.get<any[]>('/analytics/activities', params);
  }

  async getSystemHealth(): Promise<any> {
    return this.get<any>('/analytics/system-health');
  }

  async getCriticalAlerts(): Promise<any[]> {
    return this.get<any[]>('/analytics/alerts/critical');
  }

  async getUserSessions(userId: string): Promise<any> {
    return this.get<any>(`/users/${userId}/sessions`);
  }

  async getPredictiveAnalysis(params?: {
    period?: string;
    modules?: string[];
  }): Promise<any> {
    return this.get<any>('/analytics/predictive', params);
  }

  // Dashboard KPIs
  async getDashboardKPIs(params?: { period?: string }): Promise<any> {
    return this.get<any>('/dashboard/kpis', params);
  }

  async getModuleStats(): Promise<any> {
    return this.get<any>('/dashboard/module-stats');
  }

  async getRevenueChart(params?: {
    period?: string;
    granularity?: string;
  }): Promise<any[]> {
    return this.get<any[]>('/analytics/revenue-chart', params);
  }

  async getExecutiveInsights(params?: {
    limit?: number;
    priority?: string;
  }): Promise<any[]> {
    return this.get<any[]>('/dashboard/insights', params);
  }

  // Dados Financeiros Expandidos
  async getFinancialSummaryNew(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    return this.get<any>('/finance/summary', params);
  }

  async getFinancialRecordsNew(params?: {
    page?: number;
    limit?: number;
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    coachId?: string;
    planId?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.get<PaginatedResponse<any>>('/finance/records', params);
  }

  async getRevenueReportNew(params?: {
    period: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    return this.get<any>('/finance/revenue-report', params);
  }

  async exportFinanceReport(data: any): Promise<Blob> {
    const response = await this.api.post('/finance/export-pdf', data, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Estatísticas de Usuários
  async getUserStats(params?: { period?: string }): Promise<any> {
    return this.get<any>('/users/stats', params);
  }

  // Estatísticas de Coaches
  async getCoachStats(): Promise<any> {
    return this.get<any>('/coaches/stats');
  }

  async getCoachSubaccountStats(): Promise<any> {
    return this.get<any>('/coaches/subaccount-stats');
  }

  // =============================================================================
  // MÉTODOS ESPECÍFICOS DO DASHBOARD DO COACH
  // =============================================================================

  // Perfil do Treinador
  async getCoachProfile(): Promise<any> {
    return this.get<any>('/coaches/profile');
  }

  async updateCoachProfile(data: any): Promise<any> {
    return this.put<any>('/coaches/profile', data);
  }

  // Gerenciamento de Alunos
  async getCoachStudents(params?: { modalidadeId?: string; planId?: string; status?: string }): Promise<any> {
    
    
    // Tentativa 1: Endpoint específico de alunos do coach
    try {
      const response = await this.get<any>('/coaches/students', params);
      
      
      // A API retorna { success: true, data: { total, displayed, students: [...] } }
      if (response.success && response.data && response.data.students) {
        return {
          data: response.data.students,
          pagination: {
            page: 1,
            limit: response.data.displayed || response.data.total,
            total: response.data.total,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        };
      }
      
      return response;
    } catch (error) {
      
      // Tentativa 2: Buscar via assinaturas ativas
      try {
        const subscriptions = await this.getSubscriptions({ 
          status: 'ACTIVE',
          ...params 
        });
        
        // Extrair informações dos alunos das assinaturas
        const students = subscriptions.data
          .filter((subscription: any) => subscription.coach) // Filtrar apenas assinaturas com coach
          .map((subscription: any) => ({
            id: subscription.user.id,
            name: subscription.user.name,
            email: subscription.user.email,
            image: subscription.user.image,
            subscriptionId: subscription.id,
            planName: subscription.plan.name,
            modalidadeName: subscription.modalidade.name
          }));
        
        return {
          data: students,
          pagination: subscriptions.pagination
        };
      } catch (subscriptionError) {
        
        // Tentativa 3: Buscar todos os usuários e filtrar por tipo
        try {
          const users = await this.getUsers({ 
            userType: UserType.FITNESS_STUDENT,
            isActive: true,
            ...params 
          });
          
          return {
            data: users.data || users,
            pagination: users.pagination || { page: 1, limit: users.data?.length || 0, total: users.data?.length || 0, totalPages: 1, hasNext: false, hasPrev: false }
          };
        } catch (usersError) {
          
          // Fallback: retornar array vazio
          return {
            data: [],
            pagination: { page: 1, limit: 0, total: 0, totalPages: 1, hasNext: false, hasPrev: false }
          };
        }
      }
    }
  }

  async updateCoachStudentStatus(studentId: string, data: { isActive: boolean }): Promise<any> {
    return this.patch<any>(`/coaches/students/${studentId}/status`, data);
  }

  // Gerenciamento de Provas
  async getCoachExams(params?: { page?: number; limit?: number }): Promise<any> {
    return this.get<any>('/coaches/exams', params);
  }

  async createCoachExam(data: any): Promise<any> {
    return this.post<any>('/coaches/exams', data);
  }

  async updateCoachExam(examId: string, data: any): Promise<any> {
    return this.put<any>(`/coaches/exams/${examId}`, data);
  }

  async deleteCoachExam(examId: string): Promise<any> {
    return this.delete<any>(`/coaches/exams/${examId}`);
  }

  // Dashboard do Coach - Listar Inscrições em Provas
  async getCoachExamRegistrations(params?: {
    page?: number;
    limit?: number;
    examId?: string;
    modalidadeId?: string;
    attended?: boolean;
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary: {
      total: number;
      attended: number;
      pending: number;
      upcomingExams: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.examId) queryParams.append('examId', params.examId);
    if (params?.modalidadeId) queryParams.append('modalidadeId', params.modalidadeId);
    if (params?.attended !== undefined) queryParams.append('attended', params.attended.toString());
    
    const url = `/coaches/dashboard/exam-registrations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.get<any>(url);
  }

  // Dashboard do Coach - Confirmar Presença em Prova
  async confirmExamAttendance(registrationId: string): Promise<any> {
    return this.post<any>('/coaches/dashboard/confirm-attendance', { registrationId });
  }

  // Dashboard do Coach - Atualizar Registro de Prova (Presença + Resultado)
  async updateExamRegistration(registrationId: string, data: {
    result?: string;
    attended?: boolean;
  }): Promise<any> {
    return this.patch<any>(`/exams/registration/${registrationId}`, data);
  }

  // Dashboard do Coach - Registrar Resultado de Teste (Legado)
  async recordCoachTestResult(data: {
    testId: string;
    userId: string;
    value: number;
    unit?: string;
    notes?: string;
  }): Promise<any> {
    return this.post<any>('/coaches/dashboard/record-test-result', data);
  }

  // Sistema de Licença Temporária (refatorado)
  // Aluno apenas solicita com motivo/descrição
  async requestLeave(data: LeaveRequestCreate): Promise<any> {
    return this.post<any>('/subscriptions/request-leave', data);
  }

  async cancelLeave(): Promise<any> {
    return this.patch<any>('/subscriptions/cancel-leave');
  }

  async getLeaves(): Promise<any> {
    return this.get<any>('/subscriptions/leaves');
  }

  // Admin aprova definindo período
  async approveLeave(requestId: string, data: LeaveApprovalRequest): Promise<any> {
    return this.patch<any>(`/subscriptions/leaves/${requestId}/approve`, data);
  }

  // Admin pode estender período
  async extendLeave(subscriptionId: string, data: LeaveExtendRequest): Promise<any> {
    return this.patch<any>(`/subscriptions/leaves/${subscriptionId}/extend`, data);
  }

  async reactivateExpiredLeaves(): Promise<any> {
    return this.post<any>('/subscriptions/leaves/reactivate-expired');
  }

  // Adicionar Resultados (método legado)
  async addExamResult(examId: string, data: any): Promise<any> {
    return this.post<any>(`/coaches/exams/${examId}/results`, data);
  }

  // Relatórios Financeiros
  async getCoachEarnings(params?: { period?: 'monthly' | 'yearly' }): Promise<any> {
    return this.get<any>('/coaches/financial/earnings', params);
  }

  // Analytics do Coach
  async getCoachAnalytics(): Promise<any> {
    return this.get<any>('/coaches/dashboard/analytics');
  }

  // Insights do Coach
  async getCoachInsights(params?: { period?: '1w' | '1m' | '3m' | '6m' }): Promise<{
    summary?: any;
    insights: Array<{
      id: string;
      type: string;
      priority: 'high' | 'medium' | 'low';
      impact?: 'positive' | 'negative' | 'neutral';
      title: string;
      summary: string;
      value?: number;
      unit?: string;
      recommendations?: string[];
      confidence?: number;
      createdAt?: string;
    }>
    priorityActions?: any;
  }> {
    return this.get<any>('/coaches/dashboard/insights', params);
  }

  // Insights do Aluno
  async getStudentInsights(params?: { period?: '1w' | '1m' | '3m' | '6m' }): Promise<{
    summary?: any;
    insights: Array<{
      id: string;
      type: string; // plan | payments | exams | tests
      priority: 'high' | 'medium' | 'low';
      impact?: 'positive' | 'negative' | 'neutral';
      title: string;
      summary: string;
      value?: number;
      unit?: string;
      recommendations?: string[];
      confidence?: number;
      createdAt?: string;
    }>;
    priorityActions?: any;
  }> {
    return this.get<any>('/users/dashboard/insights', params);
  }

  // Gerenciamento de Modalidades do Coach
  async getCoachModalidades(): Promise<any> {
    return this.get<any>('/coaches/modalidades');
  }

  async getCoachModalidadesAvailable(): Promise<any> {
    return this.get<any>('/coaches/modalidades/available');
  }

  async linkCoachModalidade(modalidadeId: string): Promise<any> {
    return this.post<any>('/coaches/modalidades', { modalidadeId });
  }

  async unlinkCoachModalidade(modalidadeId: string): Promise<any> {
    return this.delete<any>(`/coaches/modalidades/${modalidadeId}`);
  }

  // Gerenciamento de Planos do Coach
  async getCoachPlans(): Promise<any> {
    return this.get<any>('/coaches/plans');
  }

  async getCoachPlansAvailable(): Promise<any> {
    return this.get<any>('/coaches/plans/available');
  }

  async linkCoachPlan(planId: string): Promise<any> {
    return this.post<any>('/coaches/plans', { planId });
  }

  async unlinkCoachPlan(planId: string): Promise<any> {
    return this.delete<any>(`/coaches/plans/${planId}`);
  }

  // Estatísticas de Planos
  async getPlanStats(): Promise<any> {
    return this.get<any>('/plans/stats');
  }

  // Estatísticas de Eventos
  async getEventStats(): Promise<any> {
    return this.get<any>('/events/stats');
  }

  async getEventsWithFilters(params?: {
    page?: number;
    limit?: number;
    status?: string;
    modalidadeId?: string;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.get<PaginatedResponse<any>>('/events', params);
  }

  // Estatísticas de Testes
  async getTestStats(): Promise<any> {
    return this.get<any>('/tests/stats');
  }

  // Resultados de Testes - Admin
  async getAdminAllResults(filters?: {
    page?: number;
    limit?: number;
    testId?: string;
    userId?: string;
    testType?: string;
    modalidadeId?: string;
    resultType?: 'SINGLE' | 'MULTIPLE';
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<AdminAllResultsResponse> {
    const queryParams = new URLSearchParams();
    
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.testId) queryParams.append('testId', filters.testId);
    if (filters?.userId) queryParams.append('userId', filters.userId);
    if (filters?.testType) queryParams.append('testType', filters.testType);
    if (filters?.modalidadeId) queryParams.append('modalidadeId', filters.modalidadeId);
    if (filters?.resultType) queryParams.append('resultType', filters.resultType);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.search) queryParams.append('search', filters.search);
    
    const url = `/tests/admin/all-results${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.get<AdminAllResultsResponse>(url);
  }

  // Registros de Provas - Admin
  async getAdminAllExamRegistrations(filters?: {
    page?: number;
    limit?: number;
    examId?: string;
    userId?: string;
    modalidadeId?: string;
    attended?: boolean;
    startDate?: string;
    endDate?: string;
    minAge?: number;
    maxAge?: number;
    gender?: string;
  }): Promise<AdminExamRegistrationsResponse> {
    const queryParams = new URLSearchParams();
    
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.examId) queryParams.append('examId', filters.examId);
    if (filters?.userId) queryParams.append('userId', filters.userId);
    if (filters?.modalidadeId) queryParams.append('modalidadeId', filters.modalidadeId);
    if (filters?.attended !== undefined) queryParams.append('attended', filters.attended.toString());
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.minAge) queryParams.append('minAge', filters.minAge.toString());
    if (filters?.maxAge) queryParams.append('maxAge', filters.maxAge.toString());
    if (filters?.gender) queryParams.append('gender', filters.gender);
    
    const url = `/exams/admin/all-registrations${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.get<AdminExamRegistrationsResponse>(url);
  }

  // Sistema de Notificações
  async getNotificationsByModule(moduleId: string): Promise<any[]> {
    return this.get<any[]>(`/notifications/by-module/${moduleId}`);
  }

  async getUserNotifications(userId: string, params?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<any[]> {
    return this.get<any[]>(`/notifications/user/${userId}`, params);
  }

  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    return this.put<{ success: boolean }>(`/notifications/${notificationId}/read`);
  }

  // Estatísticas de Margens
  async getMarginStats(): Promise<any> {
    return this.get<any>('/margins/stats');
  }

  async getMarginsWithFilters(params?: {
    page?: number;
    limit?: number;
    coachLevel?: string;
    planId?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<any>> {
    return this.get<PaginatedResponse<any>>('/margins', params);
  }

  // Estatísticas de Solicitações
  async getRequestStats(): Promise<any> {
    return this.get<any>('/requests/stats');
  }

  async getRequestsWithFilters(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.get<PaginatedResponse<any>>('/requests', params);
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
  // Dashboard do Coach - Endpoints Financeiros
  
  // Listar Ganhos Financeiros com Filtros
  async getCoachFinancialEarnings(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    studentId?: string;
    planId?: string;
    modalidadeId?: string;
    paymentStatus?: string;
    subscriptionStatus?: string;
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary: {
      totalCoachEarnings: number;
      totalPlatformAmount: number;
      totalAmount: number;
      overallMarginPercentage: number;
      transactionCount: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.studentId) queryParams.append('studentId', params.studentId);
    if (params?.planId) queryParams.append('planId', params.planId);
    if (params?.modalidadeId) queryParams.append('modalidadeId', params.modalidadeId);
    if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params?.subscriptionStatus) queryParams.append('subscriptionStatus', params.subscriptionStatus);
    
    const url = `/coaches/financial/earnings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.get<any>(url);
  }

  // Obter Totais por Período
  async getCoachFinancialPeriodTotals(data: {
    startDate: string;
    endDate: string;
    modalidadeId?: string;
    planId?: string;
    paymentStatus?: string;
  }): Promise<{
    period: {
      startDate: string;
      endDate: string;
    };
    totals: {
      coachEarnings: number;
      platformAmount: number;
      totalAmount: number;
      marginPercentage: number;
      transactionCount: number;
    };
    breakdown: {
      byPlan: Array<{
        planName: string;
        totalAmount: number;
        transactionCount: number;
      }>;
      byModalidade: Array<{
        modalidadeName: string;
        totalAmount: number;
        transactionCount: number;
      }>;
    };
  }> {
    return this.post<any>('/coaches/financial/period-totals', data);
  }

  // Resumo Financeiro
  async getCoachFinancialSummary(): Promise<{
    totalEarnings: number;
    monthlyEarnings: number;
    yearlyEarnings: number;
    pendingPayments: number;
    currentMonth: number;
    currentYear: number;
  }> {
    return this.get('/coaches/financial/summary');
  }

  // Métodos para Videochamadas

  async createVideoCall(data: CreateVideoCallRequest): Promise<VideoCall> {
    return this.post('/video-calls', data);
  }

  async getVideoCalls(filters?: VideoCallFilters): Promise<VideoCallsResponse> {
    return this.get('/video-calls', filters);
  }

  async getVideoCall(id: string): Promise<VideoCall> {
    return this.get(`/video-calls/${id}`);
  }

  async updateVideoCall(id: string, data: UpdateVideoCallRequest): Promise<VideoCall> {
    return this.patch(`/video-calls/${id}`, data);
  }

  async deleteVideoCall(id: string): Promise<void> {
    return this.delete(`/video-calls/${id}`);
  }

  async getVideoCallStats(): Promise<VideoCallStats> {
    return this.get('/video-calls/stats');
  }

  // Métodos específicos para treinadores
  async acceptVideoCall(id: string): Promise<VideoCall> {
    return this.post(`/video-calls/${id}/accept`);
  }

  async denyVideoCall(id: string, data: { cancellationReason: string }): Promise<VideoCall> {
    return this.post(`/video-calls/${id}/deny`, data);
  }

  async completeVideoCall(id: string): Promise<VideoCall> {
    return this.post(`/video-calls/${id}/complete`);
  }

  // Métodos específicos para alunos
  async cancelVideoCall(id: string, data: { cancellationReason: string }): Promise<VideoCall> {
    return this.post(`/video-calls/${id}/cancel`, data);
  }

  async rescheduleVideoCall(id: string, data: { scheduledAt: string; notes?: string }): Promise<VideoCall> {
    return this.post(`/video-calls/${id}/reschedule`, data);
  }

  // Métodos para histórico
  async getVideoCallHistory(videoCallId: string): Promise<VideoCallHistory[]> {
    return this.get(`/video-calls/${videoCallId}/history`);
  }
}

// Instância singleton
export const enduranceApi = new EnduranceApiClient();

// Hook para usar em React components
export const useEnduranceApi = () => {
  return enduranceApi;
};

export default enduranceApi; 