'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Card, CardContent, Grid,
  CircularProgress, Alert, Chip, Avatar, Divider, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Accordion, AccordionSummary, AccordionDetails, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Switch, Tooltip
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../../contexts/AuthContext';
import { enduranceApi } from '../../../services/enduranceApi';
import { 
  ExternalExam, 
  CreateExternalExamRequest, 
  UpdateExternalExamRequest,
  ExternalExamFilters,
  Modalidade 
} from '../../../types/api';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import SportsIcon from '@mui/icons-material/Sports';

interface ExternalExamsTabProps {
  onExamClick?: (exam: ExternalExam) => void;
}

const ExternalExamsTab: React.FC<ExternalExamsTabProps> = ({ onExamClick }) => {
  const auth = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [externalExams, setExternalExams] = useState<ExternalExam[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [filters, setFilters] = useState<ExternalExamFilters>({
    page: 1,
    limit: 50,
    search: '',
    modalidadeId: '',
    startDate: '',
    endDate: ''
  });
  const [appliedFilters, setAppliedFilters] = useState<ExternalExamFilters>({
    page: 1,
    limit: 50,
    search: '',
    modalidadeId: '',
    startDate: '',
    endDate: ''
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExternalExam | null>(null);
  const [formData, setFormData] = useState<CreateExternalExamRequest>({
    name: '',
    description: '',
    examDate: '',
    location: '',
    modalidadeId: '',
    distance: ''
  });

  // Carregar modalidades
  const loadModalidades = useCallback(async () => {
    try {
      const response = await enduranceApi.getModalidades();
      setModalidades(response.data || []);
    } catch (err) {
      console.error('Erro ao carregar modalidades:', err);
    }
  }, []);

  // Carregar provas externas
  const loadExternalExams = useCallback(async (customFilters?: ExternalExamFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtersToUse = customFilters || {
        page: 1,
        limit: 50,
        search: '',
        modalidadeId: '',
        startDate: '',
        endDate: ''
      };
      
      const response = await enduranceApi.getExternalExams(filtersToUse);
      
      
      // Agora response já é do tipo ExternalExamsResponse
      const exams = Array.isArray(response.data) ? response.data : [];
      setExternalExams(exams);
    } catch (err) {
      console.error('Erro ao carregar provas externas:', err);
      setError('Erro ao carregar provas externas.');
      setExternalExams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Aplicar filtros
  const applyFilters = () => {
    const cleanFilters = {
      ...filters,
      search: filters.search?.trim() || '',
      modalidadeId: filters.modalidadeId || '',
      startDate: filters.startDate || '',
      endDate: filters.endDate || ''
    };
    setAppliedFilters(cleanFilters);
    loadExternalExams(cleanFilters);
  };

  // Limpar filtros
  const clearFilters = () => {
    const emptyFilters = {
      page: 1,
      limit: 50,
      search: '',
      modalidadeId: '',
      startDate: '',
      endDate: ''
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    loadExternalExams(emptyFilters);
  };

  // Criar prova externa
  const handleCreateExam = async () => {
    try {
      setLoading(true);
      await enduranceApi.createExternalExam(formData);
      setCreateModalOpen(false);
      setFormData({
        name: '',
        description: '',
        examDate: '',
        location: '',
        modalidadeId: '',
        distance: ''
      });
      loadExternalExams();
    } catch (err) {
      console.error('Erro ao criar prova externa:', err);
      setError('Erro ao criar prova externa.');
    } finally {
      setLoading(false);
    }
  };

  // Editar prova externa
  const handleEditExam = async () => {
    if (!selectedExam) return;
    
    try {
      setLoading(true);
      const updateData: UpdateExternalExamRequest = {
        name: formData.name,
        description: formData.description,
        examDate: formData.examDate,
        location: formData.location,
        modalidadeId: formData.modalidadeId,
        distance: formData.distance
      };
      
      await enduranceApi.updateExternalExam(selectedExam.id, updateData);
      setEditModalOpen(false);
      setSelectedExam(null);
      setFormData({
        name: '',
        description: '',
        examDate: '',
        location: '',
        modalidadeId: '',
        distance: ''
      });
      loadExternalExams();
    } catch (err) {
      console.error('Erro ao editar prova externa:', err);
      setError('Erro ao editar prova externa.');
    } finally {
      setLoading(false);
    }
  };

  // Remover prova externa
  const handleDeleteExam = async (exam: ExternalExam) => {
    if (!window.confirm(`Tem certeza que deseja remover a prova "${exam.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await enduranceApi.deleteExternalExam(exam.id);
      loadExternalExams();
    } catch (err) {
      console.error('Erro ao remover prova externa:', err);
      setError('Erro ao remover prova externa.');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de edição
  const openEditModal = (exam: ExternalExam) => {
    setSelectedExam(exam);
    setFormData({
      name: exam.name,
      description: exam.description || '',
      examDate: exam.examDate,
      location: exam.location || '',
      modalidadeId: exam.modalidadeId,
      distance: exam.distance || ''
    });
    setEditModalOpen(true);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar se há filtros ativos
  const hasActiveFilters = () => {
    return Object.entries(appliedFilters).some(([key, value]) => {
      if (key === 'page' || key === 'limit') return false;
      return value !== '' && value !== null && value !== undefined;
    });
  };

  useEffect(() => {
    loadModalidades();
    loadExternalExams();
  }, []);

  if (loading && externalExams.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* Cabeçalho com botão de adicionar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Suas Provas Externas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
          sx={{ ml: 2 }}
        >
          Nova Prova Externa
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          🔍 Filtros
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Nome da prova"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Ex: Maratona de São Paulo..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Modalidade</InputLabel>
              <Select
                value={filters.modalidadeId}
                label="Modalidade"
                onChange={(e) => setFilters(prev => ({ ...prev, modalidadeId: e.target.value }))}
              >
                <MenuItem value="">Todas as modalidades</MenuItem>
                {modalidades.map((modalidade) => (
                  <MenuItem key={modalidade.id} value={modalidade.id}>
                    {modalidade.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data inicial"
                value={filters.startDate ? new Date(filters.startDate) : null}
                onChange={(date) => setFilters(prev => ({ 
                  ...prev, 
                  startDate: date ? date.toISOString() : '' 
                }))}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data final"
                value={filters.endDate ? new Date(filters.endDate) : null}
                onChange={(date) => setFilters(prev => ({ 
                  ...prev, 
                  endDate: date ? date.toISOString() : '' 
                }))}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Filtros ativos: {hasActiveFilters() ? 'Sim' : 'Não'}
            </Typography>
            {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={applyFilters}
              startIcon={<SearchIcon />}
              size="small"
            >
              Buscar
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
              size="small"
              disabled={!hasActiveFilters()}
            >
              Limpar
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Lista de provas externas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {externalExams.length === 0 ? (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Alert severity="info">
            {hasActiveFilters() 
              ? 'Nenhuma prova externa encontrada com os filtros aplicados.'
              : 'Você ainda não cadastrou nenhuma prova externa. Clique em "Nova Prova Externa" para começar.'
            }
          </Alert>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {externalExams.map((exam) => (
            <Accordion key={exam.id} sx={{ boxShadow: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                    <EventIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {exam.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(exam.examDate)} • {exam.modalidade.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(exam);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remover">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteExam(exam);
                        }}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {exam.description && (
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {exam.description}
                    </Typography>
                  )}
                  
                  <Grid container spacing={2}>
                    {exam.location && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOnIcon color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {exam.location}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    
                    {exam.distance && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DirectionsRunIcon color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {exam.distance}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SportsIcon color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {exam.modalidade.name}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Modal de Criar Prova Externa */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Criar Nova Prova Externa</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da prova *"
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
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data da prova *"
                  value={formData.examDate ? new Date(formData.examDate) : null}
                  onChange={(date) => setFormData(prev => ({ 
                    ...prev, 
                    examDate: date ? date.toISOString() : '' 
                  }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Modalidade *</InputLabel>
                <Select
                  value={formData.modalidadeId}
                  label="Modalidade *"
                  onChange={(e) => setFormData(prev => ({ ...prev, modalidadeId: e.target.value }))}
                >
                  {modalidades.map((modalidade) => (
                    <MenuItem key={modalidade.id} value={modalidade.id}>
                      {modalidade.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Local"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Parque Ibirapuera, São Paulo - SP"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Distância"
                value={formData.distance}
                onChange={(e) => setFormData(prev => ({ ...prev, distance: e.target.value }))}
                placeholder="Ex: 10km, 42.195km"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleCreateExam} 
            variant="contained"
            disabled={!formData.name || !formData.examDate || !formData.modalidadeId}
          >
            Criar Prova
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Editar Prova Externa */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Prova Externa</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da prova *"
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
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data da prova *"
                  value={formData.examDate ? new Date(formData.examDate) : null}
                  onChange={(date) => setFormData(prev => ({ 
                    ...prev, 
                    examDate: date ? date.toISOString() : '' 
                  }))}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Modalidade *</InputLabel>
                <Select
                  value={formData.modalidadeId}
                  label="Modalidade *"
                  onChange={(e) => setFormData(prev => ({ ...prev, modalidadeId: e.target.value }))}
                >
                  {modalidades.map((modalidade) => (
                    <MenuItem key={modalidade.id} value={modalidade.id}>
                      {modalidade.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Local"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Parque Ibirapuera, São Paulo - SP"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Distância"
                value={formData.distance}
                onChange={(e) => setFormData(prev => ({ ...prev, distance: e.target.value }))}
                placeholder="Ex: 10km, 42.195km"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleEditExam} 
            variant="contained"
            disabled={!formData.name || !formData.examDate || !formData.modalidadeId}
          >
            Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExternalExamsTab;
