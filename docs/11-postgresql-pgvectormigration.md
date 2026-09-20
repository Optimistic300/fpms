# Migration Plan: MySQL to PostgreSQL with pgvector

This document outlines the steps required to migrate the FPMS database from MySQL to PostgreSQL with the pgvector extension for enhanced AI capabilities.

## Overview

FPMS currently uses MySQL as its database backend. This plan describes migrating to PostgreSQL with the pgvector extension to support vector similarity search for the AI assistant feature, while maintaining all existing functionality.

## Prerequisites

- PostgreSQL 14+ installed
- pgvector extension installed and enabled
- Laravel 10+ (supports PostgreSQL natively)
- Composer and npm available

## Migration Steps

### 1. Environment Configuration

Update `.env` file to use PostgreSQL:

```env
# === Database (PostgreSQL) ===
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fpms
DB_USERNAME=app_user
DB_PASSWORD=StrongPass123

# === Testing Database (PostgreSQL) ===
# DB_DATABASE=fpms_test
```

### 2. Install PostgreSQL Dependencies

Ensure the PostgreSQL PHP driver is installed:

```bash
# Ubuntu/Debian
sudo apt-get install php-pgsql

# Or with PHP version specific
sudo apt-get install php8.2-pgsql
```

### 3. Database Schema Migration

Laravel migrations are database-agnostic, so existing migrations will work with PostgreSQL with minor adjustments needed for specific MySQL features:

#### Data Type Mapping

| MySQL Type | PostgreSQL Equivalent | Notes |
|------------|----------------------|-------|
| bigint, auto | bigserial or bigint | Use bigserial for auto-increment |
| varchar(n) | varchar(n) | Identical |
| text | text | Identical |
| longtext | text | PostgreSQL text has no practical limit |
| timestamp | timestamp with time zone or timestamp without time zone | Laravel defaults to without time zone |
| boolean | boolean | Identical |
| tinyint | smallint or integer | For progress field (0-100) |
| enum | text or varchar | Application-level validation recommended |
| longText (for document content) | text | PostgreSQL text suitable for large content |

#### MySQL-Specific Features to Replace

1. **FULLTEXT Indexes** (in documents.filename and document_texts.content):
   - MySQL: `FULLTEXT('filename')`, `FULLTEXT('content')`
   - PostgreSQL: Will be replaced by pgvector for AI search, keep GIN indexes for fallback text search if needed

2. **Unsigned Integers**:
   - PostgreSQL doesn't have unsigned types; use CHECK constraints if needed
   - Most Laravel unsigned columns are for counts/IDs which are naturally non-negative

3. **Specific MySQL Functions**:
   - `NOW()` → `NOW()` (same in PostgreSQL)
   - String concatenation: Keep Laravel's query builder which handles differences

### 4. Run Migrations

```bash
# Fresh installation
php artisan migrate:fresh --seed

# Existing database (requires manual data migration - see section 5)
php artisan migrate
```

### 5. Data Migration (if existing data)

For existing MySQL databases with data:

1. Dump MySQL database:
   ```bash
   mysqldump -u root -p fpms > fpms_mysql_dump.sql
   ```

2. Convert to PostgreSQL format (using pgloader recommended):
   ```bash
   pgloader mysql://root@localhost/fpms postgresql://user@localhost/fpms
   ```

3. Or manual conversion:
   - Export data as CSV from MySQL
   - Import into PostgreSQL using `\copy` command
   - Handle sequence resetting for auto-increment fields

### 6. pgvector Extension Setup

Install and enable pgvector extension:

```sql
-- Connect to your database
CREATE EXTENSION IF NOT EXISTS vector;
```

### 7. AI Assistant Feature Modifications

The current AI assistant uses MySQL FULLTEXT search in `app/Services/AiAssistantService.php`. This needs to be modified to use pgvector for vector similarity search.

#### Current Implementation (MySQL FULLTEXT):
- Uses `MATCH ... AGAINST` for boolean mode search
- Ranks results by relevance score
- Applies boosting factors (recency, division match)

#### Target Implementation (pgvector):
1. Store document embeddings as vectors in a new table
2. Use cosine similarity or inner product for search
3. Maintain fallback to text search for exact matches

#### Required Changes:

1. **Create document_embeddings table** (new migration):
   ```php
   Schema::create('document_embeddings', function (Blueprint $table) {
       $table->id();
       $table->foreignId('document_id')->constrained()->cascadeOnDelete();
       $table->vector('embedding', 1536); // OpenAI ada-002 dimension
       $table->timestamps();
       
       $table->index(['document_id']);
   });
   ```

2. **Modify AiAssistantService.php**:
   - Replace FULLTEXT search with vector similarity search
   - Add embedding generation (when documents are processed)
   - Maintain hybrid search capability (vector + text)

3. **Update Document processing pipeline**:
   - Generate embeddings when documents are indexed
   - Store embeddings in the new table
   - Update SyncDocumentIndex job to handle embeddings

### 8. Testing

After migration:

1. Run all tests:
   ```bash
   php artisan test
   ```

2. Verify AI assistant functionality:
   - Test document upload and indexing
   - Test search queries return expected results
   - Verify citation accuracy

3. Performance testing:
   - Compare query latency between MySQL FULLTEXT and pgvector
   - Ensure acceptable performance for expected document volume

### 9. Rollback Plan

1. Keep MySQL database backup until migration verified
2. Document all changes made
3. Ability to revert to MySQL by:
   - Restoring MySQL database from backup
   - Reverting .env DB_CONNECTION to mysql
   - Temporarily disabling pgvector-dependent code

## Impact on AI Assistant Feature

### Benefits of pgvector:
1. **Semantic Search**: Understanding meaning beyond exact keywords
2. **Better Recall**: Finding relevant documents even with different terminology
3. **Scalability**: Better performance for large document collections
4. **Future-Proofing**: Easy to swap embedding models or vector databases

### Implementation Approach:
1. **Phase 1**: Keep current MySQL FULLTEXT implementation working
2. **Phase 2**: Add pgvector alongside existing search (hybrid approach)
3. **Phase 3**: Migrate completely to pgvector with fallback to text search

### Document Processing Flow with pgvector:
1. Document uploaded → stored in `documents` table
2. Document processed → text extracted → stored in `document_texts` table
3. Text chunked → embedded → vectors stored in `document_embeddings` table
4. Search query → embedded → similarity search against `document_embeddings`
5. Results → fetch document details → return with citations

## Configuration Notes

### Laravel Scout Alternative
Consider using Laravel Scout with pgvector driver instead of custom implementation:
- Scout provides abstraction for different search engines
- pgvector Scout driver available via community packages
- Would require implementing a custom Scout engine for pgvector

### Connection Pooling
For production, consider using PgBouncer for connection pooling:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=fpms
DB_USERNAME=your_username
DB_PASSWORD=your_password
# Add pool configuration in config/database.php if needed
```

## Verification Checklist

[ ] All migrations run successfully on PostgreSQL
[ ] All seed data loads correctly
[ ] Application functions normally (CRUD operations)
[ ] Authentication and authorization work
[ ] File uploads and storage function correctly
[ ] Queue workers process jobs correctly
[ ] Scheduled tasks run without error
[ ] AI assistant can index documents
[ ] AI assistant returns relevant search results
[ ] Citations are accurate and verifiable
[ ] Performance meets requirements
[ ] Error handling works correctly
[ ] Tests pass

## Estimated Effort

- Configuration and testing: 2-4 hours
- Data migration (if applicable): 4-8 hours depending on data size
- AI assistant modifications: 8-16 hours
- Testing and verification: 4-8 hours
- Total: 18-36 hours

## References

- Laravel PostgreSQL Documentation: https://laravel.com/docs/database#postgresql-installation
- pgvector GitHub: https://github.com/pgvector/pgvector
- Laravel Scout: https://laravel.com/docs/scout
- Vector embeddings guide: https://platform.openai.com/docs/guides/embeddings