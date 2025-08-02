import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { ExamDistance } from '../../../types/api';

interface DistanceSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (distanceId: string) => Promise<void>;
  examName: string;
  distances: ExamDistance[];
  categories?: any[];
  loading: boolean;
  error: string | null;
}

export default function DistanceSelectionModal({
  open,
  onClose,
  onConfirm,
  examName,
  distances,
  categories = [],
  loading,
  error
}: DistanceSelectionModalProps) {
  const [selectedDistanceId, setSelectedDistanceId] = React.useState<string>('');



  const handleConfirm = async () => {
    if (selectedDistanceId) {
      await onConfirm(selectedDistanceId);
    }
  };

  const handleClose = () => {
    setSelectedDistanceId('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Selecionar {distances.length > 0 ? 'Distância' : 'Categoria'} - {examName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          {distances.length > 0 
            ? 'Escolha a distância que você deseja percorrer nesta prova:'
            : 'Escolha a categoria que você deseja participar nesta prova:'
          }
        </Typography>

        <RadioGroup
          value={selectedDistanceId}
          onChange={(e) => setSelectedDistanceId(e.target.value)}
        >
          {/* Distâncias */}
          {distances.filter(distance => distance && distance.id).map((distance) => (
            <Card key={distance.id} sx={{ mb: 2 }}>
              <CardContent>
                <FormControlLabel
                  value={distance.id}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {distance.distance}{distance.unit}
                      </Typography>
                      <Chip 
                        label={`R$ ${(distance.price && !isNaN(Number(distance.price)) ? Number(distance.price) : 0).toFixed(2)}`} 
                        color="primary" 
                        size="small" 
                      />
                      {distance.maxParticipants && (
                        <Chip 
                          label={`Máx: ${distance.maxParticipants}`} 
                          variant="outlined" 
                          size="small" 
                        />
                      )}
                    </Box>
                  }
                />
              </CardContent>
            </Card>
          ))}
          
          {/* Categorias */}
          {categories.filter(category => category && category.id).map((category) => (
            <Card key={category.id} sx={{ mb: 2 }}>
              <CardContent>
                <FormControlLabel
                  value={category.id}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {category.name}
                      </Typography>
                      {category.date && (
                        <Chip 
                          label={new Date(category.date).toLocaleDateString('pt-BR')} 
                          color="secondary" 
                          size="small" 
                        />
                      )}
                    </Box>
                  }
                />
              </CardContent>
            </Card>
          ))}
        </RadioGroup>

        {distances.length === 0 && categories.length === 0 && (
          <Alert severity="info">
            Nenhuma opção disponível para esta prova.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={loading || !selectedDistanceId}
        >
          {loading ? <CircularProgress size={20} /> : 'Confirmar Inscrição'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 