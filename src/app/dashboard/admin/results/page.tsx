'use client';

import React, { useState } from 'react';
import { Box, Paper, Typography, CircularProgress, Tabs, Tab } from '@mui/material';

import ProtectedRoute from '../../../../components/ProtectedRoute';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`results-tabpanel-${index}`}
      aria-labelledby={`results-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function ResultsPageContent() {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box>
      <PageHeader
        title="Resultados"
        description="Visualize os resultados de testes e provas dos usuários."
      />
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Abas de resultados">
            <Tab label="Resultados de Testes" id="results-tab-0" />
            <Tab label="Resultados de Provas" id="results-tab-1" />
          </Tabs>
        </Box>
        <TabPanel value={tabIndex} index={0}>
          <Typography variant="h6">Resultados de Testes</Typography>
          <Typography color="text.secondary">
            Em breve: Uma lista com os resultados dos testes de todos os usuários.
          </Typography>
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <Typography variant="h6">Resultados de Provas (Eventos)</Typography>
           <Typography color="text.secondary">
            Em breve: Uma lista com os resultados de provas (eventos) de todos os usuários.
          </Typography>
        </TabPanel>
      </Paper>
    </Box>
  );
}

export default function ResultsPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user} onLogout={logout}>
        <ResultsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 