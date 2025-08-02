// Types baseados na documentação da API EnduranceOn

export enum UserType {
  FITNESS_STUDENT = 'FITNESS_STUDENT',
  COACH = 'COACH',
  ADMIN = 'ADMIN'
}

export enum CoachLevel {
  JUNIOR = 'JUNIOR',
  PLENO = 'PLENO',
  SENIOR = 'SENIOR',
  ESPECIALISTA = 'ESPECIALISTA'
}

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO'
}

export enum PlanPeriod {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMIANNUALLY = 'SEMIANNUALLY',
  YEARLY = 'YEARLY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum CompanyType {
  INDIVIDUAL = 'INDIVIDUAL',
  MEI = 'MEI',
  LIMITED = 'LIMITED',
  ASSOCIATION = 'ASSOCIATION'
}

// Interfaces de Autenticação
export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: UserType;
  isActive: boolean;
  coachLevel?: CoachLevel;
  bio?: string;
  image?: string;
  walletId?: string;
  cpfCnpj?: string; // Consolidado de 'cpf' e 'cpfCnpj'
  birthDate?: string | null;
  address?: Address;
  specialties?: string[];
  certifications?: string[];
  emailVerified?: boolean;
  has2FA?: boolean;
  twoFactorVerified?: boolean;
  onboardingCompleted?: boolean;
  subaccountStatus?: SubaccountStatus;
  subscriptions?: {
    plan: { id: string; name: string; };
    modalidade: { id: string; name: string; };
  }[];
  coachPlans?: { plan: Plan }[];
  coachModalidades?: { modalidade: Modalidade }[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  userType: UserType;
  cpf?: string;
  phone?: string;
  coachLevel?: CoachLevel;
  address?: Address;
  image?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface Verify2FARequest {
  code: string;
}

export interface Verify2FAResponse {
  access_token: string;
  user: User;
}

// Interfaces de Planos e Modalidades
export interface PlanPrice {
  id?: string;
  period: PlanPeriod;
  price: number;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  enrollmentFee: number;
  prices: PlanPrice[];
  modalidades: { modalidade: Modalidade }[];
  features?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Modalidade {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces de Pagamento
export interface AsaasCreditCardDto {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfoDto {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

export interface CheckoutRequest {
  userId: string;
  planId: string;
  modalidadeId: string;
  coachId?: string;
  billingType: PaymentMethod;
  period: PlanPeriod;
  creditCard?: AsaasCreditCardDto;
  creditCardHolderInfo?: AsaasCreditCardHolderInfoDto;
  remoteIp?: string;
  coupon?: string;
}

export interface CheckoutResponse {
  success: boolean;
  subscriptionId: string;
  paymentId: string;
  asaasPaymentId: string;
  asaasSubscriptionId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: 'ACTIVE' | 'PENDING'; // Status da Assinatura
  paymentStatus: PaymentStatus; // Status do Pagamento
  dueDate: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  bankSlipUrl?: string;
}

export interface CheckoutStatusResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  paymentMethod: PaymentMethod;
  dueDate: string;
  paidAt?: string;
  subscription: {
    id: string;
    status: string;
    isActive: boolean;
    plan: {
      name: string;
      modalidade?: string;
    };
  };
  split?: {
    coachAmount: number;
    coachName: string;
    status: string;
  };
}

export interface Payment {
  id: string;
  subscriptionId?: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  asaasPaymentId?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

// Interfaces de Subcontas
export interface ActivateSubaccountRequest {
  coachId: string;
  birthDate?: string;
  companyType?: CompanyType;
}

export interface ActivateSubaccountResponse {
  success: boolean;
  message: string;
  data: {
    coachId: string;
    subaccountId: string;
    walletId: string;
    accountNumber: {
      agency: string;
      account: string;
      accountDigit: string;
    };
  };
}

export interface SubaccountStatus {
  coachId: string;
  hasSubaccount: boolean;
  canReceivePayments: boolean;
  walletId?: string;
  accountNumber?: {
    agency: string;
    account: string;
    accountDigit: string;
  };
  status: string;
  createdAt?: string;
}

export interface SubaccountStats {
  totalCoaches: number;
  activeSubaccounts: number;
  pendingActivations: number;
  totalRevenue: number;
  monthlyRevenue: number;
  splitPayments: number;
  averageSplit: number;
}

// Interfaces de Subscription
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  modalidadeId: string;
  coachId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED' | 'ON_LEAVE';
  period: PlanPeriod;
  startDate: string;
  endDate: string;
  nextPaymentDate?: string;
  amount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  plan: Plan;
  modalidade: Modalidade;
  coach?: User;
  user: User;
}

// Interfaces de Dashboard
export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalRevenue: number;
  pendingPayments: number;
  activeCoaches: number;
  popularPlans: {
    planName: string;
    subscribers: number;
    revenue: number;
  }[];
  recentPayments: {
    id: string;
    userName: string;
    amount: number;
    status: PaymentStatus;
    date: string;
  }[];
}

// Interfaces de API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interfaces de Filtros
export interface UserFilters {
  userType?: UserType;
  coachLevel?: CoachLevel;
  hasActiveSubscription?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
  age?: number;
  coachId?: string;
  modalidadeId?: string;
  planId?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  period?: PlanPeriod;
  coachId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SubaccountFilters {
  hasSubaccount?: boolean;
  canReceivePayments?: boolean;
  coachLevel?: CoachLevel;
  search?: string;
  page?: number;
  limit?: number;
}

// Interfaces de Webhook
export interface WebhookPayload {
  event: string;
  payment: {
    id: string;
    status: PaymentStatus;
    amount: number;
    customer: string;
    dueDate: string;
    paidAt?: string;
  };
  subscription?: {
    id: string;
    status: string;
  };
}

// Interfaces de Erro
export interface ApiError {
  message: string;
  code: string;
  details?: any;
  timestamp: string;
}

// Interfaces de Relatórios
export interface RevenueReport {
  period: string;
  totalRevenue: number;
  splitRevenue: number;
  planRevenue: {
    planName: string;
    revenue: number;
    count: number;
  }[];
  coachRevenue: {
    coachName: string;
    revenue: number;
    count: number;
  }[];
  paymentMethodRevenue: {
    method: PaymentMethod;
    revenue: number;
    count: number;
  }[];
}

export interface PerformanceMetrics {
  conversionRate: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  monthlyGrowthRate: number;
  activeUserRate: number;
}

// Interfaces de Testes e Avaliações
export enum TestType {
  RESISTENCIA = 'RESISTENCIA',
  VELOCIDADE = 'VELOCIDADE',
  FORCA = 'FORCA',
  FLEXIBILIDADE = 'FLEXIBILIDADE',
  CARDIO = 'CARDIO',
  PERFORMANCE = 'PERFORMANCE',
  STRENGTH = 'STRENGTH',
  TECHNICAL = 'TECHNICAL',
}

export enum ExamCategory {
  SPRINT = 'SPRINT',
  SUPER_SPRINT = 'SUPER_SPRINT',
  OLYMPIC = 'OLYMPIC',
  HALF_DISTANCE = 'HALF_DISTANCE',
  DUATHLON = 'DUATHLON',
}

export interface AvailableTest {
  id: string;
  name: string;
  description: string;
  type: TestType;
  specificData?: any;
  examId?: string;
  exam?: Exam;
  isActive: boolean;
  // Novos campos para execução do teste
  executionDate?: string;
  status?: string;
  studentId?: string;
  coachId?: string;
  // Campos legados (serão removidos em versão futura)
  supportsDynamicResults?: boolean;
  defaultResultFields?: DynamicTestResult[];
  // Novos campos para campos dinâmicos
  dynamicFields?: TestDynamicField[];
  createdAt: string;
  updatedAt: string;
}

// Novo modelo para campos dinâmicos
export interface TestDynamicField {
  id: string;
  testId: string;
  fieldName: string;
  value: string;
  metric?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserTest {
  id: string;
  userId: string;
  testId: string;
  test?: AvailableTest;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  scheduledAt?: string;
  coachId?: string;
  location?: string;
  date?: string;
  results?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  testResult?: {
    id: string;
    value: number;
    unit: string;
    notes?: string;
    recordedAt: string;
    recordedBy: string;
    recorder: {
      id: string;
      name: string;
    };
  };
}

export interface ExamDistance {
  id: string;
  examId: string;
  distance: number;
  unit: string;
  price: number;
  maxParticipants: number;
  date?: string;
  category?: ExamCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamRegistration {
  id: string;
  userId: string;
  examId: string;
  distanceId?: string;
  distance?: ExamDistance;
  attended: boolean;
  attendanceConfirmedBy?: string;
  attendanceConfirmedAt?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Exam {
  id: string;
  name: string;
  description: string;
  date: string;
  end_date?: string;
  exam_url?: string;
  location: string;
  modalidadeId: string;
  modalidade: Modalidade;
  price?: number;
  maxParticipants?: number;
  isActive?: boolean;
  distances: ExamDistance[];
  categories?: Array<{
    id: string;
    name: string;
    date: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  registrations?: ExamRegistration[];
  createdAt: string;
  updatedAt: string;
}

export interface Margin {
  id: string;
  coachLevel: CoachLevel;
  planId: string;
  plan: Plan;
  percentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SplitResult {
  totalAmount: number;
  coachPercentage: number;
  coachAmount: number;
  platformAmount: number;
}

export interface FinancialRecord {
  paymentId: string;
  paymentMethod: string;
  period: string;
  amount: number;
  nextPaymentDate: string;
  coachEarnings: number;
  platformEarnings: number;
  paymentStatus: PaymentStatus;
  student: {
    id: string;
    name: string;
    email: string;
  };
  coach: {
    id: string;
    name: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
  };
  notes?: string;
}

// Interfaces de Carteira (Wallet)
export enum TransactionType {
  BONUS = 'BONUS',
  REFERRAL = 'REFERRAL',
  ACHIEVEMENT = 'ACHIEVEMENT',
  ADJUSTMENT = 'ADJUSTMENT',
  PAYMENT_DISCOUNT = 'PAYMENT_DISCOUNT',
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  transactions: WalletTransaction[];
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  balance: number;
}

// Interfaces para Dashboard do Coach - Testes e Exames
export interface TestAppointment {
  id: string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  scheduledAt?: string;
  location?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    age?: number;
  };
  test: {
    id: string;
    name: string;
    type: TestType;
    exam?: {
      id: string;
      name: string;
      modalidade: {
        id: string;
        name: string;
      };
    };
  };
  coach: {
    id: string;
    name: string;
    image?: string;
  };
}



export interface TestAppointmentsList {
  data: TestAppointment[];
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
}

export interface ExamRegistrationsList {
  data: ExamRegistration[];
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
}

export interface RegisterForExamRequest {
  distanceId: string;
}

export interface ConfirmAttendanceRequest {
  registrationId: string;
}

export interface RecordTestResultRequest {
  testId: string;
  userId: string;
  value: number;
  unit?: string;
  notes?: string;
}

export interface TestResultResponse {
  id: string;
  testId: string;
  userId: string;
  value: number;
  unit?: string;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  test: {
    id: string;
    name: string;
    description?: string;
    type: TestType;
    exam?: {
      id: string;
      name: string;
      modalidade: {
        id: string;
        name: string;
      };
    };
  };
  recorder: {
    id: string;
    name: string;
  };
}

// Interfaces para Dashboard do Coach - Financeiro
export interface FinancialTransaction {
  id: string;
  coachAmount: number;
  platformAmount: number;
  totalAmount: number;
  marginPercentage: number;
  createdAt: string;
  updatedAt: string;
  payment: {
    id: string;
    amount: number;
    status: PaymentStatus;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    subscription: {
      id: string;
      status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'PENDING';
      startDate: string;
      endDate: string;
      plan: {
        id: string;
        name: string;
        description: string;
      };
      modalidade: {
        id: string;
        name: string;
      };
    };
  };
}

export interface FinancialSummary {
  totalCoachEarnings: number;
  totalPlatformAmount: number;
  totalAmount: number;
  overallMarginPercentage: number;
  transactionCount: number;
}

export interface FinancialEarningsList {
  data: FinancialTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: FinancialSummary;
}

export interface CoachFinancialSummary {
  totalEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  pendingPayments: number;
  currentMonth: number;
  currentYear: number;
}

export interface PeriodTotalsRequest {
  startDate: string;
  endDate: string;
  modalidadeId?: string;
  planId?: string;
  paymentStatus?: string;
}

export interface PeriodTotals {
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
}

export interface FinancialFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  studentId?: string;
  planId?: string;
  modalidadeId?: string;
  paymentStatus?: PaymentStatus;
  subscriptionStatus?: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'PENDING' | 'ON_LEAVE';
}

// Sistema de Licença Temporária
export interface LeaveRequest {
  leaveStartDate: string;
  leaveDays: number;
  leaveReason?: string;
  pauseTraining: boolean;
  pauseBilling: boolean;
}

export interface LeaveResponse {
  message: string;
  subscription: {
    id: string;
    status: string;
    leaveStartDate?: string;
    leaveEndDate?: string;
    leaveDays?: number;
    leaveReason?: string;
    pauseTraining: boolean;
    pauseBilling: boolean;
  };
}

export interface LeaveSubscription {
  id: string;
  status: string;
  leaveStartDate?: string;
  leaveEndDate?: string;
  leaveDays?: number;
  leaveReason?: string;
  pauseTraining: boolean;
  pauseBilling: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
  };
  modalidade: {
    id: string;
    name: string;
  };
} 

export interface DynamicTestResult {
  fieldName: string;        // Nome do campo (ex: "Tempo", "Sprint", "Velocidade")
  value: string | number;   // Valor do resultado
  unit?: string;           // Unidade de medida (ex: "s", "h", "km/h")
  description?: string;    // Descrição adicional do campo
}

export interface TestResult {
  id: string;
  testId: string;
  userId: string;
  value: number;
  unit?: string;
  notes?: string;
  recordedBy?: string;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
  
  // Novos campos para resultados dinâmicos
  dynamicResults?: DynamicTestResult[];  // Armazena múltiplos campos de resultado
  resultType?: 'SINGLE' | 'MULTIPLE';   // Tipo do resultado (SINGLE, MULTIPLE)
  
  user: {
    id: string;
    name: string;
    email: string;
  };
  test: {
    id: string;
    name: string;
    description?: string;
    type: TestType;
    exam?: {
      id: string;
      name: string;
      modalidade: {
        id: string;
        name: string;
      };
    };
  };
  recorder?: {
    id: string;
    name: string;
  };
}

export interface RecordDynamicTestResultRequest {
  testId: string;
  userId: string;
  resultType: 'SINGLE' | 'MULTIPLE';
  singleResult?: {
    value: number;
    unit?: string;
    notes?: string;
  };
  multipleResults?: DynamicTestResult[];
  notes?: string;
} 

export interface AdminTestResult {
  id: string;
  testId: string;
  userId: string;
  value?: number;
  unit?: string;
  notes?: string;
  recordedBy?: string;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
  
  // Novos campos para resultados dinâmicos
  dynamicResults?: DynamicTestResult[];
  resultType?: 'SINGLE' | 'MULTIPLE';
  
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    birthDate?: string;
    gender?: string;
  };
  test: {
    id: string;
    name: string;
    description?: string;
    type: TestType;
    exam?: {
      id: string;
      name: string;
      modalidade: {
        id: string;
        name: string;
      };
    };
  };
  recorder?: {
    id: string;
    name: string;
    image?: string;
  };
  coach?: {
    id: string;
    name: string;
    image?: string;
  };
}

export interface AdminAllResultsResponse {
  data: AdminTestResult[];
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
    singleResults: number;
    multipleResults: number;
    byTestType: Array<{
      type: TestType;
      count: number;
    }>;
    byModalidade: Array<{
      modalidadeName: string;
      count: number;
    }>;
  };
} 

export interface AdminExamRegistration {
  id: string;
  userId: string;
  examId: string;
  attended: boolean;
  result?: string;
  user: {
    id: string;
    name: string;
    email: string;
    birthDate?: string;
    gender?: string;
  };
  exam: {
    id: string;
    name: string;
    date: string;
    modalidade: {
      id: string;
      name: string;
    };
  };
  distance: {
    distance: string;
    unit: string;
  };
}

export interface AdminExamRegistrationsResponse {
  data: AdminExamRegistration[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statistics: {
    averageAge: number;
    genderDistribution: {
      male: number;
      female: number;
      other: number;
    };
    attendanceStats: {
      attended: number;
      notAttended: number;
      total: number;
    };
    modalidadeDistribution: Record<string, number>;
  };
} 

// Interfaces para Solicitações de Teste (Coach Dashboard)
export interface TestRequest {
  id: string;
  test: {
    id: string;
    name: string;
    description: string;
    type: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  requestedAt: string;
  scheduledAt?: string;
  location?: string;
  notes?: string;
  results?: string;
}

export interface TestRequestsResponse {
  data: TestRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface UpdateTestRequestStatusRequest {
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  scheduledAt?: string;
  location?: string;
  notes?: string;
  results?: string;
} 