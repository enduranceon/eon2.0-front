'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, UserType, LoginRequest, LoginResponse } from '../types/api';
import { enduranceApi } from '../services/enduranceApi';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  emailVerified: boolean;
  has2FA: boolean;
  subscriptionActive: boolean;
  subscriptionStatus: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  register: (userData: any) => Promise<{ userId: string; access_token: string; user: User }>;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  resend2FA: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  hasRole: (roles: UserType[]) => boolean;
  requiresSubscription: () => boolean;
  updateProfile: (updatedData: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    emailVerified: false,
    has2FA: false,
    subscriptionActive: false,
    subscriptionStatus: null,
  });

  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = enduranceApi.getToken();

    if (token) {
      try {
        enduranceApi.setToken(token);

        const user = await enduranceApi.getProfile();
        
        const subscriptionStatus = await checkUserSubscription(user);

        setState({
          user,
          token,
          isAuthenticated: true,
          emailVerified: true, // Temporariamente desabilitado
          has2FA: !!user.has2FA,
          subscriptionActive: subscriptionStatus === 'ACTIVE',
          subscriptionStatus,
          isLoading: false,
        });
        
        // Marcar que a inicialização foi concluída com sucesso
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_initialized', 'true');
        }
        
      } catch (error) {
        enduranceApi.clearToken();
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          emailVerified: false,
          has2FA: false,
          subscriptionActive: false,
          subscriptionStatus: null,
        });
        
        // Marcar que a inicialização foi concluída (mesmo com erro)
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_initialized', 'true');
        }
      }
    } else {
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        emailVerified: false,
        has2FA: false,
        subscriptionActive: false,
        subscriptionStatus: null,
      });
      
      // Marcar que a inicialização foi concluída (sem token)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_initialized', 'true');
      }
    }
  };

  const checkUserSubscription = async (user: User): Promise<'ACTIVE' | 'PENDING' | 'NONE' | 'ON_LEAVE'> => {
    // Apenas alunos precisam de assinatura ativa
    if (user.userType === UserType.FITNESS_STUDENT) {
      try {
        const subscription = await enduranceApi.getActiveSubscription();
        
        if (!subscription) return 'NONE';

        // Priorizar status explícito retornado pela API
        const rawStatus: string | undefined = (subscription as any).status;

        if (rawStatus) {
          const normalized = rawStatus.toString().trim().toUpperCase();
          
          if (normalized === 'ACTIVE') return 'ACTIVE';
          if (normalized === 'ON_LEAVE') return 'ON_LEAVE';
          if (normalized.startsWith('PENDING')) return 'PENDING';
        }

        // Fallback: considerar isActive apenas se status ausente
        if ((subscription as any).isActive) return 'ACTIVE';

        return 'NONE';
      } catch (error) {
        console.error('❌ Error checking subscription:', error);
        return 'NONE';
      }
    }
    return 'ACTIVE'; // Outros tipos não precisam de assinatura
  };

  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await enduranceApi.login(credentials);
      const { access_token, user } = response;

      // Salvar token e usuário
      setState(prev => ({
        ...prev,
        token: access_token,
        user,
        isAuthenticated: true,
        emailVerified: user.emailVerified || false,
        has2FA: user.has2FA || false,
        isLoading: false,
      }));

      // Limpar qualquer dado de onboarding anterior que possa pertencer a outro usuário
      const onboardingKeys = [
        'onboarding_selected_plan',
        'onboarding_selected_modalidade',
        'onboarding_selected_coach',
        'onboarding_step_1_completed',
        'onboarding_step_2_completed',
        'onboarding_completed',
        'onboarding_user_id',
      ];
      onboardingKeys.forEach(key => localStorage.removeItem(key));

      // Verificar assinatura ativa
      const subscriptionStatus = await checkUserSubscription(user);
      const subscriptionActive = subscriptionStatus === 'ACTIVE';

      // Verificar se precisa de 2FA
      if (user.has2FA && !user.twoFactorVerified) {
        setState(prev => ({
          ...prev,
          user,
          token: access_token,
          has2FA: true,
          isLoading: true, // Manter loading ativo
        }));
        router.push('/2fa');
        
        // Aguardar redirecionamento ser processado
        setTimeout(() => {
          setState(prev => ({ ...prev, isLoading: false }));
        }, 1000);
        
        return response;
      }

      // Verificar se email está confirmado (TEMPORARIAMENTE DESABILITADO)
      // if (!user.emailVerified && process.env.NODE_ENV === 'production') {
      //   setState(prev => ({
      //     ...prev,
      //     user,
      //     token: access_token,
      //     emailVerified: false,
      //     isLoading: true, // Manter loading ativo
      //   }));
      //   router.push('/verify-email');
      //   
      //   // Aguardar redirecionamento ser processado
      //   setTimeout(() => {
      //     setState(prev => ({ ...prev, isLoading: false }));
      //   }, 1000);
      //   
      //   return response;
      // }

      // Login completo
      setState(prev => ({
        ...prev,
        user,
        token: access_token,
        isAuthenticated: true,
        emailVerified: true, // Em desenvolvimento, sempre considerar como verificado
        subscriptionActive,
        subscriptionStatus,
        // Manter loading ativo até redirecionamento ser concluído
        isLoading: true,
      }));

      // Marcar que a inicialização foi concluída
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_initialized', 'true');
      }

      // Redirecionar para dashboard apropriado
      redirectToDashboard(user.userType, subscriptionStatus as 'ACTIVE' | 'PENDING' | 'NONE' | 'ON_LEAVE');
      toast.success('Login realizado com sucesso!');
      
      // Aguardar um tempo para garantir que o redirecionamento seja processado
      setTimeout(() => {
        setState(prev => ({ ...prev, isLoading: false }));
      }, 1500); // 1.5 segundos para garantir que a navegação seja concluída
      
      return response;
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      const message = error.response?.data?.message || 'Erro ao fazer login';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    enduranceApi.clearToken();
    
    // Limpar flag de inicialização
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_initialized');
    }
    
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      emailVerified: false,
      has2FA: false,
      subscriptionActive: false,
      subscriptionStatus: null,
    });
    router.push('/login');
    toast.success('Logout realizado com sucesso');
  };

  const register = async (userData: any): Promise<{ userId: string; access_token: string; user: User }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await enduranceApi.register(userData);
      
      console.log('Resposta bruta do registro:', response);
      
      // Extrair dados da resposta
      // A API retorna { access_token, user: { id, name, email, userType, has2FA } }
      const { access_token, user } = response;
      const userId = user?.id;
      
      console.log('Dados extraídos:', { userId, access_token, user });
      
      // Temporariamente desabilitado - sempre redirecionar para login
      toast.success('Conta criada com sucesso! Faça login para acessar o dashboard.');
      router.push('/login');
      
      // Retornar dados para uso externo (como aceitar termo de consentimento)
      return { userId, access_token, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao criar conta';
      toast.error(message);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const verifyEmail = async (token: string): Promise<void> => {
    try {
      await enduranceApi.verifyEmail(token);
      
      setState(prev => ({
        ...prev,
        emailVerified: true,
      }));
      
      toast.success('Email verificado com sucesso!');
      
      // Se usuário logado, redirecionar para dashboard
      if (state.user) {
        redirectToDashboard(state.user.userType, state.subscriptionStatus as 'ACTIVE' | 'PENDING' | 'NONE' | 'ON_LEAVE');
      } else {
        router.push('/login');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Token inválido ou expirado';
      toast.error(message);
      throw error;
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await enduranceApi.forgotPassword(email);
      toast.success('Link de recuperação enviado para seu email');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao enviar email';
      toast.error(message);
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string): Promise<void> => {
    try {
      await enduranceApi.resetPassword(token, password);
      toast.success('Senha alterada com sucesso!');
      router.push('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Token inválido ou expirado';
      toast.error(message);
      throw error;
    }
  };

  const verify2FA = async (code: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await enduranceApi.verify2FA(code);
      const { user } = response;
      
      const subscriptionStatus = await checkUserSubscription(user);
      const subscriptionActive = subscriptionStatus === 'ACTIVE';
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        emailVerified: true,
        has2FA: true,
        subscriptionActive,
        subscriptionStatus,
        isLoading: true, // Manter loading ativo até redirecionamento
      }));
      
      // Marcar que a inicialização foi concluída
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_initialized', 'true');
      }
      
      redirectToDashboard(user.userType, subscriptionStatus as 'ACTIVE' | 'PENDING' | 'NONE' | 'ON_LEAVE');
      toast.success('2FA verificado com sucesso!');
      
      // Aguardar redirecionamento ser processado
      setTimeout(() => {
        setState(prev => ({ ...prev, isLoading: false }));
      }, 1500);
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      const message = error.response?.data?.message || 'Código inválido';
      toast.error(message);
      throw error;
    }
  };

  const resend2FA = async (): Promise<void> => {
    try {
      await enduranceApi.resend2FA();
      toast.success('Código reenviado!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao reenviar código';
      toast.error(message);
      throw error;
    }
  };

  const resendVerificationEmail = async (): Promise<void> => {
    try {
      if (!state.user?.email) {
        throw new Error('Email não encontrado');
      }
      await enduranceApi.resendVerificationEmail();
      toast.success('Email de verificação reenviado!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao reenviar email';
      toast.error(message);
      throw error;
    }
  };

  const checkSubscriptionStatus = async (): Promise<void> => {
    if (state.user && state.user.userType === UserType.FITNESS_STUDENT) {
      try {
        const subscriptionStatus = await checkUserSubscription(state.user);
        const subscriptionActive = subscriptionStatus === 'ACTIVE';
        setState(prev => ({ ...prev, subscriptionActive }));
      } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
      }
    }
  };

  const hasRole = (roles: UserType[]): boolean => {
    return state.user ? roles.includes(state.user.userType) : false;
  };

  const requiresSubscription = (): boolean => {
    return (
      state.user?.userType === UserType.FITNESS_STUDENT &&
      state.subscriptionStatus !== 'ACTIVE'
    );
  };

  const redirectToDashboard = (
    userType: UserType,
    subscriptionStatus: 'ACTIVE' | 'PENDING' | 'NONE' | 'ON_LEAVE' = 'NONE'
  ) => {
    switch (userType) {
      case UserType.ADMIN:
        router.push('/dashboard/admin');
        break;
      case UserType.COACH:
        router.push('/dashboard/coach');
        break;
      case UserType.FITNESS_STUDENT:
        if (subscriptionStatus === 'ACTIVE') {
          router.push('/dashboard/aluno');
        } else if (subscriptionStatus === 'PENDING') {
          router.push('/subscription/pending');
        } else if (subscriptionStatus === 'ON_LEAVE') {
          router.push('/licenca-status');
        } else {
          // Se não tem assinatura, inicia fluxo de onboarding pelas calculadoras
          router.push('/onboarding/quiz-plano');
        }
        break;
      default:
        router.push('/login');
    }
  };

  const updateProfile = (updatedData: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updatedData } : prev.user,
    }));
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    verify2FA,
    resend2FA,
    resendVerificationEmail,
    checkSubscriptionStatus,
    hasRole,
    requiresSubscription,
    updateProfile,
    isLoading: state.isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// Hook para verificar se usuário tem acesso a uma rota
export function useRequireAuth(requiredRoles?: UserType[], requireSubscription = false) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isLoading) return;

    // Não autenticado
    if (!auth.isAuthenticated) {
      router.push('/login');
      return;
    }

    // Email não verificado (TEMPORARIAMENTE DESABILITADO)
    // if (!auth.emailVerified) {
    //   router.push('/verify-email');
    //   return;
    // }

    // 2FA pendente
    if (auth.has2FA && !auth.isAuthenticated) {
      router.push('/2fa');
      return;
    }

    // Role insuficiente
    if (requiredRoles && !auth.hasRole(requiredRoles)) {
      toast.error('Acesso negado');
      // Redirecionar para dashboard específico baseado no tipo de usuário
      if (auth.user?.userType === UserType.ADMIN) {
        router.push('/dashboard/admin');
      } else if (auth.user?.userType === UserType.COACH) {
        router.push('/dashboard/coach');
      } else if (auth.user?.userType === UserType.FITNESS_STUDENT) {
        router.push('/dashboard/aluno');
      } else {
        router.push('/login');
      }
      return;
    }

    // Assinatura inativa (para alunos)
    if (requireSubscription && auth.requiresSubscription()) {
      router.push('/onboarding/checkout');
      return;
    }
  }, [auth, router, requiredRoles, requireSubscription]);

  return auth;
} 