# Kyndo Order — Design System

Identidade visual oficial da plataforma SaaS de gestão de delivery para restaurantes.

## Identidade da Marca

- **Nome oficial:** Kyndo Order
- **Wordmark provisório:** `kyndo.` (ponto em laranja) + `ORDER` (grafite ou branco)
- **Conceito:** Plataforma moderna, intuitiva e profissional de gestão de delivery
- **Estilo:** Premium, minimalista, tecnologia sofisticada, interfaces limpas e organizadas

## Paleta de Cores

### Cores Principais

| Token | Hex | Uso |
|-------|-----|-----|
| `--kyndo-orange` | `#FF6B35` | Botões principais, CTAs, links ativos, destaques |
| `--kyndo-orange-hover` | `#E85A25` | Estado hover dos botões primários |
| `--kyndo-orange-soft` | `#FFF0E9` | Fundos de destaque, estados selecionados, elementos secundários |
| `--kyndo-graphite` | `#191B20` | Sidebar, cabeçalhos escuros, textos principais, elementos institucionais |
| `--kyndo-slate` | `#414650` | Textos secundários, ícones inativos, labels |
| `--kyndo-ice` | `#F6F7F9` | Fundo principal do dashboard e páginas |
| `--kyndo-white` | `#FFFFFF` | Cards, formulários, modais, fundos de conteúdo |

### Cores Funcionais

| Token | Hex | Background | Uso |
|-------|-----|------------|-----|
| `--kyndo-success` | `#16A34A` | `#DCFCE7` | Pedidos entregues, operações concluídas, toggle ativo |
| `--kyndo-info` | `#2563EB` | `#DBEAFE` | Informações, pedidos em preparo, links informativos |
| `--kyndo-warning` | `#F59E0B` | `#FEF3C7` | Pedidos aguardando confirmação, alertas não-críticos |
| `--kyndo-danger` | `#DC3545` | `#FEE2E2` | Cancelamentos, erros, ações destrutivas, validações |

## Aplicação no Dashboard

- **Header/Sidebar:** Grafite `#191B20` com texto branco
- **Fundo principal:** Branco gelo `#F6F7F9`
- **Cards:** Branco puro `#FFFFFF` com bordas sutis `border-zinc-100` e sombra `shadow-sm`
- **Botões primários:** Laranja `#FF6B35` com hover `#E85A25`
- **Botões secundários:** Grafite `#191B20` ou outline com borda `zinc-200`
- **Botões destrutivos:** Vermelho `#DC3545`
- **Menus ativos:** Texto laranja + border-bottom laranja
- **Textos principais:** Grafite `#191B20`
- **Textos secundários:** Slate `#414650`
- **Inputs:** Fundo `#F6F7F9`, borda `zinc-200`, focus laranja
- **Badges de status:** Background derivado claro + texto funcional escuro

### Regras de Uso do Laranja

- Use estrategicamente para **ações e destaques** apenas
- Evite excesso: nunca use laranja como fundo de seção inteira
- Reserve para: CTAs, links ativos, preços, indicadores positivos, wordmark dot
- Para backgrounds de destaque suave, use `--kyndo-orange-soft` (`#FFF0E9`)

## Componentes Padronizados

### Botões

```css
/* Primário */
bg-kyndo-orange hover:bg-kyndo-orange-hover text-white font-bold rounded-xl shadow-sm

/* Secundário */
bg-kyndo-graphite hover:bg-zinc-800 text-white font-bold rounded-xl

/* Outline */
bg-white border border-zinc-200 hover:border-kyndo-orange text-kyndo-graphite rounded-xl

/* Destrutivo */
bg-kyndo-danger hover:bg-red-600 text-white font-bold rounded-xl
```

### Inputs e Formulários

```css
bg-kyndo-ice border border-zinc-200 rounded-xl px-4 py-3 text-sm
focus:border-kyndo-orange focus:ring-1 focus:ring-kyndo-orange outline-none
text-kyndo-graphite placeholder:text-zinc-400
```

### Cards

```css
bg-white rounded-xl border border-zinc-100 shadow-sm p-4
```

### Badges de Status

```css
/* Sucesso */ bg-green-50 text-green-600
/* Info */    bg-blue-50 text-blue-600
/* Warning */ bg-yellow-50 text-yellow-600
/* Danger */  bg-red-50 text-red-500
```

### Tabs de Navegação

```css
/* Ativa */   text-kyndo-orange border-b-2 border-kyndo-orange
/* Inativa */ text-kyndo-slate hover:text-kyndo-graphite
```

## Tipografia

- **Fonte primária:** Geist Sans (via Next.js) com fallback para Inter, system-ui
- **Fonte monoespaçada:** Geist Mono
- **Antialiasing:** `-webkit-font-smoothing: antialiased`
- **Hierarquia:**
  - Títulos: `font-bold text-kyndo-graphite`
  - Corpo: `text-kyndo-graphite`
  - Secundário: `text-kyndo-slate`
  - Labels: `text-sm font-medium text-kyndo-slate`

## Espaçamento e Bordas

- **Border radius:** `rounded-xl` (12px) para cards, inputs, botões; `rounded-lg` (8px) para elementos menores
- **Sombras:** `shadow-sm` para cards e botões; `shadow-lg shadow-orange-500/20` para CTAs principais
- **Espaçamento interno:** `p-4` para cards, `px-4 py-3` para inputs, `py-3` para botões
- **Gap entre elementos:** `gap-3` para grids densos, `gap-4` para layouts padrão, `gap-6` para seções

## Acessibilidade (WCAG AA)

- Contraste mínimo de 4.5:1 para texto normal sobre qualquer background
- Contraste mínimo de 3:1 para texto grande (≥18px bold ou ≥24px regular)
- Todos os controles interativos têm estado `focus` visível (ring laranja)
- Ícones sempre acompanhados de texto ou `aria-label`
- Cores funcionais nunca são o único indicador de estado (sempre combinadas com ícone ou texto)

## Cardápio Público dos Restaurantes

> ⚠️ **Importante:** O cardápio público de cada restaurante (`/[tenant]`) deve respeitar a personalização visual do próprio estabelecimento. A identidade Kyndo Order é aplicada apenas à plataforma administrativa e institucional, sem sobrescrever as cores e marcas configuradas pelos restaurantes.

## Arquivos de Referência

- **Design tokens CSS:** `src/app/globals.css`
- **Layout base:** `src/app/layout.tsx`
- **Landing page:** `src/app/page.tsx`
- **Dashboard admin:** `src/app/admin/dashboard.tsx`
- **Login:** `src/app/admin/login/page.tsx`
- **Cadastro:** `src/app/admin/register/page.tsx`
- **Vitrine pública:** `src/app/[tenant]/storefront.tsx` (personalizável por tenant)