'use client';

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Description as DocumentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  History as HistoryIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { consentService } from '../../services/consentService';
import { ConsentViewResponse } from '../../types/api';

interface ConsentViewProps {
  userId: string;
}

export default function ConsentView({ userId }: ConsentViewProps) {
  const [consentData, setConsentData] = useState<ConsentViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termDialogOpen, setTermDialogOpen] = useState(false);

  useEffect(() => {
    loadConsentData();
  }, [userId]);

  const loadConsentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await consentService.getConsentView();
      setConsentData(data);
    } catch (err) {
      console.error('Erro ao carregar dados do termo:', err);
      setError('Erro ao carregar informações do termo de aceite');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (hasAccepted: boolean) => {
    return hasAccepted ? 'success' : 'warning';
  };

  const getStatusText = (hasAccepted: boolean) => {
    return hasAccepted ? 'Aceito' : 'Pendente';
  };

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Carregando informações do termo...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={loadConsentData}>
          Tentar Novamente
        </Button>
      </Paper>
    );
  }

  if (!consentData) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="info">
          Nenhuma informação de termo de aceite encontrada.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <DocumentIcon sx={{ mr: 2, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight="bold">
          Termo de Aceite
        </Typography>
      </Box>

      {/* Status do Aceite */}
      <Card sx={{ mb: 3, bgcolor: consentData.hasAcceptedLatestTerm ? 'success.light' : 'warning.light' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {consentData.hasAcceptedLatestTerm ? (
                <CheckCircleIcon sx={{ mr: 2, color: 'success.main' }} />
              ) : (
                <WarningIcon sx={{ mr: 2, color: 'warning.main' }} />
              )}
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Status do Termo Atual
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Versão {consentData.currentTerm.version} - {formatDate(consentData.currentTerm.createdAt)}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={getStatusText(consentData.hasAcceptedLatestTerm)}
              color={getStatusColor(consentData.hasAcceptedLatestTerm)}
              variant="filled"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Informações do Termo Atual */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Termo Atual
            </Typography>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => setTermDialogOpen(true)}
            >
              Visualizar Conteúdo
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Versão: {consentData.currentTerm.version}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Criado em: {formatDate(consentData.currentTerm.createdAt)}
          </Typography>
        </CardContent>
      </Card>

      {/* Histórico de Aceites */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 2 }} />
            <Typography variant="h6">
              Histórico de Aceites ({consentData.totalConsents})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {consentData.consentHistory.length === 0 ? (
            <Alert severity="info">
              Nenhum aceite registrado ainda.
            </Alert>
          ) : (
            <List>
              {consentData.consentHistory.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Versão ${item.version}`}
                      secondary={
                        <React.Fragment>
                          <span style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                            Aceito em: {formatDate(item.acceptedAt)}
                          </span>
                          {item.ipAddress && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.6)' }}>
                              IP: {item.ipAddress}
                            </span>
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < consentData.consentHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Informações Adicionais */}
      {consentData.lastAcceptedAt && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <InfoIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
            Último aceite: {formatDate(consentData.lastAcceptedAt)}
          </Typography>
        </Box>
      )}

      {/* Dialog para visualizar o conteúdo do termo */}
      <Dialog
        open={termDialogOpen}
        onClose={() => setTermDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DocumentIcon sx={{ mr: 2 }} />
            Termo de Aceite - Versão {consentData.currentTerm.version}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            maxHeight: '60vh', 
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            p: 2,
            bgcolor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.300'
          }}>
            {consentData.currentTerm.content}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTermDialogOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
