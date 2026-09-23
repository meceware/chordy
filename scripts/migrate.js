import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDb, databasePath } from '../src/lib/db.js';

const dir = join(import.meta.dirname, '..', 'migrations');

const files = readdirSync(dir)
  .filter((name) => name.endsWith('.sql'))
  .sort();

const db = getDb();
const applied = db.pragma('user_version', { simple: true });

if (applied >= files.length) {
  console.log(`Database schema is up to date (${applied} migrations) at ${databasePath}`);
} else {
  for (let version = applied; version < files.length; version += 1) {
    const name = files[version];
    console.log(`Applying ${name}`);

    // user_version cannot be parameterised, so the literal comes from the loop index.
    db.exec('BEGIN');
    try {
      db.exec(readFileSync(join(dir, name), 'utf8'));
      db.pragma(`user_version = ${version + 1}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  console.log(`Migrated to version ${files.length} at ${databasePath}`);
}
