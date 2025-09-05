import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { TestResult, DynamicTestResult, AvailableTest } from '../../../types/api';
import { enduranceApi } from '../../../services/enduranceApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TestResultsViewerProps {
  open: boolean;
  onClose: () => void;
  test: AvailableTest | null;
}

export default function TestResultsViewer({ open, onClose, test }: TestResultsViewerProps) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && test) {
      // Usar setTimeout para evitar setState durante render
      const timeoutId = setTimeout(() => {
        loadTestResults();
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [open, test]);

  const loadTestResults = async () => {
    if (!test) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await enduranceApi.getTestResults(test.id, { limit: 100 });
      
      // Validar e normalizar os dados recebidos
      const validatedResults = Array.isArray(response.data) 
        ? response.data.map(result => ({
            ...result,
            dynamicResults: Array.isArray(result.dynamicResults) ? result.dynamicResults : []
          }))
        : [];
      
      setResults(validatedResults);
    } catch (err) {
      console.error('Erro ao carregar resultados:', err);
      setError('Erro ao carregar resultados do teste.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const renderSingleResult = (result: TestResult) => {
    // Preferir novo padrão timeSeconds/generalRank/categoryRank
    const fmtTime = (seconds?: number) => {
      if (typeof seconds !== 'number' || isNaN(seconds)) return undefined;
      const minutes = Math.floor(seconds / 60);
      const rem = seconds - minutes * 60;
      const secFixed = rem.toFixed(3);
      const secStr = rem < 10 ? `0${secFixed}` : secFixed;
      return `${minutes}:${secStr}`;
    };
    if (typeof result.timeSeconds === 'number') {
      return (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            Tempo: {fmtTime(result.timeSeconds)}
          </Typography>
          {typeof result.generalRank === 'number' && (
            <Typography variant="body2">Geral: {result.generalRank}</Typography>
          )}
          {typeof result.categoryRank === 'number' && (
            <Typography variant="body2">Categoria: {result.categoryRank}</Typography>
          )}
          {result.notes && (
            <Typography variant="caption" color="text.secondary" display="block">
              📝 {result.notes}
            </Typography>
          )}
        </Box>
      );
    }
    // Fallback para legado
    return (
      <Box>
        <Typography variant="body2" fontWeight="medium">
          {result.value} {result.unit}
        </Typography>
        {result.notes && (
          <Typography variant="caption" color="text.secondary">
            {result.notes}
          </Typography>
        )}
      </Box>
    );
  };

  const renderMultipleResults = (result: TestResult) => {
    // Validação robusta para dynamicResults
    if (!result.dynamicResults || !Array.isArray(result.dynamicResults) || result.dynamicResults.length === 0) {
      return <Typography variant="body2" color="text.secondary">Sem resultados</Typography>;
    }

    return (
      <Box>
        {result.dynamicResults.map((field: DynamicTestResult, index: number) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {field.fieldName}: {field.value} {field.unit}
            </Typography>
            {field.description && (
              <Typography variant="caption" color="text.secondary" display="block">
                {field.description}
              </Typography>
            )}
          </Box>
        ))}
        {result.notes && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            📝 {result.notes}
          </Typography>
        )}
      </Box>
    );
  };

  const getResultTypeLabel = (result: TestResult) => {
    if (result.resultType === 'MULTIPLE') {
      return <Chip label="Múltiplos" size="small" color="primary" />;
    }
    return <Chip label="Único" size="small" color="default" />;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Resultados do Teste: {test?.name}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {results.length === 0 ? (
              <Alert severity="info">
                Nenhum resultado registrado para este teste.
              </Alert>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Aluno</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Resultados</TableCell>
                      <TableCell>Registrado por</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {result.user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {result.user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getResultTypeLabel(result)}
                        </TableCell>
                        <TableCell>
                          {result.resultType === 'MULTIPLE' && result.dynamicResults && Array.isArray(result.dynamicResults) && result.dynamicResults.length > 0
                            ? renderMultipleResults(result)
                            : renderSingleResult(result)
                          }
                        </TableCell>
                        <TableCell>
                          {result.recorder ? (
                            <Typography variant="body2">
                              {result.recorder.name}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Sistema
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(result.recordedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Visualizar detalhes">
                            <IconButton size="small">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar resultado">
                            <IconButton size="small" color="primary">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir resultado">
                            <IconButton size="small" color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => {
            // TODO: Implementar adição de resultado
          
          }}
        >
          Adicionar Resultado
        </Button>
      </DialogActions>
    </Dialog>
  );
} 