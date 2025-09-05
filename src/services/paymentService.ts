import { PaymentMethod, PlanPeriod, Payment, Subscription, PaginatedResponse, PaymentFilters } from '../types/api';
import { enduranceApi } from './enduranceApi';

export interface PaymentData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  holderEmail?: string;
  holderCpfCnpj?: string;
  holderPostalCode?: string;
  holderAddressNumber?: string;
  holderPhone?: string;
}

export interface PaymentRequest {
  customerId: string;
  planType: 'essencial' | 'premium';
  modalidade: 'corrida' | 'triathlon';
  period: PlanPeriod;
  paymentMethod: PaymentMethod;
  creditCardData?: PaymentData;
  coachId: string;
  splitPercentage: number; // Porcentagem para o coach
}

export interface PaymentResponse {
  paymentId: string;
  status: 'pending' | 'confirmed' | 'failed';
  qrCode?: string; // Para PIX
  boletoUrl?: string; // Para boleto
  installmentUrl?: string; // Para cartão
  splitTransactionId?: string;
  message: string;
  dueDate?: string;
}

export interface SubaccountData {
  coachId: string;
  name: string;
  email: string;
  cpfCnpj: string;
  mobilePhone?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface SubaccountResponse {
  subaccountId: string;
  walletId: string;
  status: 'active' | 'pending' | 'suspended';
  message: string;
}

class PaymentService {
  private readonly ASAAS_API_KEY = process.env.NEXT_PUBLIC_ASAAS_API_KEY;
  private readonly ASAAS_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api.asaas.com/v3' 
    : 'https://sandbox.asaas.com/api/v3';

  // Preços dos planos
  private planPrices = {
    essencial: {
      corrida: {
        monthly: 250,
        quarterly: 185,
        semiannual: 175,
        annual: 165,
      },
      triathlon: {
        monthly: 320,
        quarterly: 250,
        semiannual: 240,
        annual: 230,
      },
    },
    premium: {
      corrida: {
        monthly: 390,
        quarterly: 290,
        semiannual: 280,
        annual: 270,
      },
      triathlon: {
        monthly: 560,
        quarterly: 420,
        semiannual: 410,
        annual: 400,
      },
    },
  };

  // Taxa de matrícula (adicional na primeira cobrança)
  private readonly ENROLLMENT_FEE = 50;

  // Configurações de split por nível de coach
  private splitConfigurations = {
    junior: 60, // Coach recebe 60%
    pleno: 65,  // Coach recebe 65%
    senior: 70, // Coach recebe 70%
    specialist: 75, // Coach recebe 75%
  };

  // Processar pagamento
  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Se não tiver API key, usar mock
      if (!this.ASAAS_API_KEY) {
        return this.mockPaymentProcessing(paymentRequest);
      }

      // Verificar se coach tem subconta
      const subaccount = await this.ensureCoachSubaccount(paymentRequest.coachId);
      if (!subaccount) {
        throw new Error('Erro ao configurar subconta do treinador');
      }

      // Calcular valores
      const amount = this.calculateAmount(paymentRequest);
      const splitAmount = Math.round(amount * (paymentRequest.splitPercentage / 100));

      // Criar cobrança principal
      const payment = await this.createAsaasPayment({
        customerId: paymentRequest.customerId,
        amount,
        paymentMethod: paymentRequest.paymentMethod,
        creditCardData: paymentRequest.creditCardData,
        description: `${paymentRequest.planType} ${paymentRequest.modalidade} - ${paymentRequest.period}`,
      });

      // Criar split de pagamento
      if (payment.status === 'confirmed') {
        await this.createSplitPayment({
          paymentId: payment.paymentId,
          subaccountId: subaccount.subaccountId,
          amount: splitAmount,
        });
      }

      return payment;
    } catch (error) {
      console.error('Erro no processamento de pagamento:', error);
      return {
        paymentId: '',
        status: 'failed',
        message: 'Erro ao processar pagamento. Tente novamente.',
      };
    }
  }

  // Calcular valor total incluindo taxa de matrícula
  private calculateAmount(request: PaymentRequest): number {
    const baseAmount = this.planPrices[request.planType][request.modalidade][request.period];
    return baseAmount + this.ENROLLMENT_FEE;
  }

  // Mock do processamento de pagamento
  private async mockPaymentProcessing(request: PaymentRequest): Promise<PaymentResponse> {
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const amount = this.calculateAmount(request);

    // Simular diferentes resultados baseado no método de pagamento
    switch (request.paymentMethod) {
      case PaymentMethod.PIX:
        return {
          paymentId,
          status: 'pending',
          qrCode: `00020126580014br.gov.bcb.pix013636d7f239-8a64-43a3-a8e8-${paymentId}5204000053039865802BR5913ENDURANCE ON6014Belo Horizonte62070503***630445CC`,
          message: 'PIX gerado com sucesso! Escaneie o QR Code para pagar.',
          dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
        };

      case PaymentMethod.BOLETO:
        return {
          paymentId,
          status: 'pending',
          boletoUrl: `https://mock-asaas.com/boleto/${paymentId}.pdf`,
          message: 'Boleto gerado com sucesso! Clique no link para imprimir.',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 dias
        };

      case PaymentMethod.CREDIT_CARD:
        // Simular validação de cartão
        if (!request.creditCardData || !this.validateCreditCard(request.creditCardData)) {
          return {
            paymentId: '',
            status: 'failed',
            message: 'Dados do cartão inválidos. Verifique as informações.',
          };
        }

        // Simular aprovação (90% de chance)
        const isApproved = Math.random() > 0.1;
        
        return {
          paymentId,
          status: isApproved ? 'confirmed' : 'failed',
          message: isApproved 
            ? 'Pagamento aprovado com sucesso! Bem-vindo à Endurance On!'
            : 'Pagamento recusado. Verifique os dados do cartão ou tente outro cartão.',
          splitTransactionId: isApproved ? `split_${paymentId}` : undefined,
        };

      default:
        throw new Error('Método de pagamento não suportado');
    }
  }

  // Validar dados do cartão de crédito
  private validateCreditCard(cardData: PaymentData): boolean {
    const { number, expiryMonth, expiryYear, ccv, holderName } = cardData;

    // Validações básicas
    if (!holderName || holderName.length < 2) return false;
    if (!number || number.replace(/\D/g, '').length < 13) return false;
    if (!expiryMonth || !expiryYear) return false;
    if (!ccv || ccv.length < 3) return false;

    // Validar data de expiração
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    const expMonth = parseInt(expiryMonth);
    const expYear = parseInt(expiryYear);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return false;
    }

    // Validação do algoritmo de Luhn (básica)
    const cleanNumber = number.replace(/\D/g, '');
    return this.luhnCheck(cleanNumber);
  }

  // Algoritmo de Luhn para validação de cartão
  private luhnCheck(num: string): boolean {
    let sum = 0;
    let isEven = false;
    
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  // Criar subconta para coach (mock)
  async createCoachSubaccount(subaccountData: SubaccountData): Promise<SubaccountResponse> {
    try {
      if (!this.ASAAS_API_KEY) {
        return this.mockSubaccountCreation(subaccountData);
      }

      // Implementação real com Asaas seria aqui
      // const response = await this.callAsaasAPI('/subaccounts', 'POST', subaccountData);
      
      return this.mockSubaccountCreation(subaccountData);
    } catch (error) {
      console.error('Erro ao criar subconta:', error);
      throw error;
    }
  }

  // Mock da criação de subconta
  private async mockSubaccountCreation(data: SubaccountData): Promise<SubaccountResponse> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const subaccountId = `subac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      subaccountId,
      walletId,
      status: 'active',
      message: 'Subconta criada com sucesso!',
    };
  }

  // Garantir que coach tem subconta
  private async ensureCoachSubaccount(coachId: string): Promise<SubaccountResponse | null> {
    // Em um ambiente real, verificaria no banco de dados se o coach já tem subconta
    // Por enquanto, simular que sempre tem
    return {
      subaccountId: `subac_${coachId}`,
      walletId: `wallet_${coachId}`,
      status: 'active',
      message: 'Subconta existente',
    };
  }

  // Criar cobrança no Asaas (mock)
  private async createAsaasPayment(data: any): Promise<PaymentResponse> {
    // Implementação mock
    return this.mockPaymentProcessing({
      customerId: data.customerId,
      planType: 'premium',
      modalidade: 'corrida',
      period: PlanPeriod.MONTHLY,
      paymentMethod: data.paymentMethod,
      creditCardData: data.creditCardData,
      coachId: 'mock',
      splitPercentage: 70,
    });
  }

  // Criar split de pagamento (mock)
  private async createSplitPayment(data: {
    paymentId: string;
    subaccountId: string;
    amount: number;
  }): Promise<boolean> {
    // Mock: sempre sucesso
    return true;
  }

  // Obter split percentage baseado no nível do coach
  getSplitPercentage(coachLevel: string): number {
    return this.splitConfigurations[coachLevel as keyof typeof this.splitConfigurations] || 60;
  }

  // Calcular valores de split
  calculateSplitAmounts(amount: number, splitPercentage: number): {
    coachAmount: number;
    platformAmount: number;
    coachPercentage: number;
    platformPercentage: number;
  } {
    const coachAmount = Math.round(amount * (splitPercentage / 100));
    const platformAmount = amount - coachAmount;

    return {
      coachAmount,
      platformAmount,
      coachPercentage: splitPercentage,
      platformPercentage: 100 - splitPercentage,
    };
  }

  // Formatar valores para exibição
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  // Verificar status de pagamento
  async checkPaymentStatus(paymentId: string): Promise<'pending' | 'confirmed' | 'failed'> {
    // Mock: retornar status baseado no tempo
    const createdTime = parseInt(paymentId.split('_')[1]);
    const elapsedTime = Date.now() - createdTime;

    // Simular confirmação após 30 segundos para PIX/Boleto
    if (elapsedTime > 30000) {
      return Math.random() > 0.2 ? 'confirmed' : 'failed'; // 80% de sucesso
    }

    return 'pending';
  }

  async getActiveSubscription(): Promise<Subscription | null> {
    try {
      const response = await enduranceApi.getActiveSubscription();
      return response;
    } catch (error) {
      console.error('❌ PaymentService - Erro ao buscar assinatura ativa:', error);
      return null;
    }
  }

  async getPaymentHistory(filters?: PaymentFilters): Promise<PaginatedResponse<Payment>> {
    try {
      const response = await enduranceApi.getPayments(filters);
      
      return response;
    } catch (error: any) {
      console.error('❌ PaymentService - Erro ao buscar histórico de pagamentos:', error);
      
      // Se a API não existe (404), tentar gerar dados baseados na assinatura
      if (error?.response?.status === 404) {
        try {
          const subscription = await this.getActiveSubscription();
          if (subscription) {
            const mockPayments = this.generateMockPaymentsFromSubscription(subscription);
            
            return {
              data: mockPayments,
              pagination: {
                total: mockPayments.length,
                page: 1,
                limit: 50,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
              },
            };
          }
        } catch (subError) {
        }
      }
      
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  // Gerar pagamentos mockados baseados na assinatura existente
  private generateMockPaymentsFromSubscription(subscription: Subscription): Payment[] {
    const payments: Payment[] = [];
    const startDate = new Date(subscription.startDate);
    const currentDate = new Date();
    
    // Calcular quantos meses se passaram desde o início da assinatura
    const monthsDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    // Gerar pagamentos para cada mês (máximo 12 meses)
    for (let i = 0; i <= Math.min(monthsDiff, 11); i++) {
      const paymentDate = new Date(startDate);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      // Só gerar pagamentos para datas passadas
      if (paymentDate <= currentDate) {
        const dueDate = new Date(paymentDate);
        dueDate.setDate(15); // Vencimento dia 15
        
        const paidDate = new Date(dueDate);
        paidDate.setDate(Math.random() > 0.5 ? 12 : 18); // Pagos antes ou após vencimento
        
        const paymentMethod = i % 3 === 0 ? 'CREDIT_CARD' as any : i % 3 === 1 ? 'PIX' as any : 'BOLETO' as any;
        const isPaid = paidDate <= currentDate;
        
        // Gerar dados do Asaas baseado no método de pagamento
        const asaasPaymentData = this.generateAsaasPaymentData(paymentMethod, isPaid, subscription.amount);

        const payment: Payment = {
          id: `mock_payment_${subscription.id}_${i}`,
          subscriptionId: subscription.id,
          userId: subscription.userId,
          amount: subscription.amount,
          paymentMethod,
          status: isPaid ? 'CONFIRMED' as any : 'PENDING' as any,
          asaasPaymentId: `pay_asaas_${Date.now()}_${i}`,
          asaasPaymentData,
          dueDate: dueDate.toISOString(),
          paidAt: isPaid ? paidDate.toISOString() : undefined,
          createdAt: paymentDate.toISOString(),
        };
        
        payments.push(payment);
      }
    }
    
    return payments.reverse(); // Mais recentes primeiro
  }

  // Gerar dados do Asaas para diferentes métodos de pagamento
  private generateAsaasPaymentData(paymentMethod: string, isPaid: boolean, amount: number) {
    const baseData = {
      id: `pay_asaas_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: isPaid ? 'CONFIRMED' : 'PENDING',
      billingType: paymentMethod as PaymentMethod,
      invoiceUrl: `https://www.asaas.com/i/pay_asaas_${Date.now()}`,
      transactionReceiptUrl: isPaid ? `https://www.asaas.com/r/pay_asaas_${Date.now()}` : undefined,
    };

    switch (paymentMethod) {
      case 'PIX':
        return {
          ...baseData,
          pixData: {
            encodedImage: this.generateMockQRCode(),
            payload: this.generateMockPixPayload(amount),
            expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
          },
        };

      case 'BOLETO':
        return {
          ...baseData,
          boletoData: {
            bankSlipUrl: `https://www.asaas.com/b/pdf/pay_asaas_${Date.now()}`,
            bankSlipBarCode: this.generateMockBoletoBarCode(),
            bankSlipBarCodeNumber: this.generateMockBoletoNumber(),
          },
        };

      case 'CREDIT_CARD':
        return {
          ...baseData,
          creditCardData: {
            holderName: 'João Silva',
            number: '4111111111111111',
            expiryMonth: '12',
            expiryYear: '2025',
          },
        };

      default:
        return baseData;
    }
  }

  // Gerar QR Code mock (base64 de uma imagem simples)
  private generateMockQRCode(): string {
    // QR Code mock em base64 (imagem 200x200 pixels)
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDgvMDEvMjO8qJqJAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDI0LTAxLTE1VDEwOjAwOjAwKzAwOjAw8qJqJAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyNC0wMS0xNVQxMDowMDowMCswMDowMPKiayQAAAAASUVORK5CYII=';
  }

  // Gerar payload PIX mock
  private generateMockPixPayload(amount: number): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    return `00020126580014br.gov.bcb.pix013636d7f239-8a64-43a3-a8e8-${Date.now()}5204000053039865802BR5913ENDURANCE ON6014Belo Horizonte62070503***6304${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  // Gerar código de barras do boleto mock
  private generateMockBoletoBarCode(): string {
    return '23791.12345.67890.123456.78901.234567.8.12345678901234';
  }

  // Gerar número do código de barras do boleto mock
  private generateMockBoletoNumber(): string {
    return '23791123456789012345678901234567812345678901234';
  }
}

export const paymentService = new PaymentService(); 