'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  Container,
  Card
} from '@mui/material';
import { Payment, Subscription, UserType } from '@/types/api';
import { paymentService } from '@/services/paymentService';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import SubscriptionCard from '@/components/Dashboard/Aluno/SubscriptionCard';
import PaymentHistory from '@/components/Dashboard/Aluno/PaymentHistory';

const MeuPlanoContent = () => {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
            
                
                const [subResult, paymentsResult] = await Promise.all([
                    paymentService.getActiveSubscription(),
                    paymentService.getPaymentHistory({ page: 1, limit: 50 })
                ]);

                setSubscription(subResult);
                
                let paymentsData: Payment[] = [];
                if (paymentsResult) {
                    if ('data' in paymentsResult && Array.isArray(paymentsResult.data)) {
                        paymentsData = paymentsResult.data;
                    } else if (Array.isArray(paymentsResult)) {
                        paymentsData = paymentsResult;
                    }
                }
                
                setPayments(paymentsData);
                
            } catch (err) {
                console.error('❌ Erro ao buscar dados do plano:', err);
                setError('Falha ao carregar os dados do plano. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Box sx={{ textAlign: 'center' }}>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                        Carregando informações do plano...
                    </Typography>
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Meu Plano
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Gerencie sua assinatura e acompanhe o histórico de pagamentos
                </Typography>
            </Box>
            
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                        <Card sx={{ 
                          background: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(30, 30, 30, 0.98)' 
                            : 'rgba(255, 255, 255, 0.98)', 
                          backdropFilter: 'blur(10px)', 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column' 
                        }}>
                            <SubscriptionCard
                                subscription={subscription} 
                                onSubscriptionUpdate={() => {
                                    // Recarregar dados da assinatura
                                    const fetchData = async () => {
                                        try {
                                            const [subResult, paymentsResult] = await Promise.all([
                                                paymentService.getActiveSubscription(),
                                                paymentService.getPaymentHistory({ page: 1, limit: 50 })
                                            ]);
                                            setSubscription(subResult);
                                            
                                            let paymentsData: Payment[] = [];
                                            if (paymentsResult) {
                                                if ('data' in paymentsResult && Array.isArray(paymentsResult.data)) {
                                                    paymentsData = paymentsResult.data;
                                                } else if (Array.isArray(paymentsResult)) {
                                                    paymentsData = paymentsResult;
                                                }
                                            }
                                            setPayments(paymentsData);
                                        } catch (err) {
                                            console.error('Erro ao atualizar dados:', err);
                                        }
                                    };
                                    fetchData();
                                }} 
                            />
                        </Card>
                    </Paper>
                </Grid>
                
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                        <Card sx={{ 
                          background: (theme) => theme.palette.mode === 'dark' 
                            ? 'rgba(30, 30, 30, 0.98)' 
                            : 'rgba(255, 255, 255, 0.98)', 
                          backdropFilter: 'blur(10px)', 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column' 
                        }}>
                            <PaymentHistory payments={payments} />
                        </Card>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

const MeuPlanoPage = () => {
    const { user, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();

    // Redirecionar para login se usuário não estiver autenticado
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    // Verificação básica de autenticação (substitui ProtectedRoute temporariamente)
    if (authLoading || !user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Verificação simples de tipo de usuário
    if (user.userType !== UserType.FITNESS_STUDENT) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>Acesso não autorizado</Typography>
            </Box>
        );
    }
    
    return (
        <DashboardLayout user={user} onLogout={logout}>
            <Container maxWidth="xl" sx={{ py: 3 }}>
                <MeuPlanoContent />
            </Container>
        </DashboardLayout>
    );
};

export default MeuPlanoPage; 