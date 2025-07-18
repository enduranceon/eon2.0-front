'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Container,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Pause as PauseIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';
import { subscriptionService, SubscriptionRequest } from '../../../../services/subscriptionService';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function RequestsPageContent() {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const statusFilters = ['PENDING', 'APPROVED', 'REJECTED'] as const;
  const currentStatus = statusFilters[tabValue];

  useEffect(() => {
    fetchRequests();
  }, [tabValue]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionService.getSubscriptionRequests(currentStatus);
      // Garantir que data seja sempre um array
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
      setError('Erro ao carregar solicitações');
      // Garantir que requests seja um array vazio em caso de erro
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (request: SubscriptionRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes('');
    setActionModalOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      setActionLoading(selectedRequest.id);
      
      if (actionType === 'approve') {
        if (selectedRequest.type === 'PAUSE') {
          await subscriptionService.approvePause(selectedRequest.id, { adminNotes });
        } else {
          await subscriptionService.approveCancel(selectedRequest.id, { adminNotes });
        }
        toast.success('Solicitação aprovada com sucesso!');
      } else {
        await subscriptionService.rejectRequest(selectedRequest.id, { adminNotes });
        toast.success('Solicitação rejeitada com sucesso!');
      }

      setActionModalOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      toast.error('Erro ao processar solicitação');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'PAUSE' ? <PauseIcon /> : <CancelIcon />;
  };

  const getTypeLabel = (type: string) => {
    return type === 'PAUSE' ? 'Pausa' : 'Cancelamento';
  };

  // Garantir que requests seja sempre um array antes de filtrar
  const filteredRequests = Array.isArray(requests) ? 
    requests.filter(request => request.status === currentStatus) : 
    [];

  return (
    <Box>
      <PageHeader
        title="Solicitações de Assinatura"
        description="Gerencie as solicitações de pausa e cancelamento de assinaturas dos usuários."
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} variant="fullWidth">
          <Tab label="Pendentes" />
          <Tab label="Aprovadas" />
          <Tab label="Rejeitadas" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              {filteredRequests.length === 0 ? (
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  Nenhuma solicitação pendente.
                </Typography>
              ) : (
                <List>
                  {filteredRequests.map((request) => (
                    <React.Fragment key={request.id}>
                      <ListItem sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          {getTypeIcon(request.type)}
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6">{request.user.name}</Typography>
                              <Chip 
                                label={getTypeLabel(request.type)} 
                                size="small"
                                color={request.type === 'PAUSE' ? 'warning' : 'error'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Plano:</strong> {request.subscription.plan.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Motivo:</strong> {request.reason}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Data:</strong> {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              color="success"
                              onClick={() => handleAction(request, 'approve')}
                              disabled={actionLoading === request.id}
                            >
                              <ApproveIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleAction(request, 'reject')}
                              disabled={actionLoading === request.id}
                            >
                              <RejectIcon />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {filteredRequests.length === 0 ? (
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  Nenhuma solicitação aprovada.
                </Typography>
              ) : (
                <List>
                  {filteredRequests.map((request) => (
                    <React.Fragment key={request.id}>
                      <ListItem sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          {getTypeIcon(request.type)}
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6">{request.user.name}</Typography>
                              <Chip 
                                label={getTypeLabel(request.type)} 
                                size="small"
                                color={request.type === 'PAUSE' ? 'warning' : 'error'}
                              />
                              <Chip label="Aprovado" size="small" color="success" />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Plano:</strong> {request.subscription.plan.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Motivo:</strong> {request.reason}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Data:</strong> {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}
                              </Typography>
                              {request.adminNotes && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Notas do Admin:</strong> {request.adminNotes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {filteredRequests.length === 0 ? (
                <Typography variant="body1" color="text.secondary" textAlign="center">
                  Nenhuma solicitação rejeitada.
                </Typography>
              ) : (
                <List>
                  {filteredRequests.map((request) => (
                    <React.Fragment key={request.id}>
                      <ListItem sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          {getTypeIcon(request.type)}
                        </Box>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="h6">{request.user.name}</Typography>
                              <Chip 
                                label={getTypeLabel(request.type)} 
                                size="small"
                                color={request.type === 'PAUSE' ? 'warning' : 'error'}
                              />
                              <Chip label="Rejeitado" size="small" color="error" />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Plano:</strong> {request.subscription.plan.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Motivo:</strong> {request.reason}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Data:</strong> {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm')}
                              </Typography>
                              {request.adminNotes && (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Notas do Admin:</strong> {request.adminNotes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </TabPanel>
          </>
        )}
      </Paper>

      {/* Modal de Confirmação */}
      <Dialog open={actionModalOpen} onClose={() => setActionModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Aprovar' : 'Rejeitar'} Solicitação
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Usuário:</strong> {selectedRequest.user.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Tipo:</strong> {getTypeLabel(selectedRequest.type)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Motivo:</strong> {selectedRequest.reason}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="Notas do Administrador"
            multiline
            rows={3}
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Adicione observações sobre sua decisão..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionModalOpen(false)}>Cancelar</Button>
          <Button
            onClick={confirmAction}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            disabled={actionLoading !== null}
          >
            {actionLoading ? 'Processando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function RequestsPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user} onLogout={logout}>
        <Container maxWidth="xl">
          <RequestsPageContent />
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 