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
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
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
                const subPromise = paymentService.getActiveSubscription();
                const paymentsPromise = paymentService.getPaymentHistory();
                
                const [subResult, paymentsResult] = await Promise.all([subPromise, paymentsPromise]);

                setSubscription(subResult);
                
                if ('data' in paymentsResult && Array.isArray(paymentsResult.data)) {
                  setPayments(paymentsResult.data);
                } else if (Array.isArray(paymentsResult)) {
                  setPayments(paymentsResult);
                }

            } catch (err) {
                setError('Falha ao carregar os dados do plano. Tente novamente mais tarde.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Grid container spacing={4}>
            {/* Subscription Card */}
            <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                    <Card sx={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <SubscriptionCard subscription={subscription} />
                    </Card>
                </Paper>
            </Grid>
            {/* Payment History */}
            <Grid item xs={12}>
                <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                    <Card sx={{ background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <PaymentHistory payments={payments} />
                    </Card>
                </Paper>
            </Grid>
        </Grid>
    );
}

const MeuPlanoPage = () => {
    const { user, isLoading: authLoading, logout } = useAuth();

    if (authLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    return (
        <ProtectedRoute allowedUserTypes={[UserType.FITNESS_STUDENT]}>
        {user && (
            <DashboardLayout user={user} onLogout={logout}>
            <Container maxWidth="xl" sx={{ py: 3 }}>
                <MeuPlanoContent />
            </Container>
            </DashboardLayout>
        )}
        </ProtectedRoute>
    );
};

export default MeuPlanoPage; 