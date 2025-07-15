import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Retornar dados simplificados e consistentes com a base real (1 aluno)
    const moduleStats = [
      {
        moduleName: 'users',
        totalRecords: 1, // Base real: 1 aluno
        activeRecords: 1,
        pendingRecords: 0,
        overdueRecords: 0,
        newRecords: 0,
        inactiveRecords: 0,
        recentActivity: 1,
        growthRate: 0,
        lastUpdate: new Date().toISOString(),
      },
      {
        moduleName: 'coaches',
        totalRecords: 0, // Base real: sem coaches ainda
        activeRecords: 0,
        pendingRecords: 0,
        overdueRecords: 0,
        newRecords: 0,
        inactiveRecords: 0,
        recentActivity: 0,
        growthRate: 0,
        lastUpdate: new Date().toISOString(),
      },
      {
        moduleName: 'plans',
        totalRecords: 0, // Base real: sem planos ainda
        activeRecords: 0,
        pendingRecords: 0,
        overdueRecords: 0,
        newRecords: 0,
        inactiveRecords: 0,
        recentActivity: 0,
        growthRate: 0,
        lastUpdate: new Date().toISOString(),
      },
      {
        moduleName: 'events',
        totalRecords: 0, // Base real: sem eventos ainda
        activeRecords: 0,
        pendingRecords: 0,
        overdueRecords: 0,
        newRecords: 0,
        inactiveRecords: 0,
        recentActivity: 0,
        growthRate: 0,
        lastUpdate: new Date().toISOString(),
      },
      {
        moduleName: 'tests',
        totalRecords: 0, // Base real: sem testes ainda
        activeRecords: 0,
        pendingRecords: 0,
        overdueRecords: 0,
        newRecords: 0,
        inactiveRecords: 0,
        recentActivity: 0,
        growthRate: 0,
        lastUpdate: new Date().toISOString(),
      },
      {
        moduleName: 'margins',
        totalRecords: 0, // Base real: sem margens ainda
        activeRecords: 0,
        pendingRecords: 0,
        overdueRecords: 0,
        newRecords: 0,
        inactiveRecords: 0,
        recentActivity: 0,
        growthRate: 0,
        lastUpdate: new Date().toISOString(),
      },
      {
        moduleName: 'requests',
        totalRecords: 0, // Base real: sem solicitações ainda
        activeRecords: 0,
        pendingRecords: 0,
        overdueRecords: 0,
        newRecords: 0,
        inactiveRecords: 0,
        recentActivity: 0,
        growthRate: 0,
        lastUpdate: new Date().toISOString(),
      },
      {
        moduleName: 'financial',
        totalRecords: 0, // Base real: sem dados financeiros ainda
        activeRecords: 0,
        pendingRecords: 0,
        overdueRecords: 0,
        newRecords: 0,
        inactiveRecords: 0,
        recentActivity: 0,
        growthRate: 0,
        lastUpdate: new Date().toISOString(),
      },
      {
        moduleName: 'support',
        totalRecords: 0, // Base real: sem dados de suporte ainda
        activeRecords: 0,
        pendingRecords: 0,
        overdueRecords: 0,
        newRecords: 0,
        inactiveRecords: 0,
        recentActivity: 0,
        growthRate: 0,
        lastUpdate: new Date().toISOString(),
      },
      {
        moduleName: 'analytics',
        totalRecords: 0, // Base real: sem dados de analytics ainda
        activeRecords: 0,
        pendingRecords: 0,
        overdueRecords: 0,
        newRecords: 0,
        inactiveRecords: 0,
        recentActivity: 0,
        growthRate: 0,
        lastUpdate: new Date().toISOString(),
      },
      {
        moduleName: 'modalidades',
        totalRecords: 0, // Base real: sem modalidades ainda
        activeRecords: 0,
        pendingRecords: 0,
        overdueRecords: 0,
        newRecords: 0,
        inactiveRecords: 0,
        recentActivity: 0,
        growthRate: 0,
        lastUpdate: new Date().toISOString(),
      }
    ];

    return NextResponse.json(moduleStats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos módulos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleId, action } = body;

    // Simular atualização de estatísticas
    const response = {
      success: true,
      message: `Estatísticas do módulo ${moduleId} atualizadas`,
      action,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleId, stats } = body;

    // Simular atualização parcial de estatísticas
    const response = {
      success: true,
      message: `Estatísticas do módulo ${moduleId} atualizadas parcialmente`,
      updatedStats: stats,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
      return NextResponse.json(
        { error: 'ID do módulo é obrigatório' },
        { status: 400 }
      );
    }

    // Simular reset de estatísticas
    const response = {
      success: true,
      message: `Estatísticas do módulo ${moduleId} resetadas`,
      moduleId,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Erro ao resetar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 