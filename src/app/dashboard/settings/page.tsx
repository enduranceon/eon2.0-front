'use client';

import React, { useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  useTheme,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { ColorModeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import DashboardLayout from '../../../components/Dashboard/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import NotificationSettingsCard from '../../../components/NotificationSettings/NotificationSettingsCard';
import NotificationTester from '../../../components/Notifications/NotificationTester';
import WebSocketEventTester from '../../../components/Debug/WebSocketEventTester';
import HighlightTester from '../../../components/Debug/HighlightTester';
import { Brightness4 as Brightness4Icon, Palette as PaletteIcon } from '@mui/icons-material';

export default function SettingsPage() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const auth = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout user={auth.user!} onLogout={auth.logout}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Configurações
          </Typography>
          
          {/* Configurações de Notificações */}
          <NotificationSettingsCard />
          
          {/* Testador de Notificações (apenas desenvolvimento) */}
          <NotificationTester />
          
          {/* Debug - Testador de Eventos WebSocket */}
          <WebSocketEventTester />
          
          {/* Debug - Testador de Destaque */}
          <HighlightTester />
          
          <Paper
            elevation={4}
            sx={{
              p: 2,
              mt: 2,
            }}
          >
            <Card sx={{ 
          background: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(30, 30, 30, 0.98)' 
            : 'rgba(255, 255, 255, 0.98)', 
          backdropFilter: 'blur(10px)' 
        }}>
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PaletteIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                  <Typography variant="h5" component="h2" fontWeight="bold">
                    Aparência
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Brightness4Icon />
                    </ListItemIcon>
                    <ListItemText
                      id="switch-list-label-dark-mode"
                      primary="Modo Escuro"
                      secondary="Ative para uma experiência visual com menos brilho."
                    />
                    <Switch
                      edge="end"
                      onChange={colorMode.toggleColorMode}
                      checked={theme.palette.mode === 'dark'}
                      inputProps={{
                        'aria-labelledby': 'switch-list-label-dark-mode',
                      }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Paper>
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 