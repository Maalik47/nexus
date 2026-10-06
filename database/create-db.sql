-- ============================================================================
-- Bootstrap: run ONCE as a PostgreSQL superuser (e.g. the `postgres` user)
--   psql -U postgres -f database/create-db.sql
-- Then load the schema and demo data with:
--   cd backend && npm run db:setup
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'nexusgear') THEN
    CREATE ROLE nexusgear WITH LOGIN PASSWORD 'nexusgear';
  END IF;
END
$$;

-- CREATE DATABASE cannot run inside a transaction/DO block.
SELECT 'CREATE DATABASE nexusgear OWNER nexusgear'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'nexusgear')
\gexec
