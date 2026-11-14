# DeliverySaaS — Plataforma Multi-Tenant de Pedidos via WhatsApp

SaaS white-label estilo iFood onde cada lojista tem sua própria loja, painel admin isolado e recebe pedidos formatados direto no WhatsApp. Zero taxa por pedido para o estabelecimento.

## Stack

- **Frontend:** Next.js 14 App Router + Tailwind CSS + Lucide Icons
- **Backend:** Supabase (Auth + PostgreSQL + RLS)
- **Linguagem:** TypeScript
- **Deploy:** Vercel / Netlify / HostGator

## Arquitetura Multi-Tenant

O isolamento de dados é feito via **Row Level Security (RLS)** do Supabase:

- Cada loja (`tenant`) tem um `owner_id` vinculado ao usuário autenticado
- Todas as tabelas possuem policies RLS que filtram por `tenant_id`
- O middleware protege rotas `/admin/*` exigindo sessão ativa
- Lojistas só acessam seus próprios dados — impossível ver dados de outra loja via API

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `tenants` | Dados da loja (nome, logo, WhatsApp, horários, cores) |
| `categories` | Categorias do cardápio por loja |
| `products` | Produtos com opções, extras e preço |
| `coupons` | Cupons de desconto (%, fixo, validade, limite de uso) |
| `orders` | Pedidos com itens, status e dados do cliente |

## Como Replicar para Novo Cliente (White-Label)

### Passo 1: Criar conta do lojista no Supabase Auth

```bash
# No Supabase Dashboard > Authentication > Users > Add User
# Ou via API:
curl -X POST https://SEU_PROJETO.supabase.co/auth/v1/signup \
 -H "apikey: SUA_SERVICE_ROLE_KEY" \
 -d '{"email":"lojista@email.com","password":"senha-segura"}'
```

### Passo 2: Inserir o tenant via SQL Editor

```sql
INSERT INTO tenants (slug, name, whatsapp_number, delivery_fee, is_open, owner_id)
VALUES (
 'nome-da-loja',
 'Nome da Loja 🍕',
 '11999999999',
 5.00,
 true,
 'UUID_DO_USUARIO_CRIADO_NO_PASSO_1'
);
```

### Passo 3: Adicionar categorias e produtos

```sql
-- Exemplo: adicionar categoria
INSERT INTO categories (tenant_id, name, sort_order)
VALUES ('UUID_DO_TENANT', '🍔 Hambúrgueres', 1);

-- Exemplo: adicionar produto
INSERT INTO products (tenant_id, category_id, name, description, price, is_available)
VALUES ('UUID_DO_TENANT', 'UUID_DA_CATEGORIA', 'X-Bacon', 'Hambúrguer 180g + bacon', 32.90, true);
```

### Passo 4: Configurar subdomínio (opcional)

Na Vercel/Netlify, adicione um domínio customizado ou use o slug na URL:
- `https://seudominio.com.br/nome-da-loja`
- `https://nome-da-loja.seudominio.com.br` (com wildcard DNS)

### Passo 5: Personalizar aparência

No painel admin (`/admin`), o lojista pode trocar:
- Logo e banner
- Cor primária
- Horário de funcionamento
- Taxa de entrega
- Status aberto/fechado

## Setup Local

```bash
# 1. Clonar e instalar
git clone <repo> && cd delivery-saas
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase

# 3. Executar schema SQL no Supabase
# Copie supabase/schema.sql e execute no SQL Editor do Supabase Dashboard

# 4. Rodar dev server
npm run dev
```

Acesse:
- Landing page: http://localhost:3000
- Demo store: http://localhost:3000/demo-burger
- Admin login: http://localhost:3000/admin/login

## Estrutura de Arquivos

```
src/
├── app/
│ ├── page.tsx # Landing page do SaaS
│ ├── [tenant]/
│ │ ├── page.tsx # Vitrine pública (server component)
│ │ └── storefront.tsx # UI do cardápio + carrinho + checkout
│ ├── admin/
│ │ ├── page.tsx # Dashboard (protegido)
│ │ ├── dashboard.tsx # UI do painel admin
│ │ └── login/page.tsx # Login do lojista
│ └── api/
│ ├── orders/route.ts # POST: criar pedido
│ └── admin/products/route.ts # GET/POST: CRUD produtos
├── lib/
│ ├── supabase.ts # Client + tipos TypeScript
│ └── utils.ts # formatCurrency + generateWhatsAppMessage
└── middleware.ts # Proteção de rotas admin + verificação de tenant

supabase/
└── schema.sql # Schema completo com RLS + dados de demo
```

## Segurança

- **RLS no Supabase:** Isolamento multi-tenant no nível do banco de dados
- **Middleware Next.js:** Proteção de rotas admin com verificação de sessão
- **Validação Zod:** Todos os inputs da API são validados antes de persistir
- **Tokens JWT:** Autenticação stateless via Supabase Auth
- **Variáveis de ambiente:** Credenciais nunca expostas no frontend

## Fluxo do Pedido

1. Cliente acessa `/{slug-da-loja}` e monta o pedido
2. Escolhe produtos, personaliza (ponto da carne, extras, observações)
3. Informa nome, WhatsApp, endereço e forma de pagamento
4. Clique em "Enviar Pedido no WhatsApp"
5. Sistema formata mensagem completa e abre `wa.me` com texto pronto
6. Lojista recebe pedido organizado no WhatsApp

## Licença

MIT