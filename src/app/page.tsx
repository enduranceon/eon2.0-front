'use client';

import React from 'react';

export default function HomePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1976d2 0%, #2e7d32 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>
          Endurance On
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>
          Sua plataforma completa para assessoria esportiva em corrida e triathlon
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              backgroundColor: 'white',
              color: '#1976d2',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Acessar Plataforma
          </button>
          <button 
            onClick={() => window.location.href = '/register'}
            style={{
              backgroundColor: 'transparent',
              color: 'white',
              padding: '12px 24px',
              border: '2px solid white',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Começar Agora
          </button>
        </div>
      </div>
    </div>
  );
} 