import { NextRequest, NextResponse } from 'next/server';
import { enduranceApi } from '@/services/enduranceApi';

export async function GET(request: NextRequest) {
  try {
    // Obter dados reais dos testes
    const tests = await enduranceApi.getAvailableTests({ limit: 100 });
    
    // Calcular estatísticas baseadas nos dados reais
    const totalTests = tests.pagination.total;
    const activeTests = tests.data.filter(test => test.isActive).length;
    const inactiveTests = totalTests - activeTests;
    
    // Simular dados de novos testes e pendentes com base nos dados reais
    const newTests = Math.floor(totalTests * 0.03); // 3% de novos testes
    const pendingTests = Math.floor(totalTests * 0.01); // 1% de pendências
    const overdueTests = Math.floor(totalTests * 0.005); // 0.5% de atrasados
    
    // Calcular taxa de crescimento
    const growthRate = totalTests > 0 ? ((totalTests - Math.max(1, totalTests - newTests)) / Math.max(1, totalTests - newTests)) * 100 : 0;
    
    const stats = {
      total: totalTests,
      active: activeTests,
      inactive: inactiveTests,
      new: newTests,
      pending: pendingTests,
      overdue: overdueTests,
      recentActivity: Math.floor(totalTests * 0.1), // 10% de atividade recente
      growthRate: parseFloat(growthRate.toFixed(2)),
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas dos testes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 