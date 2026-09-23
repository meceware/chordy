FROM node:26-alpine AS builder
WORKDIR /app

# git is needed because @tombatossals/react-chords is a pinned git dependency: version 1.1.0,
# the one whose peer react is 19, was never published to npm.
RUN apk add --no-cache git

COPY package.json package-lock.json ./
# --ignore-scripts because better-sqlite3 ships a prebuilt binary for musl in its tarball, but
# carries a binding.gyp too, so npm would run node-gyp and fail for want of a Python toolchain —
# compiling something that is already sitting in prebuilds/.
RUN npm ci --ignore-scripts

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:26-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/app/data/chordy.db

COPY --from=builder /app/.next/standalone ./
# Neither of these is part of the standalone bundle, by design: static assets are served from
# disk and public/ is never traced.
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# better-sqlite3 resolves its prebuilt binary through a path it computes at runtime, which
# @vercel/nft cannot follow, so the traced bundle omits prebuilds/ and the first query fails with
# "Cannot find module .../linuxmusl-x64.node". Copying the package whole settles it.
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Read with fs at runtime by the migration runner, so they cannot be bundled either.
COPY migrations ./migrations
COPY scripts ./scripts
COPY src/lib/db.js ./src/lib/db.js
COPY src/components/config.js ./src/components/config.js

COPY scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && mkdir -p /app/data && chown -R node:node /app/data

USER node
EXPOSE 3000
VOLUME /app/data

ENTRYPOINT ["./entrypoint.sh"]
