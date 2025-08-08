import { useEffect, useRef } from 'react';

/**
 * Hook para proteger contra interferências de extensões do navegador
 * que podem causar erros como querySelector com seletor vazio
 */
export function useBrowserExtensionProtection() {
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Função para capturar e suprimir erros de extensões
    const handleError = (event: ErrorEvent) => {
      // Verificar se o erro é de uma extensão do navegador
      const isExtensionError = 
        event.filename?.includes('autofill') ||
        event.filename?.includes('password') ||
        event.filename?.includes('extension') ||
        event.filename?.includes('chrome-extension') ||
        event.filename?.includes('moz-extension') ||
        event.message?.includes('querySelector') ||
        event.message?.includes('empty selector');

      if (isExtensionError) {
        // Suprimir o erro no console para não poluir os logs
        event.preventDefault();
        return false;
      }

      // Permitir outros erros passarem normalmente
      return true;
    };

    // Função para capturar promessas rejeitadas de extensões
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Verificar se é um erro de extensão
      const isExtensionError = 
        error?.message?.includes('querySelector') ||
        error?.message?.includes('empty selector') ||
        error?.stack?.includes('autofill') ||
        error?.stack?.includes('password') ||
        error?.stack?.includes('extension');

      if (isExtensionError) {
        // Suprimir o erro
        event.preventDefault();
        return false;
      }

      // Permitir outras rejeições passarem normalmente
      return true;
    };

    // Adicionar listeners
    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Configurar observer para detectar mudanças no DOM que podem ser causadas por extensões
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Verificar se as mudanças são suspeitas (causadas por extensões)
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Verificar se o elemento tem atributos suspeitos de extensões
              const hasExtensionAttributes = 
                element.hasAttribute('data-autofill') ||
                element.hasAttribute('data-password-manager') ||
                element.hasAttribute('data-extension') ||
                element.classList.contains('autofill') ||
                element.classList.contains('password-manager') ||
                element.classList.contains('extension');

              if (hasExtensionAttributes) {
                
              }
            }
          });
        }
      });
    });

    // Iniciar observação
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-autofill', 'data-password-manager', 'data-extension']
    });

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Função para verificar se há extensões interferindo
  const checkForExtensionInterference = () => {
    const suspiciousElements = document.querySelectorAll(
      '[data-autofill], [data-password-manager], [data-extension], .autofill, .password-manager, .extension'
    );
    
    return suspiciousElements.length > 0;
  };

  // Função para limpar interferências de extensões
  const clearExtensionInterference = () => {
    const suspiciousElements = document.querySelectorAll(
      '[data-autofill], [data-password-manager], [data-extension], .autofill, .password-manager, .extension'
    );
    
    suspiciousElements.forEach((element) => {
      // Remover atributos suspeitos
      element.removeAttribute('data-autofill');
      element.removeAttribute('data-password-manager');
      element.removeAttribute('data-extension');
      
      // Remover classes suspeitas
      element.classList.remove('autofill', 'password-manager', 'extension');
    });
  };

  return {
    checkForExtensionInterference,
    clearExtensionInterference
  };
}

/**
 * Hook para proteger formulários contra autofill de extensões
 */
export function useFormProtection() {
  useEffect(() => {
    // Função para prevenir autofill indesejado
    const preventAutofill = (event: Event) => {
      const target = event.target as HTMLInputElement;
      
      // Se o campo não deve ter autofill, limpar o valor
      if (target.autocomplete === 'off' || target.dataset.noAutofill === 'true') {
        // Aguardar um frame para permitir que o autofill seja aplicado
        requestAnimationFrame(() => {
          if (target.value && !target.dataset.userTyped) {
            target.value = '';
          }
        });
      }
    };

    // Adicionar listeners para todos os campos de input
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
    
    inputs.forEach((input) => {
      input.addEventListener('input', preventAutofill);
      input.addEventListener('change', preventAutofill);
    });

    // Cleanup
    return () => {
      inputs.forEach((input) => {
        input.removeEventListener('input', preventAutofill);
        input.removeEventListener('change', preventAutofill);
      });
    };
  }, []);

  // Função para marcar um campo como digitado pelo usuário
  const markAsUserTyped = (element: HTMLInputElement) => {
    element.dataset.userTyped = 'true';
  };

  return { markAsUserTyped };
} 