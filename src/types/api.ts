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

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'
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
  gender?: Gender | string;
  address?: Address;
  addresses?: (Address & { isMain?: boolean })[];
  specialties?: string[];
  certifications?: string[];
  emailVerified?: boolean;
  has2FA?: boolean;
  twoFactorVerified?: boolean;
  onboardingCompleted?: boolean;
  subaccountStatus?: SubaccountStatus;
  subscriptions?: Subscription[];
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

export interface OverdueInfo {
  isOverdue: boolean;
  overdueAmount?: number;
  dueDate?: string;
  daysRemaining?: number;
  accessLimitDate?: string;
  isAccessBlocked: boolean;
  message?: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
  overdueInfo?: OverdueInfo;
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
  birthDate?: string; // formato esperado: YYYY-MM-DD 00:00:00.000
  gender?: Gender | string;
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
  features?: PlanFeature[];
  isActive: boolean;
  forSale: boolean;
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
  installmentCount?: number;
  creditCard?: AsaasCreditCardDto;
  creditCardHolderInfo?: AsaasCreditCardHolderInfoDto;
  remoteIp?: string;
  enrollmentFee?: number;
  discountCoupon?: string;
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

export interface AsaasPaymentData {
  id: string;
  status: string;
  billingType: PaymentMethod;
  pixData?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
  boletoData?: {
    bankSlipUrl: string;
    bankSlipBarCode: string;
    bankSlipBarCodeNumber: string;
  };
  invoiceUrl?: string;
  transactionReceiptUrl?: string;
  creditCardData?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
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
  asaasPaymentData?: AsaasPaymentData;
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
  modalidadeId?: string;
  modalidade?: Modalidade;
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
  imageUrl?: string;
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

export interface ExamImageResponse {
  id: string;
  name: string;
  imageUrl?: string;
  updatedAt: string;
}

export interface UploadExamImageRequest {
  file: File;
}

export interface UpdateExamImageUrlRequest {
  imageUrl: string;
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
  dueDate?: string;
  installments?: number;
  installmentAmount?: number;
  receiptDate?: string;
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
  confirmedBy?: string; // ID do treinador que está confirmando
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
    dueDate?: string;
    installments?: number;
    installmentNumber?: number;
    installmentAmount?: number;
    receiptDate?: string;
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
export enum LeaveReasonType {
  TRAVEL = 'TRAVEL',
  ILLNESS = 'ILLNESS',
  FINANCIAL = 'FINANCIAL',
  OTHER = 'OTHER',
}

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
  leaveReasonType?: LeaveReasonType;
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

// Novos contratos para o fluxo de Licença baseado na doc subscription-management.md
export interface LeaveRequestCreate {
  reasonType: LeaveReasonType;
  reasonDescription?: string;
}

export interface LeaveApprovalRequest {
  startDate: string; // ISO string
  endDate: string;   // ISO string
  adminNotes?: string;
}

export interface LeaveExtendRequest {
  newEndDate: string; // ISO string
  notes?: string;
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
  // Novo padrão de resultados (preferencial)
  timeSeconds?: number;      // tempo total em segundos
  generalRank?: number;      // classificação geral (inteiro ≥ 1)
  categoryRank?: number;     // classificação na categoria (inteiro ≥ 1)
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

  // Campos legados (compatibilidade)
  value?: number;            // legado - não usar no frontend novo
  unit?: string;             // legado - não usar no frontend novo
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
  reportUrl?: string | null;
  
  // Novos campos para resultados dinâmicos
  dynamicResults?: {
    type?: string;
    notes?: string;
    multipleResults?: DynamicTestResult[];
  } | DynamicTestResult[];
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

// Tipos para Videochamadas
export enum VideoCallStatus {
  REQUESTED = 'REQUESTED',
  SCHEDULED = 'SCHEDULED',
  WAITING = 'WAITING',
  CANCELLED = 'CANCELLED',
  DENIED = 'DENIED',
  CHANGED = 'CHANGED',
  COMPLETED = 'COMPLETED'
}

export interface VideoCall {
  id: string;
  studentId: string;
  coachId: string;
  status: VideoCallStatus;
  requestedAt: string;
  scheduledAt?: string;
  completedAt?: string;
  duration?: number; // em minutos
  meetingLink?: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  student?: User;
  coach?: User;
}

export interface VideoCallHistory {
  id: string;
  videoCallId: string;
  status: VideoCallStatus;
  changedBy: string; // userId
  notes?: string;
  changedAt: string;
  user?: User;
}

export interface CreateVideoCallRequest {
  coachId: string;
  scheduledAt?: string;
  duration?: number; // 15-120 minutos
  notes?: string;
}

export interface UpdateVideoCallRequest {
  status?: VideoCallStatus;
  scheduledAt?: string;
  duration?: number;
  meetingLink?: string;
  notes?: string;
  cancellationReason?: string;
}

export interface VideoCallFilters {
  status?: VideoCallStatus;
  studentId?: string;
  coachId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface VideoCallStats {
  total: number;
  requested: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  denied: number;
  averageResponseTime?: number; // em minutos
  averageDuration?: number; // em minutos
  monthlyUsage?: {
    month: string;
    count: number;
  }[];
}

export interface VideoCallsResponse {
  data: VideoCall[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary?: VideoCallStats;
} 

export interface ConsentTerm {
  id: string;
  version: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentAcceptance {
  id: string;
  userId: string;
  consentTermId: string;
  consentTermVersion: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentAcceptanceRequest {
  userId: string;
  consentTermVersion: string;
  ipAddress?: string;
  userAgent?: string;
}

// Interfaces para visualização do termo de aceite
export interface ConsentViewUser {
  id: string;
  name: string;
  email: string;
}

export interface ConsentViewCurrentTerm {
  id: string;
  content: string;
  version: string;
  createdAt: string;
}

export interface ConsentViewHistoryItem {
  id: string;
  version: string;
  acceptedAt: string;
  ipAddress?: string;
}

export interface ConsentViewResponse {
  user: ConsentViewUser;
  currentTerm: ConsentViewCurrentTerm;
  consentHistory: ConsentViewHistoryItem[];
  hasAcceptedLatestTerm: boolean;
  lastAcceptedAt: string | null;
  totalConsents: number;
}

// Interfaces para WebSocket
export interface UserPhotoUpdateEvent {
  userId: string;
  imageUrl: string;
  updatedAt: string;
  userType: string;
  timestamp: string;
  receivedAt?: string; // Timestamp de quando o evento foi recebido no frontend
}

export interface UserProfileUpdateEvent {
  userId: string;
  updatedFields: string[];
  updatedAt: string;
  userType: string;
  timestamp: string;
}

export interface UserStatusChangeEvent {
  userId: string;
  status: string;
  previousStatus: string;
  updatedAt: string;
  userType: string;
  timestamp: string;
}

// Interface WebSocketEvent movida para baixo com novos eventos

export interface WebSocketConnectionStatus {
  isConnected: boolean;
  lastConnected?: string;
  lastDisconnected?: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

// Novos eventos WebSocket implementados
export interface ExamResultRegisteredEvent {
  userId: string;
  examId: string;
  examName: string;
  result: any;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface TestResultRegisteredEvent {
  userId: string;
  testId: string;
  testName: string;
  result: any;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface NewExamCreatedEvent {
  examId: string;
  examName: string;
  modalidade: string;
  coachId: string;
  coachName: string;
  students: string[];
  timestamp: string;
}

export interface PlanChangeEvent {
  userId: string;
  studentName: string;
  oldPlanId: string;
  oldPlanName: string;
  newPlanId: string;
  newPlanName: string;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface StudentAccountCreatedEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface LeaveRequestEvent {
  userId: string;
  studentName: string;
  requestId: string;
  reason: string;
  startDate: string;
  endDate: string;
  coachId: string;
  coachName: string;
  timestamp: string;
}

// Novos tipos de eventos WebSocket baseados na documentação

// Eventos Aluno → Treinador
export interface StudentExternalExamCreatedEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  examId: string;
  examName: string;
  modalidade: string;
  examDate: string;
  location: string;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface StudentExamRegisteredEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  examId: string;
  examName: string;
  modalidade: string;
  examDate: string;
  location: string;
  registrationId: string;
  distanceId?: string;
  categoryId?: string;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface StudentTestReportRequestedEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  requestId: string;
  testResultId: string;
  testName?: string;
  reason?: string;
  requiresPayment: boolean;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface StudentSubscriptionCreatedEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  subscriptionId: string;
  planId: string;
  planName: string;
  period: string;
  value: number;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface StudentFeaturePurchasedEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  featureId: string;
  featureName: string;
  value: number;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface StudentPlanCancelledEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  subscriptionId: string;
  planId: string;
  planName: string;
  cancellationReason?: string;
  coachId: string;
  coachName: string;
  timestamp: string;
}

// Eventos Treinador → Aluno
export interface CoachExamResultRegisteredEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  examId: string;
  examName: string;
  modalidade: string;
  examDate: string;
  result: string;
  timeSeconds?: number;
  generalRank?: number;
  categoryRank?: number;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface CoachExamAttendanceConfirmedEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  examId: string;
  examName: string;
  modalidade: string;
  examDate: string;
  examLocation?: string;
  registrationId: string;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface CoachTestResultRegisteredEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  testId: string;
  testName: string;
  testType: string;
  result: TestResult | any; // Pode ser TestResult completo ou dados simplificados
  notes?: string;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface CoachTestReportAddedEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  testResultId: string;
  testName: string;
  reportUrl: string;
  notes?: string;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface CoachStudentStatusChangedEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  oldStatus: boolean;
  newStatus: boolean;
  reason?: string;
  coachId: string;
  coachName: string;
  timestamp: string;
}

export interface CoachStudentDataUpdatedEvent {
  userId: string;
  studentName: string;
  studentEmail: string;
  updatedFields: string[];
  updateReason?: string;
  coachId: string;
  coachName: string;
  timestamp: string;
}

// Eventos Sistema → Administrador
export interface AdminUserRegisteredEvent {
  userId: string;
  userName: string;
  userEmail: string;
  userType: string;
  registrationSource?: string;
  timestamp: string;
}

export interface AdminSubscriptionCreatedEvent {
  userId: string;
  userName: string;
  userEmail: string;
  subscriptionId: string;
  planId: string;
  planName: string;
  period: string;
  value: number;
  coachId?: string;
  coachName?: string;
  paymentMethod?: string;
  timestamp: string;
}

export interface AdminLeaveRequestedEvent {
  userId: string;
  userName: string;
  userEmail: string;
  requestId: string;
  reason: string;
  startDate: string;
  endDate: string;
  coachId?: string;
  coachName?: string;
  timestamp: string;
}

export interface AdminPlanChangedEvent {
  userId: string;
  userName: string;
  userEmail: string;
  subscriptionId: string;
  oldPlanId: string;
  oldPlanName: string;
  newPlanId: string;
  newPlanName: string;
  changeReason?: string;
  coachId?: string;
  coachName?: string;
  timestamp: string;
}

export interface AdminCancellationRequestedEvent {
  userId: string;
  userName: string;
  userEmail: string;
  subscriptionId: string;
  planId: string;
  planName: string;
  cancellationReason?: string;
  coachId?: string;
  coachName?: string;
  timestamp: string;
}

export interface AdminAsaasWebhookEvent {
  webhookId: string;
  eventType: string;
  eventData: {
    paymentId?: string;
    subscriptionId?: string;
    customerId?: string;
    amount?: number;
    status?: string;
    billingType?: string;
    dueDate?: string;
    description?: string;
  };
  paymentId?: string;
  subscriptionId?: string;
  customerId?: string;
  userId?: string;
  userName?: string;
  amount?: number;
  status?: string;
  description: string;
  timestamp: string;
}

// ===== CONFIGURAÇÕES DE NOTIFICAÇÕES =====

export interface NotificationSettings {
  id: string;
  userId: string;
  userType: 'FITNESS_STUDENT' | 'COACH' | 'ADMIN';
  
  // Configurações gerais
  enabled: boolean;
  soundEnabled: boolean;
  desktopEnabled: boolean;
  emailEnabled: boolean;
  
  // Configurações específicas por tipo de usuário
  
  // Para Alunos - Eventos do Treinador
  studentSettings?: {
    examResultRegistered: boolean;
    examAttendanceConfirmed: boolean;
    testResultRegistered: boolean;
    testReportAdded: boolean;
    studentStatusChanged: boolean;
    studentDataUpdated: boolean;
  };
  
  // Para Treinadores - Eventos dos Alunos
  coachSettings?: {
    externalExamCreated: boolean;
    examRegistered: boolean;
    testReportRequested: boolean;
    subscriptionCreated: boolean;
    featurePurchased: boolean;
    planCancelled: boolean;
  };
  
  // Para Administradores - Eventos do Sistema
  adminSettings?: {
    userRegistered: boolean;
    subscriptionCreated: boolean;
    leaveRequested: boolean;
    planChanged: boolean;
    cancellationRequested: boolean;
    asaasWebhook: boolean;
    // Configurações específicas para webhooks Asaas
    asaasWebhookTypes?: {
      PAYMENT_RECEIVED: boolean;
      PAYMENT_OVERDUE: boolean;
      PAYMENT_REFUNDED: boolean;
      SUBSCRIPTION_CREATED: boolean;
      PAYMENT_CHARGEBACK_REQUESTED: boolean;
      PAYMENT_CREATED: boolean;
      PAYMENT_CONFIRMED: boolean;
    };
  };
  
  // Metadados
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationSettingsRequest {
  enabled?: boolean;
  soundEnabled?: boolean;
  desktopEnabled?: boolean;
  emailEnabled?: boolean;
  
  // Configurações específicas por tipo de usuário
  studentSettings?: Partial<NotificationSettings['studentSettings']>;
  coachSettings?: Partial<NotificationSettings['coachSettings']>;
  adminSettings?: Partial<NotificationSettings['adminSettings']>;
}

export interface UpdateNotificationSettingsRequest extends CreateNotificationSettingsRequest {
  id: string;
}

export interface NotificationSettingsResponse {
  success: boolean;
  message: string;
  data: NotificationSettings;
}

export interface NotificationSettingsListResponse {
  success: boolean;
  message: string;
  data: NotificationSettings[];
}

// Configurações padrão para cada tipo de usuário
export const DEFAULT_STUDENT_NOTIFICATION_SETTINGS: NotificationSettings = {
  id: '',
  userId: '',
  userType: 'FITNESS_STUDENT',
  enabled: true,
  soundEnabled: true,
  desktopEnabled: true,
  emailEnabled: false,
  studentSettings: {
    examResultRegistered: true,
    examAttendanceConfirmed: true,
    testResultRegistered: true,
    testReportAdded: true,
    studentStatusChanged: true,
    studentDataUpdated: true,
  },
  createdAt: '',
  updatedAt: '',
};

export const DEFAULT_COACH_NOTIFICATION_SETTINGS: NotificationSettings = {
  id: '',
  userId: '',
  userType: 'COACH',
  enabled: true,
  soundEnabled: true,
  desktopEnabled: true,
  emailEnabled: false,
  coachSettings: {
    externalExamCreated: true,
    examRegistered: true,
    testReportRequested: true,
    subscriptionCreated: true,
    featurePurchased: true,
    planCancelled: true,
  },
  createdAt: '',
  updatedAt: '',
};

export const DEFAULT_ADMIN_NOTIFICATION_SETTINGS: NotificationSettings = {
  id: '',
  userId: '',
  userType: 'ADMIN',
  enabled: true,
  soundEnabled: true,
  desktopEnabled: true,
  emailEnabled: false,
  adminSettings: {
    userRegistered: true,
    subscriptionCreated: true,
    leaveRequested: true,
    planChanged: true,
    cancellationRequested: true,
    asaasWebhook: true,
    asaasWebhookTypes: {
      PAYMENT_RECEIVED: true,
      PAYMENT_OVERDUE: true,
      PAYMENT_REFUNDED: true,
      SUBSCRIPTION_CREATED: true,
      PAYMENT_CHARGEBACK_REQUESTED: true,
      PAYMENT_CREATED: true,
      PAYMENT_CONFIRMED: true,
    },
  },
  createdAt: '',
  updatedAt: '',
};

// ===== NOTIFICAÇÕES ARMAZENADAS =====

export interface StoredNotification {
  id: string;
  type: 'websocket' | 'system' | 'manual';
  eventType: string;
  title: string;
  message: string;
  description?: string;
  data?: any;
  userId: string;
  userType: 'FITNESS_STUDENT' | 'COACH' | 'ADMIN';
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'exam' | 'test' | 'subscription' | 'payment' | 'system' | 'other';
  timestamp: string;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  color?: string;
}

export interface NotificationFilter {
  isRead?: boolean;
  category?: StoredNotification['category'];
  priority?: StoredNotification['priority'];
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<StoredNotification['category'], number>;
  byPriority: Record<StoredNotification['priority'], number>;
  recentCount: number; // últimas 24h
}

// Mapeamento de eventos WebSocket para categorias, prioridades e URLs
export const WEBSOCKET_EVENT_MAPPING: Record<string, {
  category: StoredNotification['category'];
  priority: StoredNotification['priority'];
  icon: string;
  color: string;
  redirectUrl?: string; // URL para redirecionamento quando clicar na notificação
}> = {
  // Eventos de Aluno para Treinador
  'student:external-exam:created': {
    category: 'exam',
    priority: 'medium',
    icon: '🏃‍♂️',
    color: '#2196F3',
    redirectUrl: '/dashboard/coach/provas-externas'
  },
  'student:exam:registered': {
    category: 'exam',
    priority: 'medium',
    icon: '✅',
    color: '#4CAF50',
    redirectUrl: '/dashboard/coach/confirmar-presenca'
  },
  'student:test-report:requested': {
    category: 'test',
    priority: 'high',
    icon: '📄',
    color: '#FF9800',
    redirectUrl: '/dashboard/coach/gerenciar-testes'
  },
  'student:subscription:created': {
    category: 'subscription',
    priority: 'high',
    icon: '💰',
    color: '#4CAF50',
    redirectUrl: '/dashboard/coach/planos'
  },
  'student:feature:purchased': {
    category: 'subscription',
    priority: 'medium',
    icon: '🎯',
    color: '#9C27B0',
    redirectUrl: '/dashboard/coach/financeiro'
  },
  'student:plan:cancelled': {
    category: 'subscription',
    priority: 'high',
    icon: '❌',
    color: '#F44336',
    redirectUrl: '/dashboard/coach/planos'
  },
  
  // Eventos de Treinador para Aluno
  'coach:exam-result:registered': {
    category: 'exam',
    priority: 'high',
    icon: '✅',
    color: '#4CAF50',
    redirectUrl: '/dashboard/aluno/eventos'
  },
  'coach:exam-attendance:confirmed': {
    category: 'exam',
    priority: 'medium',
    icon: '📋',
    color: '#2196F3',
    redirectUrl: '/dashboard/aluno/eventos'
  },
  'coach:test-result:registered': {
    category: 'test',
    priority: 'high',
    icon: '📊',
    color: '#2196F3',
    redirectUrl: '/dashboard/aluno/testes'
  },
  'coach:test-report:added': {
    category: 'test',
    priority: 'high',
    icon: '📄',
    color: '#FF9800',
    redirectUrl: '/dashboard/aluno/testes'
  },
  'coach:student-status:changed': {
    category: 'system',
    priority: 'urgent',
    icon: '⚠️',
    color: '#FF5722',
    redirectUrl: '/dashboard/aluno/perfil'
  },
  'coach:student-data:updated': {
    category: 'system',
    priority: 'low',
    icon: '✏️',
    color: '#607D8B',
    redirectUrl: '/dashboard/aluno/perfil'
  },
  
  // Eventos de Sistema para Administrador
  'admin:user:registered': {
    category: 'system',
    priority: 'medium',
    icon: '👤',
    color: '#2196F3',
    redirectUrl: '/dashboard/admin/users'
  },
  'admin:subscription:created': {
    category: 'subscription',
    priority: 'high',
    icon: '💰',
    color: '#4CAF50',
    redirectUrl: '/dashboard/admin/subscriptions'
  },
  'admin:leave:requested': {
    category: 'system',
    priority: 'high',
    icon: '🏖️',
    color: '#FF9800',
    redirectUrl: '/dashboard/admin/leave-requests'
  },
  'admin:plan:changed': {
    category: 'subscription',
    priority: 'medium',
    icon: '🔄',
    color: '#2196F3',
    redirectUrl: '/dashboard/admin/subscriptions'
  },
  'admin:cancellation:requested': {
    category: 'subscription',
    priority: 'high',
    icon: '❌',
    color: '#F44336',
    redirectUrl: '/dashboard/admin/subscriptions'
  },
  'admin:asaas:webhook': {
    category: 'payment',
    priority: 'medium',
    icon: '🔗',
    color: '#9C27B0',
    redirectUrl: '/dashboard/admin/payments'
  },
};

// Atualizar interface WebSocketEvent para incluir todos os eventos
export interface WebSocketEvent {
  type: 'user:photo:updated' | 'user:profile:updated' | 'user:status:changed' | 'user:connected' | 'user:disconnected' | 'pong' | 
        // Eventos existentes
        'exam:result:registered' | 'exam:result:registered:coach' | 
        'test:result:registered' | 'test:result:registered:coach' |
        'exam:created' | 'exam:created:coach' |
        'plan:changed' | 'plan:changed:coach' |
        'account:created' | 'student:account:created' |
        'leave:requested' | 'leave:requested:coach' |
        // Novos eventos Aluno → Treinador
        'student:external-exam:created' | 'student:exam:registered' | 'student:test-report:requested' |
        'student:subscription:created' | 'student:feature:purchased' | 'student:plan:cancelled' |
        // Novos eventos Treinador → Aluno  
        'coach:exam-result:registered' | 'coach:exam-attendance:confirmed' | 'coach:test-result:registered' | 'coach:test-report:added' |
        'coach:student-status:changed' | 'coach:student-data:updated' |
        // Novos eventos Sistema → Administrador
        'admin:user:registered' | 'admin:subscription:created' | 'admin:leave:requested' |
        'admin:plan:changed' | 'admin:cancellation:requested' | 'admin:asaas:webhook';
  data: UserPhotoUpdateEvent | UserProfileUpdateEvent | UserStatusChangeEvent | 
        ExamResultRegisteredEvent | TestResultRegisteredEvent | NewExamCreatedEvent |
        PlanChangeEvent | StudentAccountCreatedEvent | LeaveRequestEvent |
        // Novos tipos de eventos
        StudentExternalExamCreatedEvent | StudentExamRegisteredEvent | StudentTestReportRequestedEvent |
        StudentSubscriptionCreatedEvent | StudentFeaturePurchasedEvent | StudentPlanCancelledEvent |
        CoachExamResultRegisteredEvent | CoachExamAttendanceConfirmedEvent | CoachTestResultRegisteredEvent | CoachTestReportAddedEvent |
        CoachStudentStatusChangedEvent | CoachStudentDataUpdatedEvent |
        AdminUserRegisteredEvent | AdminSubscriptionCreatedEvent | AdminLeaveRequestedEvent |
        AdminPlanChangedEvent | AdminCancellationRequestedEvent | AdminAsaasWebhookEvent | any;
  timestamp: string;
}

// Interfaces para Solicitação de Relatório de Teste
export enum TestReportRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TestReportRequestType {
  FREE_PREMIUM = 'FREE_PREMIUM',
  PAID_PURCHASE = 'PAID_PURCHASE'
}

export interface TestReportRequest {
  id: string;
  userId: string;
  testResultId: string;
  requestType: TestReportRequestType;
  status: TestReportRequestStatus;
  reason?: string;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  completedAt?: string;
  paymentId?: string;
  asaasPaymentId?: string;
  price?: number;
  createdAt: string;
  updatedAt: string;
  testResult?: {
    id: string;
    test: {
      id: string;
      name: string;
      type: TestType;
    };
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface CreateTestReportRequestRequest {
  testResultId: string;
  reason?: string;
}

export interface TestReportRequestResponse {
  success: boolean;
  message: string;
  data: {
    requestId: string;
    requestType: TestReportRequestType;
    status: TestReportRequestStatus;
    price?: number;
    createdAt: string;
  };
}

export interface TestReportPaymentRequest {
  billingType: PaymentMethod;
}

export interface TestReportPaymentResponse {
  success: boolean;
  message: string;
  data: {
    requestId: string;
    asaasPaymentId: string;
    amount: number;
    billingType: PaymentMethod;
    paymentUrl: string;
    pixData?: {
      qrCode: string;
      copyPaste: string;
    };
    dueDate: string;
  };
}

export interface TestReportRequestFilters {
  status?: TestReportRequestStatus;
  requestType?: TestReportRequestType;
  page?: number;
  limit?: number;
}

export interface TestReportRequestStats {
  total: number;
  byStatus: {
    pending: number;
    approved: number;
    rejected: number;
    completed: number;
    cancelled: number;
  };
  byType: {
    freeRequests: number;
    paidRequests: number;
  };
}

// Interfaces para Cupons de Desconto
export enum CouponType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE_AMOUNT = 'PERCENTAGE_AMOUNT',
  FIXED_SUBSCRIPTION = 'FIXED_SUBSCRIPTION',
  PERCENTAGE_SUBSCRIPTION = 'PERCENTAGE_SUBSCRIPTION',
  FREE_ENROLLMENT = 'FREE_ENROLLMENT'
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponRequest {
  code: string;
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  isActive: boolean;
  usageLimit?: number;
  validFrom: string;
  validUntil: string;
}

export interface UpdateCouponRequest {
  name?: string;
  description?: string;
  type?: CouponType;
  value?: number;
  isActive?: boolean;
  usageLimit?: number;
  validFrom?: string;
  validUntil?: string;
}

export interface CouponValidationResponse {
  isValid: boolean;
  message: string;
  coupon?: Coupon;
  discount?: {
    type: 'amount' | 'percentage';
    value: number;
    description: string;
  };
}

export interface CouponDiscountResponse {
  isValid: boolean;
  message: string;
  originalPlanPrice: number;
  originalEnrollmentFee: number;
  discountedPlanPrice: number;
  discountedEnrollmentFee: number;
  totalDiscount: number;
  coupon: {
    code: string;
    name: string;
    type: CouponType;
    value: number;
  };
}

// Interfaces para Taxa de Matrícula
export interface EnrollmentFee {
  id: string;
  name: string;
  description?: string;
  amount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentFeeRequest {
  name: string;
  description?: string;
  amount: number;
  isActive: boolean;
}

export interface UpdateEnrollmentFeeRequest {
  name?: string;
  description?: string;
  amount?: number;
  isActive?: boolean;
}

// Interfaces para Provas Externas
export interface ExternalExam {
  id: string;
  name: string;
  description?: string;
  examDate: string;
  location?: string;
  modalidadeId: string;
  distance?: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  modalidade: {
    id: string;
    name: string;
    description: string;
  };
}

export interface CreateExternalExamRequest {
  name: string;
  description?: string;
  examDate: string;
  location?: string;
  modalidadeId: string;
  distance?: string;
}

export interface UpdateExternalExamRequest {
  name?: string;
  description?: string;
  examDate?: string;
  location?: string;
  modalidadeId?: string;
  distance?: string;
}

export interface ExternalExamFilters {
  page?: number;
  limit?: number;
  search?: string;
  modalidadeId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExternalExamsResponse {
  data: ExternalExam[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interfaces para Features
export enum FeatureStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  DISCONTINUED = 'DISCONTINUED'
}

export interface Feature {
  id: string;
  name: string;
  description?: string;
  value: number;
  quantity?: number; // null = ilimitado
  validUntil?: string;
  status: FeatureStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateFeatureRequest {
  name: string;
  description?: string;
  value: number;
  quantity?: number;
  validUntil?: string;
  status?: FeatureStatus;
  isActive?: boolean;
}

export interface UpdateFeatureRequest {
  name?: string;
  description?: string;
  value?: number;
  quantity?: number;
  validUntil?: string;
  status?: FeatureStatus;
  isActive?: boolean;
}

export interface FeatureFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: FeatureStatus;
  isActive?: boolean;
}

export interface FeaturesResponse {
  data: Feature[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interfaces para Features dos Planos
export interface PlanFeature {
  id: string;
  planId: string;
  featureId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  feature: Feature;
}

export interface AddFeatureToPlanRequest {
  featureId: string;
  isActive?: boolean;
}

export interface UpdatePlanFeatureStatusRequest {
  isActive: boolean;
}

export interface PlanFeatureAudit {
  id: string;
  planId: string;
  featureId: string;
  action: 'ADD' | 'REMOVE' | 'UPDATE';
  changedBy: string;
  oldValue?: any;
  newValue?: any;
  createdAt: string;
  userName: string;
  featureName: string;
}

export interface PlanFeaturesResponse {
  data: PlanFeature[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PlanFeatureAuditsResponse {
  data: PlanFeatureAudit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 