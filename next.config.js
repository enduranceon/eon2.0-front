/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações para produção
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Configuração do ESLint para produção
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configurações de imagem
  images: {
    domains: ['localhost', 'api.endurance.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Configurações de build
  experimental: {
    // optimizeCss: true, // Desabilitado devido a problemas com critters
  },
  
  // Configurações de webpack
  webpack: (config, { dev, isServer }) => {
    // Otimizações para produção
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 