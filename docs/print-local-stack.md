# Running the print stack locally

The print flow is: portal → print API → renderer → PDF (see "Printing" in the README). The script
`scripts/print/print-local-stack.sh` runs all of it on localhost, so print changes can be tried without
deploying anything. [moto](https://github.com/getmoto/moto) (one Docker container) replaces DynamoDB,
SQS and S3. The state service stays the deployed dev one, so the machine needs internet access.

## Prerequisites

`docker` (with the compose plugin), `uv`, `git`, `curl`, `node`, `ss` and Google Chrome at
`/usr/bin/google-chrome` (the renderer uses it).

## Usage

```sh
scripts/print/print-local-stack.sh up              # clones and starts everything, builds the portal once
scripts/print/print-local-stack.sh status
scripts/print/print-local-stack.sh rebuild-portal  # after code changes, then `up` again
scripts/print/print-local-stack.sh down
```

- `service-print-api` and `service-print-renderer` are cloned next to `web-portal` (`REPOS` changes the
  directory).
- The portal runs as a production build on port 3000 (`PORTAL_PORT`), the API on 8000 (`API_PORT`).
  The script only stops what it started.
- The `.env` of web-portal is not touched: the settings are passed in the environment of the process.
- Open http://localhost:3000/en/map, use "Open Print Panel" in the debug bar and send a print request.
  The API returns the old job for an identical payload (24 h), so change the scale or format to render again.
- Logs are in `~/.local/state/print-local-stack`.

## Limits

The renderer opens the portal at `PORTAL_URL`, which the script sets to the local portal. A deployed
renderer loads the deployed portal, so a PDF shows a portal change only after that portal is deployed.
