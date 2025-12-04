FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/skeleton/package.json  ./packages/skeleton/
COPY packages/map/package.json ./package/map/

RUN pnpm i

COPY . ./

RUN pnpm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/.output/ ./

ENV PORT=80
ENV HOST=0.0.0.0

EXPOSE 80

CMD ["node", "/app/server/index.mjs"]
