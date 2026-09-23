#!/bin/sh
set -e

# Migrations run here rather than on import: at container start there is exactly one process
# doing it, where module-level migration would race across request workers and during the build.
node scripts/migrate.js

exec node server.js
