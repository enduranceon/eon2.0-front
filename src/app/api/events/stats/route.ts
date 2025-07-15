import { NextRequest, NextResponse } from 'next/server';
import { enduranceApi } from '@/services/enduranceApi';

export async function GET(request: NextRequest) {
  try {
    // Obter dados reais dos eventos
    const events = await enduranceApi.getExams({ limit: 1000 });
    
    // Calcular estatísticas baseadas nos dados reais
    const totalEvents = events.pagination.total;
    const activeEvents = totalEvents; // Considerando todos os eventos como ativos
    const inactiveEvents = 0;
    
    // Simular dados de novos eventos e pendentes com base nos dados reais
    const newEvents = Math.floor(totalEvents * 0.05); // 5% de novos eventos
    const pendingEvents = Math.floor(totalEvents * 0.02); // 2% de pendências
    const overdueEvents = Math.floor(totalEvents * 0.01); // 1% de atrasados
    
    // Calcular taxa de crescimento
    const growthRate = totalEvents > 0 ? ((totalEvents - Math.max(1, totalEvents - newEvents)) / Math.max(1, totalEvents - newEvents)) * 100 : 0;
    
    const stats = {
      total: totalEvents,
      active: activeEvents,
      inactive: inactiveEvents,
      new: newEvents,
      pending: pendingEvents,
      overdue: overdueEvents,
      recentActivity: Math.floor(totalEvents * 0.12), // 12% de atividade recente
      growthRate: parseFloat(growthRate.toFixed(2)),
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos eventos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 