-- The app role may only add and read audit rows; history can never be rewritten.
REVOKE UPDATE, DELETE, TRUNCATE ON "audit_log" FROM "ebike_app";
