ALTER TABLE documents ADD COLUMN extracted_text TEXT;

CREATE INDEX idx_documents_fts
    ON documents USING gin(to_tsvector('english', coalesce(extracted_text, '')));
