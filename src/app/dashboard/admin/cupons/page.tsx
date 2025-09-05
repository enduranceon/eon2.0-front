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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Tooltip,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../../contexts/AuthContext';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { enduranceApi } from '../../../../services/enduranceApi';
import { Coupon, CouponType, CreateCouponRequest, UpdateCouponRequest } from '../../../../types/api';

function CuponsPageContent() {
  const { enqueueSnackbar } = useSnackbar();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CreateCouponRequest>({
    code: '',
    name: '',
    description: '',
    type: CouponType.FIXED_AMOUNT,
    value: 0,
    isActive: true,
    usageLimit: 100,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await enduranceApi.getCoupons({ includeInactive: true });
      setCoupons(data);
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      enqueueSnackbar('Erro ao carregar cupons', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        type: coupon.type,
        value: coupon.value,
        isActive: coupon.isActive,
        usageLimit: coupon.usageLimit || 100,
        validFrom: coupon.validFrom.split('T')[0],
        validUntil: coupon.validUntil.split('T')[0],
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        type: CouponType.FIXED_AMOUNT,
        value: 0,
        isActive: true,
        usageLimit: 100,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCoupon(null);
  };

  const handleSave = async () => {
    try {
      if (editingCoupon) {
        const updateData: UpdateCouponRequest = {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          value: formData.value,
          isActive: formData.isActive,
          usageLimit: formData.usageLimit,
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil).toISOString(),
        };
        await enduranceApi.updateCoupon(editingCoupon.id, updateData);
        enqueueSnackbar('Cupom atualizado com sucesso!', { variant: 'success' });
      } else {
        const createData: CreateCouponRequest = {
          ...formData,
          validFrom: new Date(formData.validFrom).toISOString(),
          validUntil: new Date(formData.validUntil).toISOString(),
        };
        await enduranceApi.createCoupon(createData);
        enqueueSnackbar('Cupom criado com sucesso!', { variant: 'success' });
      }
      handleCloseDialog();
      loadCoupons();
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      enqueueSnackbar('Erro ao salvar cupom', { variant: 'error' });
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await enduranceApi.toggleCouponStatus(coupon.id);
      enqueueSnackbar(`Cupom ${coupon.isActive ? 'desativado' : 'ativado'} com sucesso!`, { variant: 'success' });
      loadCoupons();
    } catch (error) {
      console.error('Erro ao alterar status do cupom:', error);
      enqueueSnackbar('Erro ao alterar status do cupom', { variant: 'error' });
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (window.confirm(`Tem certeza que deseja excluir o cupom "${coupon.name}"?`)) {
      try {
        await enduranceApi.deleteCoupon(coupon.id);
        enqueueSnackbar('Cupom excluído com sucesso!', { variant: 'success' });
        loadCoupons();
      } catch (error) {
        console.error('Erro ao excluir cupom:', error);
        enqueueSnackbar('Erro ao excluir cupom', { variant: 'error' });
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar('Código copiado!', { variant: 'success' });
  };

  const getCouponTypeLabel = (type: CouponType) => {
    switch (type) {
      case CouponType.FIXED_AMOUNT:
        return 'Valor Fixo (Primeiro Pagamento)';
      case CouponType.PERCENTAGE_AMOUNT:
        return 'Porcentagem (Primeiro Pagamento)';
      case CouponType.FIXED_SUBSCRIPTION:
        return 'Valor Fixo (Assinatura)';
      case CouponType.PERCENTAGE_SUBSCRIPTION:
        return 'Porcentagem (Assinatura)';
      case CouponType.FREE_ENROLLMENT:
        return 'Taxa de Matrícula Gratuita';
      default:
        return type;
    }
  };

  const formatValue = (coupon: Coupon) => {
    if (coupon.type === CouponType.FREE_ENROLLMENT) {
      return 'Gratuita';
    }
    if (coupon.type === CouponType.PERCENTAGE_AMOUNT || coupon.type === CouponType.PERCENTAGE_SUBSCRIPTION) {
      return `${coupon.value}%`;
    }
    return `R$ ${coupon.value.toFixed(2)}`;
  };

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
          Gerenciamento de Cupons
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Cupom
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Uso</TableCell>
                  <TableCell>Validade</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {coupon.code}
                        </Typography>
                        <Tooltip title="Copiar código">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(coupon.code)}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{coupon.name}</Typography>
                      {coupon.description && (
                        <Typography variant="caption" color="text.secondary">
                          {coupon.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getCouponTypeLabel(coupon.type)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatValue(coupon)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={coupon.isActive ? 'Ativo' : 'Inativo'}
                        color={coupon.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {coupon.usedCount} / {coupon.usageLimit || '∞'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(coupon.validFrom).toLocaleDateString()} - {new Date(coupon.validUntil).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(coupon)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={coupon.isActive ? 'Desativar' : 'Ativar'}>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleStatus(coupon)}
                          >
                            {coupon.isActive ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(coupon)}
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

      {/* Dialog para criar/editar cupom */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Código do Cupom"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              fullWidth
              disabled={!!editingCoupon}
              helperText={editingCoupon ? 'Código não pode ser alterado' : 'Digite o código que será usado no checkout'}
            />
            
            <TextField
              label="Nome do Cupom"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            
            <TextField
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            
            <FormControl fullWidth>
              <InputLabel>Tipo de Cupom</InputLabel>
              <Select
                value={formData.type}
                label="Tipo de Cupom"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as CouponType })}
              >
                <MenuItem value={CouponType.FIXED_AMOUNT}>Valor Fixo (Primeiro Pagamento)</MenuItem>
                <MenuItem value={CouponType.PERCENTAGE_AMOUNT}>Porcentagem (Primeiro Pagamento)</MenuItem>
                <MenuItem value={CouponType.FIXED_SUBSCRIPTION}>Valor Fixo (Assinatura)</MenuItem>
                <MenuItem value={CouponType.PERCENTAGE_SUBSCRIPTION}>Porcentagem (Assinatura)</MenuItem>
                <MenuItem value={CouponType.FREE_ENROLLMENT}>Taxa de Matrícula Gratuita</MenuItem>
              </Select>
            </FormControl>
            
            {formData.type !== CouponType.FREE_ENROLLMENT && (
              <TextField
                label={formData.type.includes('PERCENTAGE') ? 'Porcentagem (%)' : 'Valor (R$)'}
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                fullWidth
                inputProps={{
                  min: 0,
                  max: formData.type.includes('PERCENTAGE') ? 100 : undefined,
                  step: formData.type.includes('PERCENTAGE') ? 1 : 0.01,
                }}
              />
            )}
            
            <TextField
              label="Limite de Uso"
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
              fullWidth
              inputProps={{ min: 0 }}
              helperText="Deixe em branco para uso ilimitado"
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Válido de"
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              
              <TextField
                label="Válido até"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              }
              label="Cupom ativo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            {editingCoupon ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function CuponsPage() {
  const auth = useAuth();

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={auth.user!} onLogout={auth.logout}>
        <CuponsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
