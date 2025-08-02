'use client';

import React from 'react';
import { useBrowserExtensionProtection, useFormProtection } from '@/hooks/useBrowserExtensionProtection';

/**
 * Componente que protege a aplicação contra interferências de extensões do navegador
 * Este componente não renderiza nada visualmente, apenas aplica proteções
 */
export function BrowserExtensionProtection() {
  // Aplicar proteção contra extensões
  useBrowserExtensionProtection();
  
  // Aplicar proteção de formulários
  useFormProtection();

  // Este componente não renderiza nada
  return null;
}

/**
 * Componente para proteger formulários específicos
 */
interface FormProtectionProps {
  children: React.ReactNode;
  className?: string;
}

export function FormProtection({ children, className }: FormProtectionProps) {
  useFormProtection();

  return (
    <div className={className} data-form-protection="true">
      {children}
    </div>
  );
} 