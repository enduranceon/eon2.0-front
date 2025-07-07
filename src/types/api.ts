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
  SEMIANNUAL = 'SEMIANNUALLY',
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
  cpf?: string;
  birthDate?: string;
  address?: Address;
  specialties?: string[];
  certifications?: string[];
  emailVerified?: boolean;
  has2FA?: boolean;
  twoFactorVerified?: boolean;
  onboardingCompleted?: boolean;
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
export interface Plan {
  id: string;
  name: string;
  description: string;
  type: 'ESSENCIAL' | 'PREMIUM';
  features: string[];
  prices: {
    monthly: number;
    quarterly: number;
    semiannual: number;
    annual: number;
  };
  modalidades: Modalidade[];
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
export interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  holderEmail: string;
  holderCpfCnpj: string;
  holderPostalCode: string;
  holderAddressNumber: string;
  holderPhone: string;
}

export interface CheckoutRequest {
  userId: string;
  planId: string;
  modalidadeId: string;
  coachId?: string;
  paymentMethod: PaymentMethod;
  period: PlanPeriod;
  creditCard?: CreditCardData;
  coupon?: string;
}

export interface CheckoutResponse {
  success: boolean;
  subscriptionId: string;
  paymentId: string;
  asaasPaymentId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  hasSplit: boolean;
  coachWalletId?: string;
  dueDate: string;
  status: PaymentStatus;
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
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED';
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
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interfaces de Filtros
export interface UserFilters {
  userType?: UserType;
  coachLevel?: CoachLevel;
  hasActiveSubscription?: boolean;
  search?: string;
  page?: number;
  limit?: number;
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
  CARDIO = 'CARDIO',
  PERFORMANCE = 'PERFORMANCE',
  STRENGTH = 'STRENGTH',
  TECHNICAL = 'TECHNICAL',
}

export interface AvailableTest {
  id: string;
  name: string;
  description: string;
  type: TestType;
  isActive: boolean;
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
  createdAt: string;
  updatedAt: string;
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