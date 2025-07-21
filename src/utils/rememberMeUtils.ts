/**
 * Utilitários para gerenciar a funcionalidade "Lembrar-me"
 */

interface RememberMeData {
  email: string;
  rememberMe: boolean;
  timestamp: number;
}

const REMEMBER_ME_KEY = 'endurance_remember_me';
const REMEMBER_ME_EXPIRY_DAYS = 30; // 30 dias

/**
 * Salva os dados de "Lembrar-me" no localStorage
 */
export const saveRememberMeData = (email: string, rememberMe: boolean): void => {
  if (typeof window === 'undefined') return;

  if (rememberMe) {
    const data: RememberMeData = {
      email,
      rememberMe,
      timestamp: Date.now(),
    };
    localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(data));
  } else {
    // Se não marcou "Lembrar-me", remove os dados salvos
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
};

/**
 * Recupera os dados de "Lembrar-me" do localStorage
 */
export const getRememberMeData = (): { email: string; rememberMe: boolean } | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(REMEMBER_ME_KEY);
    if (!stored) return null;

    const data: RememberMeData = JSON.parse(stored);
    
    // Verificar se os dados não expiraram
    const now = Date.now();
    const expiryTime = data.timestamp + (REMEMBER_ME_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    
    if (now > expiryTime) {
      // Dados expirados, remover
      localStorage.removeItem(REMEMBER_ME_KEY);
      return null;
    }

    return {
      email: data.email,
      rememberMe: data.rememberMe,
    };
  } catch (error) {
    console.error('Erro ao recuperar dados de "Lembrar-me":', error);
    // Em caso de erro, limpar dados corrompidos
    localStorage.removeItem(REMEMBER_ME_KEY);
    return null;
  }
};

/**
 * Remove os dados de "Lembrar-me" do localStorage
 */
export const clearRememberMeData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REMEMBER_ME_KEY);
};

/**
 * Verifica se há dados salvos de "Lembrar-me"
 */
export const hasRememberMeData = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(REMEMBER_ME_KEY) !== null;
};

/**
 * Atualiza o timestamp dos dados salvos (para manter ativo)
 */
export const refreshRememberMeTimestamp = (): void => {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(REMEMBER_ME_KEY);
    if (!stored) return;

    const data: RememberMeData = JSON.parse(stored);
    data.timestamp = Date.now();
    
    localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao atualizar timestamp de "Lembrar-me":', error);
  }
}; 