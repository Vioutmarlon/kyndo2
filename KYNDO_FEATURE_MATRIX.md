# KYNDO FEATURE MATRIX — Auditoria P0

## Última atualização: 2026-11-14

| # | Recurso | Status | Evidência | Prioridade | Dependências |
|---|---------|--------|-----------|------------|--------------|
| A | Autenticação + sessão | ✅ Concluído | `middleware.ts` protege `/admin/*`; Supabase Auth com JWT | — | — |
| B | Isolamento multi-tenant (RLS) | ✅ Concluído | `schema.sql`: policies RLS em tenants, categories, products, coupons, orders | — | Supabase |
| C | Cadastro/edição de categorias | ⚠️ Parcial | API `GET /api/admin/products` lista categorias via join; CRUD de categorias não tem rota dedicada | P1 | Rota `POST/PUT/DELETE /api/admin/categories` |
| D | Cadastro/edição de produtos | ✅ Concluído | `POST /api/admin/products` com validação Zod; `GET` lista por tenant | — | — |
| E | Fotos, adicionais, variações | ⚠️ Parcial | Schema suporta `image_url`, `options` (JSONB), `extras` (JSONB); storefront exibe options mas extras não são selecionáveis no carrinho | P1 | UI de seleção de extras no storefront |
| F | Cardápio público responsivo | ✅ Concluído | `[tenant]/page.tsx` (server) + `storefront.tsx` (client); skeletons de loading; mobile-first | — | — |
| G | Carrinho com cálculos corretos | ✅ Concluído | Commit b928f76: server-side price recalculation em POST /api/orders valida preços reais do DB | — | — |
| H | Checkout com dados do cliente | ✅ Concluído | Formulário completo: nome, telefone, endereço, delivery/pickup, pagamento, troco | — | — |
| I | Persistência de pedido no banco | ✅ Concluído | Commit b928f76: storefront chama POST /api/orders, persiste pedido, inclui order ID na mensagem WhatsApp | — | — |
| J | Pedido exibido no painel admin | ✅ Concluído | Commits 51b58e7 + 6121cdc: GET /api/admin/orders criado; dashboard fetches live orders com polling 15s | — | — |
| K | Kanban operacional com transições | ✅ Concluído | Commit 8d394ac: PATCH /api/admin/orders/[id] com state machine validada; botões do Kanban funcionais | — | — |
| L | Notificação visual/sonora de novos pedidos | ❌ Ausente | Sem polling sonoro ou WebSocket | P1 | Audio notification + polling indicator |
| M | Histórico e acompanhamento | ❌ Ausente | Sem tela de histórico de pedidos no admin | P1 | `GET /api/admin/orders` com filtros + UI |
| N | Dashboard com indicadores reais | ✅ Concluído | Commit 6121cdc: KPIs e Kanban usam liveOrders do GET /api/admin/orders (demo mode preservado) | — | — |
| O | Configurações do restaurante | ⚠️ Parcial | Tela de settings existe no dashboard mas **não salva no banco** (sem `PUT /api/admin/tenant`) | P1 | Rota de atualização de tenant |
| P | Cupons | ⚠️ Parcial | Schema e RLS existem; `POST /api/orders` valida cupom; **sem UI de gerenciamento no admin** | P1 | CRUD `/api/admin/coupons` + UI |
| Q | Horários de funcionamento | ❌ Ausente | Schema tem `opening_hours` (JSONB) mas sem UI de edição | P1 | UI no settings |
| R | Áreas de entrega | ❌ Ausente | Sem schema nem UI | P2 | Nova tabela + UI |
| S | Tela de cozinha | ❌ Ausente | — | P1 | Nova rota `/admin/kitchen` |
| T | Impressão de comandas | ❌ Ausente | — | P1 | Window.print() ou integração térmica |
| U | Kyndo 3D Scan / AR Menu | ❌ Ausente | Documentado no BRIAN_CORE.md como P2 | P2 | Meshroom/AliceVision/Model Viewer |

## Resumo P0
- **Concluídos (9):** A, B, D, F, G, H, I, J, K, N
- **Parciais (2):** C, E
- **Pendentes P1:** L, M, O, P, Q, S, T

## Próxima implementação prioritária
1. **C**: Criar CRUD `/api/admin/categories` para gestão completa de categorias
2. **E**: Adicionar UI de seleção de extras no storefront
3. **O**: Criar `PUT /api/admin/tenant` para salvar configurações do restaurante
4. **P**: Criar CRUD `/api/admin/coupons` + UI de gerenciamento no dashboard