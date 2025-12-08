#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import sys
from typing import List
from tinydb import TinyDB, Query

import requests

db = TinyDB('db.json', sort_keys=True, indent=4)
# db.insert({'name': 'John', 'age': 22})
table_records = db.table('records')

harvest_db = TinyDB('harvest_db.json', sort_keys=True, indent=4)
table_layersconfig = harvest_db.table('layersconfig')
table_mapserverlayers = harvest_db.table('mapserverlayers')
# table.insert({'value': True})


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="records.py",
        description=
        "Harvest data from various source APIs, store them in a local database and convert them to the OGC API Records format.",
    )

    # Positional arguments
    # p.add_argument("files",
    #                nargs="*",
    #                type=Path,
    #                help="One or more input files (optional)")

    # Optional flags and options
    p.add_argument("-v",
                   "--verbose",
                   action="count",
                   default=0,
                   help="Increase verbosity (use -vv for more verbose output)")
    # p.add_argument("-n",
    #                "--number",
    #                type=int,
    #                default=1,
    #                help="A numeric option (default: 1)")
    # p.add_argument("--config", type=Path, help="Path to config file")
    # p.add_argument("--dry-run",
    #                action="store_true",
    #                help="Show actions without making changes")

    # Sub-commands example
    sub = p.add_subparsers(dest="command", required=False, help="Sub-commands")

    harvest = sub.add_parser("harvest",
                             help="Download data files from various sources")

    imp = sub.add_parser(
        "import", help="Import the source APIs into a local database (TinyDB)")
    # imp.add_argument(
    #     "--from",
    #     choices=["layersConfig", "geodienste"],
    #     #    default="safe",
    #     help="imping Source")
    # imp.add_argument("--task", required=True, help="Task name to imp")
    # imp.add_argument("--repeat",
    #                  type=int,
    #                  default=1,
    #                  help="How many times to imp")

    merge = sub.add_parser(
        "merge",
        help="Merge and convert data in the database to OGC API Records format"
    )

    export = sub.add_parser(
        "export",
        help="Export data in the database to OGC API Records format file")
    # convert.add_argument("--pattern",
    #                      default="convert_*.py",
    #                      help="Which converts to run")

    return p


def main(argv: List[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    parser = build_parser()
    args = parser.parse_args(argv)

    # Show parsed arguments (useful for debugging)
    if args.verbose:
        print("Debug: parsed args =", args)

    # Handle sub-commands
    if args.command == "harvest":
        return do_harvest(args)
    if args.command == "import":
        return do_import(args)
    if args.command == "merge":
        return do_merge(args)
    if args.command == "export":
        return do_export(args)

    # Default behavior (no subcommand)
    return parser.print_help()


def _get_wms_url_dict() -> dict:
    return {
        'BASE_URL': '{base_url}',
        'SERVICE': '{service}',
        'REQUEST': '{request}',
        'VERSION': '{version}',
        'LAYERS': '{layer}',
        'STYLES': '',
        'FORMAT': 'image/{image_type}',
        'CRS': '{crs}',
        'BBOX': '{bbox}',
        'WIDTH': '{width}',
        'HEIGHT': '{height}',
        'TRANSPARENT': '{transparent}',
    }


def _get_wms_url_template() -> str:
    return "{BASE_URL}?\
SERVICE={SERVICE}\
&REQUEST={REQUEST}\
&VERSION={VERSION}\
&LAYERS={LAYERS}\
&STYLES={STYLES}\
&FORMAT={FORMAT}\
&CRS={CRS}\
&BBOX={BBOX}\
&WIDTH={WIDTH}\
&HEIGHT={HEIGHT}\
&TRANSPARENT={TRANSPARENT}"


def _get_geoadmin_wms_link(
        image_type: str,
        layer: str,
        wms_base_url: str = "https://wms.geo.admin.ch/") -> dict:
    wms_url_dict = _get_wms_url_dict()
    if wms_base_url[-1] != '/':
        wms_base_url += '/'
    wms_url_dict['BASE_URL'] = wms_base_url
    wms_url_dict['SERVICE'] = "WMS"
    wms_url_dict['REQUEST'] = "GetMap"
    wms_url_dict['FORMAT'] = f"image/{image_type}"
    wms_url_dict['VERSION'] = "1.3.0"
    wms_url_dict['TRANSPARENT'] = 'true' if image_type == 'png' else 'false'
    wms_url_dict['LAYERS'] = layer

    return {
        'type': f'image/{image_type}',
        "title": "OGC Web Map Service (WMS)",
        "templated": True,
        "protocol": "OGC:WMS",
        "uriTemplate": _get_wms_url_template().format(**wms_url_dict),
        "variables": {
            "crs": {
                "description": "Coordinate Reference System",
                "type": "string",
                "enum": ["EPSG:2056", "EPSG:21781", "EPSG:4326"]
            },
            "bbox": {
                "description": "Bounding Box (minx,miny,maxx,maxy)",
                "type": "array",
                "items": {
                    "type": "number",
                    "format": "double"
                },
                "minItems": 4,
                "maxItems": 4
            },
            "width": {
                "description": "Image width in pixels",
                "type": "number",
                "format": "integer",
                "minimum": 1,
                "maximum": 4096
            },
            "height": {
                "description": "Image height in pixels",
                "type": "number",
                "format": "integer",
                "minimum": 1,
                "maximum": 4096
            }
        }
    }


def _get_wmts_url_dict() -> dict:
    return {
        'BASE_URL': '{base_url}',
        'ProtocoleVersion': '{ProtocoleVersion}',
        'LayerName': '{LayerName}',
        'Stylename': '{Stylename}',
        'Time': '{Time}',
        'TileMatrixSet': '{TileMatrixSet}',
        'TileSetId': '{TileSetId}',
        'TileRow': '{TileRow}',
        'TileCol': '{TileCol}',
        'FormatExtension': '{FormatExtension}',
    }


def _get_wmts_url_template() -> str:
    # <Scheme>://<ServerName>/<ProtocoleVersion>/<LayerName>/<Stylename>/<Time>/<TileMatrixSet>/<TileSetId>/<TileRow>/<TileCol>.<FormatExtension>
    return "{BASE_URL}/\
{ProtocoleVersion}/\
WMTSCapabilities.xml?lang=de"


def _get_geoadmin_wmts_link(
        layer: str,
        image_type: str,
        wmts_base_url: str = "https://wmts.geo.admin.ch") -> dict:
    #  {
    #     'type': 'application/vnd.ogc.wmts_xml',
    #     "title": "OGC Web Map Tile Service (WMTS)",
    #     "href":
    #     f"https://wmts.geo.admin.ch/1.0.0/WMTSCapabilities.xml?layer={layer}",
    # }

    wmts_url_dict = _get_wmts_url_dict()
    if wmts_base_url[-1] == '/':
        wmts_base_url = wmts_base_url[:-1]
    wmts_url_dict['BASE_URL'] = wmts_base_url
    wmts_url_dict['ProtocoleVersion'] = "1.0.0"
    # wmts_url_dict['LayerName'] = layer
    # wmts_url_dict['Stylename'] = "default"
    # wmts_url_dict['Time'] = "current"
    # wmts_url_dict['TileMatrixSet'] = "2056"
    # wmts_url_dict['FormatExtension'] = image_type

    link = {
        'type': 'application/vnd.ogc.wmts_xml',
        'rel': 'item',
        'protocol': 'OGC:WMTS',
        "title": "OGC Web Map Tile Service (WMTS)",
        "uriTemplate": _get_wmts_url_template().format(**wmts_url_dict),
        "templated": True,
        "variables": {}
    }
    return link


# ##########################################################################
# Harvest functions
# ##########################################################################
def do_harvest(args) -> int:
    harvest_layersconfig(args)
    harvest_mapserverlayers(args)
    return 0


def harvest_layersconfig(args):
    print("Harvesting from layersConfig source...")

    response = requests.get(
        "https://api3.geo.admin.ch/rest/services/all/MapServer/layersConfig?lang=en",
        timeout=30)
    layers = response.json()
    with open("layersConfig_en.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(layers, indent=2, ensure_ascii=False))


def harvest_mapserverlayers(args):
    # https://api3.geo.admin.ch/rest/services/api/MapServer
    print("Harvesting from mapserverlayers source...")
    response = requests.get(
        "https://api3.geo.admin.ch/rest/services/api/MapServer?lang=en",
        timeout=30)
    mapserverlayers = response.json()
    with open("mapserverlayers_en.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(mapserverlayers, indent=2, ensure_ascii=False))


# ##########################################################################
# Import functions
# ##########################################################################
def do_import(args) -> int:
    import_layersconfig(args)
    import_mapserverlayers(args)
    return 0


def import_layersconfig(args) -> int:
    print("Importing layersConfig...")

    with open("layersConfig_en.json", "r", encoding="utf-8") as f:
        layers = json.loads(f.read())

    for layername, layer in layers.items():
        layer['id'] = layername
        table_layersconfig.upsert(layer, Query().id == layername)

    return 0


def import_mapserverlayers(args) -> int:
    print("Importing MapServer layers...")

    with open("mapserverlayers_en.json", "r", encoding="utf-8") as f:
        mapserverlayers = json.loads(f.read())

    for layer in mapserverlayers["layers"]:
        layer_id = layer.get('layerBodId', None)
        layer['id'] = layer_id
        table_mapserverlayers.upsert(layer, Query().id == layer_id)

    return 0


# ##########################################################################
# Import functions
# ##########################################################################
def do_merge(args) -> int:
    print("Merging data to OGC API Records format...")

    for _idx, layer in enumerate(table_mapserverlayers.all()):
        # if _idx > 10:
        #     break
        print(layer['id'])

        layer_id = layer.get('layerBodId', None)
        layersconfig_entry = table_layersconfig.get(Query().id == layer_id)
        if not layersconfig_entry:
            print(f"++++ WARNING: layer {layer_id} not found in layersconfig")
            continue

        record = {}
        record['id'] = layer_id
        record['geocatId'] = layer.get('idGeoCat', None)

        # Language
        # TODO: generalize to support multiple languages
        record['language'] = {"code": "en", "name": "English", "dir": "ltr"}

        # Add properties
        properties = {}
        properties['type'] = 'dataset'

        # Contact
        contact_name = layer['attributes'].get('dataOwner', None)
        if not contact_name:
            print(f"++++ WARNING: layer {layer_id} has no contact info")
        else:
            contact = {"name": contact_name}
            contact['country'] = 'CH'
            if 'attributionUrl' in layersconfig_entry:
                contact['links'] = [{
                    'type':
                    'text/html',
                    'title':
                    'Attribution',
                    'href':
                    layersconfig_entry['attributionUrl'],
                    'rel':
                    'about'
                }]
        properties['contacts'] = [contact]

        # Attribution is not part of OGC API Records standard
        # but exists as stac extension
        # https://github.com/stac-extensions/attribution
        properties['attribution'] = layer['attributes'].get(
            'attribution', "ERR:NO_ATTRIBUTION")

        # Opacity is not part of OGC API Records standard
        # we use the stac extension 'render'
        # https://github.com/stac-extensions/render
        if 'opacity' in layersconfig_entry:
            properties['renders'] = {
                "OGC:WMTS": {
                    'opacity': layersconfig_entry['opacity']
                }
            }

        # Description
        properties['description'] = layer['attributes'].get(
            'abstract', 'ERR:NO_DESCRIPTION')

        # Title
        if layer['name'] != layersconfig_entry['label']:
            print(
                f"++++ WARNING: layer {layer_id} name mismatch: {layer['name']} != {layersconfig_entry['label']}"
            )
        properties['title'] = layer.get('name', 'ERR:NO_TITLE')

        # Keywords

        # Links
        links = []
        if 'urlDetails' in layer['attributes']:
            links.append({
                'type': 'text/html',
                'title': 'Details',
                'href': layer['attributes']['urlDetails'],
                'rel': 'describedby'
            })

        if 'downloadUrl' in layer['attributes']:
            links.append({
                'type': 'text/html',
                'title': 'Download',
                'href': layer['attributes']['downloadUrl'],
                'rel': 'item',
                'protocol': 'OGC:STAC'
            })

        if layersconfig_entry['type'].lower() == 'wmts':
            links.append(
                _get_geoadmin_wmts_link(
                    wmts_base_url='https://wmts.geo.admin.ch/',
                    image_type=layersconfig_entry['format'].lower(),
                    layer=layersconfig_entry.get('serverLayerName', None)
                    or layer_id,
                ))
        links.append(
            _get_geoadmin_wms_link(
                wms_base_url=layer.get('wmsUrl', 'https://wms.geo.admin.ch/'),
                image_type='png',
                layer=layer.get('wmsLayers', None) or layer_id,
            ))

        # Construct record
        record['links'] = links
        record['properties'] = properties
        table_records.upsert(record, Query().id == layer_id)

    return 0


def do_run(args) -> int:
    print(
        f"Running task '{args.task}' {args.repeat} time(s). Mode={args.mode}")
    if args.dry_run:
        print("Dry-run: nothing will be changed.")
    # Implement the task here...
    return 0


def do_export(args) -> int:
    print("Export local data to OGC API Records file")

    records = {
        'type': 'FeatureCollection',
        'features': [],
    }

    for record in table_records.all():
        print(
            f"Record ID: {record['id']}, Title: {record['properties']['title']}"
        )
        records['features'].append(record)

    with open("ogc-api-records.json", "w", encoding="utf-8") as f:
        f.write(json.dumps(records, indent=2, ensure_ascii=False))

    return 0


def do_process_files(args) -> int:
    if not args.files:
        print("No input files provided. Use --help for usage.")
        return 2

    for path in args.files:
        exists = path.exists()
        print(
            f"{'VERBOSE: ' * (args.verbose>1)}Processing {path} (exists={exists})"
        )
        # Example: read file only if not dry-run
        if exists and not args.dry_run:
            content = path.read_text(encoding="utf-8")
            # pretend we process content depending on mode/number
            summary = content[:args.number * 80]
            if args.verbose:
                print(
                    f"  -> read {len(content)} bytes, summary: {repr(summary)[:80]}"
                )
        elif not exists:
            print(f"  Warning: {path} does not exist")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
