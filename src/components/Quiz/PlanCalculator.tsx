'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  DirectionsRun as RunIcon,
  Sports as TriathlonIcon,
  CheckCircle as CheckIcon,
  Calculate as CalculateIcon,
  QuestionAnswer as QuestionIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import QuizBase, { QuizQuestion, QuizResult } from './QuizBase';
import { enduranceApi } from '../../services/enduranceApi';
import { Plan, Modalidade, PlanPeriod } from '../../types/api';
import PlanSelectionScreen from './PlanSelectionScreen';

// Preços de fallback baseados na estrutura oficial dos planos
const fallbackPrices = {
  essencial: {
    corrida: {
      monthly: 250,
      quarterly: 185,
      semiannual: 175,
      annual: 165,
    },
    triathlon: {
      monthly: 320,
      quarterly: 250,
      semiannual: 240,
      annual: 230,
    },
  },
  premium: {
    corrida: {
      monthly: 390,
      quarterly: 290,
      semiannual: 280,
      annual: 270,
    },
    triathlon: {
      monthly: 560,
      quarterly: 420,
      semiannual: 410,
      annual: 400,
    },
  },
};

// Função para obter preços de fallback
const getFallbackPrices = (planType: 'ESSENCIAL' | 'PREMIUM', modalidade: string) => {
  const type = planType.toLowerCase() as keyof typeof fallbackPrices;
  const mod = modalidade && modalidade.toLowerCase().includes('triathlon') ? 'triathlon' : 'corrida';
  return fallbackPrices[type]?.[mod] || fallbackPrices.essencial.corrida;
};

// Função para extrair preços dos dados da API
const extractPricesFromAPI = (plan: Plan) => {
  console.log('🔍 Extraindo preços da API para o plano:', plan.name);
  console.log('📊 Dados de preços recebidos:', plan.prices);

  // Verifica se prices é um array (estrutura real da API)
  if (Array.isArray(plan.prices)) {
    const pricesMap = plan.prices.reduce((acc, priceObj) => {
      // Converter string para número
      const price = typeof priceObj.price === 'string' ? parseFloat(priceObj.price) : priceObj.price;
      acc[priceObj.period.toLowerCase()] = price;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('✅ Preços extraídos do array (convertidos para números):', pricesMap);
    return pricesMap;
  }
  
  // Se prices é um objeto direto (estrutura do tipo)
  if (plan.prices && typeof plan.prices === 'object' && !Array.isArray(plan.prices)) {
    // Converter todas as propriedades para números
    const convertedPrices = Object.keys(plan.prices).reduce((acc, key) => {
      const value = plan.prices[key];
      acc[key] = typeof value === 'string' ? parseFloat(value) : value;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('✅ Preços extraídos do objeto (convertidos para números):', convertedPrices);
    return convertedPrices;
  }
  
  console.log('❌ Estrutura de preços não reconhecida, usando fallback');
  return {};
};

// Dados de fallback para os planos
const fallbackPlanData = {
  essencial: {
    corrida: {
      name: 'PLANO ESSENCIAL DE CORRIDA',
      features: [
        'Planilha de treinos personalizada',
        'Ajustes semanais no treino',
        'Acompanhamento por WhatsApp',
        'Suporte técnico',
        'Análise de performance básica'
      ]
    },
    triathlon: {
      name: 'PLANO ESSENCIAL DE TRIATHLON',
      features: [
        'Planilha de treinos para 3 modalidades',
        'Ajustes semanais no treino',
        'Acompanhamento por WhatsApp',
        'Suporte técnico',
        'Análise de performance básica'
      ]
    }
  },
  premium: {
    corrida: {
      name: 'PLANO PREMIUM DE CORRIDA',
      features: [
        'Planilha de treinos personalizada',
        'Ajustes diários no treino',
        'Acompanhamento próximo via WhatsApp',
        'Reuniões mensais',
        'Análise detalhada de métricas (TSS, CTL, PMC)',
        'Suporte 24/7',
        'Flexibilidade total para mudanças'
      ]
    },
    triathlon: {
      name: 'PLANO PREMIUM DE TRIATHLON',
      features: [
        'Planilha de treinos para 3 modalidades',
        'Ajustes diários no treino',
        'Acompanhamento próximo via WhatsApp',
        'Reuniões mensais',
        'Análise detalhada de métricas (TSS, CTL, PMC)',
        'Suporte 24/7',
        'Flexibilidade total para mudanças'
      ]
    }
  }
};

// Função para obter dados de fallback do plano
const getFallbackPlanData = (planType: 'ESSENCIAL' | 'PREMIUM', modalidade: string) => {
  const type = planType.toLowerCase() as keyof typeof fallbackPlanData;
  const mod = modalidade && modalidade.toLowerCase().includes('triathlon') ? 'triathlon' : 'corrida';
  return fallbackPlanData[type]?.[mod] || fallbackPlanData.essencial.corrida;
};

// Função para normalizar tipos de planos da API
const normalizePlanType = (plan: Plan): 'ESSENCIAL' | 'PREMIUM' => {
  // Se já tem o tipo correto, retornar
  if (plan.type === 'ESSENCIAL' || plan.type === 'PREMIUM') {
    return plan.type;
  }
  
  // Tentar inferir pelo nome
  const name = plan.name?.toLowerCase() || '';
  if (name.includes('premium') || name.includes('avançado') || name.includes('pro')) {
    return 'PREMIUM';
  }
  
  return 'ESSENCIAL'; // Default
};

// Perguntas baseadas no site oficial
const questions: QuizQuestion[] = [
  {
    id: 'modalidade',
    title: 'Qual modalidade você pratica ou deseja praticar?',
    options: [
      {
        id: 'corrida',
        label: 'Corrida',
        value: 'corrida',
        icon: <RunIcon />,
      },
      {
        id: 'triathlon',
        label: 'Triathlon',
        value: 'triathlon',
        icon: <TriathlonIcon />,
      },
    ],
  },
  {
    id: 'interacao',
    title: 'Como você prefere interagir com o treinador?',
    options: [
      {
        id: 'autonomia',
        label: 'Autonomia com suporte',
        value: 'autonomia',
      },
      {
        id: 'retorno',
        label: 'Retorno em até 2 dias',
        value: 'retorno',
      },
      {
        id: 'frequente',
        label: 'Contato frequente, inclusive fora do horário',
        value: 'frequente',
      },
    ],
  },
  {
    id: 'rotina',
    title: 'Com que frequência sua rotina de treinos muda?',
    options: [
      {
        id: 'raramente',
        label: 'Raramente',
        value: 'raramente',
      },
      {
        id: 'as-vezes',
        label: 'Às vezes',
        value: 'as-vezes',
      },
      {
        id: 'muda-muito',
        label: 'Muda muito',
        value: 'muda-muito',
      },
    ],
  },
  {
    id: 'reunioes',
    title: 'Você sente necessidade de reuniões mensais com o coach?',
    options: [
      {
        id: 'nao',
        label: 'Não',
        value: 'nao',
      },
      {
        id: 'talvez',
        label: 'Talvez',
        value: 'talvez',
      },
      {
        id: 'sim',
        label: 'Sim',
        value: 'sim',
      },
    ],
  },
  {
    id: 'metricas',
    title: 'Você usa métricas como TSS, CTL, PMC?',
    options: [
      {
        id: 'nunca',
        label: 'Nunca',
        value: 'nunca',
      },
      {
        id: 'pouco',
        label: 'Conheço, mas uso pouco',
        value: 'pouco',
      },
      {
        id: 'sempre',
        label: 'Uso sempre',
        value: 'sempre',
      },
    ],
  },
  {
    id: 'imprevistos',
    title: 'Como reage a imprevistos?',
    options: [
      {
        id: 'sozinho',
        label: 'Ajusto sozinho',
        value: 'sozinho',
      },
      {
        id: 'aviso',
        label: 'Aviso e ajusto com o coach',
        value: 'aviso',
      },
      {
        id: 'coach',
        label: 'Prefiro que o coach ajuste',
        value: 'coach',
      },
    ],
  },
  {
    id: 'objetivo',
    title: 'Você busca...',
    options: [
      {
        id: 'saude',
        label: 'Saúde e consistência',
        value: 'saude',
      },
      {
        id: 'evolucao',
        label: 'Evoluir aos poucos',
        value: 'evolucao',
      },
      {
        id: 'performance',
        label: 'Alta performance',
        value: 'performance',
      },
    ],
  },
];

// Lógica de recomendação baseada nas respostas
const calculatePlan = (answers: Record<string, any>, plans: Plan[], modalidades: Modalidade[]): { plan: Plan; modalidade: Modalidade } | null => {
  console.log('🧮 Calculando plano ideal...');
  console.log('📝 Respostas:', answers);
  console.log('📊 Planos disponíveis:', plans.length);
  console.log('🎯 Modalidades disponíveis:', modalidades.length);
  
  // Verificações defensivas
  if (!Array.isArray(plans) || plans.length === 0) {
    console.error('❌ Plans não é um array válido:', plans);
    return null;
  }
  
  if (!Array.isArray(modalidades) || modalidades.length === 0) {
    console.error('❌ Modalidades não é um array válido:', modalidades);
    return null;
  }

  if (!answers || !answers.modalidade) {
    console.error('❌ Respostas inválidas:', answers);
    return null;
  }

  let premiumScore = 0;
  
  // Critérios para Premium
  if (answers.interacao === 'frequente') premiumScore += 2;
  if (answers.interacao === 'retorno') premiumScore += 1;
  
  if (answers.rotina === 'muda-muito') premiumScore += 2;
  if (answers.rotina === 'as-vezes') premiumScore += 1;
  
  if (answers.reunioes === 'sim') premiumScore += 2;
  if (answers.reunioes === 'talvez') premiumScore += 1;
  
  if (answers.metricas === 'sempre') premiumScore += 2;
  if (answers.metricas === 'pouco') premiumScore += 1;
  
  if (answers.imprevistos === 'coach') premiumScore += 2;
  if (answers.imprevistos === 'aviso') premiumScore += 1;
  
  if (answers.objetivo === 'performance') premiumScore += 2;
  if (answers.objetivo === 'evolucao') premiumScore += 1;

  // Determinar o tipo de plano baseado nas respostas
  const planType = premiumScore >= 5 ? 'PREMIUM' : 'ESSENCIAL';
  
  console.log(`🎯 Score Premium: ${premiumScore} -> Tipo recomendado: ${planType}`);
  
  // Loggar todos os planos disponíveis
  console.log('📋 Analisando planos disponíveis:');
  plans.forEach((p, index) => {
    console.log(`  ${index + 1}. ${p.name} (${p.type}) - Ativo: ${p.isActive}`);
  });
  
  // Encontrar plano ideal
  let plan = plans.find(p => {
    const normalizedType = normalizePlanType(p);
    const match = normalizedType === planType && p.isActive;
    console.log(`  Verificando ${p.name}: tipo=${normalizedType}, match=${match}`);
    return match;
  });
  
  // Se não encontrar o tipo exato, buscar por nome
  if (!plan) {
    console.log(`⚠️ Plano ${planType} não encontrado pelo tipo, buscando por nome...`);
    plan = plans.find(p => {
      const nameMatch = p.name && p.name.toLowerCase().includes(planType.toLowerCase()) && p.isActive;
      console.log(`  Verificando ${p.name} por nome: match=${nameMatch}`);
      return nameMatch;
    });
  }
  
  // Se ainda não encontrar, usar o primeiro plano ativo
  if (!plan) {
    console.log(`⚠️ Plano ${planType} não encontrado, usando primeiro plano ativo...`);
    plan = plans.find(p => p.isActive);
  }

  if (!plan) {
    console.error('❌ Nenhum plano ativo encontrado!');
    console.log('Planos disponíveis:', plans.map(p => ({ 
      id: p.id, 
      name: p.name, 
      type: p.type, 
      normalizedType: normalizePlanType(p),
      isActive: p.isActive 
    })));
    return null;
  }

  console.log(`✅ Plano selecionado: ${plan.name} (tipo: ${normalizePlanType(plan)})`);
  
  // Encontrar modalidade adequada baseada na resposta do usuário
  console.log('🎯 Buscando modalidade adequada para:', answers.modalidade);
  console.log('📋 Modalidades disponíveis:');
  modalidades.forEach((m, index) => {
    console.log(`  ${index + 1}. ${m.name} - Ativo: ${m.isActive}`);
  });
  
  let modalidade = modalidades.find(m => {
    const match = m.name && m.name.toLowerCase().includes(answers.modalidade) && m.isActive;
    console.log(`  Verificando ${m.name}: match=${match}`);
    return match;
  });
  
  // Se não encontrar, usar a primeira modalidade ativa
  if (!modalidade) {
    console.log('⚠️ Modalidade específica não encontrada, usando primeira ativa...');
    modalidade = modalidades.find(m => m.isActive);
  }
  
  if (!modalidade) {
    console.error('❌ Nenhuma modalidade ativa encontrada!');
    return null;
  }

  console.log(`✅ Modalidade selecionada: ${modalidade.name}`);
  
  return { plan, modalidade };
};

const PlanResult = ({ 
  plan, 
  modalidade, 
  onSelectPlan,
  answers 
}: { 
  plan: Plan; 
  modalidade: Modalidade;
  onSelectPlan?: (planData: any) => void;
  answers?: Record<string, any>;
}) => {
  const theme = useTheme();
  
  console.log('💰 Processando preços para o plano:', plan.name);
  console.log('🎯 Modalidade:', modalidade.name);
  
  // Extrair preços da API
  const apiPrices = extractPricesFromAPI(plan);
  const apiSemiannualPrice = apiPrices.semiannual || 0;
  const apiMonthlyPrice = apiPrices.monthly || 0;
  
  // Normalizar tipo do plano
  const normalizedType = normalizePlanType(plan);
  
  // Usar preços da API se válidos, senão usar fallback
  let semiannualPrice = apiSemiannualPrice;
  let monthlyPrice = apiMonthlyPrice;
  
  // Se não temos preços válidos da API, usar fallback
  if (!semiannualPrice || !monthlyPrice) {
    console.log('⚠️ Preços da API inválidos, usando fallback');
    const fallbackPriceData = getFallbackPrices(normalizedType, modalidade.name || '');
    semiannualPrice = semiannualPrice || fallbackPriceData.semiannual;
    monthlyPrice = monthlyPrice || fallbackPriceData.monthly;
  } else {
    console.log('✅ Usando preços da API:', { semiannualPrice, monthlyPrice });
  }
  
  // Garantir que todos os preços sejam números válidos
  const numericSemiannualPrice = Number(semiannualPrice) || 0;
  const numericMonthlyPrice = Number(monthlyPrice) || 0;
  
  // Obter dados do plano (nome e features)
  const planName = plan.name || getFallbackPlanData(normalizedType, modalidade.name || '').name;
  const planFeatures = (plan.features && plan.features.length > 0) ? 
    plan.features : 
    getFallbackPlanData(normalizedType, modalidade.name || '').features;
  
  // Calcular preços para exibição
  const displayMonthlyPrice = numericSemiannualPrice > 0 ? (numericSemiannualPrice / 6) : numericMonthlyPrice;
  const displayTotalPrice = numericSemiannualPrice > 0 ? numericSemiannualPrice : (numericMonthlyPrice * 6);
  
  // Validar se os preços são válidos
  const isValidPrice = displayMonthlyPrice > 0 && displayTotalPrice > 0;
  
  console.log('📊 Preços finais:', {
    displayMonthlyPrice,
    displayTotalPrice,
    isValidPrice,
    numericSemiannualPrice,
    numericMonthlyPrice
  });

  const handleSelectPlan = () => {
    if (onSelectPlan) {
      onSelectPlan({
        planId: plan.id,
        modalidadeId: modalidade.id,
        type: normalizedType,
        modalidade: modalidade.name,
        answers,
        plan: {
          id: plan.id,
          name: planName,
          type: normalizedType
        }
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
      <Card 
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          mb: 3
        }}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
            {planName}
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.95)', mb: 3, fontWeight: 500 }}>
            Modalidade: {modalidade.name}
          </Typography>
          
          {/* Preço Principal */}
          {isValidPrice ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h2" fontWeight="bold" sx={{ mb: 1, color: 'white' }}>
                R$ {displayMonthlyPrice.toFixed(2).replace('.', ',')}
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.95)', mb: 1, fontWeight: 500 }}>
                por mês
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.90)', fontSize: '1rem' }}>
                Plano semestral • Total: R$ {displayTotalPrice.toFixed(2).replace('.', ',')}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: 'white' }}>
                Preço sob consulta
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.90)' }}>
                Entre em contato para mais informações
              </Typography>
            </Box>
          )}
          
          {/* Economia */}
          {isValidPrice && numericMonthlyPrice > 0 && numericSemiannualPrice > 0 && (numericMonthlyPrice * 6) > numericSemiannualPrice && (
            <Box sx={{ 
              mb: 3, 
              p: 2.5, 
              background: 'rgba(255, 255, 255, 0.15)', 
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <Typography variant="body1" sx={{ 
                color: 'white', 
                fontWeight: 600,
                fontSize: '1.1rem',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                💰 Economia de R$ {((numericMonthlyPrice * 6) - numericSemiannualPrice).toFixed(2).replace('.', ',')} 
                {' '}no plano semestral
              </Typography>
            </Box>
          )}
          
          <Button
            variant="contained"
            size="large"
            onClick={handleSelectPlan}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            CONTRATAR {planName.toUpperCase()}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            O que está incluído:
          </Typography>
          <List>
            {planFeatures.map((feature, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={feature} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="outlined" size="large">
          Ver todos os planos
        </Button>
      </Box>
    </Box>
  );
};

interface PlanCalculatorProps {
  onPlanSelected?: (planData: any) => void;
}

type PlanScreenType = 'initial' | 'selection' | 'quiz';

export default function PlanCalculator({ onPlanSelected }: PlanCalculatorProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<PlanScreenType>('initial');

  useEffect(() => {
    loadPlansAndModalidades();
  }, []);

  // Função para criar planos de fallback
  const createFallbackPlans = (): Plan[] => {
    return [
      {
        id: 'essencial-corrida',
        name: 'PLANO ESSENCIAL DE CORRIDA',
        description: 'Plano ideal para corredores que buscam autonomia com suporte profissional.',
        enrollmentFee: 0,
        prices: [
          { period: PlanPeriod.MONTHLY, price: 250 },
          { period: PlanPeriod.QUARTERLY, price: 185 },
          { period: PlanPeriod.SEMIANNUALLY, price: 175 },
          { period: PlanPeriod.YEARLY, price: 165 },
        ],
        modalidades: [
          {
            modalidade: {
              id: 'corrida-modal',
              name: 'Corrida',
              description: 'Modalidade focada em corrida de rua, montanha e pista.',
              icon: '🏃‍♂️',
              color: '#FF6B6B',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'essencial-triathlon',
        name: 'PLANO ESSENCIAL DE TRIATHLON',
        description: 'Plano ideal para triatletas que buscam autonomia com suporte nas três modalidades.',
        enrollmentFee: 0,
        prices: [
          { period: PlanPeriod.MONTHLY, price: 320 },
          { period: PlanPeriod.QUARTERLY, price: 250 },
          { period: PlanPeriod.SEMIANNUALLY, price: 240 },
          { period: PlanPeriod.YEARLY, price: 230 },
        ],
        modalidades: [
          {
            modalidade: {
              id: 'triathlon-modal',
              name: 'Triathlon',
              description: 'Modalidade que combina natação, ciclismo e corrida.',
              icon: '🏊‍♂️',
              color: '#4ECDC4',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'premium-corrida',
        name: 'PLANO PREMIUM DE CORRIDA',
        description: 'Plano com acompanhamento próximo e análises detalhadas para alta performance.',
        enrollmentFee: 0,
        prices: [
          { period: PlanPeriod.MONTHLY, price: 390 },
          { period: PlanPeriod.QUARTERLY, price: 290 },
          { period: PlanPeriod.SEMIANNUALLY, price: 280 },
          { period: PlanPeriod.YEARLY, price: 270 },
        ],
        modalidades: [
          {
            modalidade: {
              id: 'corrida-modal',
              name: 'Corrida',
              description: 'Modalidade focada em corrida de rua, montanha e pista.',
              icon: '🏃‍♂️',
              color: '#FF6B6B',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'premium-triathlon',
        name: 'PLANO PREMIUM DE TRIATHLON',
        description: 'Plano com acompanhamento próximo e análises detalhadas para alta performance no triathlon.',
        enrollmentFee: 0,
        prices: [
          { period: PlanPeriod.MONTHLY, price: 560 },
          { period: PlanPeriod.QUARTERLY, price: 420 },
          { period: PlanPeriod.SEMIANNUALLY, price: 410 },
          { period: PlanPeriod.YEARLY, price: 400 },
        ],
        modalidades: [
          {
            modalidade: {
              id: 'triathlon-modal',
              name: 'Triathlon',
              description: 'Modalidade que combina natação, ciclismo e corrida.',
              icon: '🏊‍♂️',
              color: '#4ECDC4',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  };

  // Função para criar modalidades de fallback
  const createFallbackModalidades = (): Modalidade[] => {
    return [
      {
        id: 'corrida-modal',
        name: 'Corrida',
        description: 'Modalidade focada em corrida de rua, montanha e pista.',
        icon: '🏃‍♂️',
        color: '#FF6B6B',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'triathlon-modal',
        name: 'Triathlon',
        description: 'Modalidade que combina natação, ciclismo e corrida.',
        icon: '🏊‍♂️',
        color: '#4ECDC4',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  };

  const loadPlansAndModalidades = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Carregando planos e modalidades da API...');

      const [plansResponse, modalidadesResponse] = await Promise.all([
        enduranceApi.getPlans(),
        enduranceApi.getModalidades()
      ]);

      console.log('📊 Dados recebidos da API:');
      console.log('Plans Response:', plansResponse);
      console.log('Modalidades Response:', modalidadesResponse);

      // Extrair dados do formato paginado ou array direto
      const plansData = Array.isArray(plansResponse) 
        ? plansResponse 
        : plansResponse?.data || [];
      
      const modalidadesData = Array.isArray(modalidadesResponse) 
        ? modalidadesResponse 
        : modalidadesResponse?.data || [];

      console.log('📋 Dados extraídos:');
      console.log('Plans Data:', plansData);
      console.log('Modalidades Data:', modalidadesData);

      // PRIORIZAR DADOS REAIS DA API
      let finalPlans = plansData;
      let finalModalidades = modalidadesData;

      // Só usar fallback se realmente não há dados da API
      if (!Array.isArray(plansData) || plansData.length === 0) {
        console.warn('⚠️ API não retornou planos válidos, usando fallback');
        finalPlans = createFallbackPlans();
      } else {
        console.log('✅ Usando planos reais da API');
        // Loggar detalhes dos planos reais
        finalPlans.forEach((plan, index) => {
          console.log(`📄 Plano ${index + 1}:`, {
            id: plan.id,
            name: plan.name,
            type: plan.type,
            prices: plan.prices,
            isActive: plan.isActive
          });
        });
      }

      if (!Array.isArray(modalidadesData) || modalidadesData.length === 0) {
        console.warn('⚠️ API não retornou modalidades válidas, usando fallback');
        finalModalidades = createFallbackModalidades();
      } else {
        console.log('✅ Usando modalidades reais da API');
        // Loggar detalhes das modalidades reais
        finalModalidades.forEach((modalidade, index) => {
          console.log(`🎯 Modalidade ${index + 1}:`, {
            id: modalidade.id,
            name: modalidade.name,
            isActive: modalidade.isActive
          });
        });
      }

      setPlans(finalPlans);
      setModalidades(finalModalidades);

      console.log('✅ Dados carregados com sucesso:');
      console.log(`- ${finalPlans.length} planos (${Array.isArray(plansData) && plansData.length > 0 ? 'REAIS' : 'FALLBACK'})`);
      console.log(`- ${finalModalidades.length} modalidades (${Array.isArray(modalidadesData) && modalidadesData.length > 0 ? 'REAIS' : 'FALLBACK'})`);
    } catch (err) {
      console.error('❌ Erro ao carregar planos e modalidades:', err);
      console.log('🔄 Usando dados de fallback devido ao erro da API');
      
      // Em caso de erro, usar dados de fallback
      setPlans(createFallbackPlans());
      setModalidades(createFallbackModalidades());
      setError(null); // Limpar erro pois temos fallback
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (answers: Record<string, any>): QuizResult => {
    // Verificar se os dados foram carregados
    if (loading) {
      return {
        id: 'plan-loading',
        title: 'Carregando...',
        description: 'Aguarde enquanto processamos sua análise.',
        icon: <CalculateIcon />,
        data: (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ),
      };
    }

    // Com o sistema de fallback, sempre teremos dados válidos
    const recommendation = calculatePlan(answers, plans, modalidades);
    
    if (!recommendation) {
      return {
        id: 'plan-error',
        title: 'Erro na Recomendação',
        description: 'Não foi possível encontrar um plano adequado.',
        icon: <CalculateIcon />,
        data: (
          <Alert severity="error" sx={{ mb: 2 }}>
            Não foi possível encontrar um plano adequado para suas necessidades.
            <Button 
              variant="outlined" 
              onClick={loadPlansAndModalidades}
              sx={{ mt: 2 }}
            >
              Tentar Novamente
            </Button>
          </Alert>
        ),
      };
    }
    
    return {
      id: 'plan-result',
      title: 'RESULTADO DA ANÁLISE',
      description: `Recomendamos para você:`,
      icon: <CalculateIcon />,
      data: (
        <PlanResult 
          plan={recommendation.plan} 
          modalidade={recommendation.modalidade}
          onSelectPlan={onPlanSelected}
          answers={answers}
        />
      ),
    };
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Carregando planos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <QuizBase
        title="CALCULADORA DE PLANO IDEAL"
        subtitle="Descubra seu Plano Ideal"
        questions={questions}
        onComplete={handleComplete}
        icon={<CalculateIcon />}
        autoAdvance={true}
      />
    </Box>
  );
} 