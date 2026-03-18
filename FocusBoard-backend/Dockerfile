FROM oven/bun:1-slim

ENV NODE_ENV=production \
    WORKERS=2

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY --chown=bun:bun . .

USER bun

EXPOSE 5000

CMD ["bun", "run", "server.js"]
