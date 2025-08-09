'use client';

import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedUserTypes={['FITNESS_STUDENT']}>
      {children}
    </ProtectedRoute>
  );
}


