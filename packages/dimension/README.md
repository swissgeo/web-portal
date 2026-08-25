# @swissgeo/dimension

Dimension state and time-slider UI for SWISSGEO projects.

## Overview

This package owns the concept of a **dimension** on a layer — today, only the
`"time"` dimension — and provides the UI to let the user navigate it.

It is the single source of truth for dimension state: a Pinia store keyed by
**layer uuid**, plus the `Dimension` / `DimensionId` / `DimensionRecord` types
that describe the data shape. On top of the store it ships a `TimeSlider` Vue
component (the slider the user drags to pick a year) and a set of pure time
utilities (year parsing, formatting, year/data intersection).

### Why a dedicated package?

Dimensions are conceptually owned by this package, not by the source list within **`@.swissgeo/layers`** package.
Keeping them in a dedicated, self-sufficient package lets the layers package
stay free of map-related concerns and lets the dimension model evolve
independently. This package therefore has **no dependency on `@swissgeo/layers`**
— it speaks in layer uuids, not `Layer` objects, so it can be consumed by any
host that tracks layers by uuid.

## Installation

```bash
npm install @swissgeo/dimension
```

See [Dependencies](#dependencies) and [Peer Dependencies](#peer-dependencies)
for what the host must provide.

## Features

- **Types**: `Dimension`, `DimensionId` (currently `"time"` only, but shaped to
  accept more), `DimensionRecord`.
- **Store**: `useDimensionsStore` — uuid-keyed dimension state with merge
  semantics, init/restore, cleanup, and reset.
- **Component**: `TimeSlider` — the year slider UI with play/pause, drag,
  keyboard, and direct store read/write.
- **Time utilities**: parsing of geoadmin timestamp formats (`YYYY`,
  `YYYYMMDD`, `YYYY-MM-DD`, ISO 8601), year-to-timestamp conversion, and
  display-name formatting.
- **Slider utilities**: `getYearsWithData` — splits the available timestamps of
  multiple layers into years shared by all (`yearsJoint`) vs. years exclusive
  to some (`yearsSeparate`).

## Usage

### The store

The store is a setup-syntax Pinia store keyed by layer uuid. An absent key
means the layer has no dimension set.

| Member                   | Kind   | Description                                                                      |
| ------------------------ | ------ | -------------------------------------------------------------------------------- |
| `dimensionsByLayer`      | state  | `Record<uuid, DimensionRecord>` — the source of truth.                           |
| `getDimensions(uuid)`    | getter | Returns the layer's `DimensionRecord`, or `undefined` if it has none.            |
| `getLayersWithDimension` | getter | Uuids of layers that currently carry the given dimension.                        |
| `setDimension`           | action | Merges a `Partial<Dimension>` over the existing entry (`uuid`-first).            |
| `setLayerDimensions`     | action | Replaces the full `DimensionRecord` for a layer (used by the state import path). |
| `clearLayerDimensions`   | action | Removes a layer's entry. Call alongside `layerStore.removeLayer`.                |
| `$reset`                 | action | Clears all entries.                                                              |

### The `TimeSlider` component

The component reads which layers have a `"time"` dimension directly from
`useDimensionsStore` (it takes no layer prop), and writes the selected year
back to the store via `setDimension`. It emits:

- `close` — when no time-enabled layers remain.
- `update-visibility` — `{ uuid, isVisible }` when a layer has no data for the
  selected year (so the host can hide it).

It supports drag, click-to-select, keyboard arrows, manual year entry, and a
play/pause animation that steps through the years that actually have data.

## Dependencies

Internal SWISSGEO workspace packages this package builds on:

| module              | provides                                                          |
| ------------------- | ----------------------------------------------------------------- |
| `@swissgeo/log`     | Structured logging (the store logs through it, never `console.*`) |
| `@swissgeo/numbers` | `round` (slider label spacing) and `isTimestampYYYYMMDD`          |

## Peer Dependencies

This package requires the host to provide:

- `pinia` — the store is a `defineStore` setup-syntax store.
- `vue` — `ref` / `computed` / SFCs.
- `vue-i18n` — the slider bar uses `useI18n()` for labels and tooltips.
- `@vueuse/core` — `useDebounceFn` and `useResizeObserver` in `TimeSlider.vue`.
- `@lucide/vue` — icons referenced via Nuxt UI / `UIcon`.
- `@nuxt/ui` — `UButton` provides the time-slider control.

## License

BSD-3-Clause

## Repository

[https://github.com/swissgeo/web-portal](https://github.com/swissgeo/web-portal)
