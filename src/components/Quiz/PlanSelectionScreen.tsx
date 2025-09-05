'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Modal,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  DirectionsRun as RunIcon,
  Pool as TriathlonIcon,
  EuroSymbol as PriceIcon,
} from '@mui/icons-material';
import { enduranceApi } from '../../services/enduranceApi';
import { Plan, Modalidade, PlanPeriod } from '../../types/api';

interface PlanSelectionScreenProps {
  onPlanSelected: (planData: any) => void;
  onBack?: () => void;
}

interface PlanModalData {
  plan: Plan;
  modalidade: Modalidade;
  isOpen: boolean;
}

const PlanSelectionScreen: React.FC<PlanSelectionScreenProps> = ({ onPlanSelected, onBack }) => {
  const theme = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalData, setModalData] = useState<PlanModalData | null>(null);

  useEffect(() => {
    loadPlansAndModalidades();
  }, []);

  
  useEffect(() => {
    if (plans.length > 0) {
  
    }
  }, [plans]);

  useEffect(() => {
    if (modalidades.length > 0) {
  
    }
  }, [modalidades]);

  const loadPlansAndModalidades = async () => {
    try {
      setLoading(true);
      const [plansResponse, modalidadesResponse] = await Promise.all([
        enduranceApi.getPlans(),
        enduranceApi.getModalidades()
      ]);
      
      const plansData = plansResponse?.data || plansResponse || [];
      const modalidadesData = modalidadesResponse?.data || modalidadesResponse || [];
      
      setPlans(Array.isArray(plansData) ? plansData : []);
      setModalidades(Array.isArray(modalidadesData) ? modalidadesData : []);
    } catch (err) {
      console.error('❌ Erro ao carregar planos:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getPlanPrice = (plan: Plan, period: PlanPeriod = PlanPeriod.MONTHLY) => {
    if (Array.isArray(plan.prices)) {
      const priceObj = plan.prices.find(p => p.period === period);
      return priceObj ? priceObj.price : 0;
    }
    return 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getPlanFeatures = (plan: Plan) => {
    // Features baseadas no nome do plano
    const planName = plan.name.toLowerCase();
    
    if (planName.includes('premium') || planName.includes('pro')) {
      return [
        'Planilha de treinos personalizada',
        'Ajustes diários no treino',
        'Acompanhamento próximo via WhatsApp',
        'Reuniões mensais',
        'Análise detalhada de métricas',
        'Suporte 24/7',
        'Flexibilidade total para mudanças'
      ];
    }
    
    return [
      'Planilha de treinos personalizada',
      'Ajustes semanais no treino',
      'Acompanhamento por WhatsApp',
      'Suporte técnico',
      'Análise de performance básica'
    ];
  };

  const getModalidadeIcon = (modalidade: Modalidade) => {
    const name = modalidade.name.toLowerCase();
    if (name.includes('triathlon')) {
      return <TriathlonIcon sx={{ color: modalidade.color }} />;
    }
    return <RunIcon sx={{ color: modalidade.color }} />;
  };

  const handlePlanSelect = (plan: Plan) => {
    // Se o plano tem modalidades, usar a primeira modalidade disponível
    let selectedModalidade: Modalidade;
    
    if (plan.modalidades && plan.modalidades.length > 0) {
      selectedModalidade = plan.modalidades[0].modalidade;
    } else {
      // Fallback para planos sem modalidades específicas
      selectedModalidade = { id: 'general', name: 'Geral' } as any;
    }

    const planData = {
      plan,
      modalidade: selectedModalidade,
      planId: plan.id,
      modalidadeId: selectedModalidade.id,
      planType: plan.name.toLowerCase().includes('premium') ? 'premium' : 'essencial',
      modalidadeType: selectedModalidade.name.toLowerCase().includes('triathlon') ? 'triathlon' : 'corrida',
    };

    // Usar setTimeout para evitar setState durante render
    setTimeout(() => {
      onPlanSelected(planData);
    }, 0);
  };

  const handleDetailsClick = (plan: Plan) => {
    // Se o plano tem modalidades, usar a primeira modalidade disponível
    const selectedModalidade = plan.modalidades && plan.modalidades.length > 0
      ? plan.modalidades[0].modalidade
      : { id: 'general', name: 'Geral' } as any;
      
    setModalData({
      plan,
      modalidade: selectedModalidade,
      isOpen: true
    });
  };

  const closeModal = () => {
    setModalData(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={loadPlansAndModalidades} sx={{ ml: 2 }}>
          Tentar novamente
        </Button>
      </Alert>
    );
  }

  // Verificar se os dados são válidos
  if (!Array.isArray(plans) || plans.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Nenhum plano disponível no momento.
        <Button onClick={loadPlansAndModalidades} sx={{ ml: 2 }}>
          Recarregar
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Escolha seu Plano
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Selecione o plano que melhor atende às suas necessidades
        </Typography>
      </Box>

      {onBack && (
        <Box sx={{ mb: 3 }}>
          <Button onClick={onBack} variant="outlined">
            ← Voltar
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {Array.isArray(plans) && plans.map((plan) => {
          // Obter a primeira modalidade do plano para exibição
          const firstModalidade = plan.modalidades && plan.modalidades.length > 0 
            ? plan.modalidades[0].modalidade 
            : { id: 'general', name: 'Geral' } as any;

          // Criar uma lista das modalidades disponíveis para mostrar no card
          const modalidadesList = plan.modalidades && plan.modalidades.length > 0
            ? plan.modalidades.map(m => m.modalidade.name).join(', ')
            : 'Modalidade geral';

          return (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Card 
                sx={{ 
                  minHeight: 550,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-4px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    {plan.modalidades && plan.modalidades.length > 0 
                      ? getModalidadeIcon(firstModalidade)
                      : <RunIcon />
                    }
                  </Box>
                  
                  <Typography variant="h6" fontWeight="bold" gutterBottom align="center">
                    {plan.name}
                  </Typography>
                  
                  <Chip 
                    label={plan.modalidades && plan.modalidades.length > 1 
                      ? `${plan.modalidades.length} modalidades`
                      : firstModalidade.name
                    }
                    color="primary"
                    size="small"
                    sx={{ mb: 2, display: 'block', mx: 'auto', width: 'fit-content' }}
                  />

                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {formatPrice(getPlanPrice(plan))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      por mês
                    </Typography>
                  </Box>

                  {/* Mostrar modalidades disponíveis */}
                  {plan.modalidades && plan.modalidades.length > 1 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                      Modalidades: {modalidadesList}
                    </Typography>
                  )}

                  <List dense sx={{ py: 0 }}>
                    {getPlanFeatures(plan).slice(0, 3).map((feature, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CheckIcon color="success" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature}
                          primaryTypographyProps={{ fontSize: '0.875rem' }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {getPlanFeatures(plan).length > 3 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                      +{getPlanFeatures(plan).length - 3} recursos adicionais
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ p: 3, pt: 1, flexDirection: 'column', gap: 1.5, mt: 'auto' }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handlePlanSelect(plan)}
                    sx={{ fontWeight: 'bold', py: 1.2 }}
                  >
                    Selecionar
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<InfoIcon />}
                    onClick={() => handleDetailsClick(plan)}
                    sx={{ py: 1 }}
                  >
                    Detalhes
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Modal de Detalhes */}
      <Modal
        open={modalData?.isOpen || false}
        onClose={closeModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">
                Detalhes do Plano
              </Typography>
              <Button onClick={closeModal} sx={{ minWidth: 'auto', p: 1 }}>
                <CloseIcon />
              </Button>
            </Box>

            {modalData && (
              <>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  {getModalidadeIcon(modalData.modalidade)}
                  <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                    {modalData.plan.name}
                  </Typography>
                  <Chip 
                    label={modalData.modalidade.name}
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {formatPrice(getPlanPrice(modalData.plan))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    por mês
                  </Typography>
                </Box>

                {/* Seção de Periodicidades */}
                {modalData.plan.prices && modalData.plan.prices.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Opções de Pagamento
                    </Typography>
                    <Grid container spacing={2}>
                      {modalData.plan.prices.map((priceObj, index) => {
                        const getPeriodLabel = (period: PlanPeriod) => {
                          switch (period) {
                            case PlanPeriod.WEEKLY:
                              return 'Semanal';
                            case PlanPeriod.BIWEEKLY:
                              return 'Quinzenal';
                            case PlanPeriod.MONTHLY:
                              return 'Mensal';
                            case PlanPeriod.QUARTERLY:
                              return 'Trimestral';
                            case PlanPeriod.SEMIANNUALLY:
                              return 'Semestral';
                            case PlanPeriod.YEARLY:
                              return 'Anual';
                            default:
                              return period;
                          }
                        };

                        const getPeriodDescription = (period: PlanPeriod) => {
                          switch (period) {
                            case PlanPeriod.WEEKLY:
                              return 'por semana';
                            case PlanPeriod.BIWEEKLY:
                              return 'por quinzena';
                            case PlanPeriod.MONTHLY:
                              return 'por mês';
                            case PlanPeriod.QUARTERLY:
                              return 'por trimestre';
                            case PlanPeriod.SEMIANNUALLY:
                              return 'por semestre';
                            case PlanPeriod.YEARLY:
                              return 'por ano';
                            default:
                              return '';
                          }
                        };

                        return (
                          <Grid item xs={12} sm={6} key={index}>
                            <Card 
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                textAlign: 'center',
                                border: priceObj.period === PlanPeriod.MONTHLY ? `2px solid ${theme.palette.primary.main}` : '1px solid',
                                backgroundColor: priceObj.period === PlanPeriod.MONTHLY ? theme.palette.primary.light + '10' : 'transparent'
                              }}
                            >
                              <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                {getPeriodLabel(priceObj.period)}
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>
                                {formatPrice(priceObj.price)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getPeriodDescription(priceObj.period)}
                              </Typography>
                              {priceObj.period === PlanPeriod.MONTHLY && (
                                <Chip 
                                  label="Mais Popular" 
                                  size="small" 
                                  color="primary" 
                                  sx={{ mt: 1, fontSize: '0.7rem' }}
                                />
                              )}
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                )}

                {modalData.plan.description && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Descrição
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {modalData.plan.description}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    O que está incluso
                  </Typography>
                  <List dense>
                    {getPlanFeatures(modalData.plan).map((feature, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CheckIcon color="success" sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      handlePlanSelect(modalData.plan);
                      closeModal();
                    }}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Selecionar este Plano
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={closeModal}
                  >
                    Fechar
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Modal>
    </Box>
  );
};

export default PlanSelectionScreen; 