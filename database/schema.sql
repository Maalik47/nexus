-- ============================================================================
-- NexusGear - PostgreSQL schema
-- Derived from the Entity-Relationship diagram:
--   USER 1---N INVOICE          (registers)
--   INVOICE 1---N INVOICE_LINE  (contains / appears in)
--   PRODUCT 1---N INVOICE_LINE  (is sold in)
--   CATEGORY 1---N PRODUCT      (classifies)
--   PRODUCT 1---N INVENTORY_MOVEMENT (affects)
-- ============================================================================

BEGIN;

DROP TABLE IF EXISTS inventory_movements CASCADE;
DROP TABLE IF EXISTS invoice_lines CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ---------------------------------------------------------------- users -----
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(180)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          VARCHAR(20)   NOT NULL DEFAULT 'cliente'
                CHECK (role IN ('cliente', 'admin')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------- categories -----
CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------- products -----
CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(160)   NOT NULL,
  description TEXT,
  price       NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  stock       INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url   TEXT,
  category_id INTEGER REFERENCES categories (id) ON DELETE SET NULL,
  featured    BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_featured ON products (featured) WHERE featured;

-- ------------------------------------------------------------- invoices -----
CREATE TABLE invoices (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  issued_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  subtotal   NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  tax        NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total      NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  status     VARCHAR(20)  NOT NULL DEFAULT 'pagada'
             CHECK (status IN ('pendiente', 'pagada', 'anulada')),
  notes      TEXT
);

CREATE INDEX idx_invoices_user ON invoices (user_id);
CREATE INDEX idx_invoices_issued_at ON invoices (issued_at);

-- --------------------------------------------------------- invoice_lines -----
CREATE TABLE invoice_lines (
  id           SERIAL PRIMARY KEY,
  invoice_id   INTEGER       NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
  product_id   INTEGER       REFERENCES products (id) ON DELETE SET NULL,
  product_name VARCHAR(160)  NOT NULL,
  quantity     INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  line_total   NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines (invoice_id);
CREATE INDEX idx_invoice_lines_product ON invoice_lines (product_id);

-- ----------------------------------------------------- inventory_movements ---
CREATE TABLE inventory_movements (
  id            SERIAL PRIMARY KEY,
  product_id    INTEGER      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  movement_type VARCHAR(10)  NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'ajuste')),
  quantity      INTEGER      NOT NULL CHECK (quantity > 0),
  balance       INTEGER      NOT NULL CHECK (balance >= 0),
  reason        VARCHAR(200),
  invoice_id    INTEGER      REFERENCES invoices (id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_product ON inventory_movements (product_id);
CREATE INDEX idx_inventory_created_at ON inventory_movements (created_at);

COMMIT;
