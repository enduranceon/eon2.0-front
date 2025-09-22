'use client';

import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';
import NotificationSettingsCard from '../../../../components/NotificationSettings/NotificationSettingsCard';

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user!} onLogout={logout}>
        <Container maxWidth="xl">
          <PageHeader
            title="Configurações"
            description="Gerencie as configurações gerais da plataforma."
          />
          
          {/* Configurações de Notificações */}
          <NotificationSettingsCard />
          
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6">Configurações Gerais</Typography>
            <Typography color="text.secondary">
              Esta seção está em desenvolvimento. Em breve, você poderá ajustar parâmetros e configurações da plataforma.
            </Typography>
          </Paper>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 