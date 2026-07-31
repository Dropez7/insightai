-- ============================================================
-- INIT.SQL
-- Script executado automaticamente pelo container do PostgreSQL
-- na primeira vez que o volume do banco é criado.
-- Ele define a estrutura inicial (schema) da Versão 1 do InsightAI.
-- ============================================================

-- Tabela de usuários
-- Cada usuário é o "dono" de um ou mais projetos.
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    password_hash TEXT          NOT NULL,       -- nunca guardamos a senha em texto puro
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Tabela de projetos
-- Um projeto pertence a um usuário (ON DELETE CASCADE: se o usuário for
-- apagado, seus projetos também são, evitando "projetos órfãos").
CREATE TABLE IF NOT EXISTS projects (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Tabela de datasets
-- Um dataset pertence a um projeto. Guardamos metadados do arquivo,
-- não o conteúdo dele (o arquivo em si fica no disco, em /uploads).
CREATE TABLE IF NOT EXISTS datasets (
    id                SERIAL PRIMARY KEY,
    project_id        INTEGER      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name              VARCHAR(150) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename   VARCHAR(255) NOT NULL,   -- nome único salvo em disco (evita conflito de nomes)
    file_path         TEXT         NOT NULL,
    size_bytes        BIGINT       NOT NULL,
    mime_type         VARCHAR(100),
    uploaded_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Índices auxiliares para acelerar buscas por dono (chave estrangeira)
CREATE INDEX IF NOT EXISTS idx_projects_user_id   ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_project_id ON datasets(project_id);
