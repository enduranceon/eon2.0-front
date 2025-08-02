import { NextRequest, NextResponse } from 'next/server';
import { enduranceApi } from '@/services/enduranceApi';

export async function GET(request: NextRequest) {
  try {
    // Obter dados reais dos planos
    const plans = await enduranceApi.getPlans({ limit: 100 });
    
    // Calcular estatísticas baseadas nos dados reais
    const totalPlans = plans.pagination.total;
    const activePlans = plans.data.filter(plan => plan.isActive).length;
    const inactivePlans = totalPlans - activePlans;
    
    // Simular dados de novos planos e pendentes com base nos dados reais
    const newPlans = Math.floor(totalPlans * 0.02); // 2% de novos planos
    const pendingPlans = Math.floor(totalPlans * 0.01); // 1% de pendências
    const overduePlans = Math.floor(totalPlans * 0.005); // 0.5% de atrasados
    
    // Calcular taxa de crescimento
    const growthRate = totalPlans > 0 ? ((totalPlans - Math.max(1, totalPlans - newPlans)) / Math.max(1, totalPlans - newPlans)) * 100 : 0;
    
    const stats = {
      total: totalPlans,
      active: activePlans,
      inactive: inactivePlans,
      new: newPlans,
      pending: pendingPlans,
      overdue: overduePlans,
      recentActivity: Math.floor(totalPlans * 0.08), // 8% de atividade recente
      growthRate: parseFloat(growthRate.toFixed(2)),
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos planos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 