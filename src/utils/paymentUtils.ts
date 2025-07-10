/**
 * Utilitários relacionados ao fluxo de pagamento
 */

/**
 * Limpa todos os dados do localStorage relacionados ao onboarding e autenticação
 */
export const clearAllStorageData = () => {
  // Dados do onboarding
  localStorage.removeItem('onboarding_selected_plan');
  localStorage.removeItem('onboarding_selected_modalidade');
  localStorage.removeItem('onboarding_selected_coach_id');
  localStorage.removeItem('onboarding_step_1_completed');
  localStorage.removeItem('onboarding_step_2_completed');
  localStorage.removeItem('onboarding_step_3_completed');
  
  // Dados de autenticação (se existirem)
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  
  // Limpar sessionStorage também
  sessionStorage.clear();
  
  console.log('🧹 Todos os dados de storage foram limpos');
};

/**
 * Redireciona para login após limpar todos os dados
 */
export const clearStorageAndRedirectToLogin = (router: any) => {
  clearAllStorageData();
  router.push('/login');
};

/**
 * Verifica se há dados de onboarding pendentes
 */
export const hasOnboardingData = (): boolean => {
  const plan = localStorage.getItem('onboarding_selected_plan');
  const modalidade = localStorage.getItem('onboarding_selected_modalidade');
  return !!(plan && modalidade);
};

/**
 * Salva o ID do pagamento para verificação posterior
 */
export const savePaymentForVerification = (paymentId: string, userId: string) => {
  const paymentData = {
    paymentId,
    userId,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem('pending_payment_verification', JSON.stringify(paymentData));
  console.log('💾 Dados de pagamento salvos para verificação:', paymentData);
};

/**
 * Recupera dados de pagamento pendente
 */
export const getPendingPaymentData = () => {
  const data = localStorage.getItem('pending_payment_verification');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Erro ao recuperar dados de pagamento pendente:', error);
      localStorage.removeItem('pending_payment_verification');
    }
  }
  return null;
};

/**
 * Remove dados de pagamento pendente após verificação
 */
export const clearPendingPaymentData = () => {
  localStorage.removeItem('pending_payment_verification');
  console.log('🧹 Dados de pagamento pendente removidos');
};

/**
 * Verifica se o usuário tem pagamento/assinatura pendente
 * Verifica tanto localStorage quanto API
 */
export const checkUserHasPendingPayment = async (user: any, enduranceApi: any): Promise<boolean> => {
  // 1. Verificar localStorage primeiro (fluxo recente)
  const pendingPaymentData = getPendingPaymentData();
  if (pendingPaymentData) {
    console.log('💳 Pagamento pendente encontrado no localStorage:', pendingPaymentData);
    return true;
  }

  // 2. Se não há dados no localStorage, verificar na API (apenas para alunos)
  if (user?.userType === 'FITNESS_STUDENT') {
    try {
      const subscription = await enduranceApi.getActiveSubscription();
      
      if (subscription) {
        // Verificar status da assinatura
        const status = subscription.status?.toString().trim().toUpperCase();
        
        if (status === 'PENDING' || status === 'INACTIVE') {
          console.log('📋 Assinatura com status pendente encontrada na API:', {
            subscriptionId: subscription.id,
            status: subscription.status
          });
          return true;
        }

        // Se a assinatura não está ativa e não há isActive=true
        if (!subscription.isActive && status !== 'ACTIVE') {
          console.log('📋 Assinatura inativa encontrada na API:', {
            subscriptionId: subscription.id,
            isActive: subscription.isActive,
            status: subscription.status
          });
          return true;
        }
      }
      
      // Verificar também pagamentos pendentes diretamente
      const payments = await enduranceApi.getPayments({ 
        page: 1,
        limit: 10  // Buscar mais pagamentos para verificar todos os pendentes
      });
      
      if (payments?.data && payments.data.length > 0) {
        // Filtrar apenas pagamentos pendentes
        const pendingPayments = payments.data.filter(payment => 
          payment.status === 'PENDING' || payment.status === 'OVERDUE'
        );
        
        if (pendingPayments.length > 0) {
          const pendingPayment = pendingPayments[0];
          console.log('💰 Pagamentos pendentes encontrados na API:', {
            count: pendingPayments.length,
            firstPayment: {
              id: pendingPayment.id,
              amount: pendingPayment.amount,
              status: pendingPayment.status,
              paymentMethod: pendingPayment.paymentMethod,
              dueDate: pendingPayment.dueDate
            }
          });
          return true;
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao verificar status na API:', error);
      // Em caso de erro, não bloquear o acesso
      return false;
    }
  }

  return false;
}; 