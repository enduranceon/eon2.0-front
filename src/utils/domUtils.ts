/**
 * Utilitários para manipulação segura do DOM
 */

/**
 * Executa querySelector de forma segura, evitando erros de seletores vazios
 * @param selector - O seletor CSS
 * @param parent - O elemento pai (opcional, padrão: document)
 * @returns O elemento encontrado ou null
 */
export function safeQuerySelector(
  selector: string,
  parent: Document | Element = document
): Element | null {
  try {
    // Verificar se o seletor não está vazio
    if (!selector || selector.trim() === '') {
      return null;
    }

    // Verificar se o parent é válido
    if (!parent) {
      return null;
    }

    return parent.querySelector(selector);
  } catch (error) {
    return null;
  }
}

/**
 * Executa querySelectorAll de forma segura
 * @param selector - O seletor CSS
 * @param parent - O elemento pai (opcional, padrão: document)
 * @returns NodeList dos elementos encontrados ou NodeList vazio
 */
export function safeQuerySelectorAll(
  selector: string,
  parent: Document | Element = document
): NodeListOf<Element> {
  try {
    // Verificar se o seletor não está vazio
    if (!selector || selector.trim() === '') {
      return document.querySelectorAll(':not(*)'); // Retorna NodeList vazio
    }

    // Verificar se o parent é válido
    if (!parent) {
      return document.querySelectorAll(':not(*)'); // Retorna NodeList vazio
    }

    return parent.querySelectorAll(selector);
  } catch (error) {
    return document.querySelectorAll(':not(*)'); // Retorna NodeList vazio
  }
}

/**
 * Verifica se um elemento existe no DOM
 * @param selector - O seletor CSS
 * @param parent - O elemento pai (opcional, padrão: document)
 * @returns true se o elemento existe, false caso contrário
 */
export function elementExists(
  selector: string,
  parent: Document | Element = document
): boolean {
  return safeQuerySelector(selector, parent) !== null;
}

/**
 * Aguarda um elemento aparecer no DOM
 * @param selector - O seletor CSS
 * @param timeout - Timeout em ms (padrão: 5000ms)
 * @param parent - O elemento pai (opcional, padrão: document)
 * @returns Promise que resolve com o elemento ou null se timeout
 */
export function waitForElement(
  selector: string,
  timeout: number = 5000,
  parent: Document | Element = document
): Promise<Element | null> {
  return new Promise((resolve) => {
    // Verificar se o seletor não está vazio
    if (!selector || selector.trim() === '') {
      resolve(null);
      return;
    }

    // Verificar se o elemento já existe
    const element = safeQuerySelector(selector, parent);
    if (element) {
      resolve(element);
      return;
    }

    // Configurar observer para aguardar o elemento
    const observer = new MutationObserver(() => {
      const element = safeQuerySelector(selector, parent);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    // Iniciar observação
    observer.observe(parent, {
      childList: true,
      subtree: true,
    });

    // Configurar timeout
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Remove elementos do DOM de forma segura
 * @param selector - O seletor CSS
 * @param parent - O elemento pai (opcional, padrão: document)
 * @returns true se o elemento foi removido, false caso contrário
 */
export function safeRemoveElement(
  selector: string,
  parent: Document | Element = document
): boolean {
  try {
    const element = safeQuerySelector(selector, parent);
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Adiciona um event listener de forma segura
 * @param selector - O seletor CSS
 * @param event - O tipo de evento
 * @param handler - O handler do evento
 * @param options - Opções do event listener
 * @param parent - O elemento pai (opcional, padrão: document)
 * @returns true se o listener foi adicionado, false caso contrário
 */
export function safeAddEventListener(
  selector: string,
  event: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions,
  parent: Document | Element = document
): boolean {
  try {
    const element = safeQuerySelector(selector, parent);
    if (element) {
      element.addEventListener(event, handler, options);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Remove um event listener de forma segura
 * @param selector - O seletor CSS
 * @param event - O tipo de evento
 * @param handler - O handler do evento
 * @param options - Opções do event listener
 * @param parent - O elemento pai (opcional, padrão: document)
 * @returns true se o listener foi removido, false caso contrário
 */
export function safeRemoveEventListener(
  selector: string,
  event: string,
  handler: EventListener,
  options?: boolean | EventListenerOptions,
  parent: Document | Element = document
): boolean {
  try {
    const element = safeQuerySelector(selector, parent);
    if (element) {
      element.removeEventListener(event, handler, options);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
} 