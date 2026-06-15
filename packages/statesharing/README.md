# State Sharing Module

## Purpose

Provides types, Zod validators and the version constant for the app state sharing API. The HTTP client is generated from the OpenAPI spec via [Hey API](https://heyapi.dev), see `openapi-ts.config.ts`.

All HTTP calls go through Nuxt server proxy routes (`packages/main/server/api/wpa/v1/state/`) to avoid CORS. The generated client itself is not called directly from the browser.

## Regenerating the types and validators

The types and validators (zod) are generated from the OpenAPI spec served by the state service. The URL is read from `NUXT_SHARE_SERVICE_URL` (falling back to the dev endpoint), so it stays in sync with the runtime config:

```sh
# defaults to https://www.dev.sgdi.tech/api/wps/v1/state
pnpm --filter @swissgeo/statesharing generate-types

# target a different environment
NUXT_SHARE_SERVICE_URL=https://www.prod.sgdi.tech/api/wps/v1/state pnpm --filter @swissgeo/statesharing generate-types

pnpm --filter @swissgeo/statesharing build
```

## Dependencies

| module | provides                  |
| ------ | ------------------------- |
| `zod`  | Runtime schema validation |

## Exposed Members

| member                     | type      | description                                                              |
| -------------------------- | --------- | ------------------------------------------------------------------------ |
| `APP_STATE_CONFIG_VERSION` | constant  | Current version of the state payload format                              |
| `ReadAppStateValidator`    | validator | Zod schema to validate the GET `/state/{stateId}` response               |
| `SaveAppStateValidator`    | validator | Zod schema to validate the POST `/state` request body                    |
| `StatePayloadValidator`    | validator | Zod schema to validate and parse a raw app state object (`StateV1Input`) |
| `SaveAppStateResponse`     | validator | Zod schema to validate the POST `/state` response                        |
| `SaveAppState`             | type      | POST request body type                                                   |
| `GetAppState`              | type      | GET response type                                                        |
| `AppState`                 | type      | Core app state (`StateV1Input`): map position + layers                   |
| `LayerState`               | type      | Output representation of a single layer in the state                     |
| `LayerStateInput`          | type      | Input representation of a single layer in the state                      |
| `MapState`                 | type      | Map position (center, zoom, rotation)                                    |
