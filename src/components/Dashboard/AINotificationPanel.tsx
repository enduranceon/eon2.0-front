'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Alert,
  AlertTitle,
  Chip,
  Button,
  Collapse,
  Fade,
  LinearProgress,
  Tooltip,
  Divider,
  Stack,
  Badge,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Psychology as PsychologyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Refresh as RefreshIcon,
  Science as ScienceIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { useAINotifications } from '../../contexts/AINotificationContext';
import { AIInsight } from '../../services/aiNotificationService';
import { useRouter } from 'next/navigation';

interface AINotificationPanelProps {
  maxInsights?: number;
}

const getInsightIcon = (type: AIInsight['type']) => {
  switch (type) {
    case 'urgent': return <WarningIcon />;
    case 'warning': return <WarningIcon />;
    case 'success': return <CheckCircleIcon />;
    case 'info': return <InfoIcon />;
    case 'trend': return <TrendingUpIcon />;
    default: return <InfoIcon />;
  }
};

const getInsightSeverity = (type: AIInsight['type']) => {
  switch (type) {
    case 'urgent': return 'error';
    case 'warning': return 'warning';
    case 'success': return 'success';
    case 'info': return 'info';
    case 'trend': return 'info';
    default: return 'info';
  }
};

const getPriorityColor = (priority: AIInsight['priority']) => {
  switch (priority) {
    case 'high': return '#f44336';
    case 'medium': return '#ff9800';
    case 'low': return '#4caf50';
    default: return '#2196f3';
  }
};

export default function AINotificationPanel({ 
  maxInsights = 5 
}: AINotificationPanelProps) {
  const {
    insights,
    isLoading,
    refreshInsights,
    dismissInsight,
  } = useAINotifications();

  const [isExpanded, setIsExpanded] = useState(true);
  const router = useRouter();

  const displayedInsights = insights.slice(0, maxInsights);
  const hasMoreInsights = insights.length > maxInsights;

  const handleActionClick = (insight: AIInsight) => {
    if (insight.actionable && insight.moduleId) {
      // Navegar para o módulo relevante
      const moduleRoutes: Record<string, string> = {
        'admin-finance': '/dashboard/admin/finance',
        'admin-students': '/dashboard/admin/students',
        'admin-coaches': '/dashboard/admin/coaches',
        'admin-requests': '/dashboard/admin/requests',
        'admin-settings': '/dashboard/admin/settings',
        // Rotas para Coach
        'dashboard-coach': '/dashboard/coach',
        'my-clients': '/dashboard/my-clients',
        'financial': '/dashboard/coach/financeiro',
        'coach-modalidades': '/dashboard/coach/modalidades',
        'coach-planos': '/dashboard/coach/planos',
        'coach-gerenciar-testes': '/dashboard/coach/gerenciar-testes',
        'coach-participantes': '/dashboard/coach/participantes',
        // Rotas para Aluno
        'dashboard-student': '/dashboard/aluno',
        'student-coach': '/dashboard/aluno/treinador',
        'student-events': '/dashboard/aluno/eventos',
        'student-tests': '/dashboard/aluno/testes',
        'student-plan': '/dashboard/aluno/meu-plano',
        'student-payments': '/dashboard/aluno/pagamentos',
      };

      const route = moduleRoutes[insight.moduleId];
      if (route) {
        router.push(route);
        dismissInsight(insight.id);
      }
    }
  };

  return (
    <Box 
      sx={{ 
        width: '100%',
        color: 'white',
      }}
    >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge 
              badgeContent={insights.length} 
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#FF8012',
                  color: '#FFFFFF',
                  animation: insights.length > 0 ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' },
                  },
                },
              }}
            >
              <PsychologyIcon sx={{ color: '#FF8012', fontSize: 28 }} />
            </Badge>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF8012' }}>
                Assistente IA
              </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {insights.length === 0 
                ? 'Monitorando sua plataforma...'
                : `${insights.length} insight(s) disponível(eis)`
              }
            </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Atualizar insights">
              <span>
                <IconButton onClick={refreshInsights} disabled={isLoading} size="small" sx={{ color: 'white' }}>
                  <RefreshIcon sx={{ 
                    animation: isLoading ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }} />
                </IconButton>
              </span>
            </Tooltip>
            
            <IconButton onClick={() => setIsExpanded(!isExpanded)} size="small" sx={{ color: 'white' }}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Loading */}
        {isLoading && (
          <LinearProgress 
            sx={{ 
              mb: 2, 
              borderRadius: 1,
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #6a5acd, #9c27b0)',
              },
            }} 
          />
        )}

        {/* Insights */}
        <Collapse in={isExpanded}>
          {insights.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <LightbulbIcon sx={{ fontSize: 48, color: '#FF8012', opacity: 0.5, mb: 1 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {insights.length === 0 
                  ? 'Monitorando sua plataforma...'
                  : 'Nenhum insight disponível no momento'
                }
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {displayedInsights.map((insight, index) => (
                <Fade key={insight.id} in={true} timeout={300 + index * 100}>
                  <Alert
                    severity={getInsightSeverity(insight.type)}
                    icon={getInsightIcon(insight.type)}
                    sx={{
                      cursor: insight.actionable ? 'pointer' : 'default',
                      '&:hover': insight.actionable ? {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      } : {},
                    }}
                  >
                    <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {insight.title}
                      <Chip 
                        label={`${insight.aiConfidence}% IA`} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getPriorityColor(insight.priority),
                          color: 'white',
                          fontSize: '0.65rem',
                          height: 18,
                        }} 
                      />
                    </AlertTitle>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {insight.message}
                    </Typography>

                    {insight.actionable && insight.recommendedAction && (
                      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          💡 Recomendação: {insight.recommendedAction}
                        </Typography>
                        
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleActionClick(insight)}
                            sx={{ 
                              backgroundColor: '#FF8012',
                              '&:hover': { backgroundColor: '#E67300' },
                              fontSize: '0.7rem',
                              py: 0.5,
                            }}
                          >
                            Ir para módulo
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissInsight(insight.id);
                            }}
                            sx={{ fontSize: '0.7rem', py: 0.5 }}
                          >
                            Dispensar
                          </Button>
                        </Stack>
                      </Box>
                    )}
                  </Alert>
                </Fade>
              ))}

              {hasMoreInsights && (
                <Box sx={{ textAlign: 'center', pt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    + {insights.length - maxInsights} insights adicionais
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </Collapse>
    </Box>
  );
} 