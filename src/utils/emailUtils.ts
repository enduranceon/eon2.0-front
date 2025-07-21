/**
 * Utilitários para validação de e-mail
 */

/**
 * Valida se um e-mail é válido usando regex
 */
export const validateEmail = (email: string): boolean => {
  // Regex para validação de e-mail
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Valida e formata e-mail, retornando um objeto com informações de validação
 */
export const validateAndFormatEmail = (value: string): {
  isValid: boolean;
  formatted: string;
  error?: string;
} => {
  const trimmedEmail = value.trim().toLowerCase();
  
  // Se o campo está vazio, não é erro ainda
  if (!trimmedEmail) {
    return {
      isValid: false,
      formatted: value,
    };
  }
  
  // Verifica se tem pelo menos um @
  if (!trimmedEmail.includes('@')) {
    return {
      isValid: false,
      formatted: trimmedEmail,
      error: 'E-mail deve conter @',
    };
  }
  
  // Verifica se tem domínio após o @
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2 || !parts[1]) {
    return {
      isValid: false,
      formatted: trimmedEmail,
      error: 'E-mail deve ter um domínio válido',
    };
  }
  
  // Verifica se o domínio tem pelo menos um ponto
  const domain = parts[1];
  if (!domain.includes('.')) {
    return {
      isValid: false,
      formatted: trimmedEmail,
      error: 'Domínio deve ter pelo menos um ponto (ex: .com)',
    };
  }
  
  // Verifica se o domínio tem extensão válida
  const domainParts = domain.split('.');
  if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) {
    return {
      isValid: false,
      formatted: trimmedEmail,
      error: 'Domínio deve ter uma extensão válida (ex: .com, .br)',
    };
  }
  
  // Validação completa com regex
  const isValid = validateEmail(trimmedEmail);
  
  return {
    isValid,
    formatted: trimmedEmail,
    error: isValid ? undefined : 'Formato de e-mail inválido',
  };
};

/**
 * Verifica se o e-mail tem formato básico válido (para validação em tempo real)
 */
export const hasValidEmailFormat = (email: string): boolean => {
  const trimmedEmail = email.trim();
  
  // Verificações básicas para feedback em tempo real
  return trimmedEmail.includes('@') && 
         trimmedEmail.split('@')[1]?.includes('.') &&
         trimmedEmail.length > 5;
}; 