'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  DirectionsRun as RunIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { enduranceApi } from '@/services/enduranceApi';
import { LeaveSubscription } from '@/types/api';
import PageHeader from '@/components/Dashboard/PageHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminLeavesPage() {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<LeaveSubscription[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    leave: LeaveSubscription | null;
  }>({ open: false, leave: null });
  const [extendDate, setExtendDate] = useState<Date | null>(null);
  const [extending, setExtending] = useState(false);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      
      const response = await enduranceApi.getLeaves();
      const leavesData = Array.isArray(response) ? response : response.data || [];
      
      
      
      setLeaves(leavesData);
      
    } catch (err) {
      console.error('Erro ao carregar licenças:', err);
      setError('Erro ao carregar licenças ativas.');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateExpired = async () => {
    try {
      setReactivating(true);
      
      await enduranceApi.reactivateExpiredLeaves();
      
      toast.success('Licenças expiradas reativadas com sucesso!');
      loadLeaves(); // Recarregar lista
      
    } catch (error) {
      console.error('Erro ao reativar licenças:', error);
      toast.error('Erro ao reativar licenças expiradas.');
    } finally {
      setReactivating(false);
    }
  };

  const handleViewDetails = (leave: LeaveSubscription) => {
    setDetailsDialog({ open: true, leave });
  };

  const handleCloseDetails = () => {
    setDetailsDialog({ open: false, leave: null });
    setExtendDate(null);
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const days = differenceInDays(end, now);
    return Math.max(0, days);
  };

  const getStatusColor = (leave: LeaveSubscription) => {
    const daysRemaining = calculateDaysRemaining(leave.leaveEndDate!);
    
    if (daysRemaining === 0) return 'error';
    if (daysRemaining <= 3) return 'warning';
    return 'success';
  };

  const getStatusText = (leave: LeaveSubscription) => {
    const daysRemaining = calculateDaysRemaining(leave.leaveEndDate!);
    
    if (daysRemaining === 0) return 'Expirada';
    if (daysRemaining <= 3) return 'Expira em breve';
    return 'Ativa';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getLeaveStats = () => {
    const total = leaves.length;
    const expired = leaves.filter(leave => calculateDaysRemaining(leave.leaveEndDate!) === 0).length;
    const expiringSoon = leaves.filter(leave => {
      const days = calculateDaysRemaining(leave.leaveEndDate!);
      return days > 0 && days <= 3;
    }).length;
    const active = total - expired - expiringSoon;

    return { total, expired, expiringSoon, active };
  };

  const handleExtendLeave = async () => {
    if (!detailsDialog.leave || !extendDate) {
      toast.error('Selecione a nova data de término');
      return;
    }
    try {
      setExtending(true);
      await enduranceApi.extendLeave(detailsDialog.leave.id, {
        newEndDate: extendDate.toISOString(),
        notes: 'Extensão manual pelo administrador',
      });
      toast.success('Período de licença estendido com sucesso!');
      handleCloseDetails();
      loadLeaves();
    } catch (error) {
      console.error('Erro ao estender licença:', error);
      toast.error('Erro ao estender licença.');
    } finally {
      setExtending(false);
    }
  };

  if (!auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const stats = getLeaveStats();

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={auth.user} onLogout={auth.logout}>
        <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
          <PageHeader
            title="Gerenciar Licenças"
            description="Visualize e gerencie as licenças temporárias dos alunos."
          />
          
          {/* Estatísticas */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Licenças
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {stats.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Licenças Ativas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                    {stats.expiringSoon}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Expirando em Breve
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                    {stats.expired}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Licenças Expiradas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Ações */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadLeaves}
              disabled={loading}
            >
              Atualizar
            </Button>
            
            <Button
              variant="outlined"
              color="warning"
              startIcon={<PlayArrowIcon />}
              onClick={handleReactivateExpired}
              disabled={reactivating || stats.expired === 0}
            >
              {reactivating ? 'Reativando...' : `Reativar ${stats.expired} Expiradas`}
            </Button>
          </Box>

          {/* Lista de Licenças */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          ) : leaves.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Nenhuma licença ativa encontrada.
            </Alert>
          ) : (
            <Paper sx={{ mt: 3 }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Usuário</TableCell>
                      <TableCell>Plano</TableCell>
                      <TableCell>Modalidade</TableCell>
                      <TableCell>Início</TableCell>
                      <TableCell>Fim</TableCell>
                      <TableCell>Dias Restantes</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Motivo</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaves.map((leave) => {
                      const daysRemaining = calculateDaysRemaining(leave.leaveEndDate!);
                      
                      return (
                        <TableRow key={leave.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                <PersonIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {leave.user.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {leave.user.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                              <Typography variant="body2">
                                {leave.plan.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <RunIcon sx={{ mr: 1, color: 'secondary.main' }} />
                              <Typography variant="body2">
                                {leave.modalidade.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(leave.leaveStartDate!)}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(leave.leaveEndDate!)}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: daysRemaining === 0 ? 'error.main' : 
                                       daysRemaining <= 3 ? 'warning.main' : 'success.main'
                              }}
                            >
                              {daysRemaining === 0 ? 'Expirada' : `${daysRemaining} dias`}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Chip
                              label={getStatusText(leave)}
                              color={getStatusColor(leave) as any}
                              size="small"
                              icon={daysRemaining === 0 ? <CancelIcon /> : 
                                    daysRemaining <= 3 ? <WarningIcon /> : <CheckCircleIcon />}
                            />
                          </TableCell>
                          
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {leave.leaveReason || '-'}
                            </Typography>
                          </TableCell>
                          
                          <TableCell>
                            <Tooltip title="Ver Detalhes">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(leave)}
                                color="primary"
                              >
                                <CalendarIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Dialog de Detalhes */}
          <Dialog 
            open={detailsDialog.open} 
            onClose={handleCloseDetails}
            maxWidth="md"
            fullWidth
          >
            {detailsDialog.leave && (
              <>
                <DialogTitle>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon sx={{ mr: 1 }} />
                    Detalhes da Licença
                  </Box>
                </DialogTitle>
                <DialogContent>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Informações do Usuário
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ mr: 2 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {detailsDialog.leave.user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {detailsDialog.leave.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Plano
                      </Typography>
                      <Typography variant="body1">
                        {detailsDialog.leave.plan.name}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Modalidade
                      </Typography>
                      <Typography variant="body1">
                        {detailsDialog.leave.modalidade.name}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Data de Início
                      </Typography>
                      <Typography variant="body1">
                        {formatDateTime(detailsDialog.leave.leaveStartDate!)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Data de Fim
                      </Typography>
                      <Typography variant="body1">
                        {formatDateTime(detailsDialog.leave.leaveEndDate!)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Dias de Licença
                      </Typography>
                      <Typography variant="body1">
                        {detailsDialog.leave.leaveDays} dias
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Dias Restantes
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 'bold',
                          color: calculateDaysRemaining(detailsDialog.leave.leaveEndDate!) === 0 ? 'error.main' : 
                                 calculateDaysRemaining(detailsDialog.leave.leaveEndDate!) <= 3 ? 'warning.main' : 'success.main'
                        }}
                      >
                        {calculateDaysRemaining(detailsDialog.leave.leaveEndDate!)} dias
                      </Typography>
                    </Grid>

                    {detailsDialog.leave.leaveReason && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Motivo da Licença
                        </Typography>
                        <Typography variant="body1">
                          {detailsDialog.leave.leaveReason}
                        </Typography>
                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Configurações da Licença
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip
                          label={`Treinos ${detailsDialog.leave.pauseTraining ? 'Pausados' : 'Ativos'}`}
                          color={detailsDialog.leave.pauseTraining ? 'warning' : 'success'}
                          size="small"
                        />
                        <Chip
                          label={`Cobrança ${detailsDialog.leave.pauseBilling ? 'Pausada' : 'Ativa'}`}
                          color={detailsDialog.leave.pauseBilling ? 'warning' : 'success'}
                          size="small"
                        />
                      </Box>
                    </Grid>

                    {/* Extender Licença */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Extender Período
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <DatePicker
                            label="Nova data de término"
                            minDate={detailsDialog.leave.leaveEndDate ? new Date(detailsDialog.leave.leaveEndDate) : undefined}
                            value={extendDate}
                            onChange={(d) => setExtendDate(d)}
                            slotProps={{ textField: { sx: { minWidth: 240 } } }}
                          />
                          <Button
                            variant="contained"
                            onClick={handleExtendLeave}
                            disabled={extending || !extendDate}
                            startIcon={extending ? <CircularProgress size={16} /> : undefined}
                          >
                            {extending ? 'Extendendo...' : 'Estender Licença'}
                          </Button>
                        </Box>
                      </LocalizationProvider>
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDetails}>
                    Fechar
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </Container>
        <Toaster position="top-right" />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 