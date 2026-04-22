CREATE TABLE divisions (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'SCIENTIST',
    division_id   BIGINT REFERENCES divisions(id),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    lead_id     BIGINT NOT NULL REFERENCES users(id),
    division_id BIGINT REFERENCES divisions(id),
    start_date  DATE,
    end_date    DATE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE activities (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users(id),
    project_id    BIGINT NOT NULL REFERENCES projects(id),
    description   TEXT NOT NULL,
    notes         TEXT,
    activity_date DATE NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_user    ON activities(user_id);
CREATE INDEX idx_activities_project ON activities(project_id);
CREATE INDEX idx_activities_date    ON activities(activity_date DESC);
CREATE INDEX idx_projects_status    ON projects(status);
CREATE INDEX idx_projects_lead      ON projects(lead_id);