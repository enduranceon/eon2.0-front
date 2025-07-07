'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Rating,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  DirectionsRun as RunIcon,
  Pool as TriathlonIcon,
  Hiking as TrailIcon,
  Help as HelpIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  QuestionMark as QuestionIcon,
  Check as CheckIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import QuizBase, { QuizQuestion, QuizResult } from './QuizBase';
import { enduranceApi } from '../../services/enduranceApi';
import { User, UserType, Modalidade, CoachLevel } from '../../types/api';
import { useTheme } from '@mui/material/styles';

interface CoachMatcherProps {
  onComplete?: (selectedCoach: User) => void;
}

// Perguntas baseadas no site oficial
const questions: QuizQuestion[] = [
  {
    id: 'idade',
    title: 'Qual é a sua faixa etária?',
    description: 'Isso nos ajuda a encontrar um treinador que trabalhe bem com sua categoria de idade.',
    options: [
      {
        id: '30-',
        label: '30 anos ou menos',
        value: '30-',
      },
      {
        id: '31-50',
        label: 'Entre 31 e 50 anos',
        value: '31-50',
      },
      {
        id: '51+',
        label: '51 anos ou mais',
        value: '51+',
      },
    ],
  },
  {
    id: 'genero',
    title: 'Qual é o seu gênero?',
    description: 'Alguns treinadores têm mais experiência com determinados gêneros.',
    options: [
      {
        id: 'masculino',
        label: 'Masculino',
        value: 'masculino',
        icon: <MaleIcon />,
      },
      {
        id: 'feminino',
        label: 'Feminino',
        value: 'feminino',
        icon: <FemaleIcon />,
      },
      {
        id: 'nao-informar',
        label: 'Prefiro não informar',
        value: 'nao-informar',
        icon: <QuestionIcon />,
      },
    ],
  },
  {
    id: 'tempo5k',
    title: 'Quanto tempo você faz (ou imagina fazer) em uma prova de 5km?',
    description: 'Se você nunca correu 5km, escolha a opção que mais se aproxima da sua expectativa ou capacidade atual. Não precisa ser exato!',
    options: [
      {
        id: 'iniciante',
        label: 'Mais de 27 minutos',
        value: 'iniciante',
      },
      {
        id: 'intermediario',
        label: 'Entre 20 e 27 minutos',
        value: 'intermediario',
      },
      {
        id: 'avancado',
        label: 'Menos de 20 minutos',
        value: 'avancado',
      },
    ],
  },
  {
    id: 'estilo',
    title: 'Qual estilo de acompanhamento você prefere?',
    description: 'Cada treinador tem um estilo diferente de acompanhar seus atletas.',
    options: [
      {
        id: 'proximo',
        label: 'Muito próximo e detalhado',
        description: 'Prefiro um treinador que me acompanhe de perto, com feedback constante e ajustes frequentes.',
        value: 'proximo',
      },
      {
        id: 'equilibrado',
        label: 'Intermediário e equilibrado',
        description: 'Prefiro um equilíbrio entre orientação e autonomia, com feedback regular mas não excessivo.',
        value: 'equilibrado',
      },
      {
        id: 'autonomo',
        label: 'Mais autônomo e independente',
        description: 'Prefiro mais independência, com orientações gerais e feedback apenas quando necessário.',
        value: 'autonomo',
      },
    ],
  },
  {
    id: 'objetivo',
    title: 'Qual é o seu principal objetivo?',
    description: 'Diferentes treinadores têm experiências variadas com diferentes objetivos.',
    options: [
      {
        id: 'saude',
        label: 'Saúde e qualidade de vida',
        description: 'Quero melhorar minha saúde, disposição e qualidade de vida através do esporte.',
        value: 'saude',
      },
      {
        id: 'iniciante',
        label: 'Sou iniciante e preciso de suporte',
        description: 'Estou começando agora e preciso de orientação para os primeiros passos.',
        value: 'iniciante',
      },
      {
        id: 'performance',
        label: 'Performance e competições',
        description: 'Quero melhorar meus tempos e participar de competições.',
        value: 'performance',
      },
      {
        id: 'alto-rendimento',
        label: 'Alto rendimento e profissional',
        description: 'Busco treinamento de alto nível para competições profissionais.',
        value: 'alto-rendimento',
      },
    ],
  },
];

const findBestCoach = (coaches: User[], answers: Record<string, any>): { coach: User; score: number; matchReasons: string[] } | null => {
  console.log('🔍 Encontrando melhor treinador...');
  console.log('📝 Respostas recebidas:', answers);
  console.log('👥 Treinadores disponíveis:', coaches.length);

  if (!coaches.length) return null;

  // Algoritmo inteligente de matching baseado nas respostas
  const scoredCoaches = coaches.map(coach => {
    let score = 0;
    const matchReasons: string[] = [];

    console.log(`⚖️ Avaliando ${coach.name}:`);

    // Filtro: apenas treinadores ativos
    if (!coach.isActive) {
      console.log(`  ❌ Treinador inativo`);
      return { coach, score: -1, matchReasons }; // Pontuação -1 para desqualificar
    }

    // Nível baseado no tempo 5k e experiência do coach (peso alto)
    if (answers.tempo5k && coach.coachLevel) {
      const levelMatch = {
        'iniciante': ['JUNIOR', 'PLENO'],
        'intermediario': ['PLENO', 'SENIOR'],
        'avancado': ['SENIOR', 'ESPECIALISTA'],
      };
      
      if (levelMatch[answers.tempo5k]?.includes(coach.coachLevel)) {
        score += 35;
        matchReasons.push(`Nível ideal para ${answers.tempo5k}`);
        console.log(`  ✅ Nível compatível (+35): ${coach.coachLevel} para ${answers.tempo5k}`);
      } else {
        console.log(`  ⚠️ Nível não ideal: ${coach.coachLevel} para ${answers.tempo5k}`);
      }
    }

    // Especialização baseada em modalidade e nome do coach (simulação inteligente)
    if (answers.modalidade) {
      const specialization = getCoachSpecialization(coach.name, answers.modalidade);
      if (specialization.isSpecialist) {
        score += 25;
        matchReasons.push(`Especialista em ${answers.modalidade}`);
        console.log(`  ✅ Especialização (+25): ${specialization.reason}`);
      } else {
        score += 10;
        matchReasons.push(`Atende modalidade ${answers.modalidade}`);
        console.log(`  ✅ Modalidade compatível (+10): ${specialization.reason}`);
      }
    }

    // Objetivos baseados no perfil do coach (simulação baseada no nível)
    if (answers.objetivo) {
      const objectiveMatch = getObjectiveMatch(coach.coachLevel, answers.objetivo);
      if (objectiveMatch.score > 0) {
        score += objectiveMatch.score;
        matchReasons.push(objectiveMatch.reason);
        console.log(`  ✅ Objetivo compatível (+${objectiveMatch.score}): ${objectiveMatch.reason}`);
      }
    }

    // Estilo de acompanhamento baseado no nível do coach
    if (answers.estilo) {
      const styleMatch = {
        'proximo': ['ESPECIALISTA', 'SENIOR'],
        'equilibrado': ['SENIOR', 'PLENO'],
        'autonomo': ['PLENO', 'JUNIOR'],
      };
      
      if (styleMatch[answers.estilo]?.includes(coach.coachLevel || '')) {
        score += 20;
        matchReasons.push(`Estilo de acompanhamento ideal`);
        console.log(`  ✅ Estilo compatível (+20): ${answers.estilo}`);
      }
    }

    // Bonus por experiência/nível
    if (coach.coachLevel === CoachLevel.ESPECIALISTA) {
      score += 15;
      matchReasons.push('Máxima experiência profissional');
      console.log(`  ✅ Bonus especialista (+15)`);
    } else if (coach.coachLevel === CoachLevel.SENIOR) {
      score += 10;
      matchReasons.push('Alta experiência profissional');
      console.log(`  ✅ Bonus senior (+10)`);
    } else if (coach.coachLevel === CoachLevel.PLENO) {
      score += 5;
      matchReasons.push('Experiência sólida');
      console.log(`  ✅ Bonus pleno (+5)`);
    }

    // Score mínimo para evitar matches ruins
    if (score < 15) {
      score = Math.max(score, 10); // Score mínimo para treinadores ativos
    }

    console.log(`  📊 Score final: ${score}`);
    console.log(`  📝 Motivos: ${matchReasons.join(', ')}`);
    return { coach, score, matchReasons };
  });

  // Filtrar treinadores com pontuação válida e ordenar
  const sortedCoaches = scoredCoaches
    .filter(c => c.score >= 0)
    .sort((a, b) => b.score - a.score);

  console.log('🏆 Ranking de treinadores:');
  sortedCoaches.forEach(c => console.log(`  - ${c.coach.name}: ${c.score} pontos`));

  if (sortedCoaches.length > 0) {
    return sortedCoaches[0];
  }

  return null;
};

// Função auxiliar para determinar especialização do coach
const getCoachSpecialization = (coachName: string, modalidade: string): { isSpecialist: boolean, reason: string } => {
  const name = coachName.toLowerCase();
  
  // Lógica baseada em nomes para simular especialização
  if (modalidade === 'corrida') {
    if (name.includes('maria') || name.includes('joao') || name.includes('ana')) {
      return { isSpecialist: true, reason: 'Especialista em corrida de rua' };
    }
  } else if (modalidade === 'triathlon') {
    if (name.includes('pedro') || name.includes('carla')) {
      return { isSpecialist: true, reason: 'Especialista em triathlon' };
    }
  }
  
  return { isSpecialist: false, reason: 'Treinador generalista qualificado' };
};

// Função auxiliar para determinar compatibilidade de objetivos
const getObjectiveMatch = (coachLevel: string | undefined, objetivo: string): { score: number, reason: string } => {
  if (!coachLevel) return { score: 0, reason: '' };
  
  const objectiveMap = {
    'performance': {
      'ESPECIALISTA': { score: 25, reason: 'Especialista em alto desempenho' },
      'SENIOR': { score: 20, reason: 'Excelente para performance' },
      'PLENO': { score: 15, reason: 'Bom para desenvolvimento de performance' },
      'JUNIOR': { score: 10, reason: 'Adequado para iniciação em performance' }
    },
    'saude': {
      'SENIOR': { score: 25, reason: 'Excelente para saúde e bem-estar' },
      'PLENO': { score: 20, reason: 'Muito bom para objetivos de saúde' },
      'ESPECIALISTA': { score: 15, reason: 'Qualificado para todos os objetivos' },
      'JUNIOR': { score: 15, reason: 'Bom para iniciação saudável' }
    },
    'competicoes': {
      'ESPECIALISTA': { score: 30, reason: 'Especialista em competições' },
      'SENIOR': { score: 25, reason: 'Experiente em preparação competitiva' },
      'PLENO': { score: 15, reason: 'Adequado para competições amadoras' },
      'JUNIOR': { score: 10, reason: 'Bom para primeiras competições' }
    }
  };
  
  return objectiveMap[objetivo]?.[coachLevel] || { score: 10, reason: 'Treinador qualificado' };
};

const CoachResult = ({ matchResult, onSelectCoach }: { 
  matchResult: any; 
  onSelectCoach: (coach: User) => void;
}) => {
  const theme = useTheme();
  if (!matchResult) return null;

  const { coach, score, matchReasons, answers } = matchResult;
  const avatarBgColor = theme.palette.secondary.dark.substring(1);

  const getCoachLevelDisplay = (level: string | undefined) => {
    const levelMap: { [key: string]: string } = {
      [CoachLevel.JUNIOR]: 'Nível Junior',
      [CoachLevel.PLENO]: 'Nível Pleno',
      [CoachLevel.SENIOR]: 'Nível Senior',
      [CoachLevel.ESPECIALISTA]: 'Nível Especialista',
    };
    return levelMap[level || ''] || 'Nível não definido';
  };

  const getCoachSpecializationDisplay = (coachName: string, modalidade: string) => {
    const spec = getCoachSpecialization(coachName, modalidade);
    return spec.isSpecialist ? `Especialista em ${modalidade}` : `Atende ${modalidade}`;
  };

  const getMatchReasonsDisplay = () => {
    return (
      <List>
        {matchReasons.map((reason: string, index: number) => (
          <ListItem key={index} sx={{ px: 0 }}>
            <ListItemIcon>
              <CheckIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary={reason} />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Box sx={{ mt: 4, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Encontramos o treinador ideal para você!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
        Com base nas suas respostas, este é o treinador que melhor se alinha aos seus objetivos e estilo de treino.
      </Typography>

      <Box sx={{ maxWidth: 480, mx: 'auto' }}>
        {/* Card Principal com Gradiente */}
        <Card
          sx={{
            p: 3,
            borderRadius: 4,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
            background: `linear-gradient(145deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: 'white',
            mb: 3,
          }}
        >
          <CardContent 
            sx={{ 
              p: '0 !important', 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Avatar
              alt={coach.name}
              src={coach.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.name)}&background=${avatarBgColor}&color=fff&size=120&font-size=0.4`}
              sx={{
                width: 120,
                height: 120,
                mb: 2,
                border: '4px solid white',
                boxShadow: '0 4px 12px 0 rgba(0,0,0,0.2)'
              }}
            />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {coach.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip 
                label={getCoachLevelDisplay(coach.coachLevel)} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white', 
                  fontWeight: 'bold' 
                }} 
              />
              <Chip 
                label={getCoachSpecializationDisplay(coach.name, answers.modalidade)} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white', 
                  fontWeight: 'bold' 
                }} 
              />
            </Box>
            <Rating name="read-only" value={score / 20} precision={0.5} readOnly sx={{ mb: 2 }} />
            
            <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

            <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 3, px: 2, color: 'rgba(255, 255, 255, 0.9)' }}>
              "{coach.bio || 'Especialista em transformar dedicação em resultados extraordinários.'}"
            </Typography>
          
            <Button
              variant="contained"
              size="large"
              startIcon={<CheckIcon />}
              onClick={() => onSelectCoach(coach)}
              sx={{ 
                fontWeight: 'bold',
                color: 'white',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Selecionar {coach.name.split(' ')[0]}
            </Button>
          </CardContent>
        </Card>

        {/* Card Secundário com Razões do Match */}
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Por que é o coach ideal?
            </Typography>
            {getMatchReasonsDisplay()}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default function CoachMatcher({ onComplete }: CoachMatcherProps) {
  const [coaches, setCoaches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, any> | null>(null);
  const [matchResult, setMatchResult] = useState<any>(null);

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await enduranceApi.getCoaches();
      const activeCoaches = response.data;

      if (!activeCoaches || activeCoaches.length === 0) {
        console.warn('⚠️ Nenhum treinador ativo encontrado. Criando treinadores de fallback.');
        
        const fallbackCoaches: User[] = [
          { id: 'coach-1', name: 'João da Corrida', email: 'joao@example.com', isActive: true, userType: UserType.COACH, coachLevel: CoachLevel.PLENO, bio: 'Focado em corrida de rua para todos os níveis.', image: `https://i.pravatar.cc/150?u=coach-1`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 'coach-2', name: 'Maria do Triathlon', email: 'maria@example.com', isActive: true, userType: UserType.COACH, coachLevel: CoachLevel.SENIOR, bio: 'Especialista em preparação para provas de triathlon.', image: `https://i.pravatar.cc/150?u=coach-2`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: 'coach-3', name: 'Pedro do Trail', email: 'pedro@example.com', isActive: true, userType: UserType.COACH, coachLevel: CoachLevel.ESPECIALISTA, bio: 'Amante de montanhas e desafios de trail run.', image: `https://i.pravatar.cc/150?u=coach-3`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ];
        
        setCoaches(fallbackCoaches);
      } else {
        setCoaches(activeCoaches);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar treinadores:', err);
      setError('Não foi possível carregar os treinadores. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (completedAnswers: Record<string, any>): QuizResult => {
    console.log('🏁 Quiz concluído, processando resultado...');
    setAnswers(completedAnswers);

    const bestCoachResult = findBestCoach(coaches, completedAnswers);
    
    if (bestCoachResult && bestCoachResult.coach) {
      console.log('🏆 Melhor treinador encontrado:', bestCoachResult.coach.name);
      setMatchResult({ ...bestCoachResult, answers: completedAnswers });
      return {
        id: 'coach-found',
        title: "Treinador Encontrado!",
        description: `Encontramos o treinador perfeito para você: ${bestCoachResult.coach.name}.`,
      };
    } else {
      console.log('😞 Nenhum treinador encontrado.');
      return {
        id: 'no-coach-found',
        title: "Nenhum Treinador Encontrado",
        description: "Não conseguimos encontrar um treinador ideal com base nas suas respostas. Tente novamente.",
      };
    }
  };

  const handleSelectCoach = (coach: User) => {
    console.log('✅ Treinador selecionado:', coach);
    if (onComplete) {
      onComplete(coach);
    }
  };

  if (loading) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }
  
  if (error) {
    return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  }

  if (matchResult) {
    return <CoachResult matchResult={matchResult} onSelectCoach={handleSelectCoach} />;
  }

  return (
    <QuizBase
      title="Encontrar Treinador Ideal"
      subtitle="Responda algumas perguntas para encontrarmos o treinador perfeito para você"
      questions={questions}
      onComplete={handleComplete}
      autoAdvance={true}
    />
  );
} 