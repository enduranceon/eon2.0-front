'use client';

import React from 'react';
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
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { enduranceApi } from '../../../../services/enduranceApi';
import { 
  Star as StarIcon, 
  Email as EmailIcon, 
  Phone as PhoneIcon,
  DirectionsRun as RunIcon,
  ChatBubble as ChatIcon,
  Info as InfoIcon,
  WorkspacePremium as CertificateIcon,
  FitnessCenter as SpecialityIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { User } from '@/types/api';

export default function StudentCoachPage() {
  const auth = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [coach, setCoach] = React.useState<User | null>(null);
  const [subscription, setSubscription] = React.useState<any>(null);

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
        console.error(err);
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
          {!coach ? (
            <Alert severity="info">Nenhum treinador associado à sua assinatura.</Alert>
          ) : (
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 4,
                background: (theme) => theme.palette.mode === 'dark' ? 'none' : theme.colors.gradient.primary,
                border: (theme) => (theme.palette.mode === 'dark' ? `1px solid ${theme.palette.divider}` : 'none'),
              }}
            >
              <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'white', mb: 2, textAlign: 'center' }}>
                Seu Treinador
              </Typography>
              <Card sx={{ borderRadius: 3, background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={coach.image || '/default-avatar.png'}
                    alt={coach.name}
                    sx={{
                      width: 120,
                      height: 120,
                      margin: '0 auto',
                      mb: 2,
                      border: '4px solid',
                      borderColor: 'primary.main',
                      boxShadow: 3,
                    }}
                  />
                  <Typography variant="h5" fontWeight="bold" color="text.primary">
                    {coach.name}
                  </Typography>
                  {coach.coachLevel && (
                    <Chip 
                      icon={<StarIcon />} 
                      label={coach.coachLevel} 
                      color="primary" 
                      variant="filled"
                      sx={{ mt: 1, fontWeight: 'bold', background: (theme) => theme.colors.gradient.secondary, color: 'white' }}
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

                    {coach.specialties && coach.specialties.length > 0 && (
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

                    {coach.certifications && coach.certifications.length > 0 && (
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
    </ProtectedRoute>
  );
} 