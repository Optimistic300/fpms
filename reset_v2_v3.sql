-- Run this in psql to roll back V2 and V3 so Flyway re-applies them.
-- DROP in reverse-dependency order.

DROP TABLE IF EXISTS document_forwards;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS project_team;

ALTER TABLE activities DROP COLUMN IF EXISTS activity_type;
ALTER TABLE users      DROP COLUMN IF EXISTS designation;
ALTER TABLE projects   DROP COLUMN IF EXISTS funding_type;
ALTER TABLE projects   DROP COLUMN IF EXISTS research_area;
ALTER TABLE projects   DROP COLUMN IF EXISTS funding_source;
ALTER TABLE projects   DROP COLUMN IF EXISTS objectives;
ALTER TABLE projects   DROP COLUMN IF EXISTS key_findings;

-- Restore status default to V1 value so V2 can migrate it cleanly
ALTER TABLE projects ALTER COLUMN status SET DEFAULT 'ACTIVE';
UPDATE projects SET status = 'ACTIVE' WHERE status = 'ONGOING';

-- Clear seeded divisions
UPDATE users    SET division_id = NULL WHERE division_id IS NOT NULL;
UPDATE projects SET division_id = NULL WHERE division_id IS NOT NULL;
DELETE FROM divisions;

-- Remove Flyway history so V2 and V3 are treated as new migrations
DELETE FROM flyway_schema_history WHERE version IN ('2', '3');
