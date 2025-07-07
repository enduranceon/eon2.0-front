# 🏃‍♂️ Endurance On - Dashboard Frontend

Dashboard moderno e ultra realista para a plataforma de assessoria esportiva Endurance On, desenvolvido com Next.js 14, Material-UI e TypeScript.

## ✨ Características

- **Design Moderno**: Interface inspirada na identidade visual da Endurance On
- **Texturas e Profundidade**: Componentes com efeitos visuais avançados, gradientes e sombras
- **Responsivo**: Adaptável para desktop, tablet e mobile
- **Tema Customizado**: Cores primárias, secundárias e terciárias da marca
- **Animações Fluidas**: Transições suaves e micro-interações
- **TypeScript**: Tipagem completa para melhor desenvolvimento
- **Componentes Reutilizáveis**: Arquitetura modular e escalável

## 🎨 Identidade Visual

Baseado no site oficial da [Endurance On](https://www.enduranceon.com.br/):

- **Azul Principal**: `#1976d2` - Confiança e estabilidade
- **Verde Endurance**: `#2e7d32` - Energia e crescimento  
- **Laranja Energia**: `#f57c00` - Motivação e dinamismo
- **Gradientes**: Efeitos visuais modernos com transições suaves
- **Profundidade**: Sombras e elevações para hierarquia visual

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **Material-UI 5** - Biblioteca de componentes
- **TypeScript** - Tipagem estática
- **Recharts** - Gráficos e visualizações
- **React Hook Form** - Gerenciamento de formulários
- **Axios** - Cliente HTTP
- **React Query** - Estado do servidor
- **Zustand** - Gerenciamento de estado global
- **React Hot Toast** - Notificações

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Páginas do dashboard
│   │   ├── page.tsx      # Dashboard principal
│   │   ├── admin/        # Área administrativa
│   │   ├── my-clients/   # Clientes do treinador
│   │   └── personal-earnings/ # Ganhos pessoais
│   ├── layout.tsx        # Layout raiz
│   └── globals.css       # Estilos globais
├── components/            # Componentes reutilizáveis
│   └── Dashboard/        # Componentes do dashboard
│       ├── DashboardLayout.tsx    # Layout principal
│       ├── DashboardOverview.tsx  # Visão geral
│       └── StatsCard.tsx         # Card de estatísticas
├── services/             # Serviços e APIs
│   └── enduranceApi.ts  # Cliente da API
├── theme/               # Configuração do tema
│   └── enduranceTheme.ts # Tema customizado
├── types/              # Definições TypeScript
│   └── api.ts         # Tipos da API
├── contexts/          # Contextos React
└── providers/        # Providers globais
```

## 🔧 Instalação e Execução

### Pré-requisitos

- Node.js 18+ 
- npm 8+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/enduranceon/front-endurance.git

# Entre no diretório
cd front-endurance

# Instale as dependências
npm install
```

### Configuração

1. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

2. Edite o arquivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
```

### Execução

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Executar produção
npm start

# Linting
npm run lint

# Formatação
npm run format
```

O dashboard estará disponível em `http://localhost:3000/dashboard`

## 📊 Funcionalidades

### Dashboard Principal
- **Visão Geral**: Estatísticas gerais da plataforma
- **Gráficos Interativos**: Receita, usuários, performance
- **Cards de Métricas**: KPIs em tempo real
- **Filtros e Períodos**: Análise customizável

### 🧮 Calculadoras Inteligentes
- **Plano Ideal**: Quiz interativo com 7 perguntas para recomendar o plano perfeito
- **Match de Treinador**: Sistema de compatibilidade com 6 critérios de matching
- **Interface Fluida**: Progressão visual, animações e resultados detalhados
- **Baseado no Site Oficial**: Perguntas e lógica idênticas ao [enduranceon.com.br](https://www.enduranceon.com.br/)
- **Algoritmo Inteligente**: Scoring automático para recomendações precisas

### Área do Treinador
- **Meus Clientes**: Gestão de alunos
- **Ganhos Pessoais**: Comissões e pagamentos
- **Análise de Performance**: Métricas detalhadas
- **Histórico Financeiro**: Transações e comprovantes

### Área Administrativa
- **Gestão de Usuários**: CRUD completo
- **Sistema de Pagamentos**: Integração Asaas
- **Subcontas**: Gestão de treinadores
- **Relatórios**: Analytics avançados

## 🎯 Componentes Principais

### StatsCard
Componente de estatísticas com visual moderno:
```tsx
<StatsCard
  title="Total de Usuários"
  value={1247}
  change={12.5}
  icon={<PeopleIcon />}
  color="primary"
  gradient={true}
/>
```

### DashboardLayout
Layout responsivo com sidebar e header:
- Menu de navegação baseado em roles
- Perfil do usuário integrado
- Sistema de notificações
- Responsividade automática

### DashboardOverview
Visão geral com gráficos e métricas:
- Gráficos de linha, barra e pizza
- Tabs para diferentes análises
- Dados mockados para demonstração
- Integração com a API

## 🔐 Sistema de Autenticação

O dashboard implementa autenticação completa conforme roteiro:

### Funcionalidades Implementadas:
- **AuthContext**: Gerenciamento global de estado de autenticação
- **ProtectedRoute**: Componente para proteção de rotas por roles
- **Guards**: Verificação de email, 2FA, assinatura ativa
- **Redirecionamentos**: Automáticos baseados no tipo de usuário

### Fluxo de Autenticação:
```typescript
// Login com verificações automáticas
const response = await auth.login({
  email: 'user@example.com',
  password: 'password123'
});

// Verificações automáticas:
// 1. Email confirmado?
// 2. 2FA necessário?
// 3. Assinatura ativa (para alunos)?
// 4. Redirecionar para dashboard correto

// Logout
await auth.logout();
```

### Proteção de Rotas:
```typescript
// Proteção por role
<ProtectedRoute requiredRoles={[UserType.ADMIN]}>
  <AdminDashboard />
</ProtectedRoute>

// Proteção com assinatura
<StudentRoute>
  <StudentDashboard />
</StudentRoute>
```

## 📡 Integração com API

Cliente HTTP centralizado para todas as operações:

```typescript
// Estatísticas do dashboard
const stats = await enduranceApi.getDashboardStats();

// Pagamentos
const payments = await enduranceApi.getPayments(filters);

// Subcontas
const subaccounts = await enduranceApi.getCoachesSubaccounts();
```

## 🎨 Customização do Tema

O tema é totalmente customizável através do `enduranceTheme.ts`:

```typescript
const enduranceTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#2e7d32' },
  },
  colors: {
    gradient: {
      primary: 'linear-gradient(135deg, #1976d2 0%, #2e7d32 100%)',
    },
    shadow: {
      primary: '0 4px 20px rgba(25, 118, 210, 0.15)',
    },
  },
});
```

## 📱 Responsividade

O dashboard é totalmente responsivo:
- **Desktop**: Layout completo com sidebar
- **Tablet**: Sidebar colapsível
- **Mobile**: Menu drawer

Breakpoints Material-UI:
- `xs`: 0px
- `sm`: 600px
- `md`: 900px
- `lg`: 1200px
- `xl`: 1536px

## 🔄 Estados de Loading

Estados visuais para melhor UX:
- Skeleton screens
- Progress indicators
- Shimmer effects
- Error boundaries

## 📈 Performance

Otimizações implementadas:
- Code splitting automático
- Lazy loading de componentes
- Memoization com React.memo
- Otimização de imagens
- Bundle analysis

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📦 Build e Deploy

```bash
# Build otimizado
npm run build

# Análise do bundle
npm run analyze

# Deploy (configurar conforme plataforma)
npm run deploy
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Email**: contato@enduranceon.com.br
- **WhatsApp**: (48) 99117-8688
- **Site**: [enduranceon.com.br](https://www.enduranceon.com.br/)

---

Desenvolvido com ❤️ pela equipe Endurance On 