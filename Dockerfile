# syntax=docker/dockerfile:1
FROM node:24-alpine AS build
ARG TARGET_ENV="prod"
ARG GIT_HASH="unknown"
WORKDIR /app
RUN echo "Building for '$TARGET_ENV'"

RUN corepack enable

COPY --exclude=node_modules . ./

RUN pnpm install --frozen-lockfile
RUN GIT_COMMIT=${GIT_HASH} pnpm run build:${TARGET_ENV}

FROM node:24-alpine

WORKDIR /app

COPY --from=build app/packages/main/.output/ ./

ENV PORT=80
ENV HOST=0.0.0.0

EXPOSE 80

CMD ["node", "/app/server/index.mjs"]
