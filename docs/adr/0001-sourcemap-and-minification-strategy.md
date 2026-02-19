# ADR 0001: Sourcemap and Minification Strategy

- Status: Proposed
- Date: 2026-02-19
- Deciders: ?

## Context

We need a consistent, secure, and developer-friendly approach for build output across all packages and the main Nuxt application.

The desired behavior differs between local development and production:

| **Feature**     | **Local / Dev**                      | **Production**                      |
| --------------- | ------------------------------------ | ----------------------------------- |
| **Minify**      | `false` (Fast builds, readable code) | `true` (Performance, smaller files) |
| **Source Maps** | `true` (Essential for debugging)     | `false` (Security/IP protection)    |

This behavior is now centralized in a shared base Vite configuration and reused across Vite package configs. In addition, the Nuxt app explicitly enables sourcemaps only outside production.

Current implementation references:

- `base.vite.config.ts`: `getBaseBuildConfig(mode)` defines `minify` and `sourcemap` defaults by mode.
- Package Vite configs (e.g. `packages/layers/vite.config.ts`) spread the base build config via `...getBaseBuildConfig(mode)`.
- `packages/main/nuxt.config.ts` configures:
  - `sourcemap.server = process.env.NODE_ENV !== 'production'`
  - `sourcemap.client = process.env.NODE_ENV !== 'production'`

## Decision

We adopt the following baseline policy for all build targets in this repository:

1. Development builds:
   - No minification.
   - Sourcemaps enabled.
2. Production builds:
   - Minification enabled.
   - Sourcemaps disabled by default.
3. Shared configuration:
   - Keep minification/sourcemap defaults centralized in `base.vite.config.ts` for Vite package builds.
   - Mirror the same production-safe sourcemap policy in Nuxt configuration.
4. Production debugging strategy:
   - If production stack-trace symbolication is required, use a controlled sourcemap upload flow to an error-monitoring platform such as Sentry.
   - Reference: https://docs.sentry.io/platforms/javascript/sourcemaps/

## Consequences

### Positive

- Faster and easier local debugging with readable output and sourcemaps.
- Reduced production bundle size and better runtime performance through minification.
- Lower risk of exposing source internals publicly by disabling public sourcemaps in production.
- Consistent behavior across package builds through shared base configuration.

### Trade-offs

- Production debugging is less convenient without symbolication tooling.
- Additional CI/CD setup is needed if using private sourcemap upload (e.g., Sentry release pipeline).

## Follow-up

- Optional: add a CI step for private sourcemap upload for release builds (e.g., Sentry) while keeping public sourcemaps disabled.
