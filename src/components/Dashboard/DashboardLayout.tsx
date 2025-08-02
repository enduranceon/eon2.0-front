'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  Divider,
  Container,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  DirectionsRun as RunIcon,
  Sports as SportsIcon,
  MonetizationOn as MoneyIcon,
  Analytics as AnalyticsIcon,
  ManageAccounts as ManageAccountsIcon,
  Receipt as ReceiptIcon,
  PersonAdd as PersonAddIcon,
  EmojiEvents as EventsIcon,
  Quiz as TestIcon,
  Assignment as AssignmentIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Percent as PercentIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  Assessment as AssessmentIcon,
  SmartToy as AIIcon,
  Close as CloseIcon,
  Group as GroupIcon,
  Add as AddIcon,
  Science as ScienceIcon,
  CalendarToday as CalendarIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import NotificationCenter from './NotificationCenter';
import AINotificationPanel from './AINotificationPanel';
import { User, UserType } from '../../types/api';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import NavigationLoader from '../NavigationLoader';
import { useLoading } from '@/contexts/LoadingContext';
import { useAINotifications } from '../../contexts/AINotificationContext';
import LogoHorizontal from '@/assets/images/logo/logo-new-white.png';
import LogoSymbol from '@/assets/images/logo/logo-symbol.svg';
import LogoSimboloPreto from '@/assets/images/logo/logo_simbolo_preto.png';

const drawerWidth = 280;

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

interface MenuItemProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: UserType[];
  badge?: number;
}

const menuItems: MenuItemProps[] = [
  // Role-specific Dashboards
  {
    id: 'dashboard-admin',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard/admin',
    roles: [UserType.ADMIN],
  },
  {
    id: 'dashboard-coach',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard/coach',
    roles: [UserType.COACH],
  },
  {
    id: 'dashboard-student',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard/aluno',
    roles: [UserType.FITNESS_STUDENT],
  },

  // Admin Menu
  {
    id: 'admin-students',
    label: 'Alunos',
    icon: <PeopleIcon />,
    path: '/dashboard/admin/students',
    roles: [UserType.ADMIN],
  },
  {
    id: 'admin-coaches',
    label: 'Treinadores',
    icon: <SportsIcon />,
    path: '/dashboard/admin/coaches',
    roles: [UserType.ADMIN],
  },
  {
    id: 'admin-admins',
    label: 'Administradores',
    icon: <ManageAccountsIcon />,
    path: '/dashboard/admin/administrators',
    roles: [UserType.ADMIN],
  },
  {
    id: 'admin-modalities',
    label: 'Modalidades',
    icon: <RunIcon />,
    path: '/dashboard/admin/modalities',
    roles: [UserType.ADMIN],
  },
  {
    id: 'admin-plans',
    label: 'Planos',
    icon: <AssignmentIcon />,
    path: '/dashboard/admin/plans',
    roles: [UserType.ADMIN],
  },
  {
    id: 'admin-events',
    label: 'Provas',
    icon: <EventsIcon />,
    path: '/dashboard/admin/events',
    roles: [UserType.ADMIN],
  },
  {
    id: 'admin-tests',
    label: 'Testes',
    icon: <TestIcon />,
    path: '/dashboard/admin/tests',
    roles: [UserType.ADMIN],
  },
  {
    id: 'admin-margins',
    label: 'Margens',
    icon: <PercentIcon />,
    path: '/dashboard/admin/margins',
    roles: [UserType.ADMIN],
  },
  {
    id: 'admin-finance',
    label: 'Financeiro',
    icon: <ReceiptIcon />,
    path: '/dashboard/admin/finance',
    roles: [UserType.ADMIN],
  },
  {
    id: 'admin-requests',
    label: 'Solicitações',
    icon: <PlaylistAddCheckIcon />,
    path: '/dashboard/admin/requests',
    roles: [UserType.ADMIN],
  },
  {
    id: 'admin-results',
    label: 'Resultados',
    icon: <AssessmentIcon />,
    path: '/dashboard/admin/results',
    roles: [UserType.ADMIN],
  },
  {
    id: 'admin-licencas',
    label: 'Licenças',
    icon: <CalendarIcon />,
    path: '/dashboard/admin/licencas',
    roles: [UserType.ADMIN],
  },
  
  // Coach
  {
    id: 'my-clients',
    label: 'Meus Alunos',
    icon: <PeopleIcon />,
    path: '/dashboard/my-clients',
    roles: [UserType.COACH],
  },
  {
    id: 'financial',
    label: 'Financeiro',
    icon: <MoneyIcon />,
    path: '/dashboard/coach/financeiro',
    roles: [UserType.COACH],
  },
  {
    id: 'coach-modalidades',
    label: 'Modalidades',
    icon: <RunIcon />,
    path: '/dashboard/coach/modalidades',
    roles: [UserType.COACH],
  },
  {
    id: 'coach-planos',
    label: 'Planos',
    icon: <AssignmentIcon />,
    path: '/dashboard/coach/planos',
    roles: [UserType.COACH],
  },
  {
    id: 'coach-confirmar-presenca',
    label: 'Confirmar Presença',
    icon: <PlaylistAddCheckIcon />,
    path: '/dashboard/coach/confirmar-presenca',
    roles: [UserType.COACH],
  },

        {
        id: 'coach-gerenciar-testes',
        label: 'Gerenciar Testes',
        icon: <ScienceIcon />,
        path: '/dashboard/coach/gerenciar-testes',
        roles: [UserType.COACH],
      },
  {
    id: 'coach-participantes',
    label: 'Participantes',
    icon: <GroupIcon />,
    path: '/dashboard/coach/participantes',
    roles: [UserType.COACH],
  },
  
  // Student
  {
    id: 'student-coach',
    label: 'Meu Treinador',
    icon: <PersonAddIcon />,
    path: '/dashboard/aluno/treinador',
    roles: [UserType.FITNESS_STUDENT],
  },
  {
    id: 'student-events',
    label: 'Provas',
    icon: <EventsIcon />,
    path: '/dashboard/aluno/eventos',
    roles: [UserType.FITNESS_STUDENT],
  },
  {
    id: 'student-tests',
    label: 'Testes',
    icon: <TestIcon />,
    path: '/dashboard/aluno/testes',
    roles: [UserType.FITNESS_STUDENT],
  },
  {
    id: 'student-request-leave',
    label: 'Solicitar Licença',
    icon: <PauseIcon />,
    path: '/dashboard/aluno/solicitar-licenca',
    roles: [UserType.FITNESS_STUDENT],
  },
  {
    id: 'student-plan',
    label: 'Meu Plano',
    icon: <AssignmentIcon />,
    path: '/dashboard/aluno/meu-plano',
    roles: [UserType.FITNESS_STUDENT],
  },
  {
    id: 'student-coins',
    label: 'Moedas',
    icon: <MoneyIcon />,
    path: '/dashboard/aluno/moedas',
    roles: [UserType.FITNESS_STUDENT],
  },
  {
    id: 'student-payments',
    label: 'Pagamentos',
    icon: <PaymentIcon />,
    path: '/dashboard/aluno/pagamentos',
    roles: [UserType.FITNESS_STUDENT],
  },
];

export default function DashboardLayout({ children, user, onLogout }: DashboardLayoutProps) {
  // Verificação de segurança - não renderizar se user for null/undefined
  if (!user || !user.userType) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { setLoading } = useLoading();
  const { getModuleNotificationCount, dismissInsight, getInsightsForModule, insights } = useAINotifications();

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(user.userType);
    });
  }, [user.userType]);

  const bestMatch = useMemo(() => {
    const matchingItems = filteredMenuItems.filter(item => pathname.startsWith(item.path));
    if (!matchingItems.length) return null;

    // Retorna o item com o caminho mais longo (mais específico)
    return matchingItems.reduce((acc, item) => (item.path.length > acc.path.length ? item : acc));
  }, [pathname, filteredMenuItems]);

  const handleNavigationClick = (path: string, moduleId: string) => {
    // Dismissar notificações do módulo quando usuário navegar para ele
    const moduleInsights = getInsightsForModule(moduleId);
    moduleInsights.forEach(insight => {
      dismissInsight(insight.id);
    });
    
    // Removido setLoading para evitar flicker desnecessário
    // A navegação do Next.js é rápida o suficiente para não precisar de loading
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  useEffect(() => {
    if (!mobileOpen && menuButtonRef.current) {
      menuButtonRef.current.focus();
    }
  }, [mobileOpen]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleAIDrawerToggle = () => {
    setAiDrawerOpen(!aiDrawerOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    onLogout();
  };

  const getAbsoluteImageUrl = (url: string | undefined | null): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http') || url.startsWith('blob:')) {
      return url;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const origin = new URL(apiUrl).origin;
    const path = url.startsWith('/api') ? url.substring(4) : url;
    return `${origin}/api${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          minHeight: '120px!important',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          background: (theme) =>
            theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.primary.main,
        }}
      >
        <Link href="/dashboard" passHref>
          <Image src={LogoHorizontal} alt="EnduranceOn Logo" width={180} />
        </Link>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, p: 2 }}>
        {filteredMenuItems.map((item) => {
          const notificationCount = getModuleNotificationCount(item.id);
          const hasNotifications = notificationCount > 0;
          
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.path}
                onClick={() => handleNavigationClick(item.path, item.id)}
                selected={bestMatch?.id === item.id}
                sx={{
                  borderRadius: 1,
                  transition: 'all 0.3s ease-in-out',
                  position: 'relative',
                  overflow: 'hidden',
                  // Animação quadrada com cantos arredondados para itens com notificações
                  ...(hasNotifications && {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      right: '8px',
                      bottom: '8px',
                      borderRadius: '12px', // Cantos levemente arredondados
                      border: '2px solid #FF8012', // Cor primária (laranja)
                      opacity: 0.8,
                      animation: 'pulse-square 2.5s infinite',
                      pointerEvents: 'none',
                      zIndex: 0,
                      '@keyframes pulse-square': {
                        '0%': {
                          transform: 'scale(0.95)',
                          opacity: 0.8,
                          borderColor: '#FF8012',
                        },
                        '50%': {
                          transform: 'scale(1.02)',
                          opacity: 0.4,
                          borderColor: '#38B6FF', // Cor secundária (azul)
                        },
                        '100%': {
                          transform: 'scale(0.95)',
                          opacity: 0.8,
                          borderColor: '#FF8012',
                        },
                      },
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      right: '4px',
                      bottom: '4px',
                      borderRadius: '16px', // Cantos mais arredondados para o glow
                      background: 'linear-gradient(135deg, rgba(255, 128, 18, 0.1), rgba(56, 182, 255, 0.1))', // Gradiente com cores da marca
                      animation: 'glow-square 3s infinite',
                      pointerEvents: 'none',
                      zIndex: 0,
                      '@keyframes glow-square': {
                        '0%': {
                          background: 'linear-gradient(135deg, rgba(255, 128, 18, 0.1), rgba(56, 182, 255, 0.05))',
                          boxShadow: '0 0 10px rgba(255, 128, 18, 0.3)',
                        },
                        '50%': {
                          background: 'linear-gradient(135deg, rgba(56, 182, 255, 0.15), rgba(255, 128, 18, 0.05))',
                          boxShadow: '0 0 20px rgba(56, 182, 255, 0.4)',
                        },
                        '100%': {
                          background: 'linear-gradient(135deg, rgba(255, 128, 18, 0.1), rgba(56, 182, 255, 0.05))',
                          boxShadow: '0 0 10px rgba(255, 128, 18, 0.3)',
                        },
                      },
                    },
                    // Badge de notificação com animação de bounce
                    '& .MuiBadge-badge': {
                      animation: 'bounce-badge 1.5s infinite',
                      backgroundColor: '#FF8012', // Cor primária
                      color: '#FFFFFF',
                      '@keyframes bounce-badge': {
                        '0%, 20%, 50%, 80%, 100%': {
                          transform: 'translateY(0)',
                        },
                        '40%': {
                          transform: 'translateY(-3px)',
                        },
                        '60%': {
                          transform: 'translateY(-1px)',
                        },
                      },
                    },
                    // Hover especial para itens com notificações
                    '&:hover': {
                      transform: 'translateX(4px) scale(1.02)',
                      backgroundColor: 'rgba(255, 128, 18, 0.08)', // Hover com cor primária
                      boxShadow: '0 4px 12px rgba(255, 128, 18, 0.2)',
                      '&::before': {
                        borderColor: '#38B6FF !important', // Azul no hover
                        opacity: '1 !important',
                      },
                      '&::after': {
                        background: 'linear-gradient(135deg, rgba(56, 182, 255, 0.2), rgba(255, 128, 18, 0.1)) !important',
                        boxShadow: '0 0 25px rgba(56, 182, 255, 0.5) !important',
                      },
                    },
                  }),
                  '&.Mui-selected': {
                    background: (theme) => theme.palette.primary.main,
                    color: (theme) => theme.palette.primary.contrastText,
                    '&:hover': {
                      background: (theme) => theme.palette.primary.dark,
                    },
                    '& .MuiListItemIcon-root': {
                      color: (theme) => theme.palette.primary.contrastText,
                    },
                  },
                  '&:hover': {
                    backgroundColor: hasNotifications 
                      ? 'rgba(255, 128, 18, 0.08)' // Cor primária (laranja) 
                      : (theme) => theme.palette.action.hover,
                    transform: hasNotifications ? 'translateX(4px) scale(1.02)' : 'translateX(2px)',
                    boxShadow: hasNotifications ? '0 4px 20px rgba(255, 128, 18, 0.3)' : 'none', // Sombra laranja
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40, position: 'relative', zIndex: 1 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: bestMatch?.id === item.id ? 600 : 400,
                    fontSize: '0.9rem',
                    position: 'relative',
                    zIndex: 1,
                  }}
                />
                {(item.badge || hasNotifications) && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Chip
                      label={item.badge || notificationCount}
                      size="small"
                      sx={{
                        height: 24,
                        minWidth: 24,
                        backgroundColor: hasNotifications ? '#FF8012' : '#f44336', // Cor primária (laranja) ou vermelho
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        animation: hasNotifications ? 'bounce-chip 1.5s infinite' : 'none',
                        '@keyframes bounce-chip': {
                          '0%, 20%, 50%, 80%, 100%': {
                            transform: 'translateY(0) scale(1)',
                          },
                          '40%': {
                            transform: 'translateY(-2px) scale(1.1)',
                          },
                          '60%': {
                            transform: 'translateY(-1px) scale(1.05)',
                          },
                        },
                        '& .MuiChip-label': {
                          padding: '0 6px',
                          lineHeight: 1,
                        },
                      }}
                    />
                  </Box>
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" textAlign="center">
          © 2024 Endurance On
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <NavigationLoader />
      
      {/* Estilos globais para animações */}
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      
      <AppBar
        position="fixed"
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ minHeight: '64px!important' }}>
          {isMobile && (
            <IconButton
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                color: 'text.primary' 
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          {isMobile && (
            <Box>
              <Image src={LogoSimboloPreto} alt="EnduranceOn Symbol" width={60} priority />
            </Box>
          )}
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationCenter userType={user.userType} userId={user.id} />
            
            {user.userType === 'ADMIN' && (
              <IconButton
                size="large"
                aria-label="open AI assistant"
                onClick={handleAIDrawerToggle}
                color="inherit"
                sx={{
                  color: 'text.primary',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 128, 18, 0.1)',
                    color: '#FF8012',
                  },
                }}
              >
                <Badge
                  badgeContent={insights.length}
                  color="secondary"
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#FF8012',
                      color: 'white',
                      animation: insights.length > 0 ? 'pulse 2s infinite' : 'none',
                      fontSize: '0.65rem',
                      height: '16px',
                      minWidth: '16px',
                      padding: '0 4px',
                      transform: 'translate(6px, -14px) !important',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      position: 'absolute !important',
                      top: '-2px !important',
                      right: '-2px !important',
                      zIndex: 1000,
                    },
                  }}
                >
                  <AIIcon />
                </Badge>
              </IconButton>
            )}
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar src={getAbsoluteImageUrl(user.image)} sx={{ width: 32, height: 32 }}>
                {!user.image && <AccountCircleIcon />}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          component={Link}
          href={user.userType === UserType.COACH ? '/dashboard/coach/perfil' : '/dashboard/aluno/perfil'}
          onClick={() => { handleProfileMenuClose(); }}
        >
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Perfil
        </MenuItem>
        <MenuItem
          component={Link}
          href="/dashboard/settings"
          onClick={() => { handleProfileMenuClose(); }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Configurações
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ 
            keepMounted: true,
            disableAutoFocus: true,
            disableEnforceFocus: true,
            disableRestoreFocus: true
          }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[50],
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {children}
        </Container>
      </Box>

      {/* Drawer lateral de IA */}
      <Drawer
        anchor="right"
        open={aiDrawerOpen}
        onClose={handleAIDrawerToggle}
        ModalProps={{
          disableAutoFocus: true,
          disableEnforceFocus: true,
          disableRestoreFocus: true
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '90vw', sm: '400px', md: '450px' },
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
            🤖 Assistente IA
          </Typography>
          <IconButton onClick={handleAIDrawerToggle} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        <Box sx={{ p: 2, height: 'calc(100vh - 80px)', overflow: 'auto' }}>
          <AINotificationPanel maxInsights={10} />
        </Box>
      </Drawer>
    </Box>
  );
} 