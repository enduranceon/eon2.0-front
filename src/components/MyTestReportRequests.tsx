'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Description as ReportIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { enduranceApi } from '@/services/enduranceApi';
import { 
  TestReportRequest, 
  TestReportRequestStatus, 
  TestReportRequestType 
} from '@/types/api';

interface MyTestReportRequestsProps {
  onRequestClick?: (request: TestReportRequest) => void;
}

const MyTestReportRequests: React.FC<MyTestReportRequestsProps> = ({
  onRequestClick
}) => {
  const [requests, setRequests] = useState<TestReportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TestReportRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await enduranceApi.getMyTestReportRequests({
        limit: 50
      });
      
      setRequests(response.data || []);
    } catch (err: any) {
      console.error('Erro ao carregar solicitações:', err);
      setError('Erro ao carregar suas solicitações de relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      setCancelling(requestId);
      
      await enduranceApi.cancelTestReportRequest(requestId);
      
      // Recarregar lista
      await loadRequests();
      
      setDetailsOpen(false);
      setSelectedRequest(null);
    } catch (err: any) {
      console.error('Erro ao cancelar solicitação:', err);
      setError(err.response?.data?.message || 'Erro ao cancelar solicitação');
    } finally {
      setCancelling(null);
    }
  };

  const handleCancelPayment = async (requestId: string) => {
    try {
      setCancelling(requestId);
      
      await enduranceApi.cancelTestReportPayment(requestId);
      
      // Recarregar lista
      await loadRequests();
      
      setDetailsOpen(false);
      setSelectedRequest(null);
    } catch (err: any) {
      console.error('Erro ao cancelar pagamento:', err);
      setError(err.response?.data?.message || 'Erro ao cancelar pagamento');
    } finally {
      setCancelling(null);
    }
  };

  const openDetails = (request: TestReportRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedRequest(null);
  };

  const getStatusColor = (status: TestReportRequestStatus) => {
    switch (status) {
      case TestReportRequestStatus.PENDING: return 'warning';
      case TestReportRequestStatus.APPROVED: return 'info';
      case TestReportRequestStatus.REJECTED: return 'error';
      case TestReportRequestStatus.COMPLETED: return 'success';
      case TestReportRequestStatus.CANCELLED: return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: TestReportRequestStatus) => {
    switch (status) {
      case TestReportRequestStatus.PENDING: return 'Pendente';
      case TestReportRequestStatus.APPROVED: return 'Aprovado';
      case TestReportRequestStatus.REJECTED: return 'Rejeitado';
      case TestReportRequestStatus.COMPLETED: return 'Concluído';
      case TestReportRequestStatus.CANCELLED: return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: TestReportRequestStatus) => {
    switch (status) {
      case TestReportRequestStatus.PENDING: return <PendingIcon />;
      case TestReportRequestStatus.APPROVED: return <CheckIcon />;
      case TestReportRequestStatus.REJECTED: return <ErrorIcon />;
      case TestReportRequestStatus.COMPLETED: return <CheckIcon />;
      case TestReportRequestStatus.CANCELLED: return <CancelIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canCancel = (request: TestReportRequest) => {
    return request.status === TestReportRequestStatus.PENDING;
  };

  const canCancelPayment = (request: TestReportRequest) => {
    return request.status === TestReportRequestStatus.PENDING && 
           request.requestType === TestReportRequestType.PAID_PURCHASE &&
           request.asaasPaymentId;
  };

  useEffect(() => {
    loadRequests();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (requests.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Você ainda não possui solicitações de relatório de teste.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReportIcon />
        Minhas Solicitações de Relatório
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Teste</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {request.testResult?.test?.name || 'Teste'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {request.testResult?.test?.type || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={request.requestType === TestReportRequestType.FREE_PREMIUM ? 'Gratuito' : 'Pago'}
                    color={request.requestType === TestReportRequestType.FREE_PREMIUM ? 'success' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(request.status)}
                    label={getStatusText(request.status)}
                    color={getStatusColor(request.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(request.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {request.price ? `R$ ${request.price.toFixed(2)}` : 'Gratuito'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Ver detalhes">
                      <IconButton
                        size="small"
                        onClick={() => openDetails(request)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {canCancel(request) && (
                      <Tooltip title="Cancelar solicitação">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={cancelling === request.id}
                        >
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de Detalhes */}
      <Dialog open={detailsOpen} onClose={closeDetails} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReportIcon />
            <Typography variant="h6">
              Detalhes da Solicitação
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Informações da Solicitação
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        ID da Solicitação
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedRequest.id}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        icon={getStatusIcon(selectedRequest.status)}
                        label={getStatusText(selectedRequest.status)}
                        color={getStatusColor(selectedRequest.status) as any}
                        size="small"
                      />
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tipo
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.requestType === TestReportRequestType.FREE_PREMIUM ? 'Gratuito (Plano Premium)' : 'Pago'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Valor
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedRequest.price ? `R$ ${selectedRequest.price.toFixed(2)}` : 'Gratuito'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Informações do Teste
                  </Typography>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Nome do Teste
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {selectedRequest.testResult?.test?.name || 'N/A'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Tipo do Teste
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.testResult?.test?.type || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  {selectedRequest.reason && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Motivo da Solicitação
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.reason}
                      </Typography>
                    </Box>
                  )}

                  {selectedRequest.adminNotes && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Observações do Treinador
                      </Typography>
                      <Typography variant="body1">
                        {selectedRequest.adminNotes}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Data de Criação
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedRequest.createdAt)}
                      </Typography>
                    </Box>
                    
                    {selectedRequest.approvedAt && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Data de Aprovação
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedRequest.approvedAt)}
                        </Typography>
                      </Box>
                    )}
                    
                    {selectedRequest.completedAt && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Data de Conclusão
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(selectedRequest.completedAt)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* Ações */}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                {canCancel(selectedRequest) && (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    disabled={cancelling === selectedRequest.id}
                    startIcon={cancelling === selectedRequest.id ? <CircularProgress size={20} /> : <CancelIcon />}
                  >
                    {cancelling === selectedRequest.id ? 'Cancelando...' : 'Cancelar Solicitação'}
                  </Button>
                )}
                
                {canCancelPayment(selectedRequest) && (
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => handleCancelPayment(selectedRequest.id)}
                    disabled={cancelling === selectedRequest.id}
                    startIcon={cancelling === selectedRequest.id ? <CircularProgress size={20} /> : <PaymentIcon />}
                  >
                    {cancelling === selectedRequest.id ? 'Cancelando...' : 'Cancelar Pagamento'}
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeDetails}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyTestReportRequests;
