'use client';

import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Container, FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField, Typography, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import PageHeader from '@/components/Dashboard/PageHeader';
import { enduranceApi } from '@/services/enduranceApi';
import { LeaveReasonType } from '@/types/api';
import { toast } from 'react-hot-toast';

export default function RequestLeavePage() {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [reasonType, setReasonType] = useState<LeaveReasonType | ''>('');
  const [reasonDescription, setReasonDescription] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [pendingLeave, setPendingLeave] = useState<{
    createdAt: string;
    reasonType: LeaveReasonType;
    reasonDescription?: string;
  } | null>(null);

  const PENDING_LEAVE_STORAGE_KEY = 'pending_leave_request';

  useEffect(() => {
    // Carregar status da assinatura e possível solicitação pendente local
    enduranceApi
      .getActiveSubscription()
      .then((sub) => {
        const status = sub?.status || null;
        setSubscriptionStatus(status);
        // Se licença já está ativa, limpar flag local
        if (status === 'ON_LEAVE') {
          localStorage.removeItem(PENDING_LEAVE_STORAGE_KEY);
          setPendingLeave(null);
        }
      })
      .catch(() => setSubscriptionStatus(null));

    // Ler solicitação pendente salva localmente
    try {
      const stored = localStorage.getItem(PENDING_LEAVE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.reasonType) {
          setPendingLeave(parsed);
        }
      }
    } catch {
      // Ignorar erro de parsing e limpar
      localStorage.removeItem(PENDING_LEAVE_STORAGE_KEY);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonType) {
      return toast.error('Selecione um motivo');
    }
    if (reasonType === LeaveReasonType.OTHER && reasonDescription.trim().length < 5) {
      return toast.error('Descreva o motivo (mínimo 5 caracteres)');
    }
    try {
      setLoading(true);
      await enduranceApi.requestLeave({
        reasonType,
        reasonDescription: reasonDescription.trim() || undefined,
      });
      toast.success('Solicitação de licença enviada! Aguarde análise do administrador.');
      // Salvar solicitação localmente para ocultar o formulário até aprovação
      const payload = {
        createdAt: new Date().toISOString(),
        reasonType: reasonType as LeaveReasonType,
        reasonDescription: reasonDescription.trim() || undefined,
      };
      localStorage.setItem(PENDING_LEAVE_STORAGE_KEY, JSON.stringify(payload));
      setPendingLeave(payload);
    } catch (err) {
      toast.error('Não foi possível enviar a solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>
      <DashboardLayout user={auth.user} onLogout={auth.logout}>
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
          <PageHeader
            title="Solicitar Licença"
            description="Envie uma solicitação informando o motivo. O administrador definirá o período."
          />

          {subscriptionStatus && subscriptionStatus !== 'ACTIVE' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Sua assinatura está com status "{subscriptionStatus}". A aprovação poderá depender deste status.
            </Alert>
          )}

          {pendingLeave && subscriptionStatus !== 'ON_LEAVE' ? (
            <Card>
              <CardContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Sua solicitação de licença foi enviada e está aguardando aprovação do administrador.
                </Alert>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Detalhes da solicitação
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Motivo
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {pendingLeave.reasonType === LeaveReasonType.TRAVEL && 'Viagem'}
                    {pendingLeave.reasonType === LeaveReasonType.ILLNESS && 'Doença'}
                    {pendingLeave.reasonType === LeaveReasonType.FINANCIAL && 'Problemas financeiros'}
                    {pendingLeave.reasonType === LeaveReasonType.OTHER && 'Outro'}
                  </Typography>
                </Box>
                {pendingLeave.reasonDescription && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Descrição
                    </Typography>
                    <Typography variant="body1">{pendingLeave.reasonDescription}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      // Revalidar status no backend
                      try {
                        const sub = await enduranceApi.getActiveSubscription();
                        const status = sub?.status || null;
                        setSubscriptionStatus(status);
                        if (status === 'ON_LEAVE') {
                          localStorage.removeItem(PENDING_LEAVE_STORAGE_KEY);
                          setPendingLeave(null);
                        }
                      } catch {}
                    }}
                  >
                    Atualizar Status
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="reason-type-label">Motivo</InputLabel>
                    <Select
                      labelId="reason-type-label"
                      label="Motivo"
                      value={reasonType}
                      onChange={(e) => setReasonType(e.target.value as LeaveReasonType)}
                      required
                    >
                      <MenuItem value={LeaveReasonType.TRAVEL}>Viagem</MenuItem>
                      <MenuItem value={LeaveReasonType.ILLNESS}>Doença</MenuItem>
                      <MenuItem value={LeaveReasonType.FINANCIAL}>Problemas financeiros</MenuItem>
                      <MenuItem value={LeaveReasonType.OTHER}>Outro</MenuItem>
                    </Select>
                    <FormHelperText>Selecione o motivo principal da solicitação.</FormHelperText>
                  </FormControl>

                  <TextField
                    fullWidth
                    label={reasonType === LeaveReasonType.OTHER ? 'Descreva o motivo (obrigatório)' : 'Descrição (opcional)'}
                    multiline
                    rows={4}
                    value={reasonDescription}
                    onChange={(e) => setReasonDescription(e.target.value)}
                    placeholder="Ex: Viagem a trabalho por 15 dias / Recuperação de procedimento / Ajuste financeiro temporário"
                    required={reasonType === LeaveReasonType.OTHER}
                  />

                  <Box sx={{ mt: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button type="submit" variant="contained" disabled={loading || !reasonType}>
                      {loading ? 'Enviando...' : 'Enviar Solicitação'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          )}
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
}