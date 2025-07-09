import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  ListItemSecondaryAction,
  Paper,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { enduranceApi } from '../../../services/enduranceApi';
import { User, Plan, Modalidade } from '../../../types/api';

interface LinkManagerProps {
  open: boolean;
  onClose: () => void;
  coach: User | null;
  onDataChange?: () => void;
}

export default function LinkManager({ open, onClose, coach, onDataChange }: LinkManagerProps) {
  const [loading, setLoading] = useState(false); // Para o carregamento inicial
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [allModalities, setAllModalities] = useState<Modalidade[]>([]);
  
  const [linkedPlans, setLinkedPlans] = useState<{ plan: Plan }[]>([]);
  const [linkedModalities, setLinkedModalities] = useState<{ modalidade: Modalidade }[]>([]);
  
  const linkedPlanIds = useMemo(() => new Set(linkedPlans.map(p => p.plan.id)), [linkedPlans]);
  const linkedModalityIds = useMemo(() => new Set(linkedModalities.map(m => m.modalidade.id)), [linkedModalities]);

  useEffect(() => {
    const loadPrerequisites = async () => {
      setLoading(true);
      setError(null);
      try {
        const [plansRes, modalitiesRes] = await Promise.all([
          enduranceApi.getPlans(),
          enduranceApi.getModalidades(),
        ]);
        setAllPlans(Array.isArray(plansRes) ? plansRes : plansRes.data || []);
        setAllModalities(Array.isArray(modalitiesRes) ? modalitiesRes : modalitiesRes.data || []);
      } catch (err) {
        console.error("Erro ao carregar pré-requisitos:", err);
        setError("Não foi possível carregar os dados de planos e modalidades.");
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadPrerequisites();
      if (coach) {
        setLinkedPlans(coach.coachPlans || []);
        setLinkedModalities(coach.coachModalidades || []);
      }
    }
  }, [open, coach]);

  const handleLink = async (type: 'plan' | 'modality', id: string) => {
    if (!coach) return;
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      if (type === 'plan') {
        await enduranceApi.linkCoachToPlan(coach.id, id);
        const plan = allPlans.find(p => p.id === id);
        if(plan) setLinkedPlans(prev => [...prev, { plan }]);
      } else {
        await enduranceApi.linkCoachToModality(coach.id, id);
        const modality = allModalities.find(m => m.id === id);
        if(modality) setLinkedModalities(prev => [...prev, { modalidade: modality }]);
      }
      onDataChange?.();
    } catch (err) {
      setError(`Erro ao vincular ${type}.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleUnlink = async (type: 'plan' | 'modality', id: string) => {
    if (!coach) return;
    setActionLoading(prev => ({ ...prev, [id]: true }));
    try {
      if (type === 'plan') {
        await enduranceApi.unlinkCoachFromPlan(coach.id, id);
        setLinkedPlans(prev => prev.filter(p => p.plan.id !== id));
      } else {
        await enduranceApi.unlinkCoachFromModality(coach.id, id);
        setLinkedModalities(prev => prev.filter(m => m.modalidade.id !== id));
      }
      onDataChange?.();
    } catch (err) {
      setError(`Erro ao desvincular ${type}.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Gerenciar Vínculos de {coach?.name}</DialogTitle>
      <DialogContent sx={{ p: { xs: 1, sm: 2 }, backgroundColor: '#f5f5f5' }}>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {!loading && !error && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Coluna de Planos */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>Planos</Typography>
                <Box sx={{ height: 300, overflowY: 'auto' }}>
                  <List>
                    {allPlans.map(plan => {
                      const isLinked = linkedPlanIds.has(plan.id);
                      const isLoading = actionLoading[plan.id];
                      return (
                        <ListItem key={plan.id} divider>
                          <ListItemText primary={plan.name} />
                          <ListItemSecondaryAction>
                             <Button 
                                size="small" 
                                variant={isLinked ? "outlined" : "contained"}
                                color={isLinked ? "error" : "primary"}
                                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : (isLinked && <DeleteIcon />)}
                                onClick={() => isLinked ? handleUnlink('plan', plan.id) : handleLink('plan', plan.id)}
                                disabled={isLoading}
                                sx={{ width: 110, textTransform: 'none' }}
                              >
                                {isLoading ? 'Aguarde...' : (isLinked ? 'Remover' : 'Vincular')}
                              </Button>
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              </Paper>
            </Grid>
            
            {/* Coluna de Modalidades */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>Modalidades</Typography>
                <Box sx={{ height: 300, overflowY: 'auto' }}>
                  <List>
                    {allModalities.map(modality => {
                      const isLinked = linkedModalityIds.has(modality.id);
                      const isLoading = actionLoading[modality.id];
                      return (
                        <ListItem key={modality.id} divider>
                          <ListItemText primary={modality.name} />
                          <ListItemSecondaryAction>
                            <Button 
                              size="small" 
                              variant={isLinked ? "outlined" : "contained"}
                              color={isLinked ? "error" : "primary"}
                              startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : (isLinked && <DeleteIcon />)}
                              onClick={() => isLinked ? handleUnlink('modality', modality.id) : handleLink('modality', modality.id)}
                              disabled={isLoading}
                              sx={{ width: 110, textTransform: 'none' }}
                            >
                              {isLoading ? 'Aguarde...' : (isLinked ? 'Remover' : 'Vincular')}
                            </Button>
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ backgroundColor: '#f5f5f5' }}>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
} 