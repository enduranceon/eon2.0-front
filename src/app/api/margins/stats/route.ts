import { NextRequest, NextResponse } from 'next/server';
import { enduranceApi } from '@/services/enduranceApi';

export async function GET(request: NextRequest) {
  try {
    // Obter dados reais das margens
    const margins = await enduranceApi.getMargins({ limit: 1000 });
    
    // Calcular estatísticas baseadas nos dados reais
    const totalMargins = margins.pagination.total;
    const activeMargins = margins.data.filter(margin => margin.isActive).length;
    const inactiveMargins = totalMargins - activeMargins;
    
    // Simular dados de novas margens e pendentes com base nos dados reais
    const newMargins = Math.floor(totalMargins * 0.02); // 2% de novas margens
    const pendingMargins = Math.floor(totalMargins * 0.005); // 0.5% de pendências
    const overdueMargins = Math.floor(totalMargins * 0.001); // 0.1% de atrasados
    
    // Calcular taxa de crescimento
    const growthRate = totalMargins > 0 ? ((totalMargins - Math.max(1, totalMargins - newMargins)) / Math.max(1, totalMargins - newMargins)) * 100 : 0;
    
    const stats = {
      total: totalMargins,
      active: activeMargins,
      inactive: inactiveMargins,
      new: newMargins,
      pending: pendingMargins,
      overdue: overdueMargins,
      recentActivity: Math.floor(totalMargins * 0.05), // 5% de atividade recente
      growthRate: parseFloat(growthRate.toFixed(2)),
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas das margens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 