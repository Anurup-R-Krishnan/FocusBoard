FROM node:20-slim

ENV NODE_ENV=production \
		WORKERS=8

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
	npm ci --omit=dev

COPY --chown=node:node . .

USER node

EXPOSE 5000

CMD ["node", "server.js"]
