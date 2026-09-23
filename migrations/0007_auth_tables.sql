-- BetterAuth's own schema, captured verbatim from `npx @better-auth/cli generate` so a fresh
-- volume needs nothing but this runner. Without it the app boots, then fails at sign-in with
-- "no such table: main.user".
--
-- IF NOT EXISTS because databases created before this migration already have these tables from
-- the CLI. On a BetterAuth upgrade that changes the schema, add another migration rather than
-- editing this one.
CREATE TABLE IF NOT EXISTS "user" (
  "id"            text    NOT NULL PRIMARY KEY,
  "name"          text    NOT NULL,
  "email"         text    NOT NULL UNIQUE,
  "emailVerified" integer NOT NULL,
  "image"         text,
  "createdAt"     date    NOT NULL,
  "updatedAt"     date    NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id"        text NOT NULL PRIMARY KEY,
  "expiresAt" date NOT NULL,
  "token"     text NOT NULL UNIQUE,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId"    text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  "accountId"             text NOT NULL,
  "id"                    text NOT NULL PRIMARY KEY,
  "providerId"            text NOT NULL,
  "userId"                text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  date,
  "refreshTokenExpiresAt" date,
  "scope"                 text,
  "password"              text,
  "createdAt"             date NOT NULL,
  "updatedAt"             date NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id"         text NOT NULL PRIMARY KEY,
  "identifier" text NOT NULL,
  "value"      text NOT NULL,
  "expiresAt"  date NOT NULL,
  "createdAt"  date NOT NULL,
  "updatedAt"  date NOT NULL
);

CREATE INDEX IF NOT EXISTS "session_userId_idx"           ON "session" ("userId");
CREATE INDEX IF NOT EXISTS "account_userId_idx"           ON "account" ("userId");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx"  ON "verification" ("identifier");
