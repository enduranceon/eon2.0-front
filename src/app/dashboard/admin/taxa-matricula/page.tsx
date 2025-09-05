'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../../contexts/AuthContext';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { enduranceApi } from '../../../../services/enduranceApi';
import { EnrollmentFee, CreateEnrollmentFeeRequest, UpdateEnrollmentFeeRequest } from '../../../../types/api';

function TaxaMatriculaPageContent() {
  const { enqueueSnackbar } = useSnackbar();
  const [enrollmentFees, setEnrollmentFees] = useState<EnrollmentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFee, setEditingFee] = useState<EnrollmentFee | null>(null);
  const [formData, setFormData] = useState<CreateEnrollmentFeeRequest>({
    name: '',
    description: '',
    amount: 0,
    isActive: true,
  });

  useEffect(() => {
    loadEnrollmentFees();
  }, []);

  const loadEnrollmentFees = async () => {
    try {
      setLoading(true);
      const data = await enduranceApi.getEnrollmentFees({ includeInactive: true });
      setEnrollmentFees(data);
    } catch (error) {
      console.error('Erro ao carregar taxas de matrícula:', error);
      enqueueSnackbar('Erro ao carregar taxas de matrícula', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (fee?: EnrollmentFee) => {
    if (fee) {
      setEditingFee(fee);
      setFormData({
        name: fee.name,
        description: fee.description || '',
        amount: fee.amount,
        isActive: fee.isActive,
      });
    } else {
      setEditingFee(null);
      setFormData({
        name: '',
        description: '',
        amount: 0,
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingFee(null);
  };

  const handleSave = async () => {
    try {
      if (editingFee) {
        const updateData: UpdateEnrollmentFeeRequest = {
          name: formData.name,
          description: formData.description,
          amount: formData.amount,
          isActive: formData.isActive,
        };
        await enduranceApi.updateEnrollmentFee(editingFee.id, updateData);
        enqueueSnackbar('Taxa de matrícula atualizada com sucesso!', { variant: 'success' });
      } else {
        await enduranceApi.createEnrollmentFee(formData);
        enqueueSnackbar('Taxa de matrícula criada com sucesso!', { variant: 'success' });
      }
      handleCloseDialog();
      loadEnrollmentFees();
    } catch (error) {
      console.error('Erro ao salvar taxa de matrícula:', error);
      enqueueSnackbar('Erro ao salvar taxa de matrícula', { variant: 'error' });
    }
  };

  const handleToggleStatus = async (fee: EnrollmentFee) => {
    try {
      await enduranceApi.toggleEnrollmentFeeStatus(fee.id);
      enqueueSnackbar(`Taxa de matrícula ${fee.isActive ? 'desativada' : 'ativada'} com sucesso!`, { variant: 'success' });
      loadEnrollmentFees();
    } catch (error) {
      console.error('Erro ao alterar status da taxa de matrícula:', error);
      enqueueSnackbar('Erro ao alterar status da taxa de matrícula', { variant: 'error' });
    }
  };

  const handleDelete = async (fee: EnrollmentFee) => {
    if (window.confirm(`Tem certeza que deseja excluir a taxa de matrícula "${fee.name}"?`)) {
      try {
        await enduranceApi.deleteEnrollmentFee(fee.id);
        enqueueSnackbar('Taxa de matrícula excluída com sucesso!', { variant: 'success' });
        loadEnrollmentFees();
      } catch (error) {
        console.error('Erro ao excluir taxa de matrícula:', error);
        enqueueSnackbar('Erro ao excluir taxa de matrícula', { variant: 'error' });
      }
    }
  };

  const activeFee = enrollmentFees.find(fee => fee.isActive);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Gerenciamento de Taxa de Matrícula
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Taxa
        </Button>
      </Box>

      {/* Taxa Ativa Atual */}
      {activeFee && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Taxa de Matrícula Ativa Atual
          </Typography>
          <Typography variant="body2">
            <strong>{activeFee.name}</strong> - R$ {activeFee.amount.toFixed(2)}
          </Typography>
          {activeFee.description && (
            <Typography variant="body2" color="text.secondary">
              {activeFee.description}
            </Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Estatísticas */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Taxa Ativa</Typography>
              </Box>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {activeFee ? `R$ ${activeFee.amount.toFixed(2)}` : 'Nenhuma'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeFee ? activeFee.name : 'Nenhuma taxa configurada'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Total de Taxas</Typography>
              </Box>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {enrollmentFees.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Taxas cadastradas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Taxas Ativas</Typography>
              </Box>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {enrollmentFees.filter(fee => fee.isActive).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Atualmente ativas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de Taxas */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Criada em</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enrollmentFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {fee.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {fee.description || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        R$ {fee.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fee.isActive ? 'Ativa' : 'Inativa'}
                        color={fee.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(fee.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(fee)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={fee.isActive ? 'Desativar' : 'Ativar'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(fee)}
                          >
                            {fee.isActive ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(fee)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para criar/editar taxa de matrícula */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFee ? 'Editar Taxa de Matrícula' : 'Nova Taxa de Matrícula'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Nome da Taxa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              placeholder="Ex: Taxa de Matrícula Padrão"
            />
            
            <TextField
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="Ex: Taxa cobrada no primeiro pagamento de novos alunos"
            />
            
            <TextField
              label="Valor (R$)"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              fullWidth
              inputProps={{
                min: 0,
                step: 0.01,
              }}
              placeholder="0.00"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Taxa ativa"
            />

            {formData.isActive && activeFee && !editingFee && (
              <Alert severity="warning">
                <Typography variant="body2">
                  Já existe uma taxa ativa: <strong>{activeFee.name}</strong> (R$ {activeFee.amount.toFixed(2)}).
                  Ativar esta taxa irá desativar a taxa atual.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingFee ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function TaxaMatriculaPage() {
  const auth = useAuth();

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={auth.user!} onLogout={auth.logout}>
        <TaxaMatriculaPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
