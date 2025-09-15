import React, { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Box,
  Chip,
  Typography,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Tooltip,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
} from '@mui/material';
import { 
  AddCircleOutline as AddIcon, 
  Delete as DeleteIcon,
  Add as AddFeatureIcon,
  Remove as RemoveIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Plan, Modalidade, PlanPrice, PlanPeriod, Feature, PlanFeature, AddFeatureToPlanRequest } from '../../../types/api';
import { enduranceApi } from '../../../services/enduranceApi';

const planPeriodTranslations: { [key in PlanPeriod]: string } = {
  [PlanPeriod.WEEKLY]: 'Semanal',
  [PlanPeriod.BIWEEKLY]: 'Quinzenal',
  [PlanPeriod.MONTHLY]: 'Mensal',
  [PlanPeriod.QUARTERLY]: 'Trimestral',
  [PlanPeriod.SEMIANNUALLY]: 'Semestral',
  [PlanPeriod.YEARLY]: 'Anual'
};

const planPriceSchema = z.object({
  period: z.nativeEnum(PlanPeriod),
  price: z.number().min(0, 'O preço deve ser positivo'),
});

const planSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  enrollmentFee: z.number().min(0, 'A taxa deve ser positiva').optional(),
  modalidadeIds: z.array(z.string()).min(1, 'Selecione ao menos uma modalidade'),
  prices: z.array(planPriceSchema).min(1, 'Adicione ao menos um preço'),
  forSale: z.boolean().optional(),
  featureIds: z.array(z.string()).optional(),
});

type PlanFormData = z.infer<typeof planSchema>;

interface PlanFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PlanFormData) => Promise<void>;
  plan?: Plan | null;
  loading: boolean;
  error: string | null;
}

export default function PlanForm({ open, onClose, onSubmit, plan, loading, error }: PlanFormProps) {
  const isEditMode = !!plan;
  const [modalities, setModalities] = useState<Modalidade[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [planFeatures, setPlanFeatures] = useState<PlanFeature[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: '', description: '', enrollmentFee: 0, modalidadeIds: [], prices: [], forSale: true },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "prices" });

  useEffect(() => {
    async function fetchModalities() {
      try {
        const response = await enduranceApi.getModalidades({ limit: 100 }); // Busca todas
        setModalities(Array.isArray(response) ? response : response.data || []);
      } catch (e) {
        console.error("Erro ao buscar modalidades", e);
      }
    }
    fetchModalities();
  }, []);

  useEffect(() => {
    async function fetchFeatures() {
      if (!open) return;
      
      setFeaturesLoading(true);
      try {
        const response = await enduranceApi.getFeatures({ limit: 100 });
        const featuresData = response?.data || [];
        setFeatures(featuresData);
        
        // Se estiver editando e o plano já tem features, usar as features do plano
        if (isEditMode && plan && plan.features) {
          setPlanFeatures(plan.features);
          const planFeatureIds = plan.features.map(pf => pf.featureId);
          setAvailableFeatures(featuresData.filter(f => !planFeatureIds.includes(f.id)));
        } else {
          // No modo de criação, todas as features estão disponíveis
          setAvailableFeatures(featuresData);
          setSelectedFeatures([]);
        }
      } catch (e) {
        console.error("Erro ao buscar features", e);
      } finally {
        setFeaturesLoading(false);
      }
    }
    fetchFeatures();
  }, [open, isEditMode, plan]);

  useEffect(() => {
    if (open) {
      if (isEditMode && plan) {
        reset({
          name: plan.name,
          description: plan.description || '',
          enrollmentFee: plan.enrollmentFee || 0,
          modalidadeIds: plan.modalidades.map(m => m.modalidade.id),
          prices: plan.prices.map(p => ({ period: p.period, price: p.price })),
          forSale: plan.forSale ?? true,
        });
      } else {
        reset({ name: '', description: '', enrollmentFee: 0, modalidadeIds: [], prices: [{ period: PlanPeriod.MONTHLY, price: 0 }], forSale: true, featureIds: [] });
      }
    }
  }, [open, plan, isEditMode, reset]);

  const handleAddFeature = async (featureId: string) => {
    if (!isEditMode || !plan) return;
    
    try {
      const data: AddFeatureToPlanRequest = { featureId, isActive: true };
      await enduranceApi.addFeatureToPlan(plan.id, data);
      
      // Atualizar lista de features do plano
      const feature = features.find(f => f.id === featureId);
      if (feature) {
        setPlanFeatures(prev => [...(prev || []), { 
          id: `temp-${Date.now()}`, 
          planId: plan.id, 
          featureId, 
          isActive: true, 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(),
          feature 
        }]);
        
        // Remover da lista de disponíveis
        setAvailableFeatures(prev => (prev || []).filter(f => f.id !== featureId));
      }
    } catch (e) {
      console.error("Erro ao adicionar feature ao plano", e);
    }
  };

  const handleRemoveFeature = async (featureId: string) => {
    if (!isEditMode || !plan) return;
    
    try {
      await enduranceApi.removeFeatureFromPlan(plan.id, featureId);
      
      // Atualizar listas
      const planFeature = planFeatures?.find(pf => pf.featureId === featureId);
      if (planFeature) {
        setPlanFeatures(prev => (prev || []).filter(pf => pf.featureId !== featureId));
        setAvailableFeatures(prev => [...(prev || []), planFeature.feature]);
      }
    } catch (e) {
      console.error("Erro ao remover feature do plano", e);
    }
  };

  const handleToggleFeatureStatus = async (featureId: string, currentStatus: boolean) => {
    if (!isEditMode || !plan) return;
    
    try {
      await enduranceApi.updatePlanFeatureStatus(plan.id, featureId, { isActive: !currentStatus });
      
      // Atualizar status local
      setPlanFeatures(prev => (prev || []).map(pf => 
        pf.featureId === featureId 
          ? { ...pf, isActive: !currentStatus }
          : pf
      ));
    } catch (e) {
      console.error("Erro ao atualizar status da feature", e);
    }
  };

  // Funções para modo de criação
  const handleSelectFeature = (feature: Feature) => {
    setSelectedFeatures(prev => [...prev, feature]);
    setAvailableFeatures(prev => prev.filter(f => f.id !== feature.id));
  };

  const handleDeselectFeature = (featureId: string) => {
    const feature = selectedFeatures.find(f => f.id === featureId);
    if (feature) {
      setSelectedFeatures(prev => prev.filter(f => f.id !== featureId));
      setAvailableFeatures(prev => [...prev, feature]);
    }
  };

  const handleFormSubmit = async (data: PlanFormData) => {
    // Incluir as features selecionadas no modo de criação
    const submitData = {
      ...data,
      featureIds: isEditMode ? undefined : selectedFeatures.map(f => f.id)
    };
    await onSubmit(submitData);
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent sx={{ p: 0 }}>
          {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
              <Tab label="Informações Básicas" />
              <Tab label="Features" />
            </Tabs>
          </Box>

          {currentTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Controller name="name" control={control} render={({ field }) => ( <TextField {...field} label="Nome do Plano" fullWidth required error={!!errors.name} helperText={errors.name?.message} /> )}/>
            </Grid>
            <Grid item xs={12} md={4}>
              <Controller name="enrollmentFee" control={control} render={({ field }) => ( 
                <TextField 
                  {...field} 
                  label="Taxa de Matrícula" 
                  fullWidth 
                  type="number" 
                  InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }} 
                  error={!!errors.enrollmentFee} 
                  helperText={errors.enrollmentFee?.message}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                /> 
              )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller name="description" control={control} render={({ field }) => ( <TextField {...field} label="Descrição" multiline rows={3} fullWidth /> )}/>
            </Grid>
            <Grid item xs={12}>
              <Controller 
                name="forSale" 
                control={control} 
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.value ?? true}
                        onChange={field.onChange}
                        color="primary"
                      />
                    }
                    label="Disponível para venda"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.modalidadeIds}>
                <InputLabel>Modalidades</InputLabel>
                <Controller name="modalidadeIds" control={control} render={({ field }) => (
                  <Select {...field} multiple required input={<OutlinedInput label="Modalidades" />} renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => ( <Chip key={value} label={modalities.find(m => m.id === value)?.name || value} /> ))}
                      </Box>
                    )}>
                    {modalities.map((m) => ( <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem> ))}
                  </Select>
                )}/>
                {errors.modalidadeIds && <Typography color="error" variant="caption" sx={{ pl: 2 }}>{errors.modalidadeIds.message}</Typography>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 6 }}>Preços</Typography>
              {errors.prices && <Alert severity="warning" sx={{ mb: 1 }}>{errors.prices.message}</Alert>}
              {fields.map((field, index) => (
                <Grid container spacing={2} key={field.id} sx={{ alignItems: 'center', mb: 1 }}>
                  <Grid item xs={5}>
                    <Controller name={`prices.${index}.period`} control={control} render={({ field: selectField }) => (
                      <FormControl fullWidth>
                        <InputLabel>Período</InputLabel>
                        <Select {...selectField} label="Período">
                          {Object.values(PlanPeriod).map(p => <MenuItem key={p} value={p}>{planPeriodTranslations[p] || p}</MenuItem>)}
                        </Select>
                      </FormControl>
                    )}/>
                  </Grid>
                  <Grid item xs={5}>
                    <Controller name={`prices.${index}.price`} control={control} render={({ field: priceField }) => (
                       <TextField 
                         {...priceField} 
                         label="Preço" 
                         fullWidth 
                         type="number" 
                         InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment>}}
                         onChange={(e) => priceField.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                       />
                    )}/>
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton onClick={() => remove(index)} color="error"><DeleteIcon /></IconButton>
                  </Grid>
                </Grid>
              ))}
               <Button startIcon={<AddIcon />} onClick={() => append({ period: PlanPeriod.MONTHLY, price: 0 })}>
                Adicionar Preço
              </Button>
            </Grid>
              </Grid>
            </Box>
          )}

          {currentTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Features do Plano */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon color="primary" />
                        Features do Plano
                      </Typography>
                      
                      {featuresLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : isEditMode ? (
                        // Modo de edição - mostrar features do plano
                        !planFeatures || planFeatures.length === 0 ? (
                          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            Nenhuma feature vinculada
                          </Typography>
                        ) : (
                          <List dense>
                            {planFeatures?.map((planFeature) => (
                              <ListItem key={planFeature.id} sx={{ px: 0 }}>
                                <ListItemIcon>
                                  <CheckIcon color={planFeature.isActive ? 'success' : 'disabled'} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={planFeature.feature.name}
                                  secondary={
                                    <React.Fragment>
                                      <Typography variant="caption" display="block">
                                        {formatCurrency(planFeature.feature.value)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {planFeature.feature.description || 'Sem descrição'}
                                      </Typography>
                                    </React.Fragment>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Tooltip title={planFeature.isActive ? 'Desativar' : 'Ativar'}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleToggleFeatureStatus(planFeature.featureId, planFeature.isActive)}
                                      >
                                        {planFeature.isActive ? <CheckIcon /> : <CancelIcon />}
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remover">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveFeature(planFeature.featureId)}
                                      >
                                        <RemoveIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        )
                      ) : (
                        // Modo de criação - mostrar features selecionadas
                        selectedFeatures.length === 0 ? (
                          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                            Nenhuma feature selecionada
                          </Typography>
                        ) : (
                          <List dense>
                            {selectedFeatures.map((feature) => (
                              <ListItem key={feature.id} sx={{ px: 0 }}>
                                <ListItemIcon>
                                  <CheckIcon color="success" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={feature.name}
                                  secondary={
                                    <React.Fragment>
                                      <Typography variant="caption" display="block">
                                        {formatCurrency(feature.value)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {feature.description || 'Sem descrição'}
                                      </Typography>
                                    </React.Fragment>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <Tooltip title="Remover">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeselectFeature(feature.id)}
                                    >
                                      <RemoveIcon />
                                    </IconButton>
                                  </Tooltip>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        )
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Features Disponíveis */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AddFeatureIcon color="primary" />
                        Features Disponíveis
                      </Typography>
                      
                      {featuresLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : !availableFeatures || availableFeatures.length === 0 ? (
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          {isEditMode ? 'Todas as features já estão vinculadas' : 'Nenhuma feature disponível'}
                        </Typography>
                      ) : (
                        <List dense>
                          {availableFeatures?.map((feature) => (
                            <ListItem key={feature.id} sx={{ px: 0 }}>
                              <ListItemIcon>
                                <MoneyIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary={feature.name}
                                secondary={
                                  <React.Fragment>
                                    <Typography variant="caption" display="block">
                                      {formatCurrency(feature.value)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {feature.description || 'Sem descrição'}
                                    </Typography>
                                    {feature.quantity && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Quantidade: {feature.quantity}
                                      </Typography>
                                    )}
                                    {feature.validUntil && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Válido até: {formatDate(feature.validUntil)}
                                      </Typography>
                                    )}
                                  </React.Fragment>
                                }
                              />
                              <ListItemSecondaryAction>
                                <Tooltip title={isEditMode ? "Adicionar ao plano" : "Selecionar feature"}>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => isEditMode ? handleAddFeature(feature.id) : handleSelectFeature(feature)}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </Tooltip>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        {currentTab === 0 && (
          <DialogActions sx={{ p: '16px 24px' }}>
            <Button onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Salvar' : 'Cadastrar')}
            </Button>
          </DialogActions>
        )}
        
        {currentTab === 1 && (
          <DialogActions sx={{ p: '16px 24px' }}>
            <Button onClick={onClose}>Fechar</Button>
            {!isEditMode && (
              <Button 
                variant="contained" 
                onClick={() => {
                  // Voltar para a aba de informações básicas para salvar
                  setCurrentTab(0);
                }}
              >
                Continuar
              </Button>
            )}
          </DialogActions>
        )}
      </form>
    </Dialog>
  );
} 