'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Modal,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  Avatar,
  Rating,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  School as EducationIcon,
  DirectionsRun as RunIcon,
  Pool as TriathlonIcon,
} from '@mui/icons-material';
import { enduranceApi } from '../../services/enduranceApi';
import { User, UserType, CoachLevel } from '../../types/api';

interface CoachSelectionScreenProps {
  onCoachSelected: (coach: User) => void;
  onBack?: () => void;
}

interface CoachModalData {
  coach: User;
  isOpen: boolean;
}

const CoachSelectionScreen: React.FC<CoachSelectionScreenProps> = ({ onCoachSelected, onBack }) => {
  const theme = useTheme();
  const [coaches, setCoaches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalData, setModalData] = useState<CoachModalData | null>(null);

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await enduranceApi.getCoaches({
        isActive: true,
        limit: 50,
      });

      console.log('👥 Treinadores carregados:', response);
      const coachesData = response.data || [];
      setCoaches(coachesData);
    } catch (err) {
      console.error('❌ Erro ao carregar treinadores:', err);
      setError('Erro ao carregar treinadores. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getCoachLevelDisplay = (level: CoachLevel | undefined) => {
    const levelMap = {
      [CoachLevel.JUNIOR]: { label: 'Júnior', color: 'default' as const },
      [CoachLevel.PLENO]: { label: 'Pleno', color: 'primary' as const },
      [CoachLevel.SENIOR]: { label: 'Sênior', color: 'secondary' as const },
      [CoachLevel.ESPECIALISTA]: { label: 'Especialista', color: 'success' as const },
    };
    
    return levelMap[level || CoachLevel.JUNIOR];
  };

  const getCoachSpecialties = (coach: User) => {
    // Especialidades baseadas no nome ou dados do coach
    const specialties = coach.specialties || [];
    
    if (specialties.length === 0) {
      // Especialidades padrão baseadas no nome
      const name = coach.name.toLowerCase();
      if (name.includes('triathlon')) {
        return ['Triathlon', 'Natação', 'Ciclismo', 'Corrida'];
      }
      return ['Corrida', 'Condicionamento', 'Performance'];
    }
    
    return specialties;
  };

  const getCoachRating = (coach: User) => {
    // Rating fictício baseado no nível do coach
    const ratingMap = {
      [CoachLevel.JUNIOR]: 4.2,
      [CoachLevel.PLENO]: 4.5,
      [CoachLevel.SENIOR]: 4.7,
      [CoachLevel.ESPECIALISTA]: 4.9,
    };
    
    return ratingMap[coach.coachLevel || CoachLevel.JUNIOR];
  };

  const getCoachExperience = (coach: User) => {
    // Experiência baseada no nível do coach
    const experienceMap = {
      [CoachLevel.JUNIOR]: '1-2 anos',
      [CoachLevel.PLENO]: '3-5 anos',
      [CoachLevel.SENIOR]: '6-10 anos',
      [CoachLevel.ESPECIALISTA]: '10+ anos',
    };
    
    return experienceMap[coach.coachLevel || CoachLevel.JUNIOR];
  };

  const handleCoachSelect = (coach: User) => {
    console.log('✅ Treinador selecionado:', coach);
    onCoachSelected(coach);
  };

  const handleDetailsClick = (coach: User) => {
    setModalData({
      coach,
      isOpen: true
    });
  };

  const closeModal = () => {
    setModalData(null);
  };

  const getCertifications = (coach: User) => {
    const certifications = coach.certifications || [];
    
    if (certifications.length === 0) {
      // Certificações padrão baseadas no nível
      const defaultCerts = {
        [CoachLevel.JUNIOR]: ['CREF', 'Corrida Básica'],
        [CoachLevel.PLENO]: ['CREF', 'Treinamento Esportivo', 'Fisiologia do Exercício'],
        [CoachLevel.SENIOR]: ['CREF', 'Treinamento Avançado', 'Nutrição Esportiva', 'Psicologia do Esporte'],
        [CoachLevel.ESPECIALISTA]: ['CREF', 'Mestrado/Doutorado', 'Treinamento Alto Rendimento', 'Biomecânica'],
      };
      
      return defaultCerts[coach.coachLevel || CoachLevel.JUNIOR];
    }
    
    return certifications;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={loadCoaches} sx={{ ml: 2 }}>
          Tentar novamente
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Escolha seu Treinador
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Selecione o treinador que melhor se adequa ao seu perfil
        </Typography>
      </Box>

      {onBack && (
        <Box sx={{ mb: 3 }}>
          <Button onClick={onBack} variant="outlined">
            ← Voltar
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {coaches.map((coach) => (
          <Grid item xs={12} sm={6} md={4} key={coach.id}>
            <Card 
              sx={{ 
                minHeight: 550,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                '&:hover': {
                  boxShadow: theme.shadows[8],
                  transform: 'translateY(-4px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar
                    src={coach.image}
                    alt={coach.name}
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mx: 'auto', 
                      mb: 2,
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {coach.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </Avatar>
                  
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {coach.name}
                  </Typography>
                  
                  <Chip 
                    label={getCoachLevelDisplay(coach.coachLevel).label}
                    color={getCoachLevelDisplay(coach.coachLevel).color}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Rating 
                      value={getCoachRating(coach)} 
                      readOnly 
                      precision={0.1} 
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {getCoachRating(coach)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Experiência: {getCoachExperience(coach)}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {getCoachSpecialties(coach).slice(0, 3).map((specialty, index) => (
                      <Chip
                        key={index}
                        label={specialty}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                </Box>

                {coach.bio && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {coach.bio}
                  </Typography>
                )}
              </CardContent>

              <CardActions sx={{ p: 3, pt: 0, flexDirection: 'column', gap: 1, mt: 'auto' }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleCoachSelect(coach)}
                  sx={{ fontWeight: 'bold', py: 1.2 }}
                >
                  Selecionar
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<InfoIcon />}
                  onClick={() => handleDetailsClick(coach)}
                  sx={{ py: 1 }}
                >
                  Detalhes
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {coaches.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Nenhum treinador disponível no momento
          </Typography>
        </Box>
      )}

      {/* Modal de Detalhes */}
      <Modal
        open={modalData?.isOpen || false}
        onClose={closeModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">
                Perfil do Treinador
              </Typography>
              <Button onClick={closeModal} sx={{ minWidth: 'auto', p: 1 }}>
                <CloseIcon />
              </Button>
            </Box>

            {modalData && (
              <>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar
                    src={modalData.coach.image}
                    alt={modalData.coach.name}
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      mx: 'auto', 
                      mb: 2,
                      fontSize: '2.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {modalData.coach.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </Avatar>
                  
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {modalData.coach.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
                    <Chip 
                      label={getCoachLevelDisplay(modalData.coach.coachLevel).label}
                      color={getCoachLevelDisplay(modalData.coach.coachLevel).color}
                    />
                    <Rating 
                      value={getCoachRating(modalData.coach)} 
                      readOnly 
                      precision={0.1} 
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {getCoachRating(modalData.coach)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Experiência
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getCoachExperience(modalData.coach)} de experiência em treinamento esportivo
                  </Typography>
                </Box>

                {modalData.coach.bio && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Sobre
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {modalData.coach.bio}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Especialidades
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {getCoachSpecialties(modalData.coach).map((specialty, index) => (
                      <Chip
                        key={index}
                        label={specialty}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Certificações
                  </Typography>
                  <List dense>
                    {getCertifications(modalData.coach).map((cert, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <EducationIcon color="primary" sx={{ fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText primary={cert} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      handleCoachSelect(modalData.coach);
                      closeModal();
                    }}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Selecionar este Treinador
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={closeModal}
                  >
                    Fechar
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Modal>
    </Box>
  );
};

export default CoachSelectionScreen; 