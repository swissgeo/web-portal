# SWISSGEO Web Portal

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

Compile the sub-packages in watch mode:

```sh
pnpx turbo build:dev:watch
```

Run the dev server for coding

```sh
pnpx run dev
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

What you can do is, instead of just using `pnpm run build|lint|format|type-check` is to use `pnpx turbo build|lint|format|type-check`. 
This will engage the wrapper and make use of these functionalities and speed up your workflow!
