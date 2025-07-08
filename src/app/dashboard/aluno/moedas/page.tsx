'use client';

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
} from '@mui/material';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { useAuth } from '../../../../contexts/AuthContext';
import DashboardLayout from '../../../../components/Dashboard/DashboardLayout';
import { 
  MonetizationOn as CoinIcon, 
  CardGiftcard as GiftIcon,
  EmojiEvents as AchievementIcon,
  TrendingUp as PositiveTrendIcon,
  SyncAlt as AdjustmentIcon,
} from '@mui/icons-material';
import { enduranceApi } from '../../../../services/enduranceApi';
import { WalletTransaction, TransactionType } from '../../../../types/api';

export default function StudentCoinsPage() {
  const auth = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [balance, setBalance] = React.useState(0);
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([]);

  React.useEffect(() => {
    const loadWalletData = async () => {
      if (!auth.user) return;
      
      try {
        setLoading(true);
        const [balanceResponse, walletTransactions] = await Promise.all([
          enduranceApi.getWalletBalance(),
          enduranceApi.getWalletHistory()
        ]);
        setBalance(balanceResponse.balance);
        setTransactions(walletTransactions);
      } catch (err) {
        console.error(err);
        setError('Erro ao carregar os dados da carteira.');
      } finally {
        setLoading(false);
      }
    };

    loadWalletData();
  }, [auth.user]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const getTransactionIcon = (type: TransactionType) => {
    switch(type) {
      case TransactionType.REFERRAL:
        return <GiftIcon />;
      case TransactionType.ACHIEVEMENT:
        return <AchievementIcon />;
      case TransactionType.ADJUSTMENT:
        return <AdjustmentIcon />;
      default:
        return <CoinIcon />;
    }
  }

  return (
    <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>
      <DashboardLayout user={auth.user!} onLogout={auth.logout}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Minhas Moedas
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Grid container spacing={4}>
              {/* Saldo de Moedas */}
              <Grid item xs={12}>
                <Paper
                  elevation={4}
                  sx={{ p: 2 }}
                >
                  <Card sx={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)' }}>
                    <CardContent sx={{ textAlign: 'center', p: {xs: 2, md: 4} }}>
                      <Typography variant="overline" color="text.secondary">Saldo Disponível</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 1 }}>
                        <CoinIcon sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
                        <Typography variant="h2" component="p" fontWeight="bold" color="primary.main">
                          {balance}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Use suas moedas para descontos em planos e produtos.
                      </Typography>
                    </CardContent>
                  </Card>
                </Paper>
              </Grid>

              {/* Histórico de Transações */}
              <Grid item xs={12}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Histórico de Transações
                </Typography>
                <Paper elevation={2} sx={{ overflow: 'hidden' }}>
                  <List disablePadding>
                    {transactions.length > 0 ? transactions.map((tx, idx) => (
                      <React.Fragment key={tx.id}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.light' }}>{getTransactionIcon(tx.type)}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={tx.description}
                            secondary={`${formatDate(tx.createdAt)} - Tipo: ${tx.type}`}
                            primaryTypographyProps={{ fontWeight: 'medium' }}
                          />
                          <Typography variant="h6" color={tx.amount > 0 ? "success.main" : "error.main"} fontWeight="bold" sx={{display: 'flex', alignItems: 'center'}}>
                            <PositiveTrendIcon sx={{mr: 0.5}}/> {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                          </Typography>
                        </ListItem>
                        {idx < transactions.length - 1 && <Divider variant="inset" component="li" />}
                      </React.Fragment>
                    )) : (
                      <ListItem><ListItemText primary="Nenhuma transação encontrada." /></ListItem>
                    )}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Container>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 