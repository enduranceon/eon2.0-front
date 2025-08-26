import { UserType, Gender } from './api';

export interface AddressData {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface FormData {
  // Campos básicos
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
  
  // Campos específicos
  cpf: string;
  phone: string;
  birthDate?: string;
  gender?: Gender | string;
  
  // Para alunos
  address?: AddressData;
  avatar?: string;
}
