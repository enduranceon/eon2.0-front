'use client';

import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LogoSymbol from '@/assets/images/logo/logo_simbolo_preto.png';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const router = useRouter();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header Centralizado */}
      <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'grey.200' }}>
        <Container maxWidth="sm">
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 2,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 }
            }}
            onClick={() => router.push('/')}
          >
            {/* Logo */}
            <Box>
              <Image 
                src={LogoSymbol} 
                alt="EnduranceOn Symbol" 
                width={80} 
                priority
                style={{ marginBottom: '0' }} 
              />
            </Box>
            
            {/* Nome da Empresa */}
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                color: 'primary.main',
                letterSpacing: '0.1em',
                margin: 0
              }}
            >
              EnduranceOn
            </Typography>
          </Box>
        </Container>
      </Box>
      
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      
      <Box component="footer" sx={{ py: 3, bgcolor: 'white', borderTop: '1px solid', borderColor: 'grey.200' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 EnduranceOn. Todos os direitos reservados.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
