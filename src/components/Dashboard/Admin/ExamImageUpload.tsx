import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { enduranceApi } from '../../../services/enduranceApi';

interface ExamImageUploadProps {
  examId?: string;
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string | null) => void;
  disabled?: boolean;
}

export default function ExamImageUpload({ 
  examId, 
  currentImageUrl, 
  onImageUpdate, 
  disabled = false 
}: ExamImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de arquivo não suportado. Use JPEG, PNG, JPG ou WEBP.');
      return;
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB em bytes
    if (file.size > maxSize) {
      setError('Arquivo muito grande. Tamanho máximo: 5MB.');
      return;
    }

    handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    
    try {
      let response;
      if (examId) {
        console.log('Usando endpoint com examId:', examId);
        response = await enduranceApi.uploadExamImage(examId, file);
      } else {
        console.log('Usando endpoint sem examId (criação)');
        response = await enduranceApi.uploadExamImageWithoutId(file);
      }
      
      console.log('Resposta do upload:', response);
      // A resposta pode vir em diferentes formatos dependendo do endpoint
      const imageUrl = response.data?.imageUrl || response.imageUrl || null;
      onImageUpdate(imageUrl);
    } catch (err: any) {
      console.error('Erro ao fazer upload:', err);
      setError(err.response?.data?.message || 'Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setRemoving(true);
    setError(null);
    
    try {
      if (examId) {
        console.log('Removendo imagem do exame:', examId);
        await enduranceApi.removeExamImage(examId);
      } else {
        console.log('Removendo imagem localmente (sem examId)');
      }
      onImageUpdate(null);
    } catch (err: any) {
      console.error('Erro ao remover imagem:', err);
      setError(err.response?.data?.message || 'Erro ao remover a imagem.');
    } finally {
      setRemoving(false);
    }
  };

  const handleUpdateUrl = async () => {
    if (!urlValue.trim()) {
      setError('URL é obrigatória.');
      return;
    }

    if (!examId) {
      setError('Não é possível atualizar URL sem ID do exame.');
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      console.log('Atualizando URL da imagem do exame:', examId, 'Nova URL:', urlValue.trim());
      const response = await enduranceApi.updateExamImageUrl(examId, urlValue.trim());
      console.log('Resposta da atualização de URL:', response);
      const imageUrl = response.imageUrl || null;
      onImageUpdate(imageUrl);
      setShowUrlDialog(false);
      setUrlValue('');
    } catch (err: any) {
      console.error('Erro ao atualizar URL:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar URL da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openUrlDialog = () => {
    setUrlValue(currentImageUrl || '');
    setShowUrlDialog(true);
    setError(null);
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {currentImageUrl ? (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Imagem da Prova
                </Typography>
                <Box
                  component="img"
                  src={currentImageUrl}
                  alt="Imagem da prova"
                  sx={{
                    width: 120,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={openFileDialog}
                  disabled={disabled || uploading || removing}
                >
                  {uploading ? <CircularProgress size={16} /> : 'Alterar'}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  onClick={openUrlDialog}
                  disabled={disabled || uploading || removing || !examId}
                >
                  URL
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleRemoveImage}
                  disabled={disabled || uploading || removing || !examId}
                >
                  {removing ? <CircularProgress size={16} /> : 'Remover'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 2, border: '2px dashed', borderColor: 'divider' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Nenhuma imagem adicionada
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={openFileDialog}
                disabled={disabled || uploading}
              >
                {uploading ? <CircularProgress size={16} /> : 'Upload'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={openUrlDialog}
                disabled={disabled || uploading || !examId}
              >
                URL
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Dialog para inserir URL */}
      <Dialog open={showUrlDialog} onClose={() => setShowUrlDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Inserir URL da Imagem</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="URL da Imagem"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg"
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUrlDialog(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdateUrl} 
            variant="contained" 
            disabled={uploading || !urlValue.trim()}
          >
            {uploading ? <CircularProgress size={16} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
