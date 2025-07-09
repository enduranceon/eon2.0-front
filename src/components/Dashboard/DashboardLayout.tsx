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
} from '@mui/icons-material';
import NotificationCenter from './NotificationCenter';
import { User, UserType } from '../../types/api';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import NavigationLoader from '../NavigationLoader';
import { useLoading } from '@/contexts/LoadingContext';
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
    id: 'dashboard-others',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    roles: [UserType.COACH, UserType.FITNESS_STUDENT],
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
    label: 'Eventos',
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
  
  // Coach
  {
    id: 'my-clients',
    label: 'Meus Clientes',
    icon: <PeopleIcon />,
    path: '/dashboard/my-clients',
    roles: [UserType.COACH],
  },
  {
    id: 'personal-earnings',
    label: 'Meus Ganhos',
    icon: <MoneyIcon />,
    path: '/dashboard/personal-earnings',
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
    label: 'Eventos',
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { setLoading } = useLoading();

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

  const handleNavigationClick = (path: string) => {
    if (pathname !== path) {
      setLoading(true);
    }
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
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
        {filteredMenuItems.map((item) => (
          <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component={Link}
              href={item.path}
              onClick={() => handleNavigationClick(item.path)}
              selected={bestMatch?.id === item.id}
              sx={{
                borderRadius: 1,
                transition: 'all 0.2s ease-in-out',
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
                  backgroundColor: (theme) => theme.palette.action.hover,
                  transform: 'translateX(2px)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {item.badge ? <Badge badgeContent={item.badge} color="error">{item.icon}</Badge> : item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: bestMatch?.id === item.id ? 600 : 400,
                  fontSize: '0.9rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
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
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { lg: 'none' },
              color: 'text.primary' 
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
            <Image src={LogoSimboloPreto} alt="EnduranceOn Symbol" width={60} />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationCenter userType={user.userType} userId={user.id} />
            
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
          href="/dashboard/aluno/perfil"
          onClick={() => { handleNavigationClick('/dashboard/aluno/perfil'); handleProfileMenuClose(); }}
        >
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Perfil
        </MenuItem>
        <MenuItem
          component={Link}
          href="/dashboard/settings"
          onClick={() => { handleNavigationClick('/dashboard/settings'); handleProfileMenuClose(); }}
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
          ModalProps={{ keepMounted: true }}
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
    </Box>
  );
} 