'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, UserType, LoginRequest, LoginResponse, OverdueInfo } from '../types/api';
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
  overdueInfo: OverdueInfo | null;
  overdueBarVisible: boolean;
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
  closeOverdueBar: () => void;
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
    overdueInfo: null,
    overdueBarVisible: false,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const router = useRouter();

  const initializeAuth = async () => {
    // Evitar múltiplas inicializações usando ref
    if (initializationRef.current) {
      return;
    }
    
    // Marcar como inicializando
    initializationRef.current = true;
    
    const token = enduranceApi.getToken();

    if (token) {
      try {
        enduranceApi.setToken(token);
        const user = await enduranceApi.getProfile();
        const subscriptionStatus = await checkUserSubscription(user);
        
        const newState = {
          user,
          token,
          isAuthenticated: true,
          emailVerified: true,
          has2FA: !!user.has2FA,
          subscriptionActive: subscriptionStatus === 'ACTIVE',
          subscriptionStatus,
          overdueInfo: null,
          overdueBarVisible: false,
          isLoading: false,
        };
        
        setState(newState);
        
      } catch (error) {
        console.error('AuthContext - Error loading user profile:', error);
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
          overdueInfo: null,
          overdueBarVisible: false,
        });
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
        overdueInfo: null,
        overdueBarVisible: false,
      });
    }

    setIsInitialized(true);
  };

  useEffect(() => {
    // Usar uma ref para evitar múltiplas execuções
    let mounted = true;
    
    const initAuth = async () => {
      if (mounted && !initializationRef.current) {
        try {
          await initializeAuth();
        } catch (error) {
          console.error('AuthContext - Error in useEffect:', error);
        }
      }
    };

    // Verificar se já foi inicializado no localStorage
    if (typeof window !== 'undefined') {
      const alreadyInitialized = localStorage.getItem('auth_initialized');
      if (alreadyInitialized && !initializationRef.current) {
        // Verificar se ainda há um token válido
        const token = enduranceApi.getToken();
        if (token) {
          // Se há token, executar initializeAuth normalmente
          initAuth();
        } else {
          // Se não há token, limpar estado e marcar como não carregando
          initializationRef.current = true;
          setIsInitialized(true);
          setState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
        return;
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []); // Array vazio para executar apenas uma vez


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
      const { access_token, user, overdueInfo } = response;

      // Definir token na API
      enduranceApi.setToken(access_token);

      // Carregar perfil completo do usuário
      const fullUser = await enduranceApi.getProfile();

      // Salvar token e usuário completo
      setState(prev => ({
        ...prev,
        token: access_token,
        user: fullUser, // Usar o perfil completo
        isAuthenticated: true,
        emailVerified: fullUser.emailVerified || false,
        has2FA: fullUser.has2FA || false,
        overdueInfo: overdueInfo || null,
        overdueBarVisible: overdueInfo?.isOverdue || false,
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
        user: fullUser, // Usar o perfil completo
        token: access_token,
        isAuthenticated: true,
        emailVerified: true, // Em desenvolvimento, sempre considerar como verificado
        subscriptionActive,
        subscriptionStatus,
        overdueInfo: overdueInfo || null,
        overdueBarVisible: overdueInfo?.isOverdue || false,
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
      overdueInfo: null,
      overdueBarVisible: false,
    });
    router.push('/login');
    toast.success('Logout realizado com sucesso');
  };

  const register = async (userData: any): Promise<{ userId: string; access_token: string; user: User }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await enduranceApi.register(userData);
      
      
      // Extrair dados da resposta
      // A API retorna { access_token, user: { id, name, email, userType, has2FA } }
      const { access_token, user } = response;
      const userId = user?.id;
      
      
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
        overdueInfo: null, // Será preenchido no próximo login
        overdueBarVisible: false,
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

  const closeOverdueBar = () => {
    setState(prev => ({
      ...prev,
      overdueBarVisible: false,
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
    closeOverdueBar,
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