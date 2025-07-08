'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
  Card,
  CardContent,
  ListItemIcon,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { enduranceApi } from '../../../../services/enduranceApi';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import { User } from '../../../../types/api';

interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
  cpf?: string;
  birthDate?: string;
  image?: string;
  avatar?: string;
  isActive?: boolean;
  walletId?: string;
  asaasCustomerId?: string;
  userType: string;
  coachLevel?: string;
  createdAt: string;
  updatedAt: string;
  address?: Address; // Legado, manter para compatibilidade
  addresses?: (Address & { isMain: boolean })[]; // Novo campo da API
}

export default function StudentProfilePage() {
  const auth = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<ProfileData | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getAbsoluteImageUrl = (url: string | undefined | null): string | undefined => {
    if (!url) return undefined;
    // Se já for uma URL completa (http, https) ou um blob local, retorne como está.
    if (/^(https?|blob):/.test(url)) {
      return url;
    }

    // Obtenha a origem da API (ex: http://localhost:3001)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const origin = new URL(apiUrl).origin;

    // Normalize o caminho da imagem para garantir que comece com /api/uploads/...
    let imagePath = url;
    
    // Remove qualquer prefixo /api/ para evitar duplicação e depois o adiciona de volta
    if (imagePath.startsWith('/api/')) {
      imagePath = imagePath.substring(5); // Remove '/api/'
    }
    if (imagePath.startsWith('/')) {
      imagePath = imagePath.substring(1); // Remove a barra inicial, se houver
    }
    
    // Garante que o caminho final seja /api/{caminho_restante}
    // Isso resolve tanto '/uploads/...' quanto 'uploads/...'
    const finalPath = `/api/${imagePath.startsWith('uploads') ? '' : 'uploads/'}${imagePath}`;
    
    return `${origin}${finalPath.replace('/api//', '/api/')}`; // Limpeza final para barras duplas
  };

  // Edit dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<Partial<ProfileData>>({});
  const [initialFormData, setInitialFormData] = React.useState<Partial<ProfileData>>({});

  // Deriva o endereço principal do novo formato de dados
  const mainAddress = profile?.addresses?.find(addr => addr.isMain) || profile?.address;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      setIsUploading(true);
      const { url } = await enduranceApi.uploadFile(file, 'avatars');
      const updatedProfile = await enduranceApi.updateUser(profile.id, { image: url });
      setProfile(updatedProfile);
    } catch (err) {
      console.error(err);
      alert('Falha ao fazer upload da imagem. Verifique o console para mais detalhes.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile?.id) return;
    try {
      setIsUploading(true);
      const updatedProfile = await enduranceApi.updateUser(profile.id, { image: null });
      setProfile(updatedProfile);
    } catch (err) {
      console.error(err);
      alert('Falha ao remover a foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const openEdit = () => {
    if (!profile) return;
    const initialData = {
      ...profile,
      address: mainAddress ? { ...mainAddress } : undefined,
    };
    setFormData(initialData);
    setInitialFormData(initialData);
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!profile?.id) return;

      const getChangedFields = (
        initial: Partial<ProfileData>,
        current: Partial<ProfileData>
      ): Partial<ProfileData> => {
        const changes: Partial<ProfileData> = {};

        Object.keys(current).forEach((keyStr) => {
          const key = keyStr as keyof ProfileData;
          if (key !== 'address' && key !== 'addresses') {
            if (initial[key] !== current[key]) {
              (changes as any)[key] = current[key];
            }
          }
        });

        if (
          current.address &&
          (!initial.address || JSON.stringify(initial.address) !== JSON.stringify(current.address))
        ) {
          changes.address = current.address;
        }

        return changes;
      };

      const changedData = getChangedFields(initialFormData, formData);

      if (Object.keys(changedData).length === 0) {
        setEditOpen(false);
        return; // Nenhum dado alterado
      }

      // Transforma o 'address' alterado no formato 'addresses' esperado pela API
      if (changedData.address) {
        (changedData as any).addresses = [{ ...changedData.address, isMain: true }];
        delete changedData.address;
      }
      
      const updatedProfile = await enduranceApi.updateUser(
        profile.id,
        changedData as Partial<User>
      );
      setProfile(updatedProfile);
      setEditOpen(false);
    } catch (err) {
      console.error(err);
      alert('Falha ao atualizar perfil');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev?.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await enduranceApi.getProfile();
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [auth]);

  if (loading) {
    return (
      <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>
        <DashboardLayout user={auth.user!} onLogout={auth.logout}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <CircularProgress size={60} />
            </Box>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>
        <DashboardLayout user={auth.user!} onLogout={auth.logout}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          </Container>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>
      <DashboardLayout user={auth.user!} onLogout={auth.logout}>
        <Container maxWidth="md" sx={{ py: 4 }}>
          {!profile ? (
            <Alert severity="info">Não foi possível carregar os dados do perfil.</Alert>
          ) : (
            <Paper 
              elevation={3} 
              sx={{ 
                p: { xs: 2, md: 3 },
                border: (theme) => (theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'),
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', mb: 2, textAlign: 'center' }}>
                Meu Perfil
              </Typography>
              <Card sx={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)' }}>
                <CardContent sx={{ textAlign: 'center', p: { xs: 2, md: 3 } }}>
                  <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                    <Avatar
                      src={getAbsoluteImageUrl(profile.image)}
                      alt={profile.name}
                      sx={{
                        width: 120,
                        height: 120,
                        margin: '0 auto',
                        border: '4px solid',
                        borderColor: 'primary.main',
                        boxShadow: 3,
                      }}
                    />
                    <Box sx={{ position: 'absolute', bottom: 0, right: -10 }}>
                      <Tooltip title="Alterar foto">
                        <IconButton
                          size="small"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          sx={{
                            bgcolor: 'background.paper',
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.main', color: 'white' },
                          }}
                        >
                          {isUploading ? <CircularProgress size={20} /> : <PhotoCameraIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      {profile.image && (
                        <Tooltip title="Remover foto">
                          <IconButton
                            size="small"
                            onClick={handleRemovePhoto}
                            disabled={isUploading}
                            sx={{
                              bgcolor: 'background.paper',
                              color: 'error.main',
                              '&:hover': { bgcolor: 'error.main', color: 'white' },
                              ml: 1,
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      hidden
                      accept="image/*"
                    />
                  </Box>

                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    {profile.name}
                  </Typography>

                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label={profile.isActive ? 'Ativo' : 'Inativo'}
                    color={profile.isActive ? 'success' : 'default'} 
                    size="small" 
                    sx={{ mt: 1, fontWeight: 'bold' }}
                  />

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ textAlign: 'left', color: 'text.secondary' }}>
                    <List dense>
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                          <EmailIcon />
                        </ListItemIcon>
                        <ListItemText primary="Email" secondary={profile.email} />
                      </ListItem>
                      {profile.phone && (
                        <ListItem>
                          <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                            <PhoneIcon />
                          </ListItemIcon>
                          <ListItemText primary="Telefone" secondary={profile.phone} />
                        </ListItem>
                      )}
                      {mainAddress && (
                        <ListItem>
                          <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                            <HomeIcon />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Endereço Principal" 
                            secondary={`${mainAddress.street}, ${mainAddress.number} - ${mainAddress.city}, ${mainAddress.state}`} 
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>

                  <Button variant="contained" sx={{ mt: 3 }} startIcon={<EditIcon />} onClick={openEdit}>
                    Editar Perfil
                  </Button>
                </CardContent>
              </Card>
            </Paper>
          )}

          {/* Edit Dialog */}
          <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle color="text.primary">Editar Perfil</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                Faça as alterações nos seus dados cadastrais.
              </DialogContentText>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField name="name" label="Nome Completo" value={formData.name || ''} onChange={handleChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="cpf" label="CPF" value={formData.cpf || ''} onChange={handleChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="birthDate" label="Data de Nascimento" type="date" value={formData.birthDate ? new Date(formData.birthDate).toISOString().split('T')[0] : ''} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField name="phone" label="Telefone" value={formData.phone || ''} onChange={handleChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}><Chip label="Endereço Principal" /></Divider>
                </Grid>
                <Grid item xs={12}>
                  <TextField name="address.street" label="Rua" value={formData.address?.street || ''} onChange={handleChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="address.number" label="Número" value={formData.address?.number || ''} onChange={handleChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="address.complement" label="Complemento" value={formData.address?.complement || ''} onChange={handleChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12}>
                  <TextField name="address.neighborhood" label="Bairro" value={formData.address?.neighborhood || ''} onChange={handleChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="address.city" label="Cidade" value={formData.address?.city || ''} onChange={handleChange} fullWidth margin="normal" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField name="address.state" label="Estado" value={formData.address?.state || ''} onChange={handleChange} fullWidth margin="normal" />
                </Grid>
                 <Grid item xs={12}>
                  <TextField name="address.zipCode" label="CEP" value={formData.address?.zipCode || ''} onChange={handleChange} fullWidth margin="normal" />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} variant="contained">Salvar Alterações</Button>
            </DialogActions>
          </Dialog>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 