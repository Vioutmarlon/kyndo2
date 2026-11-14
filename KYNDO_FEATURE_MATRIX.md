
# KYNDO FEATURE MATRIX — Auditoria P0

## Última atualização: 2026-11-14

| # | Recurso | Status | Evidência | Prioridade | Dependências |
|---|---------|--------|-----------|------------|--------------|
| A | Autenticação + sessão | ✅ Existente | `middleware.ts` protege `/admin/*`; Supabase Auth com JWT | — | — |
| B | Isolamento multi-tenant (RLS) | ✅ Existente | `schema.sql`: policies RLS em tenants, categories, products, coupons, orders | — | Supabase |
| C | Cadastro/edição de categorias | ⚠️ Parcial | API `GET /api/admin/products` lista categorias via join; CRUD de categorias não tem rota dedicada | P0 | Rota `POST/PUT/DELETE /api/admin/categories` |
| D | Cadastro/edição de produtos | ✅ Existente | `POST /api/admin/products` com validação Zod; `GET` lista por tenant | — | — |
| E | Fotos, adicionais, variações | ⚠️ Parcial | Schema suporta `image_url`, `options` (JSONB), `extras` (JSONB); storefront exibe options mas extras não são selecionáveis no carrinho | P0 | UI de seleção de extras no storefront |
| F | Cardápio público responsivo | ✅ Existente | `[tenant]/page.tsx` (server) + `storefront.tsx` (client); skeletons de loading; mobile-first | — | — |
| G | Carrinho com cálculos corretos | ⚠️ Parcial | Cálculo client-side apenas; **sem validação de preço no servidor** antes do checkout | P0 | Validação server-side no POST /api/orders |
| H | Checkout com dados do cliente | ✅ Existente | Formulário completo: nome, telefone, endereço, delivery/pickup, pagamento, troco | — | — |
| I | Persistência de pedido no banco | ❌ Ausente | `POST /api/orders` existe mas **storefront não chama a API**; envia direto para WhatsApp via `wa.me` | P0 | Integrar storefront → API → WhatsApp |
| J | Pedido exibido no painel admin | ⚠️ Parcial | Dashboard tem Kanban com dados demo hardcoded; **sem fetch real da API de orders** | P0 | `GET /api/admin/orders` + integração no dashboard |
| K | Kanban operacional com transições | ❌ Ausente | Kanban visual existe mas botões não chamam API; sem `PATCH /api/admin/orders/:id/status` | P0 | Rota de atualização de status + integração |
| L | Notificação visual/sonora de novos pedidos | ❌ Ausente | Sem polling, WebSocket ou sound notification | P1 | Polling ou Realtime do Supabase |
| M | Histórico e acompanhamento | ❌ Ausente | Sem tela de histórico de pedidos no admin | P1 | `GET /api/admin/orders` com filtros |
| N | Dashboard com indicadores reais | ❌ Ausente | KPIs e gráficos usam dados demo hardcoded (`DEMO_ORDERS`, `SALES_CHART_DATA`) | P0 | Integrar dados reais da API |
| O | Configurações do restaurante | ⚠️ Parcial | Tela de settings existe no dashboard mas **não salva no banco** (sem `PUT /api/admin/tenant`) | P1 | Rota de atualização de tenant |
| P | Cupons | ⚠️ Parcial | Schema e RLS existem; `POST /api/orders` valida cupom; **sem UI de gerenciamento no admin** | P1 | CRUD `/api/admin/coupons` + UI |
| Q | Horários de funcionamento | ❌ Ausente | Schema tem `opening_hours` (JSONB) mas sem UI de edição | P1 | UI no settings |
| R | Áreas de entrega | ❌ Ausente | Sem schema nem UI | P2 | Nova tabela + UI |
| S | Tela de cozinha | ❌ Ausente | — | P1 | Nova rota `/admin/kitchen` |
| T | Impressão de comandas | ❌ Ausente | — | P1 | Window.print() ou integração térmica |
| U | Kyndo 3D Scan / AR Menu | ❌ Ausente | Documentado no BRIAN_CORE.md como P2 | P2 | Meshroom/AliceVision/Model Viewer |

## Resumo P0
- **Funcionais (5):** A, B, D, F, H
- **Parciais (4):** C, E, G, J
- **Ausentes (4):** I, K, L→P1, N

## Próxima implementação prioritária
1. **I**: Integrar storefront checkout → `POST /api/orders` → persistir pedido → redirecionar WhatsApp com ID do pedido
2. **G**: Adicionar validação server-side de preços no `POST /api/orders` (recalcular subtotal/desconto/taxa no servidor)
3. **J+N**: Criar `GET /api/admin/orders` e integrar dashboard com dados reais
4. **K**: Criar `PATCH /api/admin/orders/[id]` para transições de status no Kanban

