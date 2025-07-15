'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Star as StarIcon,
  Email as EmailIcon,
  Info as InfoIcon,
  DirectionsRun as RunIcon,
  School as CertificateIcon,
  FitnessCenter as SpecialityIcon,
} from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { enduranceApi } from '../../../../services/enduranceApi';
import { User } from '../../../../types/api';

export default function StudentCoachPage() {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coach, setCoach] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  // Redirecionar para login se usuário não estiver autenticado
  React.useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      router.push('/login');
    }
  }, [auth.isLoading, auth.user, router]);

  const getCoachImagePath = (coach: User): string | undefined => {
    if (!coach) return undefined;
    
    // Verificar se o coach tem uma imagem da API
    if (coach.image) {
      // Se for uma URL completa, usar diretamente
      if (coach.image.startsWith('http') || coach.image.startsWith('/api/')) {
        return coach.image;
      }
      // Se for um caminho relativo, prefixar com o domínio da API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      return `${apiUrl}${coach.image.startsWith('/') ? '' : '/'}${coach.image}`;
    }
    
    // Mapeamento de nomes para imagens locais (baseado nos arquivos disponíveis)
    const nameImageMap: { [key: string]: string } = {
      'Ian Ribeiro': '/images/treinadores/ian-ribeiro.jpg',
      'Guto Fernandes': '/images/treinadores/guto-fernandes.jpg',
      'Augusto Fernandes': '/images/treinadores/guto.jpg',
      'Elinai Freitas': '/images/treinadores/elinai-freitas.jpg',
      'Elinai': '/images/treinadores/elinai.jpg',
      'Luis Fernando': '/images/treinadores/luis-fernando.jpg',
      'Jessica Rodrigues': '/images/treinadores/jessica-rodrigues.jpg',
      'William Dutra': '/images/treinadores/william-dutra.jpg',
      'William': '/images/treinadores/william.jpg',
      'Gabriel Hermann': '/images/treinadores/gabriel-hermann.jpg',
      'Bruno Jeremias': '/images/treinadores/bruno-jeremias.jpg',
      'Thais Prando': '/images/treinadores/thais-prando.jpg',
      'Thaís Prando': '/images/treinadores/thais-prando.jpg',
    };

    // Tentar encontrar a imagem pelo nome exato primeiro
    if (nameImageMap[coach.name]) {
      return nameImageMap[coach.name];
    }

    // Se não encontrar, tentar buscar por nome similar (normalização)
    const normalizedCoachName = coach.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    for (const [mappedName, imagePath] of Object.entries(nameImageMap)) {
      const normalizedMappedName = mappedName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalizedCoachName.includes(normalizedMappedName) || normalizedMappedName.includes(normalizedCoachName)) {
        return imagePath;
      }
    }

    return undefined;
  };

  React.useEffect(() => {
    const loadCoach = async () => {
      try {
        setLoading(true);
        const sub = await enduranceApi.getActiveSubscription();
        setSubscription(sub);
        if (sub && sub.coach) {
          // Fetch full coach details
          const fullCoachProfile = await enduranceApi.getCoach(sub.coach.id);
          setCoach(fullCoachProfile);
        }
      } catch (err) {
        console.error('Erro ao carregar coach:', err);
        setError('Erro ao carregar informações do treinador');
      } finally {
        setLoading(false);
      }
    };
    loadCoach();
  }, []);

  const handleSendMessage = () => {
    if (coach?.phone) {
      // Remove non-numeric characters and create WhatsApp link
      const phone = coach.phone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phone}`;
      window.open(whatsappUrl, '_blank');
    }
  };



  // Verificação simples de autenticação (substitui ProtectedRoute)
  if (auth.isLoading || !auth.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
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

  if (loading) {
    return (
      <DashboardLayout user={auth.user!} onLogout={auth.logout}>
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
      <DashboardLayout user={auth.user!} onLogout={auth.logout}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        </Container>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={auth.user!} onLogout={auth.logout}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {!coach ? (
          <Alert severity="info">Nenhum treinador associado à sua assinatura.</Alert>
        ) : (
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              border: (theme) => (theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'),
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', mb: 2, textAlign: 'center' }}>
              Seu Treinador
            </Typography>
            <Card sx={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  src={getCoachImagePath(coach)}
                  alt={coach.name}
                  sx={{
                    width: 120,
                    height: 120,
                    margin: '0 auto',
                    mb: 2,
                    border: '4px solid',
                    borderColor: 'primary.main',
                    boxShadow: 3,
                    fontSize: '2rem',
                    fontWeight: 'bold',
                  }}
                >
                  {/* Fallback para quando não há imagem */}
                  {coach.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </Avatar>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                  {coach.name}
                </Typography>
                {coach.coachLevel && (
                  <Chip 
                    icon={<StarIcon />} 
                    label={coach.coachLevel} 
                    color="primary" 
                    variant="filled"
                    sx={{ mt: 1, fontWeight: 'bold', color: 'white' }}
                  />
                )}
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ textAlign: 'left', color: 'text.secondary' }}>
                  {coach.bio && (
                    <>
                      <List dense>
                         <ListItem>
                          <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}><InfoIcon /></ListItemIcon>
                          <ListItemText primary="Sobre" primaryTypographyProps={{ fontWeight: 'bold' }} secondary={coach.bio} secondaryTypographyProps={{ component: 'div', whiteSpace: 'pre-wrap' }} />
                        </ListItem>
                      </List>
                      <Divider sx={{ my: 1 }} variant="inset" />
                    </>
                  )}

                  <List dense>
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                        <EmailIcon />
                      </ListItemIcon>
                      <ListItemText primary="Email" secondary={coach.email} />
                    </ListItem>
                    {coach.phone && (
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                          <PhoneIcon />
                        </ListItemIcon>
                        <ListItemText primary="Telefone" secondary={coach.phone} />
                      </ListItem>
                    )}
                    {subscription.modalidade && (
                      <ListItem>
                        <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                          <RunIcon />
                        </ListItemIcon>
                        <ListItemText primary="Plano Contratado" secondary={subscription.modalidade.name} />
                      </ListItem>
                    )}
                  </List>

                  {coach.specialties && Array.isArray(coach.specialties) && coach.specialties.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} variant="inset" />
                      <List dense>
                        <ListItem>
                           <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}><SpecialityIcon /></ListItemIcon>
                          <ListItemText primary="Especialidades" primaryTypographyProps={{ fontWeight: 'bold' }} secondary={
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                              {coach.specialties.map((spec, index) => (
                                <Chip key={index} label={spec} size="small" />
                              ))}
                            </Box>
                          } secondaryTypographyProps={{ component: 'div' }} />
                        </ListItem>
                      </List>
                    </>
                  )}

                  {coach.certifications && Array.isArray(coach.certifications) && coach.certifications.length > 0 && (
                     <>
                      <Divider sx={{ my: 1 }} variant="inset" />
                      <List dense>
                        <ListItem>
                           <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}><CertificateIcon /></ListItemIcon>
                          <ListItemText primary="Certificações" primaryTypographyProps={{ fontWeight: 'bold' }} secondary={
                             <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                              {coach.certifications.map((cert, index) => (
                                <Chip key={index} label={cert} size="small" variant="outlined" />
                              ))}
                            </Box>
                          } secondaryTypographyProps={{ component: 'div' }} />
                        </ListItem>
                      </List>
                    </>
                  )}

                </Box>
                <Button variant="contained" sx={{ mt: 3 }} startIcon={<WhatsAppIcon />} onClick={handleSendMessage} disabled={!coach.phone}>
                  Enviar Mensagem
                </Button>
              </CardContent>
            </Card>
          </Paper>
        )}
      </Container>
    </DashboardLayout>
  );
} 