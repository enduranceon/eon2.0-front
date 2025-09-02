import { NextRequest, NextResponse } from 'next/server';
import { enduranceApi } from '@/services/enduranceApi';
import { websocketService } from '@/services/websocketService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examId, registrationId, timeSeconds, generalRank, categoryRank, notes } = body;

    // Registrando resultado de prova

    // Chamar o backend real diretamente para evitar loop infinito
    const result = await enduranceApi.post<any>(`/coaches/exams/${examId}/results`, {
      registrationId,
      timeSeconds,
      generalRank,
      categoryRank,
      notes
    });

    // Resultado de prova registrado com sucesso

    // Emitir evento WebSocket
    const eventData = {
      userId: result.user?.id,
      examId: result.exam?.id,
      examName: result.exam?.name,
      result: {
        timeSeconds: result.timeSeconds,
        generalRank: result.generalRank,
        categoryRank: result.categoryRank
      },
      coachId: 'coach-123', // Em um ambiente real, isso viria do contexto de autenticação
      coachName: 'Treinador'
    };

    // Emitir evento via WebSocket
    websocketService.emitExamResultRegistered(eventData);

    return NextResponse.json({
      success: true,
      result,
      message: 'Resultado de prova registrado e evento WebSocket emitido'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao registrar resultado de prova',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
