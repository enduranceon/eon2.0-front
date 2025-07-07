# 🚀 Guia Rápido - Endurance On Dashboard

## Executar o Dashboard Localmente

Para testar o dashboard da Endurance On, execute os seguintes comandos:

```bash
# 1. Instalar dependências
npm install

# 2. Executar em modo desenvolvimento
npm run dev
```

## 🌐 Acesso ao Dashboard

Após executar o comando acima, acesse:

**Página Inicial**: `http://localhost:3000/`
**Login**: `http://localhost:3000/login`
**Dashboard Principal**: `http://localhost:3000/dashboard`

### 🔐 Sistema de Autenticação Implementado

O sistema implementa todas as funcionalidades do roteiro:

✅ **AuthContext**: Gerenciamento global de estado
✅ **ProtectedRoute**: Guards por roles e verificações
✅ **Redirecionamentos**: Automáticos baseados no usuário
✅ **Verificações**: Email, 2FA, assinatura ativa
✅ **Dashboards Específicos**: 
- `/dashboard/admin` - Administradores
- `/dashboard/treinador` - Treinadores  
- `/dashboard/aluno` - Alunos

## 👤 Usuários de Teste

Para demonstração, você pode usar os seguintes perfis:

### Administrador
- **Email**: admin@enduranceon.com.br
- **Senha**: 123456
- **Acesso**: Todas as funcionalidades
- **Dashboard**: `/dashboard/admin`

### Treinador
- **Email**: coach@enduranceon.com.br  
- **Senha**: 123456
- **Acesso**: Clientes e ganhos pessoais
- **Dashboard**: `/dashboard/treinador`

### Aluno
- **Email**: student@enduranceon.com.br
- **Senha**: 123456
- **Acesso**: Progresso pessoal, assinatura
- **Dashboard**: `/dashboard/aluno`

### 🔒 Funcionalidades de Autenticação

- **Login**: Verificação automática de 2FA e email
- **Registro**: Criação de conta com tipos de usuário
- **Verificação de Email**: Confirmação obrigatória
- **2FA**: Sistema de dois fatores (opcional)
- **Recuperação de Senha**: Processo completo
- **Guards**: Proteção automática por roles

## 🎨 Recursos Visuais

O dashboard inclui:

✅ **Tema Endurance On** - Cores e identidade visual oficial
✅ **Gradientes Modernos** - Efeitos visuais com profundidade
✅ **Animações Fluidas** - Transições suaves entre páginas
✅ **Responsividade** - Adaptável para todos os dispositivos
✅ **Gráficos Interativos** - Visualizações de dados em tempo real
✅ **Material Design** - Componentes consistentes e acessíveis

## 📊 Funcionalidades Principais

### 🏠 Dashboard Principal
- Visão geral com métricas principais
- Gráficos de receita e usuários
- Cards de estatísticas animados
- Filtros por período

### 🧮 Calculadoras Inteligentes
- **Plano Ideal**: Quiz com 7 perguntas para recomendação personalizada
- **Match de Treinador**: Sistema de compatibilidade com 6 critérios
- **Interface Interativa**: Progressão visual e resultados detalhados
- **Acesso**: `http://localhost:3000/dashboard/calculadoras`

### 💰 Ganhos Pessoais (Treinadores)
- Comissões e split de pagamentos
- Histórico financeiro detalhado
- Análise de performance
- Configurações bancárias

### 👑 Área Administrativa
- Gestão completa de usuários
- Sistema de pagamentos Asaas
- Subcontas de treinadores
- Relatórios avançados

## 🔧 Troubleshooting

Se encontrar problemas, tente:

```bash
# Limpar cache do npm
npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Verificar versão do Node.js (precisa ser 18+)
node --version
```

## 📱 Demonstração Mobile

O dashboard é totalmente responsivo. Para testar em mobile:

1. Abra as ferramentas do desenvolvedor (F12)
2. Ative o modo mobile
3. Teste a navegação com sidebar colapsível

---

**Pronto para explorar o dashboard da Endurance On! 🏃‍♂️💙** 