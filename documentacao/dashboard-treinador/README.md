# Documentação do Dashboard do Treinador - Endurance On 2.0

## Visão Geral

Esta documentação contém informações detalhadas sobre todas as páginas e funcionalidades do dashboard do treinador da aplicação Endurance On 2.0. Cada página foi documentada individualmente com informações completas sobre componentes, APIs, validações, regras de negócio e muito mais.

## Estrutura da Documentação

### 📋 Documentação Geral
- **[Documentação Completa do Dashboard](../DOCUMENTACAO_DASHBOARD_TREINADOR.md)** - Visão geral completa de todo o sistema

### 📄 Documentações por Página

#### 1. [Dashboard Principal](./paginas/01-dashboard-principal.md)
- **Rota**: `/dashboard/coach`
- **Funcionalidades**: Estatísticas gerais, resumo financeiro, analytics detalhados, gráficos de performance
- **APIs**: Resumo financeiro, lista de alunos, provas, analytics
- **Componentes**: Cards de estatísticas, gráficos, tabelas

#### 2. [Perfil do Treinador](./paginas/02-perfil-treinador.md)
- **Rota**: `/dashboard/coach/perfil`
- **Funcionalidades**: Visualização e edição do perfil, upload de foto, gerenciamento de endereço
- **APIs**: Obter perfil, atualizar perfil, upload de arquivo
- **Componentes**: Formulários, modal de edição, avatar com WebSocket

#### 3. [Participantes das Provas](./paginas/03-participantes-provas.md)
- **Rota**: `/dashboard/coach/participantes`
- **Funcionalidades**: Listagem de participantes, confirmação de presença, filtros avançados, exportação
- **APIs**: Lista de participantes, confirmação de presença, provas disponíveis
- **Componentes**: Tabelas, filtros, modal de detalhes

#### 4. [Gerenciar Testes](./paginas/04-gerenciar-testes.md)
- **Rota**: `/dashboard/coach/gerenciar-testes`
- **Funcionalidades**: Sistema de abas, testes dinâmicos, upload de relatórios, histórico completo
- **APIs**: Lista de alunos, testes disponíveis, registro de resultados, upload de relatórios
- **Componentes**: Sistema de abas, campos dinâmicos, modais de registro

#### 5. [Modalidades](./paginas/05-modalidades.md)
- **Rota**: `/dashboard/coach/modalidades`
- **Funcionalidades**: Visualização de modalidades vinculadas, vinculação/desvinculação, estatísticas
- **APIs**: Modalidades vinculadas, modalidades disponíveis, vinculação/desvinculação
- **Componentes**: Cards de modalidades, modal de seleção, filtros

#### 6. [Financeiro](./paginas/06-financeiro.md)
- **Rota**: `/dashboard/coach/financeiro`
- **Funcionalidades**: Resumo financeiro, estatísticas detalhadas, filtros avançados, histórico de transações
- **APIs**: Resumo financeiro, histórico de transações, estatísticas financeiras
- **Componentes**: Gráficos, tabelas, filtros, exportação CSV

#### 7. [Videochamadas](./paginas/07-videochamadas.md)
- **Rota**: `/dashboard/coach/videochamadas`
- **Funcionalidades**: Agendamento, gerenciamento, histórico, estatísticas de videochamadas
- **APIs**: Agendamento, lista de videochamadas, estatísticas de uso
- **Componentes**: Sistema de abas, formulários de agendamento, gráficos de uso

## Tecnologias Utilizadas

### Frontend
- **Next.js 14** - Framework React com App Router
- **React 18** - Biblioteca de interface de usuário
- **TypeScript** - Linguagem de programação tipada
- **Material-UI (MUI) v5** - Biblioteca de componentes UI
- **Recharts** - Biblioteca de gráficos
- **Axios** - Cliente HTTP para APIs
- **React Hot Toast** - Sistema de notificações

### Backend Integration
- **REST APIs** - Comunicação com backend
- **WebSocket** - Atualizações em tempo real
- **JWT** - Autenticação e autorização
- **Upload de Arquivos** - Sistema de upload seguro

## Padrões de Desenvolvimento

### Estrutura de Arquivos
```
src/
├── app/dashboard/coach/          # Páginas do dashboard do treinador
├── components/Dashboard/         # Componentes reutilizáveis
├── contexts/                     # Contextos React
├── hooks/                        # Hooks customizados
├── services/                     # Serviços de API
├── types/                        # Definições TypeScript
└── utils/                        # Utilitários
```

### Convenções de Código
- **Nomenclatura**: PascalCase para componentes, camelCase para funções
- **Estrutura**: Separação clara de responsabilidades
- **Validação**: Validação de dados em todas as camadas
- **Tratamento de Erros**: Try-catch com fallbacks adequados
- **Performance**: Carregamento otimizado e memoização

### Segurança
- **Autenticação**: Token JWT obrigatório
- **Autorização**: Role-based access control
- **Validação**: Sanitização de dados de entrada
- **Proteção de Rotas**: Componente ProtectedRoute

## Como Usar Esta Documentação

### Para Desenvolvedores
1. **Leia a documentação geral** para entender a arquitetura
2. **Consulte a página específica** para detalhes de implementação
3. **Verifique as APIs** para entender a comunicação com backend
4. **Analise os componentes** para reutilização de código

### Para Testadores
1. **Verifique as validações** implementadas em cada página
2. **Teste os fluxos** descritos nas regras de negócio
3. **Valide as APIs** com os payloads de exemplo
4. **Confirme a segurança** com as validações de autenticação

### Para Product Owners
1. **Entenda as funcionalidades** disponíveis em cada página
2. **Analise as regras de negócio** implementadas
3. **Verifique as validações** de dados e segurança
4. **Considere as extensibilidades** para futuras funcionalidades

## Manutenção e Evolução

### Atualizações
- **Versionamento**: Mantenha a documentação atualizada com as mudanças
- **Changelog**: Documente mudanças significativas
- **Deprecação**: Marque funcionalidades obsoletas

### Extensibilidade
- **Novas Páginas**: Siga o padrão estabelecido
- **Novas APIs**: Documente endpoints e payloads
- **Novos Componentes**: Mantenha a consistência visual

### Qualidade
- **Testes**: Implemente testes unitários e de integração
- **Performance**: Monitore métricas de performance
- **Segurança**: Mantenha validações atualizadas

## Suporte e Contato

Para dúvidas sobre esta documentação ou implementação:
- **Desenvolvedores**: Consulte o código fonte e comentários
- **Equipe de Produto**: Entre em contato com o Product Owner
- **Equipe Técnica**: Consulte a documentação técnica do backend

---

**Última atualização**: Setembro 2024  
**Versão**: 2.0  
**Status**: Ativo
