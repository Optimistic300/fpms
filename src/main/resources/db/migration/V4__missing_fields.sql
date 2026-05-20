-- Projects: extended CLAARRDEC fields (added after V2 was applied)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS research_area  VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS funding_source VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS objectives     TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS key_findings   TEXT;

-- Migrate status default: ACTIVE -> ONGOING
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'ONGOING';
UPDATE projects SET status = 'ONGOING' WHERE status = 'ACTIVE';

-- Project team membership
CREATE TABLE IF NOT EXISTS project_team (
    id          BIGSERIAL PRIMARY KEY,
    project_id  BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id),
    role        VARCHAR(100),
    joined_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_team_project ON project_team(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_user    ON project_team(user_id);
