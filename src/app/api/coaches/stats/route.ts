import { NextRequest, NextResponse } from 'next/server';
import { enduranceApi } from '@/services/enduranceApi';

export async function GET(request: NextRequest) {
  try {
    // Obter dados reais dos coaches
    const coaches = await enduranceApi.getCoaches({ limit: 100 });
    
    // Calcular estatísticas baseadas nos dados reais
    const totalCoaches = coaches.pagination.total;
    const activeCoaches = coaches.data.filter(coach => coach.isActive).length;
    const inactiveCoaches = totalCoaches - activeCoaches;
    
    // Simular dados de novos coaches e pendentes com base nos dados reais
    const newCoaches = Math.floor(totalCoaches * 0.03); // 3% de novos coaches
    const pendingCoaches = Math.floor(totalCoaches * 0.01); // 1% de pendências
    const overdueCoaches = Math.floor(totalCoaches * 0.005); // 0.5% de atrasados
    
    // Calcular taxa de crescimento
    const growthRate = totalCoaches > 0 ? ((totalCoaches - Math.max(1, totalCoaches - newCoaches)) / Math.max(1, totalCoaches - newCoaches)) * 100 : 0;
    
    const stats = {
      total: totalCoaches,
      active: activeCoaches,
      inactive: inactiveCoaches,
      new: newCoaches,
      pending: pendingCoaches,
      overdue: overdueCoaches,
      recentActivity: Math.floor(totalCoaches * 0.15), // 15% de atividade recente
      growthRate: parseFloat(growthRate.toFixed(2)),
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos coaches:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 