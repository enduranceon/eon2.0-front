import { NextRequest, NextResponse } from 'next/server';
import { enduranceApi } from '@/services/enduranceApi';
import { websocketService } from '@/services/websocketService';
import { TestResult } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, userId, resultType, singleResult, multipleResults, notes } = body;

    // Registrando resultado de teste

    // Chamar o backend real diretamente para evitar loop infinito
    const result = await enduranceApi.post<TestResult>('/coaches/dashboard/record-dynamic-test-result', {
      testId,
      userId,
      resultType,
      singleResult,
      multipleResults,
      notes
    });

    // Resultado registrado com sucesso

    // Emitir evento WebSocket
    const eventData = {
      userId: result.userId,
      testId: result.testId,
      testName: result.test.name,
      result: {
        timeSeconds: result.timeSeconds,
        generalRank: result.generalRank,
        categoryRank: result.categoryRank,
        dynamicResults: result.dynamicResults,
        resultType: result.resultType
      },
      coachId: result.recorder?.id || 'coach-123',
      coachName: result.recorder?.name || 'Treinador'
    };

    // Emitir evento via WebSocket
    websocketService.emitTestResultRegistered(eventData);
    
    return NextResponse.json({
      success: true,
      result,
      message: 'Resultado registrado e evento WebSocket emitido'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao registrar resultado de teste',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
