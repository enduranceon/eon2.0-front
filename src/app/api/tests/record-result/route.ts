import { NextRequest, NextResponse } from 'next/server';
import { enduranceApi } from '@/services/enduranceApi';
import { websocketService } from '@/services/websocketService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, userId, resultType, singleResult, multipleResults, notes } = body;

    console.log('🎯 [API] Registrando resultado de teste:', {
      testId,
      userId,
      resultType,
      singleResult,
      multipleResults,
      notes,
      timestamp: new Date().toISOString()
    });

    // Chamar o backend real diretamente para evitar loop infinito
    const result = await enduranceApi.post<TestResult>('/coaches/dashboard/record-dynamic-test-result', {
      testId,
      userId,
      resultType,
      singleResult,
      multipleResults,
      notes
    });

    console.log('✅ [API] Resultado registrado com sucesso:', result);

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
    console.error('❌ [API] Erro ao registrar resultado de teste:', error);
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
