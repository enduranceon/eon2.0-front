'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  FitnessCenter as FitnessCenterIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  EmojiEvents as TrophyIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import ProtectedRoute from '../../../../components/ProtectedRoute';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import PageHeader from '../../../../components/Dashboard/PageHeader';
import { enduranceApi } from '../../../../services/enduranceApi';
import { AdminTestResult, TestType, AdminExamRegistration } from '../../../../types/api';

// Função para obter URL absoluta da imagem
const getAbsoluteImageUrl = (url: string | undefined | null): string | undefined => {
  if (!url || url.trim() === '') return undefined;
  
  try {
    if (url.startsWith('http') || url.startsWith('blob:')) {
      return url;
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const origin = new URL(apiUrl).origin;
    const path = url.startsWith('/api') ? url.substring(4) : url;
    return `${origin}/api${path.startsWith('/') ? '' : '/'}${path}`;
  } catch (error) {
    console.warn('Erro ao processar URL da imagem:', url, error);
    return undefined;
  }
};

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
      id={`results-tabpanel-${index}`}
      aria-labelledby={`results-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function TestResultsList() {
  const [results, setResults] = useState<AdminTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    testId: '',
    userId: '',
    testType: '',
    modalidadeId: '',
    gender: '',
    minAge: '',
    maxAge: '',
    startDate: '',
    endDate: '',
  });

  // Modal de detalhes
  const [selectedResult, setSelectedResult] = useState<AdminTestResult | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await enduranceApi.getAdminAllResults({
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
      });
      
      setResults(response.data);
      setTotal(response.pagination.total);
      setSummary(response.summary);
    } catch (err: any) {
      console.error('Erro ao buscar resultados:', err);
      setError(err.response?.data?.message || 'Erro ao carregar resultados');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    fetchResults();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      testId: '',
      userId: '',
      testType: '',
      modalidadeId: '',
      gender: '',
      minAge: '',
      maxAge: '',
      startDate: '',
      endDate: '',
    });
    setPage(0);
  };

  const openDetails = (result: AdminTestResult) => {
    setSelectedResult(result);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setSelectedResult(null);
    setDetailsOpen(false);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getTestTypeColor = (type: TestType) => {
    const colors: Record<TestType, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      [TestType.RESISTENCIA]: 'primary',
      [TestType.VELOCIDADE]: 'secondary',
      [TestType.FORCA]: 'error',
      [TestType.FLEXIBILIDADE]: 'info',
      [TestType.CARDIO]: 'success',
      [TestType.PERFORMANCE]: 'warning',
      [TestType.STRENGTH]: 'error',
      [TestType.TECHNICAL]: 'info',
    };
    return colors[type] || 'default';
  };

  const renderDynamicResults = (dynamicResults: any) => {
    // Verificar se dynamicResults existe
    if (!dynamicResults) {
      return (
        <Box>
          <Typography variant="body2" color="text.secondary">
            Nenhum resultado dinâmico
          </Typography>
        </Box>
      );
    }

    // Verificar se é um array (estrutura correta)
    if (Array.isArray(dynamicResults)) {
      if (dynamicResults.length === 0) {
        return (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Nenhum resultado dinâmico encontrado
            </Typography>
          </Box>
        );
      }

      return (
        <Box>
          {dynamicResults.map((result, index) => (
            <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {result.fieldName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {result.value} {result.unit}
              </Typography>
              {result.description && (
                <Typography variant="caption" color="text.secondary">
                  {result.description}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      );
    }

    // Fallback para outros formatos
    return (
      <Box>
        <Typography variant="body2" color="text.secondary">
          Formato de resultado não suportado
        </Typography>
      </Box>
    );
  };

  return (
    <Box>
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
                 <Grid container spacing={2} alignItems="center">
           <Grid item xs={12} md={2}>
             <TextField
               fullWidth
               label="Buscar"
               value={filters.search}
               onChange={(e) => handleFilterChange('search', e.target.value)}
               InputProps={{
                 startAdornment: (
                   <InputAdornment position="start">
                     <SearchIcon />
                   </InputAdornment>
                 ),
               }}
             />
           </Grid>
           <Grid item xs={12} md={2}>
             <FormControl fullWidth>
               <InputLabel>Tipo de Teste</InputLabel>
               <Select
                 value={filters.testType}
                 label="Tipo de Teste"
                 onChange={(e) => handleFilterChange('testType', e.target.value)}
               >
                 <MenuItem value="">Todos</MenuItem>
                 <MenuItem value="RESISTENCIA">Resistência</MenuItem>
                 <MenuItem value="VELOCIDADE">Velocidade</MenuItem>
                 <MenuItem value="FORCA">Força</MenuItem>
                 <MenuItem value="FLEXIBILIDADE">Flexibilidade</MenuItem>
                 <MenuItem value="CARDIO">Cardio</MenuItem>
                 <MenuItem value="PERFORMANCE">Performance</MenuItem>
                 <MenuItem value="STRENGTH">Strength</MenuItem>
                 <MenuItem value="TECHNICAL">Technical</MenuItem>
                 <MenuItem value="METABOLIC">Metabólico</MenuItem>
               </Select>
             </FormControl>
           </Grid>
           <Grid item xs={12} md={2}>
             <FormControl fullWidth>
               <InputLabel>Gênero</InputLabel>
               <Select
                 value={filters.gender}
                 label="Gênero"
                 onChange={(e) => handleFilterChange('gender', e.target.value)}
               >
                 <MenuItem value="">Todos</MenuItem>
                 <MenuItem value="MALE">Masculino</MenuItem>
                 <MenuItem value="FEMALE">Feminino</MenuItem>
                 <MenuItem value="UNKNOWN">Não informado</MenuItem>
               </Select>
             </FormControl>
           </Grid>
           <Grid item xs={12} md={1}>
             <TextField
               fullWidth
               label="Idade Mín"
               type="number"
               value={filters.minAge}
               onChange={(e) => handleFilterChange('minAge', e.target.value)}
               InputProps={{
                 inputProps: { min: 0, max: 120 }
               }}
             />
           </Grid>
           <Grid item xs={12} md={1}>
             <TextField
               fullWidth
               label="Idade Máx"
               type="number"
               value={filters.maxAge}
               onChange={(e) => handleFilterChange('maxAge', e.target.value)}
               InputProps={{
                 inputProps: { min: 0, max: 120 }
               }}
             />
           </Grid>
           <Grid item xs={12} md={2}>
             <TextField
               fullWidth
               label="Data Início"
               type="date"
               value={filters.startDate}
               onChange={(e) => handleFilterChange('startDate', e.target.value)}
               InputLabelProps={{ shrink: true }}
             />
           </Grid>
           <Grid item xs={12} md={2}>
             <TextField
               fullWidth
               label="Data Fim"
               type="date"
               value={filters.endDate}
               onChange={(e) => handleFilterChange('endDate', e.target.value)}
               InputLabelProps={{ shrink: true }}
             />
           </Grid>
         </Grid>
         <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
           <Button
             variant="contained"
             onClick={handleSearch}
             disabled={loading}
             startIcon={<SearchIcon />}
           >
             Buscar
           </Button>
           <Button
             variant="outlined"
             onClick={handleClearFilters}
             size="small"
           >
             Limpar Filtros
           </Button>
                  </Box>
      </Paper>

      {/* Resumo */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de Resultados
                </Typography>
                <Typography variant="h4">
                  {summary.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Resultados Únicos
                </Typography>
                <Typography variant="h4">
                  {summary.singleResults}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Resultados Múltiplos
                </Typography>
                <Typography variant="h4">
                  {summary.multipleResults || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tipos de Teste
                </Typography>
                <Typography variant="h4">
                  {summary.byTestType?.length || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabela */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Aluno</TableCell>
                <TableCell>Teste</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Resultado</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Registrado por</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      Nenhum resultado encontrado
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={getAbsoluteImageUrl(result.user.image)}
                          sx={{ width: 32, height: 32 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {result.user.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {result.user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {result.test.name}
                      </Typography>
                      {result.test.description && (
                        <Typography variant="caption" color="textSecondary">
                          {result.test.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={result.test.type}
                        color={getTestTypeColor(result.test.type)}
                        size="small"
                      />
                    </TableCell>
                                                              <TableCell>
                        {result.resultType === 'MULTIPLE' && result.dynamicResults ? (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              Múltiplos resultados
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {Array.isArray(result.dynamicResults) 
                                ? result.dynamicResults.length 
                                : 'N/A'} campos
                            </Typography>
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {result.value} {result.unit}
                            </Typography>
                            {result.notes && (
                              <Typography variant="caption" color="textSecondary">
                                {result.notes}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(result.recordedAt)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(result.createdAt)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {result.recorder ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            src={getAbsoluteImageUrl(result.recorder.image)}
                            sx={{ width: 24, height: 24 }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Typography variant="body2">
                            {result.recorder.name}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Não informado
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalhes">
                        <IconButton
                          size="small"
                          onClick={() => openDetails(result)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </Paper>

      {/* Modal de Detalhes */}
      <Dialog
        open={detailsOpen}
        onClose={closeDetails}
        maxWidth="md"
        fullWidth
      >
        {selectedResult && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FitnessCenterIcon />
                Detalhes do Resultado
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                {/* Informações do Aluno */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Informações do Aluno
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      src={getAbsoluteImageUrl(selectedResult.user.image)}
                      sx={{ width: 64, height: 64 }}
                    >
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedResult.user.name}</Typography>
                      <Typography color="textSecondary">{selectedResult.user.email}</Typography>
                      {selectedResult.user.birthDate && (
                        <Typography variant="body2">
                          Nascimento: {formatDate(selectedResult.user.birthDate)}
                        </Typography>
                      )}
                      {selectedResult.user.gender && (
                        <Typography variant="body2">
                          Gênero: {selectedResult.user.gender}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                {/* Informações do Teste */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Informações do Teste
                  </Typography>
                  <Box>
                    <Typography variant="h6">{selectedResult.test.name}</Typography>
                    {selectedResult.test.description && (
                      <Typography color="textSecondary" paragraph>
                        {selectedResult.test.description}
                      </Typography>
                    )}
                    <Chip
                      label={selectedResult.test.type}
                      color={getTestTypeColor(selectedResult.test.type)}
                      sx={{ mb: 1 }}
                    />
                    {selectedResult.test.exam && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          Evento: {selectedResult.test.exam.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Modalidade: {selectedResult.test.exam.modalidade.name}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Resultados */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Resultados
                  </Typography>
                  {selectedResult.resultType === 'MULTIPLE' && selectedResult.dynamicResults ? (
                    renderDynamicResults(selectedResult.dynamicResults)
                  ) : (
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h5" fontWeight="bold">
                        {selectedResult.value} {selectedResult.unit}
                      </Typography>
                      {selectedResult.notes && (
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {selectedResult.notes}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Grid>

                {/* Informações Adicionais */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Informações Adicionais
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarIcon />
                        <Typography variant="body2">
                          <strong>Data de Registro:</strong> {formatDate(selectedResult.recordedAt)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TimeIcon />
                        <Typography variant="body2">
                          <strong>Criado em:</strong> {formatDate(selectedResult.createdAt)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {selectedResult.recorder && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <PersonIcon />
                          <Typography variant="body2">
                            <strong>Registrado por:</strong> {selectedResult.recorder.name}
                          </Typography>
                        </Box>
                      )}
                      {selectedResult.coach && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon />
                          <Typography variant="body2">
                            <strong>Treinador:</strong> {selectedResult.coach.name}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDetails}>Fechar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
     );
 }

 function ExamRegistrationsList() {
   const [registrations, setRegistrations] = useState<AdminExamRegistration[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [page, setPage] = useState(0);
   const [rowsPerPage, setRowsPerPage] = useState(10);
   const [total, setTotal] = useState(0);
   const [statistics, setStatistics] = useState<any>(null);
   
   // Filtros
   const [filters, setFilters] = useState({
     examId: '',
     userId: '',
     modalidadeId: '',
     attended: '',
     gender: '',
     minAge: '',
     maxAge: '',
     startDate: '',
     endDate: '',
   });

   // Modal de detalhes
   const [selectedRegistration, setSelectedRegistration] = useState<AdminExamRegistration | null>(null);
   const [detailsOpen, setDetailsOpen] = useState(false);

   const fetchRegistrations = useCallback(async () => {
     setLoading(true);
     setError(null);
     
     try {
       const response = await enduranceApi.getAdminAllExamRegistrations({
         page: page + 1,
         limit: rowsPerPage,
         ...filters,
         attended: filters.attended === 'true' ? true : filters.attended === 'false' ? false : undefined,
         minAge: filters.minAge ? parseInt(filters.minAge) : undefined,
         maxAge: filters.maxAge ? parseInt(filters.maxAge) : undefined,
       });
       
       setRegistrations(response.data);
       setTotal(response.pagination.total);
       setStatistics(response.statistics);
     } catch (err: any) {
       console.error('Erro ao buscar registros de provas:', err);
       setError(err.response?.data?.message || 'Erro ao carregar registros de provas');
     } finally {
       setLoading(false);
     }
   }, [page, rowsPerPage, filters]);

   useEffect(() => {
     fetchRegistrations();
   }, [fetchRegistrations]);

   const handlePageChange = (event: unknown, newPage: number) => {
     setPage(newPage);
   };

   const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
     setRowsPerPage(parseInt(event.target.value, 10));
     setPage(0);
   };

   const handleFilterChange = (field: string, value: string) => {
     setFilters(prev => ({ ...prev, [field]: value }));
     setPage(0);
   };

   const handleSearch = () => {
     setPage(0);
     fetchRegistrations();
   };

   const handleClearFilters = () => {
     setFilters({
       examId: '',
       userId: '',
       modalidadeId: '',
       attended: '',
       gender: '',
       minAge: '',
       maxAge: '',
       startDate: '',
       endDate: '',
     });
     setPage(0);
   };

   const openDetails = (registration: AdminExamRegistration) => {
     setSelectedRegistration(registration);
     setDetailsOpen(true);
   };

   const closeDetails = () => {
     setSelectedRegistration(null);
     setDetailsOpen(false);
   };

   const formatDate = (dateString: string) => {
     try {
       return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
     } catch {
       return 'Data inválida';
     }
   };

   const calculateAge = (birthDate: string) => {
     try {
       const birth = new Date(birthDate);
       const today = new Date();
       let age = today.getFullYear() - birth.getFullYear();
       const monthDiff = today.getMonth() - birth.getMonth();
       if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
         age--;
       }
       return age;
     } catch {
       return null;
     }
   };

   return (
     <Box>
       {/* Filtros */}
       <Paper sx={{ p: 2, mb: 3 }}>
         <Typography variant="h6" gutterBottom>
           Filtros
         </Typography>
         <Grid container spacing={2} alignItems="center">
           <Grid item xs={12} md={2}>
             <FormControl fullWidth>
               <InputLabel>Presença</InputLabel>
               <Select
                 value={filters.attended}
                 label="Presença"
                 onChange={(e) => handleFilterChange('attended', e.target.value)}
               >
                 <MenuItem value="">Todos</MenuItem>
                 <MenuItem value="true">Presente</MenuItem>
                 <MenuItem value="false">Ausente</MenuItem>
               </Select>
             </FormControl>
           </Grid>
           <Grid item xs={12} md={2}>
             <FormControl fullWidth>
               <InputLabel>Gênero</InputLabel>
               <Select
                 value={filters.gender}
                 label="Gênero"
                 onChange={(e) => handleFilterChange('gender', e.target.value)}
               >
                 <MenuItem value="">Todos</MenuItem>
                 <MenuItem value="MALE">Masculino</MenuItem>
                 <MenuItem value="FEMALE">Feminino</MenuItem>
               </Select>
             </FormControl>
           </Grid>
           <Grid item xs={12} md={1}>
             <TextField
               fullWidth
               label="Idade Mín"
               type="number"
               value={filters.minAge}
               onChange={(e) => handleFilterChange('minAge', e.target.value)}
               InputProps={{
                 inputProps: { min: 0, max: 120 }
               }}
             />
           </Grid>
           <Grid item xs={12} md={1}>
             <TextField
               fullWidth
               label="Idade Máx"
               type="number"
               value={filters.maxAge}
               onChange={(e) => handleFilterChange('maxAge', e.target.value)}
               InputProps={{
                 inputProps: { min: 0, max: 120 }
               }}
             />
           </Grid>
           <Grid item xs={12} md={2}>
             <TextField
               fullWidth
               label="Data Início"
               type="date"
               value={filters.startDate}
               onChange={(e) => handleFilterChange('startDate', e.target.value)}
               InputLabelProps={{ shrink: true }}
             />
           </Grid>
           <Grid item xs={12} md={2}>
             <TextField
               fullWidth
               label="Data Fim"
               type="date"
               value={filters.endDate}
               onChange={(e) => handleFilterChange('endDate', e.target.value)}
               InputLabelProps={{ shrink: true }}
             />
           </Grid>
           <Grid item xs={12} md={2}>
             <Button
               variant="contained"
               onClick={handleSearch}
               disabled={loading}
               startIcon={<SearchIcon />}
               fullWidth
             >
               Buscar
             </Button>
           </Grid>
         </Grid>
         <Box sx={{ mt: 2 }}>
           <Button
             variant="outlined"
             onClick={handleClearFilters}
             size="small"
           >
             Limpar Filtros
           </Button>
         </Box>
       </Paper>

       {/* Estatísticas */}
       {statistics && (
         <Grid container spacing={2} sx={{ mb: 3 }}>
           <Grid item xs={12} md={3}>
             <Card>
               <CardContent>
                 <Typography color="textSecondary" gutterBottom>
                   Total de Registros
                 </Typography>
                 <Typography variant="h4">
                   {statistics.attendanceStats.total}
                 </Typography>
               </CardContent>
             </Card>
           </Grid>
           <Grid item xs={12} md={3}>
             <Card>
               <CardContent>
                 <Typography color="textSecondary" gutterBottom>
                   Presentes
                 </Typography>
                 <Typography variant="h4" color="success.main">
                   {statistics.attendanceStats.attended}
                 </Typography>
               </CardContent>
             </Card>
           </Grid>
           <Grid item xs={12} md={3}>
             <Card>
               <CardContent>
                 <Typography color="textSecondary" gutterBottom>
                   Ausentes
                 </Typography>
                 <Typography variant="h4" color="error.main">
                   {statistics.attendanceStats.notAttended}
                 </Typography>
               </CardContent>
             </Card>
           </Grid>
           <Grid item xs={12} md={3}>
             <Card>
               <CardContent>
                 <Typography color="textSecondary" gutterBottom>
                   Idade Média
                 </Typography>
                 <Typography variant="h4">
                   {statistics.averageAge} anos
                 </Typography>
               </CardContent>
             </Card>
           </Grid>
         </Grid>
       )}

       {/* Tabela */}
       <Paper>
         <TableContainer>
           <Table>
             <TableHead>
               <TableRow>
                 <TableCell>Participante</TableCell>
                 <TableCell>Prova</TableCell>
                 <TableCell>Modalidade</TableCell>
                 <TableCell>Distância/Categoria</TableCell>
                 <TableCell>Presença</TableCell>
                 <TableCell>Resultado</TableCell>
                 <TableCell>Data</TableCell>
                 <TableCell>Ações</TableCell>
               </TableRow>
             </TableHead>
             <TableBody>
               {loading ? (
                 <TableRow>
                   <TableCell colSpan={8} align="center">
                     <CircularProgress />
                   </TableCell>
                 </TableRow>
               ) : registrations.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={8} align="center">
                     <Typography color="textSecondary">
                       Nenhum registro encontrado
                     </Typography>
                   </TableCell>
                 </TableRow>
               ) : (
                 registrations.map((registration) => (
                   <TableRow key={registration.id}>
                     <TableCell>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <Avatar
                           sx={{ width: 32, height: 32 }}
                         >
                           <PersonIcon />
                         </Avatar>
                         <Box>
                           <Typography variant="body2" fontWeight="bold">
                             {registration.user?.name || 'N/A'}
                           </Typography>
                           <Typography variant="caption" color="textSecondary">
                             {registration.user?.email || 'N/A'}
                           </Typography>
                           {registration.user?.birthDate && (
                             <Typography variant="caption" color="textSecondary" display="block">
                               {calculateAge(registration.user.birthDate)} anos
                             </Typography>
                           )}
                         </Box>
                       </Box>
                     </TableCell>
                     <TableCell>
                       <Typography variant="body2" fontWeight="bold">
                         {registration.exam?.name || 'N/A'}
                       </Typography>
                     </TableCell>
                     <TableCell>
                       <Chip
                         label={registration.exam?.modalidade?.name || 'N/A'}
                         color="primary"
                         size="small"
                       />
                     </TableCell>
                     <TableCell>
                       <Typography variant="body2">
                         {registration.distance
                           ? `${registration.distance.distance} ${registration.distance.unit}`
                           : 'N/A'}
                       </Typography>
                     </TableCell>
                     <TableCell>
                       <Chip
                         label={registration.attended ? 'Presente' : 'Ausente'}
                         color={registration.attended ? 'success' : 'error'}
                         size="small"
                       />
                     </TableCell>
                     <TableCell>
                       {registration.result ? (
                         <Typography variant="body2" fontWeight="bold" color="success.main">
                           {registration.result}
                         </Typography>
                       ) : (
                         <Typography variant="body2" color="textSecondary">
                           Não registrado
                         </Typography>
                       )}
                     </TableCell>
                     <TableCell>
                       <Typography variant="body2">
                         {registration.exam?.date ? formatDate(registration.exam.date) : 'N/A'}
                       </Typography>
                     </TableCell>
                     <TableCell>
                       <Tooltip title="Ver detalhes">
                         <IconButton
                           size="small"
                           onClick={() => openDetails(registration)}
                         >
                           <VisibilityIcon />
                         </IconButton>
                       </Tooltip>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </TableContainer>
         <TablePagination
           rowsPerPageOptions={[5, 10, 25, 50]}
           component="div"
           count={total}
           rowsPerPage={rowsPerPage}
           page={page}
           onPageChange={handlePageChange}
           onRowsPerPageChange={handleRowsPerPageChange}
           labelRowsPerPage="Linhas por página:"
           labelDisplayedRows={({ from, to, count }) =>
             `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
           }
         />
       </Paper>

       {/* Modal de Detalhes */}
       <Dialog
         open={detailsOpen}
         onClose={closeDetails}
         maxWidth="md"
         fullWidth
       >
         {selectedRegistration && (
           <>
             <DialogTitle>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                 <TrophyIcon />
                 Detalhes do Registro de Prova
               </Box>
             </DialogTitle>
             <DialogContent>
               <Grid container spacing={3}>
                 {/* Informações do Participante */}
                 <Grid item xs={12} md={6}>
                   <Typography variant="h6" gutterBottom>
                     Informações do Participante
                   </Typography>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                     <Avatar
                       sx={{ width: 64, height: 64 }}
                     >
                       <PersonIcon />
                     </Avatar>
                     <Box>
                       <Typography variant="h6">{selectedRegistration.user?.name || 'N/A'}</Typography>
                       <Typography color="textSecondary">{selectedRegistration.user?.email || 'N/A'}</Typography>
                       {selectedRegistration.user?.birthDate && (
                         <Typography variant="body2">
                           Nascimento: {formatDate(selectedRegistration.user.birthDate)} ({calculateAge(selectedRegistration.user.birthDate)} anos)
                         </Typography>
                       )}
                       {selectedRegistration.user?.gender && (
                         <Typography variant="body2">
                           Gênero: {selectedRegistration.user.gender === 'MALE' ? 'Masculino' : 'Feminino'}
                         </Typography>
                       )}
                     </Box>
                   </Box>
                 </Grid>

                 {/* Informações da Prova */}
                 <Grid item xs={12} md={6}>
                   <Typography variant="h6" gutterBottom>
                     Informações da Prova
                   </Typography>
                   <Box>
                     <Typography variant="h6">{selectedRegistration.exam?.name || 'N/A'}</Typography>
                     <Chip
                       label={selectedRegistration.exam?.modalidade?.name || 'N/A'}
                       color="primary"
                       sx={{ mb: 1 }}
                     />
                     <Box sx={{ mt: 1 }}>
                       <Typography variant="body2">
                         <strong>Data:</strong> {selectedRegistration.exam?.date ? formatDate(selectedRegistration.exam.date) : 'N/A'}
                       </Typography>
                       <Typography variant="body2">
                         <strong>Distância:</strong> {selectedRegistration.distance
                           ? `${selectedRegistration.distance.distance} ${selectedRegistration.distance.unit}`
                           : 'N/A'}
                       </Typography>
                     </Box>
                   </Box>
                 </Grid>

                 {/* Status e Resultado */}
                 <Grid item xs={12}>
                   <Typography variant="h6" gutterBottom>
                     Status e Resultado
                   </Typography>
                   <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                       <Chip
                         label={selectedRegistration.attended ? 'Presente' : 'Ausente'}
                         color={selectedRegistration.attended ? 'success' : 'error'}
                         size="medium"
                       />
                       {selectedRegistration.result && (
                         <Typography variant="h5" fontWeight="bold" color="success.main">
                           {selectedRegistration.result}
                         </Typography>
                       )}
                     </Box>
                     {!selectedRegistration.result && selectedRegistration.attended && (
                       <Typography variant="body2" color="textSecondary">
                         Resultado não registrado
                       </Typography>
                     )}
                   </Box>
                 </Grid>
               </Grid>
             </DialogContent>
             <DialogActions>
               <Button onClick={closeDetails}>Fechar</Button>
             </DialogActions>
           </>
         )}
       </Dialog>
     </Box>
   );
 }

 function ResultsPageContent() {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box>
      <PageHeader
        title="Resultados"
        description="Visualize os resultados de testes e provas dos usuários."
      />
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Abas de resultados">
            <Tab label="Resultados de Testes" id="results-tab-0" />
            <Tab label="Resultados de Provas" id="results-tab-1" />
          </Tabs>
        </Box>
        <TabPanel value={tabIndex} index={0}>
          <TestResultsList />
        </TabPanel>
                 <TabPanel value={tabIndex} index={1}>
           <ExamRegistrationsList />
         </TabPanel>
      </Paper>
    </Box>
  );
}

export default function ResultsPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedUserTypes={['ADMIN']}>
      <DashboardLayout user={user} onLogout={logout}>
        <ResultsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
} 