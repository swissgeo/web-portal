# SWISSGEO Web Portal

This repository contains the frontend implementation for SWISSGEO, the future central geodata platform for Switzerland.

> [!IMPORTANT]
This project is currently under active development. Features and documentation are subject to frequent changes.

## Project Context

SWISSGEO is the upcoming unified hub for Swiss geospatial data, merging federal and cantonal services (geo.admin.ch, geodienste.ch, geocat.ch) into a single, modern infrastructure.

### ℹ️ Resources

Project overview:  [Official SWISSGEO Platform info in German](https://www.geoinformation.ch/de/swissgeo-geoplattform) or [French Version here](https://www.geoinformation.ch/fr/swissgeo-geoplateforme) (FR)

## Quick-Start

Install all the dependencies:

```sh
pnpm install
```

Compile the sub-packages in watch mode:

```sh
pnpm build:dev:watch
```

Run the dev server for coding

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
NUXT_MAPTILER_API_KEY=          # MapTiler API key (server-only)
```

Optional server-only variables:

```sh
NUXT_API_ENDPOINT=              # Backend API endpoint
NUXT_AUTH_TOKEN=                # Authentication token
NUXT_PUBLIC_OVERLAY_ID=         # Map overlay identifier
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
docker build -t swissgeo-app .

# Or explicitly set the target environment
docker build --build-arg TARGET_ENV=prod -t swissgeo-app .
```

**Run the container:**

```sh
docker run -p 8080:80 swissgeo-app
```

The app will be available at `http://localhost:8080`.

> **Note:** Environment variables (`NUXT_API_ENDPOINT`, `NUXT_AUTH_TOKEN`, `NUXT_MAPTILER_API_KEY`, etc.) must be set at runtime via `-e` flags or an env file — do not bake secrets into the image.
>
> ```sh
> # Pass variables individually
> docker run -p 8080:80 \
>   -e NUXT_API_ENDPOINT=https://... \
>   -e NUXT_AUTH_TOKEN=... \
>   -e NUXT_MAPTILER_API_KEY=... \
>   swissgeo-app
>
> # Or use a .env file (copy packages/main/.env.example and fill in the values)
> docker run -p 8080:80 --env-file packages/main/.env swissgeo-app
> ```
