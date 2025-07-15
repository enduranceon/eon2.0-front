import { NextRequest, NextResponse } from 'next/server';

// Interface para o resumo financeiro
interface FinancialSummary {
  totalRevenue: number;
  monthlyRevenue: number;
  averageTicket: number;
  pendingPayments: number;
  overduePayments: number;
  conversionRate: number;
  
  // Receita por período
  revenueByPeriod: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  
  // Análise de pagamentos
  paymentAnalysis: {
    successful: number;
    failed: number;
    pending: number;
    refunded: number;
    chargeback: number;
  };
  
  // Receita por método de pagamento
  revenueByPaymentMethod: Array<{
    method: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  
  // Receita por plano
  revenueByPlan: Array<{
    planName: string;
    planId: string;
    revenue: number;
    subscribers: number;
    averageTicket: number;
    conversionRate: number;
  }>;
  
  // Ganhos de coaches
  coachEarnings: {
    totalPaid: number;
    totalPending: number;
    averageEarnings: number;
    topEarners: Array<{
      coachId: string;
      coachName: string;
      earnings: number;
      percentage: number;
    }>;
  };
  
  // Métricas financeiras
  financialMetrics: {
    mrr: number; // Monthly Recurring Revenue
    arr: number; // Annual Recurring Revenue
    ltv: number; // Customer Lifetime Value
    cac: number; // Customer Acquisition Cost
    churnRate: number;
    growthRate: number;
  };
  
  // Análise de tendências
  trends: {
    revenueGrowth: number;
    newSubscriptions: number;
    cancellations: number;
    upgrades: number;
    downgrades: number;
  };
  
  // Dados históricos para gráficos
  historicalData: Array<{
    date: string;
    revenue: number;
    subscriptions: number;
    activeUsers: number;
    churn: number;
  }>;
  
  // Previsões
  projections: {
    nextMonthRevenue: number;
    nextQuarterRevenue: number;
    yearEndRevenue: number;
    confidence: number;
  };
}

// Função para gerar dados mock baseados no período
function generateFinancialSummary(startDate?: string, endDate?: string): FinancialSummary {
  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : now;
  
  // Gerar dados dinâmicos baseados no período
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const monthsCount = Math.ceil(daysDiff / 30);
  
  const baseRevenue = 150000;
  const totalRevenue = baseRevenue * (monthsCount / 12);
  
  return {
    totalRevenue: totalRevenue,
    monthlyRevenue: Math.round(totalRevenue / monthsCount),
    averageTicket: 189.90,
    pendingPayments: 12500.75,
    overduePayments: 3200.00,
    conversionRate: 15.8,
    
    revenueByPeriod: {
      daily: Math.round(totalRevenue / daysDiff),
      weekly: Math.round(totalRevenue / (daysDiff / 7)),
      monthly: Math.round(totalRevenue / monthsCount),
      quarterly: Math.round(totalRevenue / (monthsCount / 3)),
      yearly: Math.round(totalRevenue),
    },
    
    paymentAnalysis: {
      successful: Math.round(totalRevenue * 0.92),
      failed: Math.round(totalRevenue * 0.03),
      pending: Math.round(totalRevenue * 0.04),
      refunded: Math.round(totalRevenue * 0.008),
      chargeback: Math.round(totalRevenue * 0.002),
    },
    
    revenueByPaymentMethod: [
      {
        method: 'Cartão de Crédito',
        amount: Math.round(totalRevenue * 0.65),
        percentage: 65.0,
        count: Math.round((totalRevenue * 0.65) / 189.90),
      },
      {
        method: 'PIX',
        amount: Math.round(totalRevenue * 0.28),
        percentage: 28.0,
        count: Math.round((totalRevenue * 0.28) / 189.90),
      },
      {
        method: 'Boleto',
        amount: Math.round(totalRevenue * 0.07),
        percentage: 7.0,
        count: Math.round((totalRevenue * 0.07) / 189.90),
      },
    ],
    
    revenueByPlan: [
      {
        planName: 'Plano Essencial de Corrida',
        planId: 'essencial-corrida',
        revenue: Math.round(totalRevenue * 0.35),
        subscribers: 245,
        averageTicket: 165.00,
        conversionRate: 18.2,
      },
      {
        planName: 'Plano Premium de Corrida',
        planId: 'premium-corrida',
        revenue: Math.round(totalRevenue * 0.28),
        subscribers: 128,
        averageTicket: 270.00,
        conversionRate: 12.5,
      },
      {
        planName: 'Plano Essencial de Triathlon',
        planId: 'essencial-triathlon',
        revenue: Math.round(totalRevenue * 0.22),
        subscribers: 98,
        averageTicket: 230.00,
        conversionRate: 14.8,
      },
      {
        planName: 'Plano Premium de Triathlon',
        planId: 'premium-triathlon',
        revenue: Math.round(totalRevenue * 0.15),
        subscribers: 45,
        averageTicket: 400.00,
        conversionRate: 8.9,
      },
    ],
    
    coachEarnings: {
      totalPaid: Math.round(totalRevenue * 0.65),
      totalPending: Math.round(totalRevenue * 0.08),
      averageEarnings: 4250.00,
      topEarners: [
        {
          coachId: 'coach-001',
          coachName: 'Bruno Jeremias',
          earnings: 12500.00,
          percentage: 8.5,
        },
        {
          coachId: 'coach-002',
          coachName: 'Elinai Freitas',
          earnings: 11800.00,
          percentage: 8.0,
        },
        {
          coachId: 'coach-003',
          coachName: 'Carlos Silva',
          earnings: 9200.00,
          percentage: 6.2,
        },
      ],
    },
    
    financialMetrics: {
      mrr: Math.round(totalRevenue / 12), // Monthly Recurring Revenue
      arr: totalRevenue, // Annual Recurring Revenue
      ltv: 850.00, // Customer Lifetime Value
      cac: 125.00, // Customer Acquisition Cost
      churnRate: 5.8,
      growthRate: 18.5,
    },
    
    trends: {
      revenueGrowth: 18.5,
      newSubscriptions: 156,
      cancellations: 28,
      upgrades: 45,
      downgrades: 12,
    },
    
    historicalData: Array.from({ length: Math.min(12, monthsCount) }, (_, i) => {
      const date = new Date(start);
      date.setMonth(date.getMonth() + i);
      
      return {
        date: date.toISOString().substring(0, 7), // YYYY-MM
        revenue: Math.round((totalRevenue / monthsCount) * (1 + (Math.random() - 0.5) * 0.2)),
        subscriptions: Math.round(500 + (Math.random() - 0.5) * 100),
        activeUsers: Math.round(1200 + i * 50 + (Math.random() - 0.5) * 200),
        churn: Math.round((5 + (Math.random() - 0.5) * 2) * 10) / 10,
      };
    }),
    
    projections: {
      nextMonthRevenue: Math.round((totalRevenue / monthsCount) * 1.15),
      nextQuarterRevenue: Math.round((totalRevenue / (monthsCount / 3)) * 1.12),
      yearEndRevenue: Math.round(totalRevenue * 1.25),
      confidence: 78.5,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const includeProjections = searchParams.get('includeProjections') === 'true';
    const includeTrends = searchParams.get('includeTrends') === 'true';
    
    // Validar datas se fornecidas
    if (startDate && isNaN(Date.parse(startDate))) {
      return NextResponse.json({
        success: false,
        error: 'Data de início inválida',
        message: 'Formato esperado: YYYY-MM-DD'
      }, { status: 400 });
    }
    
    if (endDate && isNaN(Date.parse(endDate))) {
      return NextResponse.json({
        success: false,
        error: 'Data de fim inválida',
        message: 'Formato esperado: YYYY-MM-DD'
      }, { status: 400 });
    }
    
    // Gerar resumo financeiro
    const financialSummary = generateFinancialSummary(startDate || undefined, endDate || undefined);
    
    // Filtrar dados baseado nos parâmetros
    let responseData: any = { ...financialSummary };
    
    if (!includeProjections) {
      delete responseData.projections;
    }
    
    if (!includeTrends) {
      delete responseData.trends;
    }
    
    // Adicionar metadados
    const metadata = {
      period: {
        start: startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().substring(0, 10),
        end: endDate || new Date().toISOString().substring(0, 10),
      },
      generatedAt: new Date().toISOString(),
      currency: 'BRL',
      timezone: 'America/Sao_Paulo',
    };
    
    return NextResponse.json({
      success: true,
      data: {
        summary: responseData,
        metadata,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Erro ao gerar resumo financeiro:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível gerar o resumo financeiro',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simular processamento de dados financeiros customizados
    const customFilters = {
      planIds: body.planIds || [],
      coachIds: body.coachIds || [],
      paymentMethods: body.paymentMethods || [],
      statuses: body.statuses || [],
      ...body
    };
    
    const financialSummary = generateFinancialSummary(
      customFilters.startDate, 
      customFilters.endDate
    );
    
    // Aplicar filtros customizados
    if (customFilters.planIds.length > 0) {
      financialSummary.revenueByPlan = financialSummary.revenueByPlan.filter(
        plan => customFilters.planIds.includes(plan.planId)
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        summary: financialSummary,
        filters: customFilters,
        metadata: {
          generatedAt: new Date().toISOString(),
          customRequest: true,
        }
      },
      message: 'Resumo financeiro customizado gerado com sucesso',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Erro ao processar resumo financeiro customizado:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: 'Não foi possível processar o resumo financeiro customizado',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 