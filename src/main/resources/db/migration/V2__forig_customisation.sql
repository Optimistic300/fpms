-- ── Activity type ─────────────────────────────────────────────────────
ALTER TABLE activities ADD COLUMN activity_type VARCHAR(50);

-- ── Division seed ──────────────────────────────────────────────────────
UPDATE users    SET division_id = NULL WHERE division_id IS NOT NULL;
UPDATE projects SET division_id = NULL WHERE division_id IS NOT NULL;
DELETE FROM divisions;

INSERT INTO divisions (name) VALUES
    ('Biodiversity Conservation and Ecosystem Services'),
    ('Forest Improvement and Productivity'),
    ('Forest and Climate Change'),
    ('Forest Economics and Marketing Division'),
    ('Forest Policy, Governance and Livelihoods'),
    ('Wood Industry and Utilisation'),
    ('Commercialisation'),
    ('Administration'),
    ('Finance'),
    ('Information and Communication Section'),
    ('Grants and Projects Office');

-- ── User: designation ──────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN designation VARCHAR(100);

-- ── Project: extended fields ───────────────────────────────────────────
ALTER TABLE projects ADD COLUMN funding_type    VARCHAR(20)  NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE projects ADD COLUMN research_area   VARCHAR(255);
ALTER TABLE projects ADD COLUMN funding_source  VARCHAR(255);
ALTER TABLE projects ADD COLUMN objectives      TEXT;
ALTER TABLE projects ADD COLUMN key_findings    TEXT;

-- Migrate status values: ACTIVE → ONGOING; set new default
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'ONGOING';
UPDATE projects SET status = 'ONGOING' WHERE status = 'ACTIVE';

-- ── Project team ───────────────────────────────────────────────────────
CREATE TABLE project_team (
    id          BIGSERIAL PRIMARY KEY,
    project_id  BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    role        VARCHAR(100),
    joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_team_project ON project_team(project_id);
CREATE INDEX idx_project_team_user    ON project_team(user_id);

-- ── Documents table ────────────────────────────────────────────────────
CREATE TABLE documents (
    id              BIGSERIAL PRIMARY KEY,
    project_id      BIGINT REFERENCES projects(id),
    activity_id     BIGINT REFERENCES activities(id),
    file_name       VARCHAR(255) NOT NULL,
    file_url        TEXT NOT NULL,
    file_type       VARCHAR(50),
    file_size       BIGINT,
    uploaded_by     BIGINT NOT NULL REFERENCES users(id),
    is_library_item BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_document_attachment CHECK (project_id IS NOT NULL OR activity_id IS NOT NULL)
);

CREATE INDEX idx_documents_project  ON documents(project_id);
CREATE INDEX idx_documents_activity ON documents(activity_id);
CREATE INDEX idx_documents_uploader ON documents(uploaded_by);
CREATE INDEX idx_documents_library  ON documents(is_library_item);

-- ── Document forwards table ────────────────────────────────────────────
CREATE TABLE document_forwards (
    id           BIGSERIAL PRIMARY KEY,
    document_id  BIGINT NOT NULL REFERENCES documents(id),
    forwarded_by BIGINT NOT NULL REFERENCES users(id),
    forwarded_to BIGINT NOT NULL REFERENCES users(id),
    message      TEXT,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doc_fwd_document ON document_forwards(document_id);
CREATE INDEX idx_doc_fwd_to       ON document_forwards(forwarded_to);
CREATE INDEX idx_doc_fwd_read     ON document_forwards(is_read);
