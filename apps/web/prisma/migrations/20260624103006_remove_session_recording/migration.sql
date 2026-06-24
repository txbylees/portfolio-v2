-- Remove the session-recording product: drop Session and its child tables,
-- plus the LogLevel enum they used. CASCADE clears the foreign keys to Project.
DROP TABLE IF EXISTS "SessionEvent" CASCADE;
DROP TABLE IF EXISTS "ConsoleLog" CASCADE;
DROP TABLE IF EXISTS "NetworkRequest" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TYPE IF EXISTS "LogLevel";
