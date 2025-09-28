'use client';

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Skeleton,
  IconButton,
  Tooltip,
  Grow,
  Collapse,
  Paper,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { enduranceApi } from '../../../services/enduranceApi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
// Temporariamente usando SVG nativo para o gráfico

interface FinancialSummary {
  entradas: number;
  recebidos: number;
  ganhosTrainadores: number;
  ganhosPlataforma: number;
  pendentes: number;
  atrasados: number;
}

interface MonthlyData {
  month: string;
  value: number;
}

interface SummaryConfig {
  key: keyof FinancialSummary;
  label: string;
  endpoint: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  valueField: string;
  tabIndex: number; // Índice da aba correspondente
}

const SUMMARY_CONFIG: SummaryConfig[] = [
  {
    key: 'entradas',
    label: 'Entradas',
    endpoint: '/financial',
    icon: <ReceiptIcon />,
    color: '#2196f3',
    bgColor: '#e3f2fd',
    valueField: 'amount',
    tabIndex: 0,
  },
  {
    key: 'recebidos',
    label: 'Recebidos',
    endpoint: '/financial/received',
    icon: <CheckCircleIcon />,
    color: '#4caf50',
    bgColor: '#e8f5e8',
    valueField: 'amount',
    tabIndex: 1,
  },
  {
    key: 'ganhosTrainadores',
    label: 'Ganhos Treinadores',
    endpoint: 'coach-earnings-summary',
    icon: <TrendingUpIcon />,
    color: '#ff9800',
    bgColor: '#fff3e0',
    valueField: 'totalAmount',
    tabIndex: 2,
  },
  {
    key: 'ganhosPlataforma',
    label: 'Ganhos Plataforma',
    endpoint: '/financial/platform-earnings',
    icon: <TrendingDownIcon />,
    color: '#9c27b0',
    bgColor: '#f3e5f5',
    valueField: 'platformEarnings',
    tabIndex: 3,
  },
  {
    key: 'pendentes',
    label: 'Pendentes',
    endpoint: '/financial/pending',
    icon: <ScheduleIcon />,
    color: '#ff5722',
    bgColor: '#fbe9e7',
    valueField: 'amount',
    tabIndex: 4,
  },
  {
    key: 'atrasados',
    label: 'Atrasados',
    endpoint: '/financial/overdue',
    icon: <WarningIcon />,
    color: '#f44336',
    bgColor: '#ffebee',
    valueField: 'amount',
    tabIndex: 5,
  },
];

interface FinancialSummaryCardsProps {
  onCardClick?: (tabIndex: number) => void;
  filters?: {
    coachId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  };
  activeTabIndex?: number;
}

export default function FinancialSummaryCards({ onCardClick, filters, activeTabIndex }: FinancialSummaryCardsProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary>({
    entradas: 0,
    recebidos: 0,
    ganhosTrainadores: 0,
    ganhosPlataforma: 0,
    pendentes: 0,
    atrasados: 0,
  });
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyData[]>>({});
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    loadSummaryData();
  }, [filters, activeTabIndex]);

  const loadSummaryData = async () => {
    setLoading(true);
    try {
      // Fazer todas as chamadas em paralelo para buscar os totais
      const promises = SUMMARY_CONFIG.map(async (config) => {
        try {
          // Tratamento especial para coach earnings
          if (config.endpoint === 'coach-earnings-summary') {
            // Se estamos na aba de Ganhos dos Treinadores, não mostrar dados aqui
            // para evitar duplicação com os cards específicos da aba
            if (activeTabIndex === 2) {
              return { 
                key: config.key, 
                total: 0,
                pending: 0,
                paid: 0,
                cancelled: 0
              };
            }
            
            try {
              const response = await enduranceApi.getCoachEarningsFinancialSummary({
                includeTotals: true
              });
              
              const summary = response.summary;
              return { 
                key: config.key, 
                total: summary?.totalAmount || 0,
                pending: summary?.pendingAmount || 0,
                paid: summary?.paidAmount || 0,
                cancelled: summary?.cancelledAmount || 0
              };
            } catch (error) {
              console.log('Endpoint de resumo de coach earnings não disponível, usando valor padrão');
              return { 
                key: config.key, 
                total: 0,
                pending: 0,
                paid: 0,
                cancelled: 0
              };
            }
          }
          
          // Para outros endpoints, usar a lógica original
          let allData: any[] = [];
          let currentPage = 1;
          let totalPages = 1;
          
          // Buscar todas as páginas para ter o total completo
          do {
            const response = await enduranceApi.getFinancialRecords(config.endpoint, {
              page: currentPage,
              limit: 100, // Paginação eficiente
            });
            
            if (response.data) {
              allData = [...allData, ...response.data];
            }
            
            totalPages = response.pagination?.totalPages || 1;
            currentPage++;
          } while (currentPage <= totalPages && currentPage <= 50); // Limite de segurança de 50 páginas
          
          // Somar os valores usando o campo correto
          const total = allData.reduce((sum: number, record: any) => {
            const value = Number(record[config.valueField] || 0);
            return sum + value;
          }, 0);
          
          return { key: config.key, total };
        } catch (error) {
          console.error(`Erro ao carregar ${config.label}:`, error);
          return { key: config.key, total: 0 };
        }
      });

      const results = await Promise.all(promises);
      
      const newSummary = results.reduce((acc, result) => {
        acc[result.key] = result.total;
        return acc;
      }, {} as FinancialSummary);

      setSummary(newSummary);
    } catch (error) {
      console.error('Erro ao carregar resumo financeiro:', error);
      toast.error('Erro ao carregar resumo financeiro');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Função para gerar dados mensais (simulados por enquanto)
  const generateMonthlyData = (config: SummaryConfig): MonthlyData[] => {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    const baseValue = summary[config.key] || 1000;
    const data: MonthlyData[] = [];
    
    months.forEach((month, index) => {
      // Simulação de dados com variação realista
      const variation = Math.random() * 0.4 + 0.8; // 80% a 120% do valor base
      const monthlyVariation = Math.sin((index + 1) * Math.PI / 6) * 0.3 + 1; // Variação sazonal
      const value = (baseValue / 12) * variation * monthlyVariation;
      
      data.push({
        month,
        value: Math.max(0, value),
      });
    });
    
    return data;
  };

  // Função para lidar com o clique do card
  const handleCardClick = (config: SummaryConfig) => {
    if (expandedCard === config.key) {
      // Se já está expandido, fecha
      setExpandedCard(null);
    } else {
      // Expande o card clicado
      setExpandedCard(config.key);
      
      // Gera dados mensais se não existirem
      if (!monthlyData[config.key]) {
        setLoadingChart(true);
        setTimeout(() => {
          const data = generateMonthlyData(config);
          setMonthlyData(prev => ({
            ...prev,
            [config.key]: data
          }));
          setLoadingChart(false);
        }, 500); // Simula carregamento
      }
    }
    
    // Mantém funcionalidade original se fornecida
    if (onCardClick && !expandedCard) {
      onCardClick(config.tabIndex);
    }
  };

  // Componente de gráfico expandido usando SVG
  const ExpandedChart = ({ config }: { config: SummaryConfig }) => {
    const data = monthlyData[config.key] || [];
    
    if (data.length === 0) return null;
    
    const maxValue = Math.max(...data.map(item => item.value));
    const minValue = Math.min(...data.map(item => item.value));
    const range = maxValue - minValue || 1;
    
    const svgWidth = 500;
    const svgHeight = 200;
    const padding = 40;
    const chartWidth = svgWidth - padding * 2;
    const chartHeight = svgHeight - padding * 2;
    
    // Calcular pontos da linha
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * chartWidth + padding;
      const y = svgHeight - padding - ((item.value - minValue) / range) * chartHeight;
      return { x, y, value: item.value, month: item.month };
    });
    
    // Criar path da linha
    const linePath = points.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `${path} L ${point.x} ${point.y}`;
    }, '');
    
    // Criar path da área preenchida
    const areaPath = linePath + 
      ` L ${points[points.length - 1].x} ${svgHeight - padding}` + 
      ` L ${points[0].x} ${svgHeight - padding} Z`;

    return (
      <Box sx={{ position: 'relative', height: '350px', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: config.color }}>
            {config.label} - Evolução Mensal
          </Typography>
          <IconButton
            onClick={() => setExpandedCard(null)}
            sx={{
              color: config.color,
              '&:hover': {
                backgroundColor: config.bgColor,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        {loadingChart ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '250px' }}>
            <CircularProgress sx={{ color: config.color }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '270px' }}>
            <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1={padding}
                  y1={padding + (i * chartHeight / 4)}
                  x2={svgWidth - padding}
                  y2={padding + (i * chartHeight / 4)}
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
              ))}
              
              {/* Área preenchida */}
              <path
                d={areaPath}
                fill={config.color}
                fillOpacity="0.2"
              />
              
              {/* Linha */}
              <path
                d={linePath}
                stroke={config.color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Pontos */}
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill={config.color}
                  stroke="#fff"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                >
                  <title>{`${point.month}: ${formatCurrency(point.value)}`}</title>
                </circle>
              ))}
              
              {/* Labels dos meses */}
              {points.map((point, index) => (
                <text
                  key={index}
                  x={point.x}
                  y={svgHeight - padding + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#666"
                >
                  {point.month}
                </text>
              ))}
              
              {/* Labels dos valores */}
              {[0, 1, 2, 3, 4].map((i) => {
                const value = maxValue - (i * range / 4);
                return (
                  <text
                    key={i}
                    x={padding - 10}
                    y={padding + (i * chartHeight / 4) + 5}
                    textAnchor="end"
                    fontSize="10"
                    fill="#666"
                  >
                    {formatCurrency(value)}
                  </text>
                );
              })}
            </svg>
            
            {/* Estatísticas */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around', width: '100%' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Máximo
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: config.color }}>
                  {formatCurrency(maxValue)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Mínimo
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: config.color }}>
                  {formatCurrency(minValue)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Média
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: config.color }}>
                  {formatCurrency(data.reduce((sum, item) => sum + item.value, 0) / data.length)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Resumo Financeiro
          </Typography>
          <Tooltip title="Atualizar dados">
            <span>
              <IconButton disabled>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Grid container spacing={2}>
          {SUMMARY_CONFIG.map((config) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={config.key}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                  <Skeleton variant="text" width="80%" height={32} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

    return (
    <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Resumo Financeiro
          </Typography>
          <Tooltip title="Atualizar dados">
            <span>
              <IconButton onClick={loadSummaryData} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      
      {/* Grid container com animação */}
      <Box sx={{ position: 'relative', minHeight: expandedCard ? '500px' : 'auto' }}>
        <Grid container spacing={2}>
          {SUMMARY_CONFIG.map((config) => {
            const isExpanded = expandedCard === config.key;
            const isHidden = expandedCard && !isExpanded;
            
            return (
              <Grid 
                item 
                xs={isExpanded ? 12 : 12} 
                sm={isExpanded ? 12 : 6} 
                md={isExpanded ? 12 : 4} 
                lg={isExpanded ? 12 : 2} 
                key={config.key}
                sx={{
                  transition: 'all 0.5s ease-in-out',
                  opacity: isHidden ? 0 : 1,
                  transform: isHidden ? 'scale(0.8)' : 'scale(1)',
                  pointerEvents: isHidden ? 'none' : 'auto',
                  position: isExpanded ? 'relative' : 'relative',
                  zIndex: isExpanded ? 10 : 1,
                }}
              >
                <Grow in={!isHidden} timeout={isExpanded ? 700 : 400}>
                  <Card 
                    sx={{ 
                      height: isExpanded ? 'auto' : '100%',
                      minHeight: isExpanded ? '500px' : 'auto',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer',
                      transform: isExpanded ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isExpanded ? 8 : 3,
                      borderColor: isExpanded ? config.color : 'transparent',
                      borderWidth: isExpanded ? 2 : 0,
                      borderStyle: 'solid',
                      '&:hover': {
                        transform: isExpanded ? 'scale(1.02)' : 'translateY(-2px)',
                        boxShadow: isExpanded ? 8 : 6,
                        borderColor: config.color,
                        borderWidth: 2,
                        borderStyle: 'solid',
                        '& .arrow-icon': {
                          opacity: 1,
                          transform: isExpanded ? 'rotate(45deg)' : 'translateX(2px)',
                        }
                      }
                    }}
                    onClick={() => handleCardClick(config)}
                  >
                    <CardContent sx={{ p: isExpanded ? 0 : 2 }}>
                      {isExpanded ? (
                        <ExpandedChart config={config} />
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 40,
                                  height: 40,
                                  borderRadius: '50%',
                                  backgroundColor: config.bgColor,
                                  color: config.color,
                                  mr: 1,
                                }}
                              >
                                {config.icon}
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {config.label}
                              </Typography>
                            </Box>
                            <ArrowForwardIcon 
                              className="arrow-icon"
                              sx={{ 
                                color: config.color, 
                                fontSize: 18,
                                opacity: 0.6,
                                transition: 'all 0.3s ease-in-out'
                              }} 
                            />
                          </Box>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 'bold',
                              color: config.color,
                            }}
                          >
                            {formatCurrency(summary[config.key])}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
} 