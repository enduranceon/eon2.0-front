import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Como não há uma API específica para solicitações, vou usar valores padrão
    const stats = {
      total: 0,
      active: 0,
      inactive: 0,
      new: 0,
      pending: 0,
      overdue: 0,
      recentActivity: 0,
      growthRate: 0,
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas das solicitações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 