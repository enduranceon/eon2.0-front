import React from 'react';
import { Controller, Control } from 'react-hook-form';
import * as z from 'zod';
import {
  Box,
  TextField,
  Grid,
  Typography,
  Divider,
} from '@mui/material';

// Schema de validação para o formulário de checkout com cartão
export const checkoutCardSchema = z.object({
  // Dados do Cartão (AsaasCreditCardDto)
  creditCard: z.object({
    holderName: z.string().min(3, 'Nome no cartão é obrigatório'),
    number: z.string().min(16, 'Número do cartão inválido').max(19, 'Número do cartão inválido'),
    expiryMonth: z.string().min(2, 'Mês inválido').max(2, 'Mês inválido'),
    expiryYear: z.string().min(4, 'Ano inválido').max(4, 'Ano inválido'),
    ccv: z.string().min(3, 'CVV inválido').max(4, 'CVV inválido'),
  }),
  // Dados do Titular (AsaasCreditCardHolderInfoDto)
  creditCardHolderInfo: z.object({
    name: z.string().min(3, 'Nome do titular é obrigatório'),
    email: z.string().email('Email do titular inválido'),
    cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
    postalCode: z.string().min(8, 'CEP inválido'),
    addressNumber: z.string().min(1, 'Número do endereço é obrigatório'),
    phone: z.string().min(10, 'Telefone inválido'),
  }),
});

export type CheckoutCardFormData = z.infer<typeof checkoutCardSchema>;

interface CheckoutCreditCardFormProps {
  control: Control<CheckoutCardFormData>;
}

export default function CheckoutCreditCardForm({ control }: CheckoutCreditCardFormProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Dados do Titular do Cartão
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Controller
            name="creditCardHolderInfo.name"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Nome Completo" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="creditCardHolderInfo.email"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Email" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="creditCardHolderInfo.cpfCnpj"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} label="CPF/CNPJ" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="creditCardHolderInfo.phone"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Telefone" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="creditCardHolderInfo.postalCode"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} label="CEP" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Controller
            name="creditCardHolderInfo.addressNumber"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Número do Endereço" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Dados do Cartão de Crédito
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Controller
            name="creditCard.holderName"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Nome Impresso no Cartão" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <Controller
            name="creditCard.number"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Número do Cartão" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <Controller
            name="creditCard.expiryMonth"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Mês de Validade (MM)" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <Controller
            name="creditCard.expiryYear"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Ano de Validade (AAAA)" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="creditCard.ccv"
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} label="Código de Segurança (CVV)" fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
} 