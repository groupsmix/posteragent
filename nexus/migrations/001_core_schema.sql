-- ============================================================
-- DOMAINS & CATEGORIES (user-configurable from dashboard)
-- ============================================================

CREATE TABLE domains (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  color       TEXT DEFAULT '#6366f1',
  sort_order  INTEGER DEFAULT 0,
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE categories (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  domain_id   TEXT NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0,
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_categories_domain ON categories(domain_id);

-- ============================================================
-- PLATFORMS (where products get listed)
-- ============================================================

CREATE TABLE platforms (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  url               TEXT,
  title_max_chars   INTEGER,
  description_max   INTEGER,
  tag_count         INTEGER,
  tag_max_chars     INTEGER,
  audience          TEXT,
  tone              TEXT,
  seo_style         TEXT,
  description_style TEXT,
  cta_style         TEXT,
  forbidden_words   TEXT,
  rules_json        TEXT,
  is_active         INTEGER DEFAULT 1,
  sort_order        INTEGER DEFAULT 0,
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- SOCIAL CHANNELS
-- ============================================================

CREATE TABLE social_channels (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  caption_max_chars INTEGER,
  hashtag_count     INTEGER,
  tone              TEXT,
  format            TEXT,
  content_types     TEXT,
  posting_mode      TEXT DEFAULT 'manual',
  is_active         INTEGER DEFAULT 1,
  sort_order        INTEGER DEFAULT 0,
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  domain_id       TEXT NOT NULL REFERENCES domains(id),
  category_id     TEXT NOT NULL REFERENCES categories(id),
  name            TEXT,
  niche           TEXT,
  language        TEXT DEFAULT 'en',
  user_input      TEXT,
  status          TEXT DEFAULT 'draft',
  ai_score        REAL,
  revenue_estimate TEXT,
  winner_patterns  TEXT,
  graveyard_at    TEXT,
  graveyard_reason TEXT,
  resurface_at    TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_domain ON products(domain_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_graveyard ON products(graveyard_at) WHERE graveyard_at IS NOT NULL;

-- ============================================================
-- WORKFLOW RUNS
-- ============================================================

CREATE TABLE workflow_runs (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cf_workflow_id  TEXT,
  status          TEXT DEFAULT 'queued',
  current_step    TEXT,
  total_steps     INTEGER DEFAULT 0,
  error           TEXT,
  started_at      TEXT,
  completed_at    TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_runs_product ON workflow_runs(product_id);
CREATE INDEX idx_runs_status ON workflow_runs(status);

-- ============================================================
-- WORKFLOW STEPS
-- ============================================================

CREATE TABLE workflow_steps (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  run_id          TEXT NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_name       TEXT NOT NULL,
  step_type       TEXT NOT NULL,
  step_order      INTEGER NOT NULL,
  status          TEXT DEFAULT 'waiting',
  ai_model_used   TEXT,
  ai_models_tried TEXT,
  input_data      TEXT,
  output_data     TEXT,
  tokens_used     INTEGER DEFAULT 0,
  cost_usd        REAL DEFAULT 0,
  started_at      TEXT,
  completed_at    TEXT,
  error           TEXT
);

CREATE INDEX idx_steps_run ON workflow_steps(run_id);
CREATE INDEX idx_steps_status ON workflow_steps(status);

-- ============================================================
-- ASSETS (files in R2 + CF Images)
-- ============================================================

CREATE TABLE assets (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  step_id         TEXT REFERENCES workflow_steps(id),
  asset_type      TEXT NOT NULL,
  r2_key          TEXT,
  cf_image_id     TEXT,
  cdn_url         TEXT,
  filename        TEXT,
  mime_type       TEXT,
  file_size_bytes INTEGER,
  metadata        TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_assets_product ON assets(product_id);

-- ============================================================
-- PLATFORM VARIANTS (one per product per platform)
-- ============================================================

CREATE TABLE platform_variants (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform_id     TEXT NOT NULL REFERENCES platforms(id),
  title           TEXT,
  description     TEXT,
  tags            TEXT,
  price           REAL,
  currency        TEXT DEFAULT 'USD',
  additional_data TEXT,
  status          TEXT DEFAULT 'draft',
  published_at    TEXT,
  published_url   TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_platform_variants_product ON platform_variants(product_id);

-- ============================================================
-- SOCIAL VARIANTS (one per product per channel)
-- ============================================================

CREATE TABLE social_variants (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  channel_id      TEXT NOT NULL REFERENCES social_channels(id),
  content         TEXT NOT NULL,
  status          TEXT DEFAULT 'draft',
  scheduled_at    TEXT,
  published_at    TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- REVIEW HISTORY (every CEO decision saved)
-- ============================================================

CREATE TABLE reviews (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  run_id          TEXT REFERENCES workflow_runs(id),
  version         INTEGER DEFAULT 1,
  ai_score        REAL,
  section_scores  TEXT,
  decision        TEXT,
  feedback        TEXT,
  revised_sections TEXT,
  reviewed_at     TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_reviews_product ON reviews(product_id);

-- ============================================================
-- TITLE VARIANTS (A/B options shown on review screen)
-- ============================================================

CREATE TABLE title_variants (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  product_id      TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform_id     TEXT REFERENCES platforms(id),
  variant_a       TEXT,
  variant_b       TEXT,
  variant_c       TEXT,
  selected        TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- TREND RADAR (daily cron results)
-- ============================================================

CREATE TABLE trend_alerts (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  domain_id       TEXT REFERENCES domains(id),
  trend_keyword   TEXT NOT NULL,
  trend_score     REAL,
  demand_window   TEXT,
  source          TEXT,
  suggested_niche TEXT,
  status          TEXT DEFAULT 'new',
  detected_at     TEXT DEFAULT (datetime('now')),
  dismissed_at    TEXT,
  workflow_id     TEXT
);

CREATE INDEX idx_trends_status ON trend_alerts(status);
CREATE INDEX idx_trends_detected ON trend_alerts(detected_at);

-- ============================================================
-- WINNER PATTERNS (learned from approvals)
-- ============================================================

CREATE TABLE winner_patterns (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  domain_id       TEXT REFERENCES domains(id),
  category_id     TEXT REFERENCES categories(id),
  pattern_type    TEXT NOT NULL,
  pattern_data    TEXT NOT NULL,
  confidence      REAL DEFAULT 0,
  sample_size     INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);
