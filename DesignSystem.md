# EnduranceOn - Guia do Sistema de Design

Este documento detalha as diretrizes de design e os componentes visuais que formam a identidade da aplicação EnduranceOn. O objetivo é garantir consistência, acessibilidade e uma experiência de usuário coesa em toda a plataforma.

## 1. Paleta de Cores

A paleta de cores oficial deve ser utilizada para manter a identidade da marca. As cores são definidas no arquivo `src/theme/enduranceTheme.tsx`.

### Cores Primárias
- **Laranja (Primary):** `#FF8012` - Usado para ações principais, botões de destaque e elementos interativos importantes.
- **Azul (Secondary):** `#38B6FF` - Usado para informações, alertas secundários e elementos de suporte.

### Cores Neutras
- **Preto (Text Primary - Dark):** `#000000` - Cor principal para textos em fundos claros.
- **Branco (Background - Light / Text Primary - Light):** `#FFFFFF` - Cor de fundo principal no modo claro e cor de texto principal no modo escuro.
- **Cinza (Tertiary / Borders / Disabled):** `#BFBFBF` - Usado para bordas, divisores, textos desabilitados e superfícies secundárias.

### Contraste
É fundamental garantir o contraste adequado para acessibilidade (WCAG 2.1 AA):
- Use a marca em cores claras (branco, laranja, azul) sobre fundos escuros.
- Use a marca em preto sobre fundos claros.

## 2. Tipografia

A aplicação utiliza duas fontes principais, importadas via `next/font`. A configuração de tipografia está em `src/theme/enduranceTheme.tsx`.

- **Títulos e Destaques:** `Gotham Ultra Italic`
  - **Uso:** `h1`, `h2`, `h3`, `h4`, `h5`, `h6`.
  - **Implementação:** Carregada como fonte local a partir de `src/assets/fonts/`. A variável CSS `--font-gotham` é usada no tema.

- **Textos Corridos:** `Montserrat`
  - **Uso:** `body1`, `body2`, `caption`, e como fonte padrão.
  - **Implementação:** Importada do Google Fonts. A variável CSS `--font-montserrat` é usada no tema.

## 3. Logos

Os logos devem ser usados em formato SVG para garantir a qualidade visual. Os arquivos estão localizados em `src/assets/images/logo/`.

- **Logo Horizontal (`logo-new-white.svg`):**
  - **Uso:** Versão principal, usada em cabeçalhos e menus com fundo escuro/colorido.
  - **Tamanho Mínimo:** 195 x 49 px.

- **Símbolo (`logo-symbol.svg`):**
  - **Uso:** Versão compacta, ideal para barras de navegação mobile ou quando o espaço é limitado.
  - **Tamanho Mínimo:** 93 x 43 px.

### Área de Proteção
Mantenha sempre um espaço livre ao redor do logo, equivalente ao diâmetro da letra "O" da palavra "ON", para garantir sua visibilidade e impacto.

## 4. Componentes

Os componentes da interface são baseados no Material-UI e estilizados globalmente através do arquivo de tema `src/theme/enduranceTheme.tsx`.

- **Botões (`MuiButton`):** Usam a cor primária (`#FF8012`) para a variante `contained`. Os cantos são arredondados (`borderRadius: 8`).
- **Cards (`MuiCard`):** Possuem cantos arredondados (`borderRadius: 8`) e uma sombra sutil para elevação.
- **Inputs (`MuiTextField`):** Seguem o estilo padrão do Material-UI, herdando as cores e a tipografia do tema.

## 5. Responsividade

O layout é responsivo e se adapta a diferentes tamanhos de tela. O principal breakpoint para a mudança do layout do dashboard (menu lateral) é o `lg` (1200px). Abaixo desse ponto, o menu lateral se torna um `Drawer` temporário. 