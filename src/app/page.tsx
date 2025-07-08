'use client';

import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import Image from 'next/image';
import NextLink from 'next/link';
import Logo from '@/assets/images/logo/logo_simbolo_preto.png';

export default function HomePage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) => theme.palette.background.default,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'text.primary',
        p: 3,
      }}
    >
      <Container maxWidth="md">
        <Image 
          src={Logo} 
          alt="EnduranceOn Logo Symbol" 
          width={240} 
          style={{ marginBottom: '32px' }}
        />
        
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ mb: 2, color: 'text.primary' }}
        >
          Sua plataforma completa para assessoria esportiva
        </Typography>
        
        <Typography 
          variant="h6" 
          component="p"
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
        >
          Conectamos atletas e treinadores de corrida e triathlon para levar seu desempenho ao próximo nível.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary"
            component={NextLink}
            href="/login"
            size="large"
          >
            Acessar Plataforma
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            component={NextLink}
            href="/register"
            size="large"
          >
            Começar Agora
          </Button>
        </Box>
      </Container>
    </Box>
  );
} 