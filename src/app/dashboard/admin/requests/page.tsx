'use client';

import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';

import ProtectedRoute from '../../../../components/ProtectedRoute';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';

function RequestsPageContent() {
  return (
    <Box>
      <PageHeader
        title="Solicitações de Assinatura"
        description="Gerencie as solicitações de pausa e cancelamento de assinaturas dos usuários."
      />
      <Paper sx={{ p: 3, mt: 3, textAlign: 'center' }}>
        <Typography variant="h6">Em Desenvolvimento</Typography>
        <Typography color="text.secondary">
          Esta seção permitirá aprovar ou rejeitar solicitações de pausa e cancelamento de assinaturas.
        </Typography>
      </Paper>
    </Box>
  );
}

export default function RequestsPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return <CircularProgress />;
  }

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user} onLogout={logout}>
        <RequestsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 