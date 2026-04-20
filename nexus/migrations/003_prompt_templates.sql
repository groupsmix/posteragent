-- ============================================================
-- PROMPT TEMPLATES (editable from dashboard, cached in KV)
-- ============================================================

CREATE TABLE prompt_templates (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  type            TEXT NOT NULL,
  ref_id          TEXT,
  name            TEXT NOT NULL,
  content         TEXT NOT NULL,
  version         INTEGER DEFAULT 1,
  is_active       INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_prompts_type ON prompt_templates(type);
CREATE INDEX idx_prompts_ref ON prompt_templates(ref_id);
