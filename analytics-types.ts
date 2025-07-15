// Types e Interfaces para Analytics API
// Este arquivo contém todos os tipos TypeScript necessários para integração com os endpoints de analytics

// =============================================================================
// TIPOS BÁSICOS E ENUMS
// =============================================================================

export type ActivityType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'PAYMENT' 
  | 'REGISTRATION' 
  | 'SUBSCRIPTION' 
  | 'PLAN_CHANGE' 
  | 'COACH_BOOKING' 
  | 'TEST_SCHEDULED' 
  | 'PROFILE_UPDATE';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SystemStatus = 'healthy' | 'degraded' | 'unhealthy';

export type ServiceStatus = 'up' | 'down' | 'degraded';

export type Trend = 'up' | 'down' | 'stable';

export type ExportFormat = 'pdf' | 'csv' | 'xlsx';

export type ReportType = 'financial' | 'users' | 'coaches' | 'plans' | 'analytics';

export type PredictionModel = 'churn' | 'growth' | 'revenue';

export type CacheType = 'analytics' | 'kpis' | 'statistics' | 'reports' | 'sessions' | 'predictive' | 'system' | 'general';

export type RequestStatus = 'pending' | 'processing' | 'approved' | 'rejected';

export type EventType = 
  | 'USER_REGISTRATION'
  | 'USER_LOGIN'
  | 'PAYMENT_COMPLETED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'PLAN_CHANGED'
  | 'COACH_BOOKED'
  | 'TEST_SCHEDULED'
  | 'PROFILE_UPDATED'
  | 'SUPPORT_TICKET_CREATED';

export type WebhookEventType = 
  | 'SYSTEM_PERFORMANCE'
  | 'USER_BEHAVIOR'
  | 'PAYMENT_ANALYTICS'
  | 'COACH_METRICS'
  | 'PLAN_ANALYTICS'
  | 'ERROR_TRACKING'
  | 'SUBSCRIPTION_EVENTS'
  | 'ENGAGEMENT_METRICS'
  | 'CONVERSION_EVENTS';

export type CoachLevel = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO' | 'EXPERT' | 'MASTER';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

// =============================================================================
// INTERFACES DE DADOS BÁSICOS
// =============================================================================

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface KPI {
  name: string;
  value: number;
  change: number;
  trend: Trend;
  target?: number;
  unit?: string;
}

export interface DetailedKPI {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: Trend;
  target?: number;
  description: string;
  category: string;
  unit: string;
  updatedAt: string;
}

export interface FunnelData {
  stage: string;
  value: number;
  percentage: number;
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
}

export interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

// =============================================================================
// INTERFACES DE ATIVIDADES
// =============================================================================

export interface Activity {
  id: string;
  userId: string;
  activityType: ActivityType;
  timestamp: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  location?: string;
  createdAt: string;
}

export interface CreateActivityDto {
  userId: string;
  activityType: ActivityType;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  location?: string;
}

export interface ActivityResponse {
  activities: Activity[];
  totalCount: number;
  hasMore: boolean;
}

export interface ActivityStatsResponse {
  totalActivities: number;
  activitiesByType: Record<string, number>;
  activitiesByPeriod: Array<{
    period: string;
    count: number;
  }>;
  topUsers: Array<{
    userId: string;
    count: number;
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
}

// =============================================================================
// INTERFACES DE NOTIFICAÇÕES
// =============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  data?: Record<string, any>;
  aiInsights?: string;
  createdAt: string;
  readAt?: string;
}

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  data?: Record<string, any>;
  aiInsights?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
}

export interface MarkAllReadDto {
  userId: string;
}

// =============================================================================
// INTERFACES DE SAÚDE DO SISTEMA
// =============================================================================

export interface ServiceStatusInfo {
  status: ServiceStatus;
  responseTime: number;
  lastCheck: string;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface SystemHealthResponse {
  status: SystemStatus;
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceStatusInfo;
    cache: ServiceStatusInfo;
    email: ServiceStatusInfo;
    payment: ServiceStatusInfo;
    storage: ServiceStatusInfo;
  };
  metrics: SystemMetrics;
  alerts: Alert[];
}

export interface DetailedMetricsResponse {
  period: string;
  metrics: {
    cpu: TimeSeriesData[];
    memory: TimeSeriesData[];
    disk: TimeSeriesData[];
    network: TimeSeriesData[];
    database: TimeSeriesData[];
  };
}

// =============================================================================
// INTERFACES DE ANÁLISE PREDITIVA
// =============================================================================

export interface ChurnPrediction {
  riskScore: number;
  usersAtRisk: number;
  factors: string[];
  recommendations: string[];
  confidence: number;
}

export interface GrowthPrediction {
  projectedGrowth: number;
  newUsers: number;
  retentionRate: number;
  confidenceInterval: [number, number];
}

export interface RevenuePrediction {
  projectedRevenue: number;
  growth: number;
  factors: string[];
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
}

export interface PredictiveAnalysisResponse {
  churnPrediction: ChurnPrediction;
  growthPrediction: GrowthPrediction;
  revenuePrediction: RevenuePrediction;
}

export interface TrainModelDto {
  modelType: PredictionModel;
  parameters?: Record<string, any>;
  dataRange?: {
    startDate: string;
    endDate: string;
  };
}

// =============================================================================
// INTERFACES DE DASHBOARD
// =============================================================================

export interface DashboardSummary {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  conversionRate: number;
  churnRate: number;
}

export interface DashboardCharts {
  userGrowth: TimeSeriesData[];
  revenueGrowth: TimeSeriesData[];
  userActivity: TimeSeriesData[];
  conversionFunnel: FunnelData[];
}

export interface DashboardResponse {
  summary: DashboardSummary;
  charts: DashboardCharts;
  kpis: KPI[];
  alerts: Alert[];
}

export interface KPIResponse {
  kpis: DetailedKPI[];
  trends: TrendData[];
  comparisons: ComparisonData[];
}

// =============================================================================
// INTERFACES DE ESTATÍSTICAS
// =============================================================================

export interface UserDemographics {
  ageDistribution: Array<{ range: string; count: number }>;
  locationDistribution: Array<{ location: string; count: number }>;
  planDistribution: Array<{ plan: string; count: number }>;
}

export interface UserRetention {
  day1: number;
  day7: number;
  day30: number;
  day90: number;
}

export interface UserEngagement {
  avgSessionDuration: number;
  avgSessionsPerUser: number;
  bounceRate: number;
}

export interface UserStatsResponse {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  churnedUsers: number;
  demographics: UserDemographics;
  retention: UserRetention;
  engagement: UserEngagement;
}

export interface CoachPerformance {
  avgRating: number;
  totalSessions: number;
  avgSessionsPerCoach: number;
}

export interface CoachRevenue {
  totalRevenue: number;
  avgRevenuePerCoach: number;
  topEarners: Array<{
    coachId: string;
    revenue: number;
    sessions: number;
  }>;
}

export interface CoachStatsResponse {
  totalCoaches: number;
  activeCoaches: number;
  performance: CoachPerformance;
  revenue: CoachRevenue;
  levels: Array<{
    level: string;
    count: number;
    revenue: number;
  }>;
}

export interface PlanConversion {
  trialToSubscription: number;
  freeToTrial: number;
  upgradeRate: number;
}

export interface PlanStatsResponse {
  totalPlans: number;
  activePlans: number;
  popularity: Array<{
    planId: string;
    name: string;
    subscriptions: number;
    revenue: number;
  }>;
  conversion: PlanConversion;
  modalityBreakdown: Array<{
    modality: string;
    plans: number;
    subscribers: number;
    revenue: number;
  }>;
}

// =============================================================================
// INTERFACES DE RELATÓRIOS FINANCEIROS
// =============================================================================

export interface FinancialBreakdown {
  subscriptions: number;
  oneTimePayments: number;
  coaching: number;
  tests: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  amount: number;
  percentage: number;
}

export interface FinancialSummaryResponse {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  breakdown: FinancialBreakdown;
  paymentMethods: PaymentMethodBreakdown[];
  trends: TimeSeriesData[];
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  subscriptions: number;
  oneTime: number;
  coaching: number;
}

export interface RevenueChartResponse {
  period: string;
  data: RevenueChartData[];
  totals: {
    totalRevenue: number;
    avgDaily: number;
    growth: number;
  };
}

// =============================================================================
// INTERFACES DE EXPORTAÇÃO
// =============================================================================

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  coachId?: string;
  planId?: string;
}

export interface ExportOptions {
  includeCharts?: boolean;
  includeDetails?: boolean;
  layout?: 'portrait' | 'landscape';
  template?: string;
}

export interface ExportRequestDto {
  format: ExportFormat;
  reportType: ReportType;
  filters?: ExportFilters;
  options?: ExportOptions;
}

export interface ExportResponse {
  downloadUrl: string;
  fileName: string;
  expiresAt: string;
  fileSize: number;
  format: string;
}

// =============================================================================
// INTERFACES DE CACHE
// =============================================================================

export interface CacheTypeStats {
  type: string;
  keys: number;
  hitRate: number;
  ttl: number;
}

export interface CacheStatsResponse {
  hitRate: number;
  missRate: number;
  totalKeys: number;
  memoryUsage: number;
  types: CacheTypeStats[];
}

// =============================================================================
// INTERFACES DE INSIGHTS EXECUTIVOS
// =============================================================================

export interface ExecutiveMetric {
  metric: string;
  value: number;
  change: number;
  trend: Trend;
}

export interface ExecutiveSummary {
  period: string;
  keyMetrics: ExecutiveMetric[];
}

export interface RevenueInsights {
  current: number;
  growth: number;
  projection: number;
  recommendations: string[];
}

export interface UserInsights {
  growth: number;
  churn: number;
  retention: number;
  opportunities: string[];
}

export interface PerformanceInsights {
  efficiency: number;
  bottlenecks: string[];
  improvements: string[];
}

export interface ExecutiveInsights {
  revenue: RevenueInsights;
  users: UserInsights;
  performance: PerformanceInsights;
}

export interface RecommendationAction {
  action: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
}

export interface ExecutiveRecommendations {
  priority: RecommendationAction[];
}

export interface ExecutiveInsightsResponse {
  summary: ExecutiveSummary;
  insights: ExecutiveInsights;
  recommendations: ExecutiveRecommendations;
}

// =============================================================================
// INTERFACES DE EVENTOS
// =============================================================================

export interface EventFunnel {
  registration: number;
  activation: number;
  retention: number;
  conversion: number;
}

export interface EventStatsResponse {
  totalEvents: number;
  eventsByType: Record<string, number>;
  funnel: EventFunnel;
  trends: TimeSeriesData[];
  recommendations: string[];
}

export interface RecordEventDto {
  eventType: EventType;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

// =============================================================================
// INTERFACES DE ANÁLISE DE MARGENS
// =============================================================================

export interface MarginByLevel {
  level: CoachLevel;
  revenue: number;
  commission: number;
  margin: number;
}

export interface MarginByModality {
  modality: string;
  revenue: number;
  coaches: number;
  avgMargin: number;
}

export interface MarginStatsResponse {
  totalRevenue: number;
  totalCommissions: number;
  profitMargin: number;
  byLevel: MarginByLevel[];
  byModality: MarginByModality[];
  trends: TimeSeriesData[];
}

// =============================================================================
// INTERFACES DE SOLICITAÇÕES
// =============================================================================

export interface RequestByType {
  type: string;
  count: number;
  approvalRate: number;
  avgResponseTime: number;
}

export interface RequestWorkload {
  pending: number;
  processing: number;
  completed: number;
}

export interface RequestStatsResponse {
  totalRequests: number;
  approvalRate: number;
  avgResponseTime: number;
  byType: RequestByType[];
  workload: RequestWorkload;
  bottlenecks: string[];
}

export interface RecordRequestDto {
  requestType: string;
  userId: string;
  status: RequestStatus;
  metadata?: Record<string, any>;
}

// =============================================================================
// INTERFACES DE WEBHOOK EVENTS
// =============================================================================

export interface WebhookAIInsights {
  patterns: string[];
  anomalies: string[];
  recommendations: string[];
}

export interface WebhookPerformance {
  avgResponseTime: number;
  successRate: number;
  errorRate: number;
}

export interface WebhookEventsResponse {
  totalEvents: number;
  eventsByType: Record<string, number>;
  aiInsights: WebhookAIInsights;
  performance: WebhookPerformance;
}

export interface RecordWebhookEventDto {
  eventType: WebhookEventType;
  source: string;
  data: Record<string, any>;
  timestamp?: string;
}

// =============================================================================
// INTERFACES DE DADOS MOCK
// =============================================================================

export interface MockDataMetadata {
  totalRecords: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface MockDataResponse {
  type: string;
  period: string;
  data: any[];
  metadata: MockDataMetadata;
}

// =============================================================================
// INTERFACES DE QUERY PARAMETERS
// =============================================================================

export interface ActivityQueryParams {
  userId?: string;
  activityType?: ActivityType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationQueryParams {
  userId?: string;
  type?: string;
  isRead?: boolean;
  priority?: NotificationPriority;
  limit?: number;
  offset?: number;
}

export interface KPIQueryParams {
  category?: string;
  period?: string;
}

export interface UserStatsQueryParams {
  period?: string;
  segmentation?: string;
}

export interface RevenueChartQueryParams {
  period?: string;
  startDate?: string;
  endDate?: string;
}

export interface PredictiveAnalysisQueryParams {
  models?: PredictionModel[];
  timeframe?: string;
}

export interface CacheQueryParams {
  type?: CacheType;
  pattern?: string;
}

export interface ExecutiveInsightsQueryParams {
  period?: string;
  includeProjections?: boolean;
}

export interface EventStatsQueryParams {
  eventType?: EventType;
  period?: string;
}

export interface MarginStatsQueryParams {
  coachLevel?: CoachLevel;
  modality?: string;
}

export interface MockDataQueryParams {
  type?: string;
  months?: number;
}

// =============================================================================
// INTERFACES DE RESPOSTA DE ERRO
// =============================================================================

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: string[];
  retryAfter?: number;
}

// =============================================================================
// CLIENTE DE API (OPCIONAL)
// =============================================================================

export interface AnalyticsApiClient {
  // Atividades
  getActivities(params?: ActivityQueryParams): Promise<ActivityResponse>;
  createActivity(data: CreateActivityDto): Promise<void>;
  getActivityStats(params?: { period?: string; startDate?: string; endDate?: string }): Promise<ActivityStatsResponse>;

  // Notificações
  getNotifications(params?: NotificationQueryParams): Promise<NotificationResponse>;
  createNotification(data: CreateNotificationDto): Promise<void>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(data: MarkAllReadDto): Promise<void>;

  // Saúde do Sistema
  getSystemHealth(): Promise<SystemHealthResponse>;
  getDetailedMetrics(params?: { period?: string }): Promise<DetailedMetricsResponse>;

  // Análise Preditiva
  getPredictiveAnalysis(params?: PredictiveAnalysisQueryParams): Promise<PredictiveAnalysisResponse>;
  trainModel(data: TrainModelDto): Promise<void>;

  // Dashboard
  getDashboard(): Promise<DashboardResponse>;
  getKPIs(params?: KPIQueryParams): Promise<KPIResponse>;

  // Estatísticas
  getUserStats(params?: UserStatsQueryParams): Promise<UserStatsResponse>;
  getCoachStats(): Promise<CoachStatsResponse>;
  getPlanStats(): Promise<PlanStatsResponse>;

  // Relatórios Financeiros
  getFinancialSummary(params?: { startDate?: string; endDate?: string; groupBy?: string }): Promise<FinancialSummaryResponse>;
  getRevenueChart(params?: RevenueChartQueryParams): Promise<RevenueChartResponse>;

  // Exportação
  exportReport(data: ExportRequestDto): Promise<ExportResponse>;
  downloadFile(token: string): Promise<Blob>;

  // Cache
  getCacheStats(): Promise<CacheStatsResponse>;
  clearCache(params?: CacheQueryParams): Promise<void>;

  // Insights Executivos
  getExecutiveInsights(params?: ExecutiveInsightsQueryParams): Promise<ExecutiveInsightsResponse>;

  // Eventos
  getEventStats(params?: EventStatsQueryParams): Promise<EventStatsResponse>;
  recordEvent(data: RecordEventDto): Promise<void>;

  // Análise de Margens
  getMarginStats(params?: MarginStatsQueryParams): Promise<MarginStatsResponse>;

  // Solicitações
  getRequestStats(): Promise<RequestStatsResponse>;
  recordRequest(data: RecordRequestDto): Promise<void>;

  // Webhook Events
  getWebhookEvents(): Promise<WebhookEventsResponse>;
  recordWebhookEvent(data: RecordWebhookEventDto): Promise<void>;

  // Dados Mock
  getMockData(params?: MockDataQueryParams): Promise<MockDataResponse>;
}

// =============================================================================
// CONFIGURAÇÃO DE API
// =============================================================================

export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface AuthToken {
  token: string;
  expiresAt?: Date;
  refreshToken?: string;
}

// =============================================================================
// TIPOS DE UTILIDADE
// =============================================================================

export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: ErrorResponse;
};

export type QueryParams = Record<string, string | number | boolean | undefined>;

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequest {
  method: ApiMethod;
  url: string;
  params?: QueryParams;
  data?: any;
  headers?: Record<string, string>;
}

// =============================================================================
// CONSTANTES
// =============================================================================

export const API_ENDPOINTS = {
  ACTIVITIES: '/api/analytics/activities',
  NOTIFICATIONS: '/api/analytics/notifications',
  SYSTEM_HEALTH: '/api/analytics/system-health',
  PREDICTIVE_ANALYSIS: '/api/analytics/predictive-analysis',
  DASHBOARD: '/api/analytics/dashboard',
  USER_STATS: '/api/analytics/users/stats',
  COACH_STATS: '/api/analytics/coaches/stats',
  PLAN_STATS: '/api/analytics/plans/stats',
  FINANCIAL_SUMMARY: '/api/analytics/financial/summary',
  REVENUE_CHART: '/api/analytics/revenue-chart',
  EXPORT: '/api/analytics/export',
  CACHE: '/api/analytics/cache',
  EXECUTIVE_INSIGHTS: '/api/analytics/executive-insights',
  EVENT_STATS: '/api/analytics/event-stats',
  MARGIN_STATS: '/api/analytics/margin-stats',
  REQUEST_STATS: '/api/analytics/request-stats',
  WEBHOOK_EVENTS: '/api/analytics/webhook-events',
  MOCK_DATA: '/api/analytics/mock-data'
} as const;

export const DEFAULT_LIMITS = {
  ACTIVITIES: 100,
  NOTIFICATIONS: 50,
  STATS: 1000,
  EXPORTS: 10
} as const;

export const CACHE_TTL = {
  ANALYTICS: 300, // 5 minutos
  KPIS: 600, // 10 minutos
  STATISTICS: 900, // 15 minutos
  REPORTS: 1800, // 30 minutos
  SESSIONS: 1800, // 30 minutos
  PREDICTIVE: 3600, // 1 hora
  SYSTEM: 60, // 1 minuto
  GENERAL: 300 // 5 minutos
} as const; 