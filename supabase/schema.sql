-- ============================================================
-- DeliverySaaS — Schema Multi-Tenant com RLS
-- Execute este SQL no Supabase SQL Editor após criar o projeto
-- ============================================================

-- 1. Tabela de Tenants (Lojas)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  primary_color TEXT DEFAULT '#f97316',
  whatsapp_number TEXT NOT NULL,
  address TEXT,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  is_open BOOLEAN DEFAULT false,
  opening_hours JSONB DEFAULT '{}',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Categorias
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Produtos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  has_options BOOLEAN DEFAULT false,
  options JSONB DEFAULT '[]',
  extras JSONB DEFAULT '[]',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Cupons
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order NUMERIC(10,2) DEFAULT 0,
  max_uses INT DEFAULT 0,
  current_uses INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de Pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  address TEXT,
  payment_method TEXT NOT NULL,
  change_for NUMERIC(10,2),
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled')),
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX idx_categories_tenant ON categories(tenant_id, sort_order);
CREATE INDEX idx_products_tenant ON products(tenant_id, category_id);
CREATE INDEX idx_products_available ON products(tenant_id, is_available);
CREATE INDEX idx_orders_tenant ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(tenant_id, status);
CREATE INDEX idx_coupons_tenant ON coupons(tenant_id, code);
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_owner ON tenants(owner_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — ISOLAMENTO MULTI-TENANT
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- === TENANTS ===
-- Público pode ler tenants (vitrine)
CREATE POLICY "Public can read tenants"
  ON tenants FOR SELECT
  USING (true);

-- Owner pode CRUD seu próprio tenant
CREATE POLICY "Owner can select own tenant"
  ON tenants FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can insert own tenant"
  ON tenants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update own tenant"
  ON tenants FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete own tenant"
  ON tenants FOR DELETE
  USING (auth.uid() = owner_id);

-- === CATEGORIES ===
-- Público pode ler categorias ativas
CREATE POLICY "Public can read active categories"
  ON categories FOR SELECT
  USING (is_active = true);

-- Owner do tenant pode CRUD categorias
CREATE POLICY "Tenant owner can manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND owner_id = auth.uid())
  );

-- === PRODUCTS ===
-- Público pode ler produtos disponíveis
CREATE POLICY "Public can read available products"
  ON products FOR SELECT
  USING (is_available = true);

-- Owner do tenant pode CRUD produtos
CREATE POLICY "Tenant owner can manage products"
  ON products FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND owner_id = auth.uid())
  );

-- === COUPONS ===
-- Público pode ler cupons ativos (para validação no checkout)
CREATE POLICY "Public can read active coupons"
  ON coupons FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Owner do tenant pode CRUD cupons
CREATE POLICY "Tenant owner can manage coupons"
  ON coupons FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND owner_id = auth.uid())
  );

-- === ORDERS ===
-- Público pode inserir pedidos (checkout)
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Owner do tenant pode ler e atualizar pedidos da sua loja
CREATE POLICY "Tenant owner can manage orders"
  ON orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND owner_id = auth.uid())
  );

-- ============================================================
-- FUNÇÃO DE ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUDIT LOG — Rastreabilidade de ações administrativas
-- ============================================================
CREATE TABLE audit_log (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
 user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
 action TEXT NOT NULL,
 resource_type TEXT NOT NULL,
 resource_id UUID,
 metadata JSONB DEFAULT '{}',
 ip_address TEXT,
 created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Owner do tenant pode ler logs da sua loja
CREATE POLICY "Tenant owner can read audit logs"
 ON audit_log FOR SELECT
 USING (
 EXISTS (SELECT 1 FROM tenants WHERE id = tenant_id AND owner_id = auth.uid())
 );

-- Sistema pode inserir logs (via service role ou triggers)
CREATE POLICY "System can insert audit logs"
 ON audit_log FOR INSERT
 WITH CHECK (true);

CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, created_at DESC);

-- ============================================================
-- DADOS DE DEMO — Hamburgueria Demo
-- ============================================================
INSERT INTO tenants (id, slug, name, whatsapp_number, delivery_fee, is_open, primary_color)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'demo-burger',
  'Demo Burger 🍔',
  '11999999999',
  5.00,
  true,
  '#f97316'
);

INSERT INTO categories (id, tenant_id, name, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '🍔 Hambúrgueres', 1),
  ('b1000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '🥤 Bebidas', 2),
  ('b1000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '🍟 Acompanhamentos', 3),
  ('b1000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '🍰 Sobremesas', 4);

INSERT INTO products (tenant_id, category_id, name, description, price, is_available, has_options, options, sort_order) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000000-0000-0000-0000-000000000001', 'X-Bacon Artesanal', 'Hambúrguer 180g, bacon crocante, cheddar, cebola caramelizada, pão brioche', 32.90, true, true, '[{"name":"Ponto da carne","choices":["Mal passada","Ao ponto","Bem passada"],"required":true}]', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000000-0000-0000-0000-000000000001', 'Double Smash Burger', 'Dois smash burgers 90g, queijo americano, picles, molho especial', 38.90, true, true, '[{"name":"Ponto da carne","choices":["Mal passada","Ao ponto","Bem passada"],"required":true}]', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000000-0000-0000-0000-000000000001', 'Veggie Burger', 'Hambúrguer de grão-de-bico, rúcula, tomate seco, maionese verde', 29.90, true, false, '[]', 3),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000000-0000-0000-0000-000000000002', 'Coca-Cola Lata', '350ml gelada', 6.00, true, false, '[]', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000000-0000-0000-0000-000000000002', 'Suco Natural', 'Laranja ou Limão - 400ml', 10.00, true, true, '[{"name":"Sabor","choices":["Laranja","Limão"],"required":true}]', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000000-0000-0000-0000-000000000002', 'Água Mineral', '500ml sem gás', 4.00, true, false, '[]', 3),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000000-0000-0000-0000-000000000003', 'Batata Frita', 'Porção generosa com sal e orégano', 18.00, true, false, '[]', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000000-0000-0000-0000-000000000003', 'Onion Rings', 'Anéis de cebola empanados e fritos', 22.00, true, false, '[]', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000000-0000-0000-0000-000000000004', 'Brownie com Sorvete', 'Brownie de chocolate quente com bola de sorvete de creme', 24.00, true, false, '[]', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1000000-0000-0000-0000-000000000004', 'Milkshake', 'Chocolate, Morango ou Baunilha - 500ml', 22.00, true, true, '[{"name":"Sabor","choices":["Chocolate","Morango","Baunilha"],"required":true}]', 2);