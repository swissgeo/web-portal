FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable

COPY --exclude=node_modules . ./

RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:24-alpine

WORKDIR /app

COPY --from=build app/packages/main/.output/ ./

ENV PORT=80
ENV HOST=0.0.0.0

EXPOSE 80

CMD ["node", "/app/server/index.mjs"]
