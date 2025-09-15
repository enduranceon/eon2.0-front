'use client';

import React from 'react';
import { Container, Typography, Box, Paper, CircularProgress } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

export default function VideoChamadasPage() {
  const auth = useAuth();

  // Estado de autenticação básico (segue padrão de outras telas do aluno)
  if (auth.isLoading || !auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  return (
    <DashboardLayout user={auth.user!} onLogout={auth.logout} overdueInfo={auth.overdueInfo}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <ConstructionIcon color="warning" sx={{ fontSize: 56, mb: 1 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Página em construção
          </Typography>
          <Typography variant="body1" color="text.secondary">
            A seção de Videochamadas para alunos ainda está em desenvolvimento. Em breve você poderá gerenciar suas videochamadas aqui.
          </Typography>
        </Paper>
      </Container>
    </DashboardLayout>
  );
} 