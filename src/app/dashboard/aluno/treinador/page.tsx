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
      if (coach.image.startsWith('http')) {
        return coach.image;
      }
      
      // Se for um caminho que começa com /api/, construir URL completa
      if (coach.image.startsWith('/api/')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        return `${apiUrl}${coach.image}`;
      }
      
      // Se for um caminho relativo sem /api/, adicionar /api/uploads/
      if (!coach.image.startsWith('/')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        return `${apiUrl}/api/uploads/${coach.image}`;
      }
      
      // Se for um caminho relativo com /, adicionar /api
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      return `${apiUrl}/api${coach.image}`;
    }
    
    // Mapeamento expandido de nomes para imagens locais
    const nameImageMap: { [key: string]: string } = {
      'Ian Ribeiro': '/images/treinadores/ian-ribeiro.jpg',
      'Ian': '/images/treinadores/ian-ribeiro.jpg',
      'Guto Fernandes': '/images/treinadores/guto-fernandes.jpg',
      'Guto': '/images/treinadores/guto.jpg',
      'Augusto Fernandes': '/images/treinadores/guto.jpg',
      'Elinai Freitas': '/images/treinadores/elinai-freitas.jpg',
      'Elinai': '/images/treinadores/elinai.jpg',
      'Luis Fernando': '/images/treinadores/luis-fernando.jpg',
      'Luis': '/images/treinadores/luis-fernando.jpg',
      'Jessica Rodrigues': '/images/treinadores/jessica-rodrigues.jpg',
      'Jessica': '/images/treinadores/jessica-rodrigues.jpg',
      'William Dutra': '/images/treinadores/william-dutra.jpg',
      'William': '/images/treinadores/william.jpg',
      'Gabriel Hermann': '/images/treinadores/gabriel-hermann.jpg',
      'Gabriel': '/images/treinadores/gabriel-hermann.jpg',
      'Bruno Jeremias': '/images/treinadores/bruno-jeremias.jpg',
      'Bruno': '/images/treinadores/bruno-jeremias.jpg',
      'Thais Prando': '/images/treinadores/thais-prando.jpg',
      'Thaís Prando': '/images/treinadores/thais-prando.jpg',
      'Thais': '/images/treinadores/thais-prando.jpg',
      'Thaís': '/images/treinadores/thais-prando.jpg',
    };

    // Tentar encontrar a imagem pelo nome exato primeiro
    if (nameImageMap[coach.name]) {
      return nameImageMap[coach.name];
    }

    // Busca mais flexível por palavras-chave
    const coachWords = coach.name.toLowerCase().split(' ');
    for (const word of coachWords) {
      if (word.length > 2) { // Ignorar palavras muito curtas
        for (const [mappedName, imagePath] of Object.entries(nameImageMap)) {
          const mappedWords = mappedName.toLowerCase().split(' ');
          if (mappedWords.some(mappedWord => mappedWord.includes(word) || word.includes(mappedWord))) {
            return imagePath;
          }
        }
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
          // Se a assinatura já tem dados completos do coach, usar diretamente
          if (sub.coach.name && sub.coach.email) {
            setCoach(sub.coach);
            
            // Debug: verificar imagem do coach
            const imagePath = getCoachImagePath(sub.coach);
          } else if (sub.coachId) {
            // Se não tem dados completos, buscar pelo ID
            try {
              const fullCoachProfile = await enduranceApi.getCoach(sub.coachId);
              setCoach(fullCoachProfile);
              
              // Debug: verificar imagem do coach
              const imagePath = getCoachImagePath(fullCoachProfile);
            } catch (coachErr) {
              console.warn('Erro ao buscar dados completos do coach:', coachErr);
              // Usar os dados básicos da assinatura
              setCoach(sub.coach);
              
              // Debug: verificar imagem do coach (fallback)
              const imagePath = getCoachImagePath(sub.coach);
            }
          }
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

  const handleSendWhatsApp = () => {
    if (coach?.phone && coach.phone.trim() !== '') {
      // Remove non-numeric characters and create WhatsApp link
      let phone = coach.phone.replace(/\D/g, '');
      
      // Se o telefone não começar com código do país, adicionar +55 (Brasil)
      if (!phone.startsWith('55') && phone.length <= 11) {
        phone = '55' + phone;
      }
      
      // Se não tiver o +, adicionar
      if (!phone.startsWith('+')) {
        phone = '+' + phone;
      }
      
      const whatsappUrl = `https://wa.me/${phone}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleSendEmail = () => {
    if (coach?.email) {
      const emailUrl = `mailto:${coach.email}?subject=Contato via Plataforma Endurance`;
      window.open(emailUrl, '_blank');
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
            <Card sx={{ 
              background: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(30, 30, 30, 0.98)' 
                : 'rgba(255, 255, 255, 0.98)', 
              backdropFilter: 'blur(10px)' 
            }}>
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
                    bgcolor: 'primary.main',
                  }}
                  onError={(e) => {
                    // Se a imagem falhar ao carregar, remover o src para mostrar o fallback
                    const target = e.target as HTMLImageElement;
                    target.src = '';
                  }}
                >
                  {/* Fallback para quando não há imagem */}
                  {coach.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
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
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button 
                    variant="contained" 
                    color="success"
                    startIcon={<WhatsAppIcon />} 
                    onClick={handleSendWhatsApp} 
                    disabled={!coach.phone || coach.phone.trim() === ''}
                  >
                    WhatsApp
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="primary"
                    startIcon={<EmailIcon />} 
                    onClick={handleSendEmail} 
                    disabled={!coach.email || coach.email.trim() === ''}
                  >
                    Email
                  </Button>
                </Box>

              </CardContent>
            </Card>
          </Paper>
        )}
      </Container>
    </DashboardLayout>
  );
} 