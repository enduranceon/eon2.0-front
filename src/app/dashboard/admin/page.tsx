'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Group as StudentsIcon,
  EmojiEvents as CoachIcon,
  Subscriptions as PlansIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as FinanceIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import StatsCard from '../../../components/Dashboard/StatsCard';
import { enduranceApi } from '../../../services/enduranceApi';
import { DashboardStats } from '../../../types/api';

export default function AdminDashboard() {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashboardStatsData, coachesData, plansData] = await Promise.all([
        enduranceApi.getDashboardStats(),
        enduranceApi.getCoaches({ limit: 1 }),
        enduranceApi.getPlans(),
      ]);
      setDashboardStats(dashboardStatsData);
      // Apenas para contagem, não precisamos dos dados completos aqui
      // setCoaches(coachesData.data);
      // setPlans(Array.isArray(plansData) ? plansData : plansData?.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do dashboard. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    if (typeof value !== 'number') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={['ADMIN']}>
        <DashboardLayout user={auth.user!} onLogout={auth.logout}>
          <Container maxWidth="xl" sx={{ py: 4 }}>
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
      <ProtectedRoute allowedUserTypes={['ADMIN']}>
        <DashboardLayout user={auth.user!} onLogout={auth.logout}>
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
            <Button variant="contained" onClick={loadDashboardData}>
              Tentar Novamente
            </Button>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={auth.user!} onLogout={auth.logout}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Painel Administrativo
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bem-vindo(a) {auth.user?.name}! Aqui está um resumo da plataforma.
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Total de Usuários"
                value={(dashboardStats?.totalUsers || 0).toLocaleString()}
                subtitle="+12% este mês"
                icon={<StudentsIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Receita Mensal"
                value={formatCurrency(dashboardStats?.monthlyRevenue || 0)}
                subtitle="+8.5% vs mês anterior"
                icon={<FinanceIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Coaches Ativos"
                value={(dashboardStats?.activeCoaches || 0).toString()}
                subtitle=" "
                icon={<CoachIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard
                title="Assinaturas Ativas"
                value={(dashboardStats?.activeSubscriptions || 0).toString()}
                subtitle=" "
                icon={<PlansIcon />}
              />
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumo Executivo da Plataforma
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Métricas Principais
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><TrendingUpIcon color="success" /></ListItemIcon>
                      <ListItemText 
                        primary={`Receita total: ${formatCurrency(dashboardStats?.totalRevenue || 0)}`}
                        secondary="Receita acumulada na plataforma"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><StudentsIcon color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary={`${dashboardStats?.totalUsers || 0} usuários ativos`}
                        secondary={`${dashboardStats?.activeSubscriptions || 0} assinaturas ativas`}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Status da Plataforma
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary={`${dashboardStats?.pendingPayments || 0} pagamentos pendentes`}
                        secondary="Acompanhe na seção Financeiro"
                      />
                    </ListItem>
                     <ListItem>
                      <ListItemText 
                        primary={`${dashboardStats?.activeCoaches || 0} treinadores ativos`}
                        secondary="Gerencie na seção de Coaches"
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 