'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Fade,
  Grow,
  Zoom,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../../contexts/AuthContext';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { enduranceApi } from '../../../../services/enduranceApi';
import { 
  Feature, 
  FeatureStatus, 
  CreateFeatureRequest, 
  UpdateFeatureRequest, 
  FeatureFilters,
  FeaturesResponse 
} from '../../../../types/api';
import toast from 'react-hot-toast';

export default function AdminFeaturesPage() {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<FeatureFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
    isActive: undefined,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState<CreateFeatureRequest>({
    name: '',
    description: '',
    value: 0,
    quantity: undefined,
    validUntil: undefined,
    status: FeatureStatus.ACTIVE,
    isActive: true,
  });

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const response = await enduranceApi.getFeatures(filters);
      setFeatures(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Erro ao carregar features:', error);
      toast.error('Erro ao carregar features');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFeatures();
    setIsRefreshing(false);
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof FeatureFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
  };

  const handleCreateFeature = async () => {
    try {
      await enduranceApi.createFeature(formData);
      toast.success('Feature criada com sucesso!');
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        value: 0,
        quantity: undefined,
        validUntil: undefined,
        status: FeatureStatus.ACTIVE,
        isActive: true,
      });
      await loadFeatures();
    } catch (error) {
      console.error('Erro ao criar feature:', error);
      toast.error('Erro ao criar feature');
    }
  };

  const handleUpdateFeature = async () => {
    if (!selectedFeature) return;
    
    try {
      await enduranceApi.updateFeature(selectedFeature.id, formData);
      toast.success('Feature atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedFeature(null);
      await loadFeatures();
    } catch (error) {
      console.error('Erro ao atualizar feature:', error);
      toast.error('Erro ao atualizar feature');
    }
  };

  const handleDeleteFeature = async () => {
    if (!selectedFeature) return;
    
    try {
      await enduranceApi.deleteFeature(selectedFeature.id);
      toast.success('Feature excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedFeature(null);
      await loadFeatures();
    } catch (error) {
      console.error('Erro ao excluir feature:', error);
      toast.error('Erro ao excluir feature');
    }
  };

  const handleEditClick = (feature: Feature) => {
    setSelectedFeature(feature);
    setFormData({
      name: feature.name,
      description: feature.description || '',
      value: feature.value,
      quantity: feature.quantity,
      validUntil: feature.validUntil,
      status: feature.status,
      isActive: feature.isActive,
    });
    setIsEditDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteClick = (feature: Feature) => {
    setSelectedFeature(feature);
    setIsDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, feature: Feature) => {
    setAnchorEl(event.currentTarget);
    setSelectedFeature(feature);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFeature(null);
  };

  const getStatusColor = (status: FeatureStatus) => {
    switch (status) {
      case FeatureStatus.ACTIVE:
        return 'success';
      case FeatureStatus.INACTIVE:
        return 'default';
      case FeatureStatus.EXPIRED:
        return 'error';
      case FeatureStatus.DISCONTINUED:
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: FeatureStatus, isActive: boolean) => {
    const baseLabel = (() => {
      switch (status) {
        case FeatureStatus.ACTIVE:
          return 'Ativo';
        case FeatureStatus.INACTIVE:
          return 'Inativo';
        case FeatureStatus.EXPIRED:
          return 'Expirado';
        case FeatureStatus.DISCONTINUED:
          return 'Descontinuado';
        default:
          return status;
      }
    })();
    
    return isActive ? baseLabel : `${baseLabel} (Desativado)`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    loadFeatures();
  }, [filters]);

  if (!auth.user) return null;

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={auth.user} onLogout={auth.logout}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold', background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)', backgroundClip: 'text', color: 'transparent', mb: 1 }}>
                  Gerenciamento de Adicionais
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Gerencie as features e adicionais da plataforma
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <IconButton
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': { backgroundColor: 'primary.dark' },
                  }}
                >
                  <RefreshIcon 
                    sx={{ 
                      transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
                      transition: 'transform 1s linear',
                    }} 
                  />
                </IconButton>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsCreateDialogOpen(true)}
                  sx={{
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                    },
                  }}
                >
                  Nova Feature
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Filtros */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Buscar features..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                      label="Status"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value={FeatureStatus.ACTIVE}>Ativo</MenuItem>
                      <MenuItem value={FeatureStatus.INACTIVE}>Inativo</MenuItem>
                      <MenuItem value={FeatureStatus.EXPIRED}>Expirado</MenuItem>
                      <MenuItem value={FeatureStatus.DISCONTINUED}>Descontinuado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Ativo</InputLabel>
                    <Select
                      value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                      onChange={(e) => handleFilterChange('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
                      label="Ativo"
                    >
                      <MenuItem value="">Todos</MenuItem>
                      <MenuItem value="true">Sim</MenuItem>
                      <MenuItem value="false">Não</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={handleSearch}
                    fullWidth
                  >
                    Filtrar
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tabela de Features */}
          <Card>
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Nome</TableCell>
                          <TableCell>Descrição</TableCell>
                          <TableCell>Valor</TableCell>
                          <TableCell>Quantidade</TableCell>
                          <TableCell>Validade</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Ações</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {features.map((feature) => (
                          <TableRow key={feature.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {feature.name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {feature.description || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold" color="primary">
                                {formatCurrency(feature.value)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {feature.quantity ? feature.quantity : 'Ilimitado'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatDate(feature.validUntil)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(feature.status, feature.isActive)}
                                color={getStatusColor(feature.status) as any}
                                size="small"
                                icon={feature.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                onClick={(e) => handleMenuOpen(e, feature)}
                                size="small"
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {features.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h6" color="text.secondary">
                        Nenhuma feature encontrada
                      </Typography>
                    </Box>
                  )}

                  {/* Paginação */}
                  {pagination.totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        count={pagination.totalPages}
                        page={pagination.page}
                        onChange={handlePageChange}
                        color="primary"
                      />
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Dialog de Criação */}
          <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Criar Nova Feature</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nome"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descrição"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Valor"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Quantidade"
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value ? parseInt(e.target.value) : undefined }))}
                    helperText="Deixe vazio para ilimitado"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Validade"
                    type="datetime-local"
                    value={formData.validUntil ? new Date(formData.validUntil).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as FeatureStatus }))}
                      label="Status"
                    >
                      <MenuItem value={FeatureStatus.ACTIVE}>Ativo</MenuItem>
                      <MenuItem value={FeatureStatus.INACTIVE}>Inativo</MenuItem>
                      <MenuItem value={FeatureStatus.EXPIRED}>Expirado</MenuItem>
                      <MenuItem value={FeatureStatus.DISCONTINUED}>Descontinuado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                    }
                    label="Feature ativa"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateFeature} variant="contained">
                Criar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog de Edição */}
          <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Editar Feature</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nome"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descrição"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    multiline
                    rows={3}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Valor"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Quantidade"
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value ? parseInt(e.target.value) : undefined }))}
                    helperText="Deixe vazio para ilimitado"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Validade"
                    type="datetime-local"
                    value={formData.validUntil ? new Date(formData.validUntil).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as FeatureStatus }))}
                      label="Status"
                    >
                      <MenuItem value={FeatureStatus.ACTIVE}>Ativo</MenuItem>
                      <MenuItem value={FeatureStatus.INACTIVE}>Inativo</MenuItem>
                      <MenuItem value={FeatureStatus.EXPIRED}>Expirado</MenuItem>
                      <MenuItem value={FeatureStatus.DISCONTINUED}>Descontinuado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                    }
                    label="Feature ativa"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateFeature} variant="contained">
                Atualizar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog de Exclusão */}
          <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogContent>
              <Typography>
                Tem certeza que deseja excluir a feature "{selectedFeature?.name}"?
                Esta ação não pode ser desfeita.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleDeleteFeature} variant="contained" color="error">
                Excluir
              </Button>
            </DialogActions>
          </Dialog>

          {/* Menu de Ações */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleEditClick(selectedFeature!)}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Editar</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => handleDeleteClick(selectedFeature!)} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Excluir</ListItemText>
            </MenuItem>
          </Menu>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
