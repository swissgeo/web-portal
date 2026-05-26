# SERVICE-SHORTLINK-MOCK

## About

This is a simple script that mocks a `service-shortlink` since that's not already available.
It provides two simple endpoints:

- `POST /`
- `GET /?state=<HASH>`

The POST endpoint receives a JSON file, creates a sha256 hash and writes that to `/tmp/service-shortlink/${hash}`
The GET endpoint expects a query param `state` providing a hash. Based on the hash it will return the config that was saved with that hash.

## Quickstart

`pnpm run serve`
