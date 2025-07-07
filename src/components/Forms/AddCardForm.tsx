import React from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';

interface AddCardFormProps {
  onSubmit: (values: any, helpers: any) => void;
  onCancel: () => void;
  initialValues?: any;
}

const cardSchema = Yup.object().shape({
  holderName: Yup.string().required('O nome do titular é obrigatório.'),
  number: Yup.string()
    .matches(/^[0-9]{16}$/, 'Número do cartão deve ter 16 dígitos.')
    .required('O número do cartão é obrigatório.'),
  expiryMonth: Yup.string()
    .matches(/^(0[1-9]|1[0-2])$/, 'Mês inválido (01-12).')
    .required('O mês de validade é obrigatório.'),
  expiryYear: Yup.string()
    .matches(/^20(2[4-9]|[3-9][0-9])$/, 'Ano inválido (ex: 2025).')
    .required('O ano de validade é obrigatório.'),
  ccv: Yup.string()
    .matches(/^[0-9]{3,4}$/, 'CVV deve ter 3 ou 4 dígitos.')
    .required('O CVV é obrigatório.'),
  isDefault: Yup.boolean(),
});

export default function AddCardForm({ onSubmit, onCancel, initialValues = { holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '', isDefault: false } }: AddCardFormProps) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={cardSchema}
      onSubmit={onSubmit}
    >
      {({ errors, touched, isSubmitting, status }) => (
        <Form>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Field
                name="holderName"
                as={TextField}
                label="Nome no Cartão"
                fullWidth
                error={touched.holderName && Boolean(errors.holderName)}
                helperText={touched.holderName && errors.holderName}
              />
            </Grid>
            <Grid item xs={12}>
              <Field
                name="number"
                as={TextField}
                label="Número do Cartão"
                fullWidth
                error={touched.number && Boolean(errors.number)}
                helperText={touched.number && errors.number}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Field
                name="expiryMonth"
                as={TextField}
                label="Mês (MM)"
                fullWidth
                error={touched.expiryMonth && Boolean(errors.expiryMonth)}
                helperText={touched.expiryMonth && errors.expiryMonth}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <Field
                name="expiryYear"
                as={TextField}
                label="Ano (AAAA)"
                fullWidth
                error={touched.expiryYear && Boolean(errors.expiryYear)}
                helperText={touched.expiryYear && errors.expiryYear}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Field
                name="ccv"
                as={TextField}
                label="CVV"
                fullWidth
                error={touched.ccv && Boolean(errors.ccv)}
                helperText={touched.ccv && errors.ccv}
              />
            </Grid>
            <Grid item xs={12}>
                <FormControlLabel
                    control={
                        <Field
                            as={Checkbox}
                            type="checkbox"
                            name="isDefault"
                        />
                    }
                    label="Definir como método de pagamento padrão"
                />
            </Grid>
          </Grid>
          
          {status && <Alert severity="error" sx={{ mt: 2 }}>{status}</Alert>}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
            <Button onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Cartão'}
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  );
} 