-- Human-run only. Creates a SELECT-only role for overnight QA.
-- Do not put this password in agent env as the owner URL.
-- The agent process must receive DATABASE_URL with user qa_agent, never managekar.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'qa_agent') THEN
    CREATE ROLE qa_agent LOGIN PASSWORD 'change-me-on-the-vps';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE managekar TO qa_agent;
GRANT USAGE ON SCHEMA public TO qa_agent;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qa_agent;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO qa_agent;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO qa_agent;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM qa_agent;
REVOKE CREATE ON SCHEMA public FROM qa_agent;
