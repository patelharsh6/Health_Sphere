# ── Build stage: install production dependencies only ──────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy manifests first so `npm ci` is cached whenever only source changes.
COPY package.json package-lock.json ./

# `npm ci --omit=dev` installs exactly the lockfile, without jest and friends.
RUN npm ci --omit=dev && npm cache clean --force

# ── Runtime stage ──────────────────────────────────────────────
FROM node:20-alpine AS runtime

# dumb-init gives the app a real PID 1, so SIGTERM from `docker stop` reaches
# node instead of being swallowed and turning into a SIGKILL ten seconds later.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY src ./src

# Uploads and logs are written at runtime. They are declared as volumes in
# compose; creating them here means the app works even without a mount.
RUN mkdir -p uploads/avatars logs \
    && chown -R node:node /app

# Never run as root.
USER node

EXPOSE 5000

# The API already exposes a health endpoint; reuse it rather than guessing.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
