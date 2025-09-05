'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Login as LoginIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import PublicLayout from '../../components/PublicLayout';

function RegistrationSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  return (
    <PublicLayout>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />
          </Box>
          
          <Typography variant="h4" component="h1" gutterBottom color="success.main">
            Cadastro Realizado com Sucesso!
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mb: 3 }}>
            Seu cadastro foi realizado com sucesso. Agora você pode fazer login na plataforma 
            e começar a usar todos os recursos disponíveis.
          </Typography>

          {message === 'registration-success' && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Sua conta foi criada e você já pode fazer login!
            </Alert>
          )}

          <Card sx={{ mb: 4, bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Próximos Passos:
              </Typography>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" paragraph>
                  1. Faça login com seu email e senha
                </Typography>
                <Typography variant="body2" paragraph>
                  2. Complete seu perfil no dashboard
                </Typography>
                <Typography variant="body2" paragraph>
                  3. Explore os recursos da plataforma
                </Typography>
                <Typography variant="body2">
                  4. Entre em contato com seu treinador
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={() => router.push('/login')}
                size="large"
              >
                Fazer Login
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={() => router.push('/')}
                size="large"
              >
                Voltar ao Início
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </PublicLayout>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={
      <PublicLayout>
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6">Carregando...</Typography>
          </Paper>
        </Container>
      </PublicLayout>
    }>
      <RegistrationSuccessContent />
    </Suspense>
  );
}
