export interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  isValid: boolean;
}

export interface AddressValidation {
  isValid: boolean;
  message: string;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}

class GeocodingService {
  private readonly GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Validar endereço e obter coordenadas
  async validateAddress(address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  }): Promise<AddressValidation> {
    try {
      // Formatear endereço para busca
      const fullAddress = this.formatAddressForSearch(address);
      
      // Se não tiver API key do Google, usar mock realista
      if (!this.GOOGLE_MAPS_API_KEY) {
        return this.mockGeocodingValidation(address);
      }

      // Fazer chamada real para Google Geocoding API
      const result = await this.callGoogleGeocodingAPI(fullAddress);
      
      return {
        isValid: result.isValid,
        message: result.isValid 
          ? 'Endereço validado com sucesso!' 
          : 'Endereço não encontrado. Verifique os dados informados.',
        coordinates: result.isValid ? { lat: result.lat, lng: result.lng } : undefined,
        formattedAddress: result.formattedAddress,
      };
    } catch (error) {
      console.error('Erro na validação de endereço:', error);
      return {
        isValid: false,
        message: 'Erro ao validar endereço. Tente novamente.',
      };
    }
  }

  // Formatear endereço para busca
  private formatAddressForSearch(address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  }): string {
    const parts = [
      `${address.street}, ${address.number}`,
      address.neighborhood,
      address.city,
      address.state,
      address.zipCode,
      address.country || 'Brasil'
    ].filter(Boolean);

    return parts.join(', ');
  }

  // Chamada real para Google Geocoding API
  private async callGoogleGeocodingAPI(address: string): Promise<GeocodingResult> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        isValid: true,
      };
    }

    return {
      lat: 0,
      lng: 0,
      formattedAddress: '',
      isValid: false,
    };
  }

  // Mock realista para desenvolvimento (quando não há API key)
  private mockGeocodingValidation(address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }): AddressValidation {
    // Todos os estados brasileiros válidos
    const validStates = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
      'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
      'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];
    
    // Validações básicas
    const isStateValid = validStates.includes(address.state.toUpperCase());
    const isZipCodeValid = /^\d{5}-?\d{3}$/.test(address.zipCode);
    const isCityValid = address.city.length > 2;
    
    const isValid = isCityValid && 
                   isStateValid && 
                   isZipCodeValid && 
                   address.street.length > 3 &&
                   address.number.length > 0;

    if (isValid) {
      // Gerar coordenadas mock baseadas na cidade
      const mockCoordinates = this.generateMockCoordinates(address.city, address.state);
      
      return {
        isValid: true,
        message: 'Endereço validado com sucesso!',
        coordinates: mockCoordinates,
        formattedAddress: `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city} - ${address.state}, ${address.zipCode}`,
      };
    }

    // Mensagens de erro específicas para debug
    const errors = [];
    if (!isCityValid) errors.push('nome da cidade muito curto');
    if (!isStateValid) errors.push(`estado "${address.state}" não é válido`);
    if (!isZipCodeValid) errors.push('CEP deve ter formato 00000-000');
    if (address.street.length <= 3) errors.push('nome da rua muito curto');
    if (address.number.length === 0) errors.push('número é obrigatório');

    return {
      isValid: false,
      message: `Endereço inválido: ${errors.join(', ')}. Verifique os dados e tente novamente.`,
    };
  }

  // Gerar coordenadas mock realistas para cidades brasileiras
  private generateMockCoordinates(city: string, state: string): { lat: number; lng: number } {
    const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'São Paulo': { lat: -23.5505, lng: -46.6333 },
      'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
      'Belo Horizonte': { lat: -19.9167, lng: -43.9345 },
      'Salvador': { lat: -12.9714, lng: -38.5014 },
      'Brasília': { lat: -15.8267, lng: -47.9218 },
      'Fortaleza': { lat: -3.7172, lng: -38.5434 },
      'São José': { lat: -27.5969, lng: -48.6388 },
      'Florianópolis': { lat: -27.5954, lng: -48.5480 },
      'Joinville': { lat: -26.3045, lng: -48.8487 },
      'Blumenau': { lat: -26.9194, lng: -49.0661 },
    };

    // Buscar coordenadas da cidade
    const foundCity = Object.keys(cityCoordinates).find(c => 
      city.toLowerCase().includes(c.toLowerCase())
    );

    if (foundCity) {
      const base = cityCoordinates[foundCity];
      // Adicionar pequena variação para simular endereços diferentes
      return {
        lat: base.lat + (Math.random() - 0.5) * 0.1,
        lng: base.lng + (Math.random() - 0.5) * 0.1,
      };
    }

    // Coordenadas por estado para quando não encontrar a cidade específica
    const stateCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'SC': { lat: -27.2423, lng: -50.2189 }, // Santa Catarina
      'SP': { lat: -23.5505, lng: -46.6333 }, // São Paulo
      'RJ': { lat: -22.9068, lng: -43.1729 }, // Rio de Janeiro
      'MG': { lat: -19.9167, lng: -43.9345 }, // Minas Gerais
      'RS': { lat: -30.0346, lng: -51.2177 }, // Rio Grande do Sul
      'PR': { lat: -25.4284, lng: -49.2733 }, // Paraná
    };

    const stateCoords = stateCoordinates[state.toUpperCase()];
    if (stateCoords) {
      return {
        lat: stateCoords.lat + (Math.random() - 0.5) * 0.5,
        lng: stateCoords.lng + (Math.random() - 0.5) * 0.5,
      };
    }

    // Coordenadas padrão para o Brasil (centro geográfico)
    return {
      lat: -14.2350 + (Math.random() - 0.5) * 10,
      lng: -51.9253 + (Math.random() - 0.5) * 10,
    };
  }

  // Buscar endereço por CEP (ViaCEP API)
  async getAddressByCep(cep: string): Promise<{
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    isValid: boolean;
    message: string;
  }> {
    try {
      const cleanCep = cep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        return {
          isValid: false,
          message: 'CEP deve ter 8 dígitos',
        };
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        return {
          isValid: false,
          message: 'CEP não encontrado',
        };
      }

      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        isValid: true,
        message: 'CEP encontrado com sucesso!',
      };
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return {
        isValid: false,
        message: 'Erro ao consultar CEP. Tente novamente.',
      };
    }
  }
}

export const geocodingService = new GeocodingService(); 