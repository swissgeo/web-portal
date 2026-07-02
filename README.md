# SWISSGEO Web Portal

| Branch  | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| develop | ![Build Status](https://codebuild.eu-central-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoibU83d3BvUEVmWkhQamlIKzlQaWgvY0dtSWdmSU84R0gzU0gxTlhTcnVkQklrbVFaZWpyVjlpQzFBYUtWUXJBbnAzelp0eGlWQi9ISmFyand6NWYyemFNPSIsIml2UGFyYW1ldGVyU3BlYyI6ImF4aDZIenFoRHlJTnBKdmsiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=develop) [![codecov-develop](https://codecov.io/gh/swissgeo/web-portal/branch/develop/graph/badge.svg)](https://codecov.io/gh/swissgeo/web-portal) |
| main    | ![Build Status](https://codebuild.eu-central-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoibU83d3BvUEVmWkhQamlIKzlQaWgvY0dtSWdmSU84R0gzU0gxTlhTcnVkQklrbVFaZWpyVjlpQzFBYUtWUXJBbnAzelp0eGlWQi9ISmFyand6NWYyemFNPSIsIml2UGFyYW1ldGVyU3BlYyI6ImF4aDZIenFoRHlJTnBKdmsiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=main) [![codecov-main](https://codecov.io/gh/swissgeo/web-portal/branch/main/graph/badge.svg)](https://codecov.io/gh/swissgeo/web-portal)          |

This repository contains the frontend implementation for SWISSGEO, the future central geodata platform for Switzerland.

> [!IMPORTANT]
> This project is currently under active development. Features and documentation are subject to frequent changes.

## Project Context

SWISSGEO is the upcoming unified hub for Swiss geospatial data, merging federal and cantonal services (geo.admin.ch, geodienste.ch, geocat.ch) into a single, modern infrastructure.

### ℹ️ Resources

Project overview: [Official SWISSGEO Platform info in German](https://www.geoinformation.ch/de/swissgeo-geoplattform) or [French Version here](https://www.geoinformation.ch/fr/swissgeo-geoplateforme) (FR)

## Quick-Start

Install all the dependencies:

```sh
pnpm install
```

Compile the sub-packages in watch mode (terminal 1):

```sh
pnpm turbo build:dev:watch
```

Run the dev server for coding (terminal 2):

```sh
pnpm run dev
```

## Environment Variables

Before running the dev server, copy the example file and fill in the values:

```sh
cp packages/main/.env.example packages/main/.env
```

The available variables are:

```sh
NUXT_PUBLIC_OGC_API_ENDPOINT=   # OGC API endpoint (exposed to client)
NUXT_PUBLIC_WANTED_LOG_LEVELS=  # String of log levels wanted (error|warn|info|debug)
NUXT_PUBLIC_SHARE_SERVICE_URL=  # The URL to the share service
NUXT_WHAT3WORDS_API_KEY=        # what3words API key (server-only)
NUXT_GEOADMIN_API_BASE_URL=     # Base URL for legacy geo.admin.ch API (server-only)
```

## Monorepo setup

This project is structed as a monorepo. There are several sub-packages, each with
a specific purpose. This way, the code is forced to stay cleaner and the various parts
have to be more abstracted.

The main entrypoint is the `main` package. It contains the necessary nuxt setup to provide
the final application.

The `layers` package handles the addition of layers to the application. The intention of this
package is to keep it as stupid as possible: don't add anything map related to this.

The `map` package's purpose is to display map. As of now, this means all the required code
to fetch the data to create an openlayers map.

Since we still have to share some types and data structures across the packages, there is a package `shared` for that.

The `skeleton` package contains UI elements and things that are not specific to a specific page/view of the app.

In the future, we'll have `content` from a CMS in this webapp. This package takes care of that.

## Docker

A `Dockerfile` is provided to build and run the application in a container. It accepts a `TARGET_ENV` build argument (`prod` by default).

**Build the image:**

```sh
# build with source maps
pnpm run docker:build:dev

# build without source maps
pnpm run docker:build:prod
```

**Run the container:**

```sh
# with source maps
pnpm run docker:run:dev

# or without source maps
pnpm run docker:run:prod
```

The app will be available at `http://localhost:3000`.

> **Note:** Environment variables (`NUXT_API_ENDPOINT`, `NUXT_AUTH_TOKEN`, `NUXT_MAPTILER_API_KEY`, etc.) must be set at runtime via `-e` flags or an env file — do not bake secrets into the image.

## Turbo

The repo makes use of [Turbo](https://turborepo.dev/), a supercharger for monorepos. Turbo caches the outcome of certain scripts and won't re-run it if its not needed.

What you can do is, instead of just using `pnpm run build|lint|format|type-check` is to use `pnpm turbo build|lint|format|type-check`.
This will engage the wrapper and make use of these functionalities and speed up your workflow!

## Integration tests

Integration tests live in `tests/integration/` and use [Playwright](https://playwright.dev/). They verify that UI components work together correctly (sidebar, map canvas, toolbox, locale routing) without depending on real external services — all outgoing API requests are mocked via `page.route()`.

The first time you run them locally, install the browser binary:

```sh
pnpm exec playwright install --with-deps chromium
```

Then build the library packages (the Nuxt dev server imports them from their `dist/` output):

```sh
pnpm build:dev
```

Run the tests:

```sh
pnpm test:integration
```

Playwright auto-starts the Nuxt dev server on `http://localhost:3000`. If you already have `pnpm run dev` running, it will reuse that server.

> **Note:** The first page load in dev mode can take 30–45s while Vite compiles modules on demand. Subsequent test runs in the same session are fast thanks to HMR.

**In CI** (AWS CodeBuild) the tests run against a production preview (`pnpm --filter main preview`) after a full `pnpm build`, which avoids the dev-mode cold-start delay. The Playwright config switches automatically when `CI=true` is set.
