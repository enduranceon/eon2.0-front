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
  IconButton,
  Tooltip,
  Divider,
  Card,
  CardContent,
  ListItemIcon,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import WebSocketAvatar from '../../../../components/WebSocketAvatar';
import {
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { enduranceApi } from '../../../../services/enduranceApi';
import Dialog from '@mui/material/Dialog';
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

interface AdminProfileData {
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
  userType: string;
  createdAt: string;
  updatedAt: string;
  address?: Address;
  addresses?: (Address & { isMain?: boolean })[];
}

export default function AdminPerfilPage() {
  const router = useRouter();
  const auth = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState<AdminProfileData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AdminProfileData>>({});

  // useEffect também deve vir antes de lógica condicional
  React.useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.push('/login');
    }
  }, [auth.isLoading, auth.user, router]);

  React.useEffect(() => {
    // Usar dados do AuthContext em vez de chamar a API diretamente
    if (auth.user && !auth.isLoading) {
      setProfile(auth.user);
      setLoading(false);
    }
  }, [auth.user, auth.isLoading]);

  
  if (auth.isLoading || !auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (auth.user.userType !== 'ADMIN') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Acesso negado. Esta página é apenas para administradores.
        </Alert>
      </Container>
    );
  }

  const getAbsoluteImageUrl = (url: string | undefined | null): string | undefined => {
    if (!url) return undefined;
    
    // Se já é uma URL absoluta, retornar como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Se é uma URL relativa, construir a URL completa
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${url}`;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    try {
      setIsUploading(true);
      const { url } = await enduranceApi.uploadFile(file, 'avatars');
      const updatedProfile = await enduranceApi.updateUser(profile.id, { image: url });
      setProfile(updatedProfile);
      
      // Atualizar o contexto de autenticação para refletir a mudança no header
      auth.updateProfile({ image: url });
    } catch (err) {
      console.error(err);
      alert('Falha ao fazer upload da imagem. Verifique o console para mais detalhes.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile) return;

    try {
      setIsUploading(true);
      const updatedProfile = await enduranceApi.updateUser(profile.id, { image: null });
      setProfile(updatedProfile);
      
      // Atualizar o contexto de autenticação para refletir a mudança no header
      auth.updateProfile({ image: null });
    } catch (err) {
      console.error(err);
      alert('Falha ao remover a foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = () => {
    if (!profile) return;
    
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      cpfCnpj: profile.cpfCnpj,
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!profile) return;

    try {
      const changedData = Object.keys(formData).reduce((acc, key) => {
        const value = formData[key as keyof AdminProfileData];
        if (value !== profile[key as keyof AdminProfileData]) {
          acc[key] = value;
        }
        return acc;
      }, {} as Partial<AdminProfileData>);

      if (Object.keys(changedData).length === 0) {
        setEditOpen(false);
        return;
      }

      const updatedProfile = await enduranceApi.updateUser(
        profile.id,
        changedData as Partial<User>
      );
      setProfile(updatedProfile);
      
      // Atualizar o contexto de autenticação para refletir as mudanças no header
      auth.updateProfile(changedData as Partial<User>);
      
      setEditOpen(false);
    } catch (err) {
      console.error(err);
      alert('Falha ao atualizar perfil');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getMainAddress = () => {
    if (!profile?.addresses || profile.addresses.length === 0) return null;
    return profile.addresses.find(addr => addr.isMain) || profile.addresses[0];
  };

  return (
    <DashboardLayout user={auth.user!} onLogout={auth.logout} overdueInfo={auth.overdueInfo}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Meu Perfil
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gerencie suas informações pessoais e configurações de conta
          </Typography>
        </Box>

        {/* Profile form content */}
        {profile ? (
          <Grid container spacing={3}>
            {/* Foto do Perfil */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  <WebSocketAvatar
                    userId={profile.id}
                    user={{
                      id: profile.id,
                      name: profile.name,
                      email: profile.email,
                      image: profile.image,
                      userType: 'ADMIN' as any,
                      isActive: true,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    }}
                    sx={{ width: 120, height: 120, margin: '0 auto', mb: 2 }}
                    showUpdateIndicator={true}
                    indicatorPosition="top"
                    indicatorSize="medium"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      size="small"
                    >
                      {isUploading ? 'Enviando...' : 'Alterar Foto'}
                    </Button>
                    {profile.image && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleRemovePhoto}
                        disabled={isUploading}
                        size="small"
                      >
                        Remover
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Informações do Perfil */}
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" component="h2">
                    Informações Pessoais
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEditClick}
                  >
                    Editar
                  </Button>
                </Box>

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <AdminIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Nome"
                      secondary={profile.name}
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email"
                      secondary={profile.email}
                    />
                  </ListItem>

                  {profile.phone && (
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Telefone"
                        secondary={profile.phone}
                      />
                    </ListItem>
                  )}

                  {profile.cpfCnpj && (
                    <ListItem>
                      <ListItemIcon>
                        <SecurityIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="CPF/CNPJ"
                        secondary={profile.cpfCnpj}
                      />
                    </ListItem>
                  )}

                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          label={profile.isActive ? 'Ativo' : 'Inativo'}
                          color={profile.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      }
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <SettingsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tipo de Usuário"
                      secondary="Administrador"
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Membro desde"
                      secondary={formatDate(profile.createdAt)}
                    />
                  </ListItem>
                </List>

                {/* Endereço Principal */}
                {getMainAddress() && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Endereço Principal
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <HomeIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${getMainAddress()?.street}, ${getMainAddress()?.number}`}
                          secondary={`${getMainAddress()?.neighborhood}, ${getMainAddress()?.city} - ${getMainAddress()?.state}`}
                        />
                      </ListItem>
                    </List>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} />
          </Box>
        )}

        {/* Dialog de Edição */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Telefone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="CPF/CNPJ"
                value={formData.cpfCnpj || ''}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                margin="normal"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEditSave} variant="contained">
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}
