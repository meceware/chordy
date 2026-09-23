import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';

// turbopackIgnore keeps the tracer from treating a runtime-configurable path as a reason
// to bundle the whole project; the database is a mounted volume, never a build artifact.
export const databasePath = /* turbopackIgnore: true */ process.env.DATABASE_PATH || 'data/chords.db';

function open() {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.pragma('journal_mode = WAL');
  database.pragma('synchronous = NORMAL');
  database.pragma('foreign_keys = ON');
  database.pragma('busy_timeout = 5000');
  return database;
}

/**
 * Opened on first use, and cached on globalThis so the dev server's module reloads reuse
 * one handle instead of leaking a file descriptor per edit. Deferring the open keeps
 * `next build` from creating a stray database just by importing this module.
 */
export function getDb() {
  globalThis.__chordsDb ??= open();
  return globalThis.__chordsDb;
}

const statements = new Map();

/**
 * Prepared on first use rather than at module load, so importing a query module does not
 * require the schema to exist yet.
 */
export function prepared(sql) {
  let statement = statements.get(sql);
  if (!statement) {
    statement = getDb().prepare(sql);
    statements.set(sql, statement);
  }
  return statement;
}
