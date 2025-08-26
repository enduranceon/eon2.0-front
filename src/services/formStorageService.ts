import { FormData } from '../types/formData';

const STORAGE_KEY = 'endurance_register_form_data';

class FormStorageService {
  /**
   * Salva os dados do formulário no localStorage
   */
  saveFormData(formData: FormData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
    }
  }

  /**
   * Recupera os dados do formulário do localStorage
   */
  getFormData(): FormData | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Erro ao recuperar dados do localStorage:', error);
      return null;
    }
  }

  /**
   * Limpa os dados do formulário do localStorage
   */
  clearFormData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar dados do localStorage:', error);
    }
  }

  /**
   * Verifica se existem dados salvos
   */
  hasStoredData(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Salva o passo atual do formulário
   */
  saveCurrentStep(step: number): void {
    try {
      localStorage.setItem('endurance_register_current_step', step.toString());
    } catch (error) {
      console.error('Erro ao salvar passo atual:', error);
    }
  }

  /**
   * Recupera o passo atual do formulário
   */
  getCurrentStep(): number {
    try {
      const stored = localStorage.getItem('endurance_register_current_step');
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Limpa o passo atual
   */
  clearCurrentStep(): void {
    try {
      localStorage.removeItem('endurance_register_current_step');
    } catch (error) {
      console.error('Erro ao limpar passo atual:', error);
    }
  }
}

export const formStorageService = new FormStorageService();
