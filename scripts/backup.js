import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getDb, databasePath } from '../src/lib/db.js';

const KEEP = 14;

const directory = join(dirname(databasePath), 'backups');
mkdirSync(directory, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const target = join(directory, `chordy-${stamp}.db`);

// better-sqlite3's online backup, not a file copy: under WAL the most recent commits live in the
// -wal file, so copying the .db alone yields a database that is silently behind.
await getDb().backup(target);
console.log(`Wrote ${target}`);

const stale = readdirSync(directory)
  .filter((name) => name.startsWith('chordy-') && name.endsWith('.db'))
  .sort()
  .slice(0, -KEEP);

for (const name of stale) {
  rmSync(join(directory, name));
  console.log(`Removed ${name}`);
}
