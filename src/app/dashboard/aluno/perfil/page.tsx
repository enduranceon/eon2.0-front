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
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [initialFormData, setInitialFormData] = useState<Partial<ProfileData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // useEffect também deve vir antes de lógica condicional
  React.useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.push('/login');
    }
  }, [auth.isLoading, auth.user, router]);

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await enduranceApi.getProfile();
        setProfile(data);
      } catch (err) {
        console.error('❌ Erro ao carregar perfil:', err);
        setError('Erro ao carregar perfil. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    // Só carrega o perfil se o usuário estiver autenticado
    if (auth.user && !auth.isLoading) {
      loadProfile();
    }
  }, [auth.user, auth.isLoading]);

  
  if (auth.isLoading || !auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (auth.user.userType !== 'FITNESS_STUDENT') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Acesso não autorizado</Typography>
      </Box>
    );
  }

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
    if (!profile?.id) return;
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
      
      // Atualizar o contexto de autenticação para refletir as mudanças no header
      auth.updateProfile(changedData as Partial<User>);
      
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

  if (loading) {
    return (
      <DashboardLayout user={auth.user} onLogout={auth.logout}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress size={60} />
          </Box>
        </Container>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={auth.user} onLogout={auth.logout}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={auth.user} onLogout={auth.logout}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Profile content */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Meu Perfil
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualize e edite suas informações pessoais
          </Typography>
        </Box>

        {/* Profile form content */}
        {profile ? (
          <Grid container spacing={3}>
            {/* Foto do Perfil */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>
                  <Avatar
                    src={getAbsoluteImageUrl(profile.image || profile.avatar)}
                    sx={{ width: 120, height: 120, margin: '0 auto', mb: 2 }}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    <Tooltip title="Alterar foto">
                      <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        color="primary"
                      >
                        <PhotoCameraIcon />
                      </IconButton>
                    </Tooltip>
                    {(profile.image || profile.avatar) && (
                      <Tooltip title="Remover foto">
                        <IconButton
                          onClick={handleRemovePhoto}
                          disabled={isUploading}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  {isUploading && <CircularProgress size={24} sx={{ mt: 1 }} />}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {profile.name}
                </Typography>
                <Chip 
                  label={profile.userType === 'FITNESS_STUDENT' ? 'Aluno' : profile.userType}
                  color="primary"
                  size="small"
                />
              </Paper>
            </Grid>

            {/* Informações Pessoais */}
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Informações Pessoais
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={openEdit}
                  >
                    Editar
                  </Button>
                </Box>

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email"
                      secondary={profile.email}
                    />
                    {profile.emailVerified && (
                      <CheckCircleIcon color="success" fontSize="small" />
                    )}
                  </ListItem>

                  <Divider />

                  {profile.phone && (
                    <>
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Telefone"
                          secondary={profile.phone}
                        />
                      </ListItem>
                      <Divider />
                    </>
                  )}

                  {(profile.cpf || profile.cpfCnpj) && (
                    <>
                      <ListItem>
                        <ListItemText
                          primary="CPF"
                          secondary={profile.cpf || profile.cpfCnpj}
                        />
                      </ListItem>
                      <Divider />
                    </>
                  )}

                  {profile.birthDate && (
                    <>
                      <ListItem>
                        <ListItemText
                          primary="Data de Nascimento"
                          secondary={new Date(profile.birthDate).toLocaleDateString('pt-BR')}
                        />
                      </ListItem>
                      <Divider />
                    </>
                  )}

                  {mainAddress && (
                    <ListItem>
                      <ListItemIcon>
                        <HomeIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Endereço"
                        secondary={`${mainAddress.street}, ${mainAddress.number}${mainAddress.complement ? `, ${mainAddress.complement}` : ''} - ${mainAddress.neighborhood}, ${mainAddress.city}/${mainAddress.state} - CEP: ${mainAddress.zipCode}`}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>

            {/* Informações da Conta */}
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Informações da Conta
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Data de Criação
                    </Typography>
                    <Typography variant="body1">
                      {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Última Atualização
                    </Typography>
                    <Typography variant="body1">
                      {new Date(profile.updatedAt).toLocaleDateString('pt-BR')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status da Conta
                    </Typography>
                    <Chip 
                      label={profile.isActive ? 'Ativa' : 'Inativa'}
                      color={profile.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Nenhum dado de perfil encontrado
            </Typography>
          </Paper>
        )}

        {/* Modal de Edição */}
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="name"
                  label="Nome"
                  fullWidth
                  value={formData.name || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  value={formData.email || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Telefone"
                  fullWidth
                  value={formData.phone || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="cpf"
                  label="CPF"
                  fullWidth
                  value={formData.cpf || formData.cpfCnpj || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="birthDate"
                  label="Data de Nascimento"
                  type="date"
                  fullWidth
                  value={formData.birthDate ? formData.birthDate.split('T')[0] : ''}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              {/* Endereço */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  Endereço
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  name="address.street"
                  label="Rua"
                  fullWidth
                  value={formData.address?.street || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="address.number"
                  label="Número"
                  fullWidth
                  value={formData.address?.number || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="address.complement"
                  label="Complemento"
                  fullWidth
                  value={formData.address?.complement || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="address.neighborhood"
                  label="Bairro"
                  fullWidth
                  value={formData.address?.neighborhood || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="address.city"
                  label="Cidade"
                  fullWidth
                  value={formData.address?.city || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="address.state"
                  label="Estado"
                  fullWidth
                  value={formData.address?.state || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  name="address.zipCode"
                  label="CEP"
                  fullWidth
                  value={formData.address?.zipCode || ''}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} variant="contained">Salvar</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
} 