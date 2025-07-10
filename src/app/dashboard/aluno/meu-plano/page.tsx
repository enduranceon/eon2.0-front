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

    // Modo debug - pode ser ativado para testar com dados mockados
    const DEBUG_MODE = process.env.NODE_ENV === 'development' && window.location.search.includes('debug=true');

    // Função para testar a API diretamente (pode ser chamada no console)
    (window as any).testPaymentsAPI = async () => {
        try {
            console.log('🧪 Testando API de pagamentos...');
            const result = await paymentService.getPaymentHistory({ page: 1, limit: 10 });
            console.log('📊 Resultado da API:', result);
            return result;
        } catch (error) {
            console.error('❌ Erro ao testar API:', error);
            return error;
        }
    };

    // Função para testar assinatura
    (window as any).testSubscriptionAPI = async () => {
        try {
            console.log('🧪 Testando API de assinatura...');
            const result = await paymentService.getActiveSubscription();
            console.log('📊 Resultado da API:', result);
            return result;
        } catch (error) {
            console.error('❌ Erro ao testar API:', error);
            return error;
        }
    };

    // Função para testar rotas alternativas
    (window as any).testAlternativeRoutes = async () => {
        const routes = [
            '/api/payments',
            '/api/payment',
            '/payments',
            '/payment', 
            '/api/invoices',
            '/invoices',
            '/api/billing',
            '/billing',
            '/api/transactions',
            '/transactions'
        ];
        
        console.log('🔍 Testando rotas alternativas...');
        
        for (const route of routes) {
            try {
                const response = await fetch(`http://localhost:3001${route}`, {
                    headers: {
                        'Authorization': `Bearer ${(window as any).localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log(`✅ ${route}: ${response.status} ${response.statusText}`);
            } catch (error) {
                console.log(`❌ ${route}: Erro de conexão`);
            }
        }
    };

    // Dados mockados para teste
    const createMockData = () => {
        const mockSubscription: Subscription = {
            id: 'sub-mock-1',
            userId: user?.id || 'user-1',
            planId: 'plan-1',
            modalidadeId: 'modalidade-1',
            status: 'ACTIVE',
            period: 'MONTHLY' as any,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            nextPaymentDate: '2024-02-01',
            amount: 250,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            plan: {
                id: 'plan-1',
                name: 'Plano Premium',
                description: 'Plano completo',
                enrollmentFee: 50,
                prices: [],
                modalidades: [],
                isActive: true,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z'
            },
            modalidade: {
                id: 'modalidade-1',
                name: 'Corrida',
                description: 'Modalidade de corrida',
                icon: 'running',
                color: '#ff5722',
                isActive: true,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z'
            },
            user: user as any
        };

        const mockPayments: Payment[] = [
            {
                id: 'payment-1',
                subscriptionId: 'sub-mock-1',
                userId: user?.id || 'user-1',
                amount: 250,
                paymentMethod: 'CREDIT_CARD' as any,
                status: 'CONFIRMED' as any,
                dueDate: '2024-01-15',
                paidAt: '2024-01-12',
                createdAt: '2024-01-01T00:00:00Z'
            },
            {
                id: 'payment-2',
                subscriptionId: 'sub-mock-1',
                userId: user?.id || 'user-1',
                amount: 250,
                paymentMethod: 'PIX' as any,
                status: 'CONFIRMED' as any,
                dueDate: '2024-02-15',
                paidAt: '2024-02-10',
                createdAt: '2024-02-01T00:00:00Z'
            },
            {
                id: 'payment-3',
                subscriptionId: 'sub-mock-1',
                userId: user?.id || 'user-1',
                amount: 250,
                paymentMethod: 'BOLETO' as any,
                status: 'PENDING' as any,
                dueDate: '2024-03-15',
                createdAt: '2024-03-01T00:00:00Z'
            }
        ];

        return { mockSubscription, mockPayments };
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            if (DEBUG_MODE) {
                console.log('🧪 Modo DEBUG ativo - usando dados mockados');
                const { mockSubscription, mockPayments } = createMockData();
                setSubscription(mockSubscription);
                setPayments(mockPayments);
                setLoading(false);
                return;
            }

            // Informação sobre funções de teste disponíveis
            console.log('🛠️ Funções de teste disponíveis no console:');
            console.log('   • testPaymentsAPI() - Testa a API de pagamentos');
            console.log('   • testSubscriptionAPI() - Testa a API de assinatura');
            console.log('   • testAlternativeRoutes() - Testa rotas alternativas de pagamento');
            console.log('💡 Se a API /payments não existir, dados serão gerados automaticamente baseados na assinatura!');

            try {
                console.log('🔍 Iniciando busca de dados do plano para usuário:', user?.id);
                
                const subPromise = paymentService.getActiveSubscription();
                // Buscar histórico de pagamentos (o backend deve filtrar automaticamente pelo usuário autenticado)
                const paymentsPromise = paymentService.getPaymentHistory({
                    page: 1,
                    limit: 50 // Buscar mais pagamentos para garantir que não perdemos dados
                });
                
                const [subResult, paymentsResult] = await Promise.all([subPromise, paymentsPromise]);

                console.log('📊 Dados de assinatura recebidos:', subResult);
                console.log('💳 Dados de pagamentos recebidos:', paymentsResult);

                setSubscription(subResult);
                
                // Melhor tratamento dos dados de pagamento
                let paymentsData: Payment[] = [];
                if (paymentsResult) {
                    if ('data' in paymentsResult && Array.isArray(paymentsResult.data)) {
                        paymentsData = paymentsResult.data;
                        console.log('📋 Histórico de pagamentos (formato paginado):', paymentsData);
                        console.log('📊 Informações de paginação:', paymentsResult.pagination);
                    } else if (Array.isArray(paymentsResult)) {
                        paymentsData = paymentsResult;
                        console.log('📋 Histórico de pagamentos (formato array):', paymentsData);
                    } else {
                        console.warn('⚠️ Formato de pagamentos não reconhecido:', paymentsResult);
                    }
                }

                // Filtrar apenas pagamentos confirmados (faturas pagas)
                const paidPayments = paymentsData.filter(payment => payment.status === 'CONFIRMED');
                console.log('✅ Faturas pagas encontradas:', paidPayments);
                
                setPayments(paymentsData); // Manter todos os pagamentos para exibição completa
                
                // Log adicional para debug
                if (paymentsData.length === 0) {
                    console.warn('⚠️ Nenhum pagamento encontrado para o usuário');
                } else if (paidPayments.length === 0) {
                    console.warn('⚠️ Nenhuma fatura paga encontrada para o usuário');
                    console.log('📄 Status dos pagamentos encontrados:', paymentsData.map(p => ({ id: p.id, status: p.status, amount: p.amount })));
                }

                // Adicionar alerta visual se não há dados da API
                if (!DEBUG_MODE && paymentsData.length === 0) {
                    setError('Nenhum pagamento encontrado na API. Verifique se há dados no backend ou se a API está funcionando corretamente.');
                }

            } catch (err) {
                const errorMessage = 'Falha ao carregar os dados do plano. Tente novamente mais tarde.';
                console.error('❌ Erro ao buscar dados do plano:', err);
                setError(errorMessage);
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
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <br />
                <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                    Verifique o console do navegador para mais detalhes sobre o erro.
                </Typography>
            </Alert>
        );
    }

    return (
        <Grid container spacing={4}>
            {/* Informação sobre modo debug */}
            {DEBUG_MODE && (
                <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <strong>Modo DEBUG ativo:</strong> Usando dados mockados para teste. 
                            Para usar dados reais, remova "?debug=true" da URL.
                        </Typography>
                    </Alert>
                </Grid>
            )}
            
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