-- ============================================================
-- 001_add_ai_insights.sql
--
-- O `init.sql` da raiz do projeto (`sql/init.sql`) só roda
-- AUTOMATICAMENTE na primeira vez que o volume do Postgres é criado
-- (é assim que a imagem oficial do Postgres funciona). Como o seu
-- banco já existe, rodar `docker compose up` de novo NÃO vai aplicar
-- as novas colunas sozinho, por isso este script existe: rode ele
-- manualmente, uma única vez, sobre o banco que já está no ar.
--
-- Como rodar (com os containers já de pé, via `docker compose up`):
--
--   docker compose exec -T db psql -U insightai -d insightai_db < sql/migrations/001_add_ai_insights.sql
--
-- (no PowerShell, troque o `<` por `Get-Content sql/migrations/001_add_ai_insights.sql | docker compose exec -T db psql -U insightai -d insightai_db`)
--
-- Todos os comandos usam "IF NOT EXISTS", então é seguro rodar esse
-- script mais de uma vez sem quebrar nada.
-- ============================================================

ALTER TABLE datasets ADD COLUMN IF NOT EXISTS profiling JSONB;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS ai_insights JSONB;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS ai_insights_generated_at TIMESTAMP;
