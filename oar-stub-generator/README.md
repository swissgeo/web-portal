# OGC API Records Stub Generator

`records.py` allows to generate an OGC API Records compatible json. It can harvest
various sources and merge its content into a format that is (mostly) conforming
to OGC API Records standard. This file can be used as a stub for the answer coming
from a `/oar/v1/collections/swissgeocatalog/items` endpoint.

It's purely file-based and uses TinyDB to manage entries in json files. This
is very simple but not very performant.

## Setup

1. Invoke `uv sync` to setup the packages and environment
2. Use `uv run records.py` to invoke the command

## Generate an `ogc-api-records.json` stub

`records.py` has four subcommands and the steps to produce a records json file are

- `harvest`: download files
- `import`: import downloaded files into the database
- `merge`: merge all the local content
- `export`: write the merged content into a `ogc-api-records.json` file

`./records.py --help` gives more information.

## Serve local directory via http

If you want to serve this file via http, you can start a simple webserver
that serves local directory with e.g.

```python
python3 -m http.server 8888
```
