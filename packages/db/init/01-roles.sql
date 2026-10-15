-- One-time bootstrap per environment, run as an administrator (docker-compose runs it automatically).
--
-- Two roles:
--   ebike      owns the schema and runs migrations. Owners bypass RLS, so the app never uses it.
--   ebike_app  what the web app and worker connect as. Subject to Row-Level Security.
-- Change the password outside local development.

CREATE ROLE ebike_app LOGIN PASSWORD 'ebike_app';

GRANT CONNECT ON DATABASE ebike TO ebike_app;
GRANT USAGE ON SCHEMA public TO ebike_app;

-- Tables created later by the owner are usable by the app role (still filtered by RLS).
ALTER DEFAULT PRIVILEGES FOR ROLE ebike IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ebike_app;
ALTER DEFAULT PRIVILEGES FOR ROLE ebike IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ebike_app;
