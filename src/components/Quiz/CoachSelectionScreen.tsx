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
  FitnessCenter as FitnessIcon,
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
      const response = await enduranceApi.getCoaches();
      setCoaches(response.data || []);
    } catch (err) {
      console.error('❌ Erro ao carregar treinadores:', err);
      setError('Erro ao carregar treinadores');
    } finally {
      setLoading(false);
    }
  };

  const getCoachImagePath = (coach: User): string | undefined => {
    // Usar a imagem da API diretamente
    return coach.image;
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
      if (name.includes('triathlon') || name.includes('elinai') || name.includes('guto')) {
        return ['Triathlon', 'Natação', 'Ciclismo', 'Corrida'];
      } else if (name.includes('bruno') || name.includes('ian')) {
        return ['Corrida', 'Trail Running'];
      } else if (name.includes('jessica') || name.includes('thais')) {
        return ['Corrida', 'Triathlon'];
      } else if (name.includes('william') || name.includes('gabriel')) {
        return ['Fitness', 'Condicionamento'];
      }
      return ['Corrida', 'Condicionamento'];
    }
    
    return specialties;
  };

  const getPrimarySpecialty = (coach: User) => {
    const specialties = getCoachSpecialties(coach);
    return specialties[0] || 'Corrida';
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

  const getCoachBio = (coach: User) => {
    if (coach.bio) return coach.bio;
    
    // Bio padrão baseada no nível e especialidades
    const name = coach.name.split(' ')[0];
    const specialty = getPrimarySpecialty(coach);
    const experience = getCoachExperience(coach);
    
    return `${name} é um treinador especializado em ${specialty} com ${experience} de experiência. Dedica-se a ajudar atletas a alcançarem seus objetivos através de treinamentos personalizados e acompanhamento próximo.`;
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
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                '&:hover': {
                  boxShadow: theme.shadows[8],
                  transform: 'translateY(-4px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {/* Imagem do treinador - 70% da altura */}
              <Box
                sx={{
                  width: '100%',
                  height: '70%',
                  minHeight: '280px',
                  backgroundImage: `url(${getCoachImagePath(coach)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: theme.palette.grey[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {/* Fallback para quando não há imagem */}
                {!getCoachImagePath(coach) && (
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      color: theme.palette.grey[500],
                      fontWeight: 'bold',
                      zIndex: 1,
                    }}
                  >
                    {coach.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </Typography>
                )}
              </Box>

              {/* Conteúdo do card - 30% da altura */}
              <CardContent sx={{ 
                flexGrow: 1, 
                p: 2, 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: '30%'
              }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {coach.name}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  <Chip 
                    label={getPrimarySpecialty(coach)}
                    variant="outlined"
                    color="primary"
                  />
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0, flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleCoachSelect(coach)}
                  sx={{ 
                    fontWeight: 'bold', 
                    py: 1.2,
                    borderRadius: 2,
                  }}
                >
                  Selecionar
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<InfoIcon />}
                  onClick={() => handleDetailsClick(coach)}
                  sx={{ 
                    py: 1,
                    borderRadius: 2,
                  }}
                >
                  Conhecer
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
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Avatar
                    src={getCoachImagePath(modalData.coach)}
                    alt={modalData.coach.name}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mx: 'auto', 
                      mb: 2,
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      border: 3,
                      borderColor: 'primary.main',
                    }}
                  >
                    {modalData.coach.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </Avatar>
                  
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {modalData.coach.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                    <Chip 
                      label={getCoachLevelDisplay(modalData.coach.coachLevel).label}
                      color={getCoachLevelDisplay(modalData.coach.coachLevel).color}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Experiência
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getCoachExperience(modalData.coach)} de experiência em treinamento esportivo
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Sobre
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getCoachBio(modalData.coach)}
                  </Typography>
                </Box>

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
                    sx={{ fontWeight: 'bold', py: 1.2 }}
                  >
                    Selecionar este Treinador
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={closeModal}
                    sx={{ py: 1.2 }}
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