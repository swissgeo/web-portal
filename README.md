# SWISSGEO WEB-APP

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

The `skeleton` package contains basic UI elements. Everything that isn't specific to a
certain feature should go here.

In the future, we'll have `content` from a CMS in this webapp. This package takes care of that.
