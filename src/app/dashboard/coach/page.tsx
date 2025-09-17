'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  School as StudentsIcon,
  AttachMoney as EarningsIcon,
  EmojiEvents as EventsIcon,
  Quiz as TestIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  PieChart as PieChartIcon,
  Subscriptions as SubscriptionsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { UserType } from '../../../types/api';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { enduranceApi } from '../../../services/enduranceApi';

interface CoachAnalytics {
  totalStudents: number;
  activeSubscriptions: number;
  newStudents?: number;
  examParticipations: number;
  testResults: number;
  modalidadeStats?: Record<string, { students?: number; activeSubscriptions?: number } | number>;
  planStats?: Record<string, number>;
  summary?: {
    totalStudents?: number;
    examParticipations?: number;
    testResults?: number;
  };
  distribution?: {
    byModalidade?: Record<string, number>;
    byPlan?: Record<string, number>;
  };
  recentActivities?: Array<{
    id: string;
    studentName?: string;
    modalidade?: string;
    plan?: string;
    period?: string;
    startDate?: string;
    status?: string;
    planChanged?: boolean;
    planChangedAt?: string;
    changeType?: string;
    planChangeInfo?: {
      previousPlan?: string;
      newPlan?: string;
      previousPeriod?: string;
      newPeriod?: string;
    } | null;
  }>;
}

export default function CoachDashboard() {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<CoachAnalytics | null>(null);
  const [financialSummary, setFinancialSummary] = useState<{
    totalEarnings: number;
    monthlyEarnings: number;
    yearlyEarnings: number;
    pendingPayments: number;
  } | null>(null);
  const [totals, setTotals] = useState<{
    totalStudents: number;
    activeStudents: number;
    totalExams: number;
  }>({ totalStudents: 0, activeStudents: 0, totalExams: 0 });

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      router.push('/login');
      return;
    }

    if (auth.user.userType !== UserType.COACH) {
      if (auth.user.userType === UserType.ADMIN) {
        router.push('/dashboard/admin');
      } else if (auth.user.userType === UserType.FITNESS_STUDENT) {
        router.push('/dashboard/aluno');
      } else {
        router.push('/login');
      }
      return;
    }

    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isAuthenticated, auth.user, router]);

  const loadDashboardData = async () => {
    if (!auth.user) return;

    setLoading(true);
    setError(null);
    try {
      const [coachStudents, coachExams, summary, anal] = await Promise.all([
        enduranceApi.getCoachStudents().catch(() => ({ data: [], pagination: { total: 0 } })),
        enduranceApi.getCoachExams().catch(() => ({ pagination: { total: 0 } })),
        enduranceApi.getCoachFinancialSummary().catch(() => ({
          totalEarnings: 0,
          monthlyEarnings: 0,
          yearlyEarnings: 0,
          pendingPayments: 0,
        })),
        enduranceApi.getCoachAnalytics().catch(() => ({
          totalStudents: 0,
          activeSubscriptions: 0,
          newStudents: 0,
          examParticipations: 0,
          testResults: 0,
          modalidadeStats: {},
          planStats: {},
          distribution: { byModalidade: {}, byPlan: {} },
          recentActivities: [],
        })),
      ]);

      setTotals({
        totalStudents: coachStudents?.total || coachStudents?.pagination?.total || coachStudents?.data?.length || 0,
        activeStudents:
          (coachStudents?.students || coachStudents?.data || []).filter((s: any) => s.status === 'ACTIVE').length || 0,
        totalExams: coachExams?.pagination?.total || 0,
      });
      setFinancialSummary({
        totalEarnings: summary.totalEarnings || 0,
        monthlyEarnings: summary.monthlyEarnings || 0,
        yearlyEarnings: summary.yearlyEarnings || 0,
        pendingPayments: summary.pendingPayments || 0,
      });
      setAnalytics(anal as CoachAnalytics);
    } catch (err) {
      console.error('Erro ao carregar dados do coach:', err);
      setError('Falha ao carregar os dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const distributionByModalidade = useMemo(() => {
    const dist = analytics?.distribution?.byModalidade || {};
    if (Object.keys(dist).length === 0 && analytics?.modalidadeStats) {
      // fallback: somar alunos por modalidade
      const fallback: Record<string, number> = {};
      Object.entries(analytics.modalidadeStats).forEach(([key, val]) => {
        if (typeof val === 'number') fallback[key] = val;
        else fallback[key] = (val?.students as number) || 0;
      });
      return fallback;
    }
    return dist;
  }, [analytics]);

  const distributionByPlan = useMemo(() => {
    return analytics?.distribution?.byPlan || analytics?.planStats || {};
  }, [analytics]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const translateStatus = (status?: string) => {
    if (!status) return '—';
    switch (status) {
      case 'ACTIVE': return 'Ativa';
      case 'INACTIVE': return 'Inativa';
      case 'CANCELLED': return 'Cancelada';
      case 'EXPIRED': return 'Expirada';
      default: return status;
    }
  };

  const translatePeriod = (period?: string) => {
    switch (period) {
      case 'WEEKLY': return 'Semanal';
      case 'BIWEEKLY': return 'Quinzenal';
      case 'MONTHLY': return 'Mensal';
      case 'QUARTERLY': return 'Trimestral';
      case 'SEMIANNUALLY': return 'Semestral';
      case 'YEARLY': return 'Anual';
      default: return period || '—';
    }
  };

  const getActivityIcon = (changeType?: string) => {
    switch (changeType) {
      case 'PLAN_CHANGED':
        return <SubscriptionsIcon color="primary" />;
      default:
        return <StudentsIcon color="primary" />;
    }
  };

  const handleLogout = () => auth.logout();

  if (!auth.user) return null;

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={['COACH']}>
        <DashboardLayout user={auth.user} onLogout={handleLogout}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <CircularProgress size={60} />
            </Box>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedUserTypes={['COACH']}>
        <DashboardLayout user={auth.user} onLogout={handleLogout}>
          <Container maxWidth="xl">
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            <Button variant="contained" onClick={loadDashboardData} startIcon={<RefreshIcon />}>Recarregar</Button>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['COACH']}>
      <DashboardLayout user={auth.user} onLogout={handleLogout}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" fontWeight="bold">Painel do Treinador</Typography>
              <Typography variant="body2" color="text.secondary">
                Bem-vindo(a) {auth.user?.name}. Acompanhe seus alunos, ganhos e atividades recentes.
              </Typography>
            </Box>
            <Box>
              <IconButton onClick={loadDashboardData} color="primary" aria-label="Atualizar">
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>

          {/* KPIs */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <StudentsIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">Alunos Totais</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">{analytics?.totalStudents || totals.totalStudents}</Typography>
                  <Chip size="small" color="primary" icon={<SubscriptionsIcon />} label={`${analytics?.activeSubscriptions || totals.activeStudents} ativos`} sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EarningsIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">Ganhos do Mês</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">{formatCurrency(financialSummary?.monthlyEarnings || 0)}</Typography>
                  <Typography variant="caption" color="text.secondary">Total: {formatCurrency(financialSummary?.totalEarnings || 0)} • Pendentes: {formatCurrency(financialSummary?.pendingPayments || 0)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventsIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary">Participações em Provas</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">{analytics?.examParticipations || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">Resultados de Testes: {analytics?.testResults || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Distribuições */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Distribuição por Modalidade</Typography>
                    <PieChartIcon color="primary" />
                  </Box>
                  {Object.keys(distributionByModalidade).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Sem dados suficientes.</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {Object.entries(distributionByModalidade).map(([name, count]) => {
                        const total = Object.values(distributionByModalidade).reduce((acc, v) => acc + (v as number), 0);
                        const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                        return (
                          <Box key={name}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">{name}</Typography>
                              <Typography variant="body2" fontWeight="bold">{count as number}</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4 }} />
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Distribuição por Plano</Typography>
                    <TrendingUpIcon color="secondary" />
                  </Box>
                  {Object.keys(distributionByPlan).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">Sem dados suficientes.</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {Object.entries(distributionByPlan).map(([name, count]) => {
                        const total = Object.values(distributionByPlan).reduce((acc, v) => acc + (v as number), 0);
                        const pct = total > 0 ? Math.round(((count as number) / total) * 100) : 0;
                        return (
                          <Box key={name}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">{name}</Typography>
                              <Typography variant="body2" fontWeight="bold">{count as number}</Typography>
                            </Box>
                            <LinearProgress color="secondary" variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4 }} />
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Atividades Recentes e Ações Rápidas */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Atividades Recentes</Typography>
                  <Divider sx={{ mb: 2 }} />
                  {analytics?.recentActivities && analytics.recentActivities.length > 0 ? (
                    <List sx={{ pt: 0 }}>
                      {analytics.recentActivities.slice(0, 8).map((act) => {
                        const periodPt = translatePeriod(act.period);
                        const startDatePt = act.startDate ? new Date(act.startDate).toLocaleDateString('pt-BR') : '—';
                        const changedAtPt = act.planChangedAt ? new Date(act.planChangedAt).toLocaleString('pt-BR') : null;
                        const changeLabel = act.changeType === 'PLAN_CHANGED' ? 'Plano alterado' : act.changeType;
                        return (
                          <ListItem key={act.id} sx={{ px: 0, py: 1.25, alignItems: 'flex-start' }}>
                            <ListItemIcon sx={{ mt: 0.5 }}>
                              {getActivityIcon(act.changeType)}
                            </ListItemIcon>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                              <Box sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                                  <Typography variant="subtitle2" fontWeight="bold" component="span">
                                    {act.studentName || 'Aluno(a)'}
                                  </Typography>
                                  {changeLabel && (
                                    <Chip size="small" color="warning" label={changeLabel} />
                                  )}
                                </Box>
                                <Typography variant="body2" color="text.secondary" component="div">
                                  {(act.modalidade || 'Modalidade')} • {(act.plan || 'Plano')}{periodPt ? ` (${periodPt})` : ''}
                                </Typography>
                                {act.planChangeInfo && (
                                  <Typography variant="caption" color="text.secondary" component="div" sx={{ display: 'block' }}>
                                    {`De ${act.planChangeInfo.previousPlan || '—'} (${translatePeriod(act.planChangeInfo.previousPeriod)}) para ${act.planChangeInfo.newPlan || '—'} (${translatePeriod(act.planChangeInfo.newPeriod)})`}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary" component="div" sx={{ display: 'block' }}>
                                  {`Início: ${startDatePt}${changedAtPt ? ` • Atualizado: ${changedAtPt}` : ''}`}
                                </Typography>
                              </Box>
                              <Box sx={{ ml: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                {periodPt && <Chip size="small" variant="outlined" label={periodPt} />}
                                {act.status && <Chip size="small" color="default" label={translateStatus(act.status)} />}
                              </Box>
                            </Box>
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Nenhuma atividade recente encontrada.</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Resumo Financeiro</Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EarningsIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="body2">Mês atual</Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="success.main" sx={{ mb: 2 }}>{formatCurrency(financialSummary?.monthlyEarnings || 0)}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Total</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatCurrency(financialSummary?.totalEarnings || 0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Pendentes</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatCurrency(financialSummary?.pendingPayments || 0)}</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Button fullWidth variant="outlined" onClick={() => router.push('/dashboard/coach/financeiro')}>
                    Ver financeiro completo
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
