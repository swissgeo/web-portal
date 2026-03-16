###########################################################
# Container that contains basic configurations used by all other containers
# It should only contain variables that don't change or change very infrequently
# so that the cache is not needlessly invalidated
FROM node:24-alpine AS base
ENV PORT=3000
ENV HOST=0.0.0.0
ENV USER=swissgeo
ENV GROUP=swissgeo
ENV INSTALL_DIR=/app
ENV BUILD_DIR=/build

RUN    addgroup -S ${GROUP} \
    && adduser -G ${GROUP} -S ${USER}

###########################################################
# Builder container
FROM base AS builder

WORKDIR ${BUILD_DIR}

RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile

###########################################################
# Builder dev container
FROM builder AS builder-dev

ARG VERSION=unknown
ARG GIT_HASH=unknown
ARG GIT_BRANCH=unknown
ARG GIT_DIRTY=""
ARG AUTHOR=unknown
LABEL git.hash=$GIT_HASH
LABEL git.branch=$GIT_BRANCH
LABEL git.dirty="$GIT_DIRTY"
LABEL author=$AUTHOR
LABEL version=$VERSION

RUN GIT_COMMIT=${GIT_HASH} VERSION=${VERSION} pnpm run build:dev

###########################################################
# Builder prod container
FROM builder AS builder-prod

ARG VERSION=unknown
ARG GIT_HASH=unknown
ARG GIT_BRANCH=unknown
ARG GIT_DIRTY=""
ARG AUTHOR=unknown
LABEL git.hash=$GIT_HASH
LABEL git.branch=$GIT_BRANCH
LABEL git.dirty="$GIT_DIRTY"
LABEL author=$AUTHOR
LABEL version=$VERSION

RUN GIT_COMMIT=${GIT_HASH} VERSION=${VERSION} pnpm run build:prod

###########################################################
# Container to use in dev
FROM base AS dev
LABEL target=dev

ARG VERSION=unknown
ARG GIT_HASH=unknown
ARG GIT_BRANCH=unknown
ARG GIT_DIRTY=""
ARG AUTHOR=unknown
LABEL git.hash=$GIT_HASH
LABEL git.branch=$GIT_BRANCH
LABEL git.dirty="$GIT_DIRTY"
LABEL author=$AUTHOR
LABEL version=$VERSION

COPY --chown=${USER}:${GROUP} --from=builder-dev ${BUILD_DIR}/packages/main/.output/ ${INSTALL_DIR}/

USER ${USER}
EXPOSE ${PORT}
WORKDIR ${INSTALL_DIR}
ENTRYPOINT ["node", "server/index.mjs"]

###########################################################
# Container to use in prod
FROM base AS prod
LABEL target=prod

ARG VERSION=unknown
ARG GIT_HASH=unknown
ARG GIT_BRANCH=unknown
ARG GIT_DIRTY=""
ARG AUTHOR=unknown
LABEL git.hash=$GIT_HASH
LABEL git.branch=$GIT_BRANCH
LABEL git.dirty="$GIT_DIRTY"
LABEL author=$AUTHOR
LABEL version=$VERSION

COPY --chown=${USER}:${GROUP} --from=builder-prod ${BUILD_DIR}/packages/main/.output/ ${INSTALL_DIR}/

USER ${USER}
EXPOSE ${PORT}
WORKDIR ${INSTALL_DIR}
ENTRYPOINT ["node", "server/index.mjs"]
