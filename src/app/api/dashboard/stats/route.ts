import { NextRequest, NextResponse } from 'next/server';
import { DashboardStats, PaymentStatus } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const userType = searchParams.get('userType') || 'all';

    // Simulação de dados reais - em produção, estes dados viriam do banco de dados
    const mockStats: DashboardStats = {
      totalUsers: 1247,
      activeSubscriptions: 892,
      monthlyRevenue: 125680.50,
      totalRevenue: 1567234.75,
      pendingPayments: 23,
      activeCoaches: 45,
      popularPlans: [
        {
          planName: "Plano Running Premium",
          subscribers: 234,
          revenue: 35100.00
        },
        {
          planName: "Plano Triathlon Elite",
          subscribers: 189,
          revenue: 47250.00
        },
        {
          planName: "Plano Corrida Básico",
          subscribers: 312,
          revenue: 28080.00
        },
        {
          planName: "Plano Natação Avançado",
          subscribers: 157,
          revenue: 19625.00
        }
      ],
      recentPayments: [
        {
          id: "pay_001",
          userName: "João Silva",
          amount: 150.00,
          status: PaymentStatus.CONFIRMED,
          date: "2024-12-07T18:30:00Z"
        },
        {
          id: "pay_002",
          userName: "Maria Santos",
          amount: 250.00,
          status: PaymentStatus.PENDING,
          date: "2024-12-07T17:15:00Z"
        },
        {
          id: "pay_003",
          userName: "Carlos Oliveira",
          amount: 200.00,
          status: PaymentStatus.CONFIRMED,
          date: "2024-12-07T16:45:00Z"
        },
        {
          id: "pay_004",
          userName: "Ana Costa",
          amount: 180.00,
          status: PaymentStatus.CONFIRMED,
          date: "2024-12-07T15:20:00Z"
        },
        {
          id: "pay_005",
          userName: "Pedro Almeida",
          amount: 300.00,
          status: PaymentStatus.OVERDUE,
          date: "2024-12-06T14:10:00Z"
        }
      ]
    };

    // Aplicar filtros baseados nos parâmetros
    if (period === 'week') {
      mockStats.monthlyRevenue = mockStats.monthlyRevenue * 0.25;
      mockStats.activeSubscriptions = Math.floor(mockStats.activeSubscriptions * 0.8);
    } else if (period === 'quarter') {
      mockStats.monthlyRevenue = mockStats.monthlyRevenue * 3;
      mockStats.activeSubscriptions = Math.floor(mockStats.activeSubscriptions * 1.2);
    } else if (period === 'year') {
      mockStats.monthlyRevenue = mockStats.monthlyRevenue * 12;
      mockStats.activeSubscriptions = Math.floor(mockStats.activeSubscriptions * 1.5);
    }

    // Filtrar por tipo de usuário
    if (userType === 'coach') {
      mockStats.totalUsers = mockStats.activeCoaches;
    } else if (userType === 'student') {
      mockStats.totalUsers = mockStats.totalUsers - mockStats.activeCoaches;
    }

    // Simular variações baseadas no período
    const now = new Date();
    const hourOfDay = now.getHours();
    
    // Ajustar dados baseados no horário (simulação de dados em tempo real)
    const timeMultiplier = 1 + (hourOfDay - 12) * 0.02; // Pequena variação baseada no horário
    mockStats.monthlyRevenue = Math.round(mockStats.monthlyRevenue * timeMultiplier * 100) / 100;
    mockStats.activeSubscriptions = Math.floor(mockStats.activeSubscriptions * timeMultiplier);

    // Calcular estatísticas adicionais para contexto
    const growthRate = 8.5; // Crescimento mensal em %
    const conversionRate = 12.3; // Taxa de conversão em %
    const churnRate = 3.2; // Taxa de churn em %

    // Adicionar metadados da resposta
    const response = {
      success: true,
      data: mockStats,
      metadata: {
        period,
        userType,
        generatedAt: new Date().toISOString(),
        metrics: {
          growthRate,
          conversionRate,
          churnRate,
          averageRevenuePerUser: Math.round(mockStats.monthlyRevenue / mockStats.activeSubscriptions * 100) / 100
        }
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        message: 'Não foi possível carregar as estatísticas do dashboard'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'refresh':
        // Simular refresh de dados
        const refreshedStats: DashboardStats = {
          totalUsers: 1247 + Math.floor(Math.random() * 10),
          activeSubscriptions: 892 + Math.floor(Math.random() * 5),
          monthlyRevenue: 125680.50 + Math.random() * 1000,
          totalRevenue: 1567234.75 + Math.random() * 10000,
          pendingPayments: 23 + Math.floor(Math.random() * 5),
          activeCoaches: 45 + Math.floor(Math.random() * 3),
          popularPlans: [
            {
              planName: "Plano Running Premium",
              subscribers: 234 + Math.floor(Math.random() * 10),
              revenue: 35100.00 + Math.random() * 1000
            },
            {
              planName: "Plano Triathlon Elite",
              subscribers: 189 + Math.floor(Math.random() * 10),
              revenue: 47250.00 + Math.random() * 1000
            },
            {
              planName: "Plano Corrida Básico",
              subscribers: 312 + Math.floor(Math.random() * 10),
              revenue: 28080.00 + Math.random() * 1000
            },
            {
              planName: "Plano Natação Avançado",
              subscribers: 157 + Math.floor(Math.random() * 10),
              revenue: 19625.00 + Math.random() * 1000
            }
          ],
          recentPayments: [
            {
                           id: "pay_new_001",
             userName: "Novo Usuário",
             amount: 150.00 + Math.random() * 100,
             status: PaymentStatus.CONFIRMED,
             date: new Date().toISOString()
            }
          ]
        };

        return NextResponse.json({
          success: true,
          data: refreshedStats,
          message: 'Dados atualizados com sucesso'
        }, { status: 200 });

      case 'export':
        // Simular exportação de dados
        return NextResponse.json({
          success: true,
          data: {
            exportUrl: '/api/dashboard/stats/export',
            format: data.format || 'csv',
            generatedAt: new Date().toISOString()
          },
          message: 'Exportação iniciada com sucesso'
        }, { status: 200 });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Ação não suportada',
            message: `Ação '${action}' não é válida` 
          }, 
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro ao processar requisição POST:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        message: 'Erro ao processar a requisição'
      }, 
      { status: 500 }
    );
  }
}

// Endpoint para buscar estatísticas históricas
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, granularity } = body;

    // Simular dados históricos
    const historicalData = {
      period: { startDate, endDate },
      granularity: granularity || 'daily',
      stats: [
        {
          date: '2024-12-01',
          totalUsers: 1200,
          activeSubscriptions: 850,
          monthlyRevenue: 120000.00,
          newUsers: 15,
          churnedUsers: 8
        },
        {
          date: '2024-12-02',
          totalUsers: 1210,
          activeSubscriptions: 855,
          monthlyRevenue: 121500.00,
          newUsers: 18,
          churnedUsers: 8
        },
        {
          date: '2024-12-03',
          totalUsers: 1225,
          activeSubscriptions: 870,
          monthlyRevenue: 123000.00,
          newUsers: 22,
          churnedUsers: 7
        },
        {
          date: '2024-12-04',
          totalUsers: 1235,
          activeSubscriptions: 880,
          monthlyRevenue: 124200.00,
          newUsers: 18,
          churnedUsers: 8
        },
        {
          date: '2024-12-05',
          totalUsers: 1240,
          activeSubscriptions: 885,
          monthlyRevenue: 124800.00,
          newUsers: 12,
          churnedUsers: 7
        },
        {
          date: '2024-12-06',
          totalUsers: 1245,
          activeSubscriptions: 890,
          monthlyRevenue: 125400.00,
          newUsers: 15,
          churnedUsers: 10
        },
        {
          date: '2024-12-07',
          totalUsers: 1247,
          activeSubscriptions: 892,
          monthlyRevenue: 125680.50,
          newUsers: 8,
          churnedUsers: 6
        }
      ]
    };

    return NextResponse.json({
      success: true,
      data: historicalData,
      message: 'Dados históricos carregados com sucesso'
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar dados históricos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        message: 'Erro ao carregar dados históricos'
      }, 
      { status: 500 }
    );
  }
}

// Endpoint para limpar cache de estatísticas
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cacheKey = searchParams.get('key') || 'all';

    // Simular limpeza de cache
    return NextResponse.json({
      success: true,
      data: {
        clearedKeys: [cacheKey],
        clearedAt: new Date().toISOString()
      },
      message: `Cache '${cacheKey}' limpo com sucesso`
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        message: 'Erro ao limpar cache'
      }, 
      { status: 500 }
    );
  }
} 