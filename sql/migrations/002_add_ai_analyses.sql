

ALTER TABLE datasets ADD COLUMN IF NOT EXISTS ai_analyses JSONB;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS ai_analyses_generated_at TIMESTAMP;
