import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    // Simular dados de atividades
    const activityTypes = ['login', 'payment', 'registration', 'course_completion', 'support_ticket', 'content_upload'];
    const activities = [];

    // Gerar atividades simuladas
    for (let i = 0; i < limit; i++) {
      const randomType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const randomDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      // Filtrar por tipo se especificado
      if (type && randomType !== type) continue;
      
      activities.push({
        id: `activity_${i + 1}`,
        type: randomType,
        userId: userId || `user_${Math.floor(Math.random() * 1000)}`,
        timestamp: randomDate.toISOString(),
        metadata: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          source: Math.random() > 0.5 ? 'web' : 'mobile',
          ...(randomType === 'payment' && {
            amount: Math.floor(Math.random() * 1000) + 50,
            currency: 'BRL',
            method: Math.random() > 0.5 ? 'credit_card' : 'pix'
          }),
          ...(randomType === 'registration' && {
            plan: `plan_${Math.floor(Math.random() * 5) + 1}`,
            referral: Math.random() > 0.7 ? 'organic' : 'paid'
          })
        }
      });
    }

    // Aplicar filtros de data se especificados
    let filteredActivities = activities;
    if (startDate) {
      filteredActivities = filteredActivities.filter(a => new Date(a.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      filteredActivities = filteredActivities.filter(a => new Date(a.timestamp) <= new Date(endDate));
    }

    // Ordenar por timestamp (mais recentes primeiro)
    filteredActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

    return NextResponse.json(paginatedActivities);
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simular criação de nova atividade
    const newActivity = {
      id: `activity_${Date.now()}`,
      type: body.type,
      userId: body.userId,
      timestamp: new Date().toISOString(),
      metadata: body.metadata || {}
    };

    return NextResponse.json(newActivity, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('id');
    
    if (!activityId) {
      return NextResponse.json(
        { error: 'ID da atividade é obrigatório' },
        { status: 400 }
      );
    }

    // Simular remoção de atividade
    return NextResponse.json({ 
      message: 'Atividade removida com sucesso',
      activityId 
    });
  } catch (error) {
    console.error('Erro ao remover atividade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 