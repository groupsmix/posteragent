-- ============================================================
-- AI MODEL REGISTRY
-- ============================================================

CREATE TABLE ai_models (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name            TEXT NOT NULL,
  provider        TEXT NOT NULL,
  model_id        TEXT NOT NULL,
  task_types      TEXT NOT NULL,
  priority        INTEGER DEFAULT 0,
  secret_key      TEXT,
  endpoint        TEXT NOT NULL,
  max_tokens      INTEGER DEFAULT 4096,
  rate_limit_rpm  INTEGER DEFAULT 60,
  cost_per_1k     REAL DEFAULT 0,
  status          TEXT DEFAULT 'sleeping',
  is_free         INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_ai_models_status ON ai_models(status);

-- ============================================================
-- AI USAGE LOG (for cost tracking + rate limit detection)
-- ============================================================

CREATE TABLE ai_usage_log (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  model_id        TEXT NOT NULL REFERENCES ai_models(id),
  step_id         TEXT REFERENCES workflow_steps(id),
  task_type       TEXT NOT NULL,
  tokens_input    INTEGER DEFAULT 0,
  tokens_output   INTEGER DEFAULT 0,
  cost_usd        REAL DEFAULT 0,
  latency_ms      INTEGER DEFAULT 0,
  success         INTEGER DEFAULT 1,
  error           TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_ai_usage_model ON ai_usage_log(model_id);
CREATE INDEX idx_ai_usage_created ON ai_usage_log(created_at);
