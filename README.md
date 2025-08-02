# 🏃‍♂️ Endurance On 2.0 - Plataforma Completa de Assessoria Esportiva

Plataforma moderna e robusta para assessoria esportiva especializada em corrida e triathlon, desenvolvida com Next.js 14, TypeScript e Material-UI.

## 📊 **ESTATÍSTICAS DA APLICAÇÃO**

- **📄 Total de Páginas:** 52 páginas
- **🔌 Endpoints API:** 13 rotas
- **🧩 Componentes React:** 40 componentes
- **👥 Tipos de Usuário:** 3 (Aluno, Treinador, Administrador)
- **⚙️ Funcionalidades Principais:** 10 módulos
- **🔄 Fluxos de Navegação:** 5 fluxos principais

---

## ✨ **CARACTERÍSTICAS PRINCIPAIS**

- **🎨 Design Moderno**: Interface inspirada na identidade visual da Endurance On
- **📱 Totalmente Responsivo**: Adaptável para desktop, tablet e mobile
- **🔐 Autenticação Completa**: Sistema de login, 2FA e controle de acesso por roles
- **💳 Sistema de Pagamentos**: Integração completa com Asaas
- **📊 Analytics Avançados**: Dashboards com KPIs em tempo real
- **🧮 Calculadoras Inteligentes**: Quiz para matching de planos e treinadores
- **📈 Gestão de Performance**: Testes, resultados e relatórios detalhados
- **🎯 Sistema de Matching**: Algoritmo inteligente para conectar alunos e treinadores

## 🎨 **IDENTIDADE VISUAL**

Baseado no site oficial da [Endurance On](https://www.enduranceon.com.br/):

- **🔵 Azul Principal**: `#1976d2` - Confiança e estabilidade
- **🟢 Verde Endurance**: `#2e7d32` - Energia e crescimento  
- **🟠 Laranja Energia**: `#f57c00` - Motivação e dinamismo
- **✨ Gradientes**: Efeitos visuais modernos com transições suaves
- **🌊 Profundidade**: Sombras e elevações para hierarquia visual

## 🚀 **TECNOLOGIAS**

### **Frontend**
- **Next.js 14** - Framework React com App Router
- **React 18** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Material-UI 5** - Biblioteca de componentes
- **Emotion** - CSS-in-JS

### **Gráficos e Visualizações**
- **Recharts** - Gráficos interativos
- **Chart.js** - Visualizações avançadas

### **Formulários e Validação**
- **React Hook Form** - Gerenciamento de formulários
- **Yup** - Validação de schemas

### **HTTP e Estado**
- **Axios** - Cliente HTTP
- **React Context** - Gerenciamento de estado global
- **React Hooks** - Hooks customizados

### **Notificações e UX**
- **React Hot Toast** - Notificações
- **React Loading Skeleton** - Estados de loading

---

## 📁 **ESTRUTURA COMPLETA DO PROJETO**

```
eon2.0-front/
├── src/
│   ├── app/                          # Next.js App Router (52 páginas)
│   │   ├── page.tsx                  # Landing Page
│   │   ├── login/                    # Autenticação
│   │   ├── register/                 # Registro
│   │   ├── onboarding/               # Fluxo de Onboarding (4 páginas)
│   │   ├── dashboard/
│   │   │   ├── aluno/                # Dashboard do Aluno (10 páginas)
│   │   │   ├── coach/                # Dashboard do Treinador (10 páginas)
│   │   │   ├── admin/                # Dashboard Administrativo (16 páginas)
│   │   │   ├── calculadoras/         # Ferramentas de Cálculo
│   │   │   ├── my-clients/           # Clientes do Treinador
│   │   │   ├── personal-earnings/    # Relatórios de Ganhos
│   │   │   └── settings/             # Configurações
│   │   ├── payment-pending/          # Status de Pagamento
│   │   ├── subscription/             # Gestão de Assinaturas
│   │   └── api/                      # Endpoints API (13 rotas)
│   ├── components/                   # Componentes React (40 arquivos)
│   │   ├── Dashboard/                # Componentes do Dashboard
│   │   ├── Forms/                    # Formulários
│   │   ├── Quiz/                     # Sistema de Quiz
│   │   └── Analytics/                # Componentes de Analytics
│   ├── contexts/                     # Contextos React (4 contextos)
│   ├── hooks/                        # Hooks Customizados (2 hooks)
│   ├── services/                     # Serviços (9 serviços)
│   ├── types/                        # Tipos TypeScript (50+ interfaces)
│   ├── utils/                        # Utilitários (6 utilitários)
│   └── theme/                        # Configuração do Tema
├── public/                           # Assets Estáticos
└── package.json                      # Dependências
```

---

## 🔧 **INSTALAÇÃO E EXECUÇÃO**

### **Pré-requisitos**
- Node.js 18+ 
- npm 8+

### **Instalação**

```bash
# Clone o repositório
git clone https://github.com/enduranceon/eon2.0-front.git

# Entre no diretório
cd eon2.0-front

# Instale as dependências
npm install
```

### **Configuração**

1. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

2. Edite o arquivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_ASAAS_API_KEY=sua_chave_api_asaas
```

### **Execução**

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

A aplicação estará disponível em `http://localhost:3000`

---

## 📊 **FUNCIONALIDADES DETALHADAS**

### **🔐 1. SISTEMA DE AUTENTICAÇÃO E AUTORIZAÇÃO**
- ✅ Login/Logout com múltiplos tipos de usuário
- ✅ Verificação de email e 2FA
- ✅ Controle de acesso baseado em roles
- ✅ Proteção de rotas
- ✅ Sistema de "Lembrar-me"
- ✅ Redirecionamento automático por tipo de usuário

### **💳 2. GESTÃO DE ASSINATURAS**
- ✅ Planos personalizados
- ✅ Sistema de pagamentos integrado (Asaas)
- ✅ Gestão de licenças
- ✅ Status de assinatura em tempo real
- ✅ Pausa e retomada de assinaturas
- ✅ Histórico de pagamentos

### **🧮 3. SISTEMA DE MATCHING**
- ✅ Quiz inteligente para planos (7 perguntas)
- ✅ Algoritmo de matching com treinadores (6 critérios)
- ✅ Recomendações personalizadas
- ✅ Baseado no site oficial enduranceon.com.br
- ✅ Interface fluida com progressão visual

### **📈 4. GESTÃO DE TESTES**
- ✅ Criação e aplicação de testes
- ✅ Registro de resultados
- ✅ Análise de performance
- ✅ Histórico de testes
- ✅ Relatórios de progresso
- ✅ Gráficos de evolução

### **💰 5. SISTEMA FINANCEIRO**
- ✅ Gestão de pagamentos
- ✅ Relatórios de ganhos
- ✅ Comissões de treinadores
- ✅ Analytics financeiro
- ✅ Integração com Asaas
- ✅ Comprovantes e extratos

### **🏃‍♂️ 6. GESTÃO DE EVENTOS**
- ✅ Cadastro de eventos/provas
- ✅ Inscrições
- ✅ Controle de presença
- ✅ Resultados
- ✅ Certificados
- ✅ Galeria de fotos

### **📊 7. ANALYTICS E RELATÓRIOS**
- ✅ Dashboard com KPIs em tempo real
- ✅ Gráficos interativos (Recharts)
- ✅ Relatórios personalizados
- ✅ Métricas de performance
- ✅ Exportação de dados
- ✅ Filtros avançados

### **🔔 8. SISTEMA DE NOTIFICAÇÕES**
- ✅ Notificações em tempo real
- ✅ Alertas de sistema
- ✅ Comunicação entre usuários
- ✅ Notificações push
- ✅ Central de notificações

### **👤 9. GESTÃO DE PERFIS**
- ✅ Perfis de usuários completos
- ✅ Configurações personalizadas
- ✅ Upload de imagens
- ✅ Dados de contato
- ✅ Especialidades e certificações
- ✅ Histórico de atividades

### **🔌 10. API E INTEGRAÇÕES**
- ✅ 13 endpoints de API
- ✅ Integração com sistemas externos
- ✅ Serviços de geocoding
- ✅ Sistema de pagamentos
- ✅ Webhooks
- ✅ Rate limiting

---

## 👥 **TIPOS DE USUÁRIO E FUNCIONALIDADES**

### **🎓 ALUNO (FITNESS_STUDENT)**
- **📄 Páginas Disponíveis:** 10
- **⚙️ Funcionalidades Principais:** 8
- **🔄 Fluxos de Navegação:** 3

**Funcionalidades:**
- Dashboard personalizado
- Gestão de plano contratado
- Visualização do treinador
- Participação em eventos
- Realização de testes
- Histórico de pagamentos
- Sistema de moedas/pontos
- Solicitação de licenças

### **🏆 TREINADOR (COACH)**
- **📄 Páginas Disponíveis:** 10
- **⚙️ Funcionalidades Principais:** 9
- **🔄 Fluxos de Navegação:** 4

**Funcionalidades:**
- Dashboard de performance
- Gestão de participantes
- Criação e aplicação de testes
- Análise de resultados
- Controle de presença
- Gestão de modalidades
- Configuração de planos
- Relatórios financeiros
- Perfil profissional

### **⚙️ ADMINISTRADOR (ADMIN)**
- **📄 Páginas Disponíveis:** 16
- **⚙️ Funcionalidades Principais:** 12
- **🔄 Fluxos de Navegação:** 5

**Funcionalidades:**
- Dashboard administrativo
- Gestão completa de usuários
- Configuração de modalidades
- Gestão de planos
- Controle de eventos
- Configuração de testes
- Gestão de margens
- Relatórios financeiros
- Gestão de licenças
- Analytics avançados
- Configurações do sistema

---

## 🔄 **FLUXOS PRINCIPAIS**

### **🆕 FLUXO 1: CADASTRO E ONBOARDING**
1. **Registro** → **Verificação de Email** → **Login**
2. **Quiz de Plano** → **Quiz de Treinador** → **Perfil do Treinador** → **Checkout**
3. **Pagamento** → **Ativação da Assinatura** → **Dashboard**

### **🔐 FLUXO 2: AUTENTICAÇÃO**
1. **Login** → **Verificação 2FA** → **Verificação de Assinatura** → **Dashboard**
2. **Redirecionamento baseado no tipo de usuário**

### **💳 FLUXO 3: PAGAMENTO**
1. **Seleção de Plano** → **Checkout** → **Processamento** → **Confirmação**
2. **Gestão de pagamentos pendentes**

### **👥 FLUXO 4: GESTÃO DE ALUNOS (TREINADOR)**
1. **Visualização de Participantes** → **Gestão de Testes** → **Resultados**
2. **Confirmação de Presença** → **Relatórios de Performance**

### **⚙️ FLUXO 5: ADMINISTRATIVO**
1. **Dashboard Geral** → **Gestão de Usuários** → **Configurações** → **Analytics**
2. **Relatórios Financeiros** → **Gestão de EVENTOS** → **Controle de Qualidade**

---

## 🎯 **COMPONENTES PRINCIPAIS**

### **📊 StatsCard**
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

### **🏗️ DashboardLayout**
Layout responsivo com sidebar e header:
- Menu de navegação baseado em roles
- Perfil do usuário integrado
- Sistema de notificações
- Responsividade automática

### **📈 DashboardOverview**
Visão geral com gráficos e métricas:
- Gráficos de linha, barra e pizza
- Tabs para diferentes análises
- Dados em tempo real
- Integração com a API

### **🧮 Quiz Components**
Sistema de quiz inteligente:
- Progressão visual
- Animações fluidas
- Algoritmo de scoring
- Resultados detalhados

---

## 🔐 **SISTEMA DE AUTENTICAÇÃO**

### **Funcionalidades Implementadas:**
- **AuthContext**: Gerenciamento global de estado de autenticação
- **ProtectedRoute**: Componente para proteção de rotas por roles
- **Guards**: Verificação de email, 2FA, assinatura ativa
- **Redirecionamentos**: Automáticos baseados no tipo de usuário

### **Fluxo de Autenticação:**
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
```

### **Proteção de Rotas:**
```typescript
// Proteção por role
<ProtectedRoute allowedUserTypes={[UserType.ADMIN]}>
  <AdminDashboard />
</ProtectedRoute>
```

---

## 📡 **INTEGRAÇÃO COM API**

Cliente HTTP centralizado para todas as operações:

```typescript
// Estatísticas do dashboard
const stats = await enduranceApi.getDashboardStats();

// Pagamentos
const payments = await enduranceApi.getPayments(filters);

// Subcontas
const subaccounts = await enduranceApi.getCoachesSubaccounts();

// Testes
const tests = await enduranceApi.getTests();
```

---

## 🎨 **CUSTOMIZAÇÃO DO TEMA**

O tema é totalmente customizável através do `enduranceTheme.ts`:

```typescript
const enduranceTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#2e7d32' },
    tertiary: { main: '#f57c00' },
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

---

## 📱 **RESPONSIVIDADE**

O dashboard é totalmente responsivo:
- **🖥️ Desktop**: Layout completo com sidebar
- **📱 Tablet**: Sidebar colapsível
- **📱 Mobile**: Menu drawer

Breakpoints Material-UI:
- `xs`: 0px
- `sm`: 600px
- `md`: 900px
- `lg`: 1200px
- `xl`: 1536px

---

## 🔄 **ESTADOS DE LOADING**

Estados visuais para melhor UX:
- Skeleton screens
- Progress indicators
- Shimmer effects
- Error boundaries
- Loading spinners

---

## 📈 **PERFORMANCE**

Otimizações implementadas:
- Code splitting automático
- Lazy loading de componentes
- Memoization com React.memo
- Otimização de imagens
- Bundle analysis
- Tree shaking

---

## 🧪 **TESTES**

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 📦 **BUILD E DEPLOY**

```bash
# Build otimizado
npm run build

# Análise do bundle
npm run analyze

# Deploy (configurar conforme plataforma)
npm run deploy
```

---

## 🤝 **CONTRIBUIÇÃO**

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📝 **LICENÇA**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 📞 **SUPORTE**

- **📧 Email**: contato@enduranceon.com.br
- **📱 WhatsApp**: (48) 99117-8688
- **🌐 Site**: [enduranceon.com.br](https://www.enduranceon.com.br/)
- **📖 Documentação**: [docs.enduranceon.com.br](https://docs.enduranceon.com.br/)

---

## 🎯 **CONCLUSÃO**

A aplicação **Endurance On 2.0** é uma plataforma completa e robusta para assessoria esportiva, oferecendo:

- **52 páginas** distribuídas em 8 categorias principais
- **3 tipos de usuário** com funcionalidades específicas
- **13 endpoints de API** para integração backend
- **40 componentes React** reutilizáveis
- **10 funcionalidades principais** cobrindo todos os aspectos do negócio
- **5 fluxos principais** de navegação otimizados

A arquitetura é escalável, modular e segue as melhores práticas de desenvolvimento React/Next.js, proporcionando uma experiência de usuário moderna e eficiente para todos os tipos de usuário da plataforma.

---

**Desenvolvido com ❤️ pela equipe Endurance On**

**Versão:** 2.0  
**Última Atualização:** Janeiro 2025 