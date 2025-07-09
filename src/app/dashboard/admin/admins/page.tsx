'use client';

import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';

export default function AdminAdminsPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user!} onLogout={logout}>
        <Container maxWidth="xl">
          <PageHeader
            title="Administradores"
            description="Gerencie os administradores da plataforma."
          />
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6">Gerenciamento de Administradores</Typography>
            <Typography color="text.secondary">
              Esta seção está em desenvolvimento. Em breve, você poderá adicionar, editar e remover administradores.
            </Typography>
          </Paper>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 