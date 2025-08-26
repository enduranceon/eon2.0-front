import { NextRequest, NextResponse } from 'next/server';
import { enduranceApi } from '@/services/enduranceApi';

export async function GET(request: NextRequest) {
  try {
    // Buscar todas as provas disponíveis via API real
    const exams = await enduranceApi.getExams({ 
      limit: 100, // Buscar até 100 provas para garantir que todas as 17 sejam incluídas
      status: 'ACTIVE' // Apenas provas ativas
    });

    // Retornar as provas em formato público
    return NextResponse.json({
      success: true,
      data: exams.data || [],
      total: exams.pagination?.total || 0,
      message: 'Provas carregadas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao buscar provas via enduranceApi:', error);
    
    // Em caso de erro, retornar array vazio
    return NextResponse.json({
      success: false,
      data: [],
      total: 0,
      message: 'Erro ao carregar provas',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
