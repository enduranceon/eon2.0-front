/**
 * Utilitários para validação e formatação de CPF
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 */
export const removeNonDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Aplica máscara de CPF (000.000.000-00)
 */
export const applyCpfMask = (value: string): string => {
  const digits = removeNonDigits(value);
  
  // Limitar a 11 dígitos
  const limitedDigits = digits.slice(0, 11);
  
  if (limitedDigits.length <= 3) {
    return limitedDigits;
  } else if (limitedDigits.length <= 6) {
    return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3)}`;
  } else if (limitedDigits.length <= 9) {
    return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6)}`;
  } else {
    return `${limitedDigits.slice(0, 3)}.${limitedDigits.slice(3, 6)}.${limitedDigits.slice(6, 9)}-${limitedDigits.slice(9, 11)}`;
  }
};

/**
 * Remove a máscara de CPF, retornando apenas os dígitos
 */
export const removeCpfMask = (value: string): string => {
  return removeNonDigits(value);
};

/**
 * Valida se um CPF é válido
 */
export const validateCpf = (cpf: string): boolean => {
  // Remove caracteres não numéricos
  const cleanCpf = removeNonDigits(cpf);
  
  // Verifica se tem 11 dígitos
  if (cleanCpf.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCpf)) {
    return false;
  }
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCpf.charAt(9))) {
    return false;
  }
  
  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(cleanCpf.charAt(10))) {
    return false;
  }
  
  return true;
};

/**
 * Valida e formata CPF, retornando um objeto com informações de validação
 */
export const validateAndFormatCpf = (value: string): {
  isValid: boolean;
  formatted: string;
  clean: string;
  error?: string;
} => {
  const clean = removeNonDigits(value);
  const formatted = applyCpfMask(value);
  
  // Se não tem dígitos suficientes, não é erro ainda
  if (clean.length < 11) {
    return {
      isValid: false,
      formatted,
      clean,
    };
  }
  
  // Se tem mais de 11 dígitos, é inválido
  if (clean.length > 11) {
    return {
      isValid: false,
      formatted,
      clean: clean.slice(0, 11),
      error: 'CPF deve ter exatamente 11 dígitos',
    };
  }
  
  // Se tem exatamente 11 dígitos, valida
  if (clean.length === 11) {
    const isValid = validateCpf(clean);
    return {
      isValid,
      formatted,
      clean,
      error: isValid ? undefined : 'CPF inválido',
    };
  }
  
  return {
    isValid: false,
    formatted,
    clean,
  };
}; 