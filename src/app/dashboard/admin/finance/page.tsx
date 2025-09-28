'use client';

import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress, Tabs, Tab, Container } from '@mui/material';

import ProtectedRoute from '../../../../components/ProtectedRoute';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';
import FinancialDataTable from '../../../../components/Dashboard/Admin/FinancialDataTable';
import FinancialSummaryCards from '../../../../components/Dashboard/Admin/FinancialSummaryCards';
import CoachEarningsTable from '../../../../components/Dashboard/Admin/CoachEarningsTable';

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
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
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

const TABS_CONFIG = [
  { label: "Entradas", endpoint: "/financial", component: "FinancialDataTable" },
  { label: "Recebidos", endpoint: "/financial/received", component: "FinancialDataTable" },
  { label: "Ganhos dos Treinadores", endpoint: "coach-earnings", component: "CoachEarningsTable" },
  { label: "Ganhos da Plataforma", endpoint: "/financial/platform-earnings", component: "FinancialDataTable" },
  { label: "Pendentes", endpoint: "/financial/pending", component: "FinancialDataTable" },
  { label: "Atrasados", endpoint: "/financial/overdue", component: "FinancialDataTable" },
];

function FinancePageContent() {
  const [tabIndex, setTabIndex] = useState(0);
  const [currentFilters, setCurrentFilters] = useState<{
    coachId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }>({});
  const [isReady, setIsReady] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Garantir que o componente está pronto antes de renderizar
  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Módulo Financeiro"
        description="Visualize e gerencie todos os dados financeiros da plataforma."
      />
      <FinancialSummaryCards onCardClick={setTabIndex} />
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange} 
            aria-label="Abas de finanças"
            variant="scrollable"
            scrollButtons="auto"
          >
            {TABS_CONFIG.map((tab, index) => (
              <Tab label={tab.label} id={`financial-tab-${index}`} key={tab.endpoint} />
            ))}
          </Tabs>
        </Box>
        {TABS_CONFIG.map((tab, index) => (
          <TabPanel value={tabIndex} index={index} key={tab.endpoint}>
            {tab.component === "CoachEarningsTable" ? (
              <CoachEarningsTable />
            ) : (
              <FinancialDataTable endpoint={tab.endpoint} tableTitle={tab.label} />
            )}
          </TabPanel>
        ))}
      </Paper>
    </Box>
  );
}

export default function FinancePage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user} onLogout={logout}>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <FinancePageContent />
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 