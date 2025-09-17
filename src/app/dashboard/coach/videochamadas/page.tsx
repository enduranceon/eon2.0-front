'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { UserType, VideoCallStats } from '@/types/api';
import VideoCallList from '@/components/Dashboard/VideoCallList';
import { videoCallService } from '@/services/videoCallService';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CoachVideoChamadasPage() {
  const { user, logout } = useAuth();
  
  const [stats, setStats] = useState<VideoCallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas
      try {
        const statsData = await videoCallService.getVideoCallStats();
        setStats(statsData);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    } catch (error: any) {
      setError('Erro ao carregar dados');
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={['COACH']}>
        <DashboardLayout user={user} onLogout={handleLogout}>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <CircularProgress />
            </Box>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['COACH']}>
      <DashboardLayout user={user} onLogout={handleLogout}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Videochamadas
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gerencie as solicitações de videochamada dos seus alunos
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          )}

          {/* Estatísticas */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                        Total
                      </Typography>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {stats.total}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                        Pendentes
                      </Typography>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {stats.requested}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                        Agendadas
                      </Typography>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {stats.scheduled}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                        Concluídas
                      </Typography>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {stats.completed}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                        Negadas
                      </Typography>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                        {stats.denied}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Métricas adicionais */}
          {stats && (stats.averageResponseTime || stats.averageDuration) && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {stats.averageResponseTime && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">Tempo Médio de Resposta</Typography>
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                        {Math.round(stats.averageResponseTime)} min
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tempo médio para responder solicitações
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {stats.averageDuration && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">Duração Média</Typography>
                      </Box>
                      <Typography variant="h3" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                        {Math.round(stats.averageDuration)} min
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duração média das videochamadas
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}

          {/* Lista de Videochamadas */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Videochamadas dos Alunos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gerencie todas as solicitações de videochamada
                </Typography>
              </Box>
              
              <VideoCallList
                userType={UserType.COACH}
                currentUser={user}
                onRefresh={loadInitialData}
              />
            </CardContent>
          </Card>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
}