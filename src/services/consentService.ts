import { enduranceApi } from './enduranceApi';
import { ConsentTerm, ConsentAcceptanceRequest } from '../types/api';

class ConsentService {
  /**
   * Busca o termo de consentimento mais recente
   */
  async getLatestConsent(): Promise<ConsentTerm> {
    try {
      // O enduranceApi.get() já processa a resposta e retorna apenas os dados
      const response = await enduranceApi.get('/consent/latest');
      
      console.log('Resposta da API processada:', response);
      
      // Verificar se a resposta existe
      if (!response) {
        throw new Error('Resposta da API vazia');
      }
      
      // A API retorna { success: true, data: { ... } }
      // Como o enduranceApi já processa a resposta, response já é o data
      const responseData = response as any;
      if (responseData.id && responseData.content) {
        return {
          id: responseData.id,
          version: responseData.version || '1.0',
          title: 'Termo de Consentimento LGPD - Endurance On',
          content: responseData.content,
          isActive: true,
          createdAt: responseData.createdAt || new Date().toISOString(),
          updatedAt: responseData.updatedAt || responseData.createdAt || new Date().toISOString(),
        };
      } 
      // Estrutura inesperada
      else {
        console.error('Estrutura de resposta inesperada:', response);
        throw new Error('Resposta da API em formato inesperado');
      }
    } catch (error) {
      console.error('Erro ao buscar termo de consentimento:', error);
      throw new Error('Não foi possível carregar o termo de consentimento');
    }
  }

  /**
   * Aceita o termo de consentimento
   */
  async acceptConsent(data: ConsentAcceptanceRequest): Promise<void> {
    try {
      console.log('Enviando dados para aceitar consentimento:', data);
      await enduranceApi.post('/consent/accept', data);
      console.log('Consentimento aceito com sucesso');
    } catch (error) {
      console.error('Erro ao aceitar termo de consentimento:', error);
      throw new Error('Não foi possível aceitar o termo de consentimento');
    }
  }

  /**
   * Verifica se o usuário já aceitou o termo de consentimento
   */
  async checkUserConsent(userId: string): Promise<boolean> {
    try {
      const response = await enduranceApi.get(`/consent/user/${userId}/status`);
      return (response as any).data.hasAccepted;
    } catch (error) {
      console.error('Erro ao verificar status do consentimento:', error);
      return false;
    }
  }
}

export const consentService = new ConsentService();
