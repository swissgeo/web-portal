"""Switch one package's manifest from built dist/ output to source exports.

usage: python3 to_source.py <package dir> '<exports json>' [extra devDependency to drop ...]

  <exports json>  the new "exports" field, e.g. '{".": "./src/index.ts"}'

What it changes:
- package.json: "exports" replaced; "files", "main", "module", "types" removed;
  build-only scripts removed (build*, prepare, generate-types when it only
  emits declarations); build-only devDependencies removed.
- tsconfig.json: build config files removed from "include".

It doesn't delete files (vite/rolldown configs, dist/): do that separately.
"""

import json
import os
import re
import sys
from collections import OrderedDict

pkg = os.path.abspath(sys.argv[1])
new_exports = json.loads(sys.argv[2], object_pairs_hook=OrderedDict)
extra_drop = set(sys.argv[3:])

BUILD_DEV_DEPS = {
    "rolldown",
    "rolldown-plugin-dts",
    "unplugin-dts",
    "@microsoft/api-extractor",
} | extra_drop
BUILD_CONFIG_INCLUDES = {
    "rolldown.config.ts",
    "vite.config.ts",
    "../../base.vite.config.ts",
}

pj_path = os.path.join(pkg, "package.json")
data = json.load(open(pj_path), object_pairs_hook=OrderedDict)
data["exports"] = new_exports
for key in ("files", "main", "module", "types"):
    data.pop(key, None)

removed_scripts = []
for name, cmd in list(data.get("scripts", {}).items()):
    declaration_only = name == "generate-types" and "--declaration" in cmd
    if name == "build" or name.startswith("build:") or name == "prepare" or declaration_only:
        removed_scripts.append(name)
        del data["scripts"][name]

removed_deps = []
for name in list(data.get("devDependencies", {})):
    if name in BUILD_DEV_DEPS:
        removed_deps.append(name)
        del data["devDependencies"][name]

open(pj_path, "w").write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

ts_path = os.path.join(pkg, "tsconfig.json")
removed_includes = []
if os.path.exists(ts_path):
    s = open(ts_path).read()
    for inc in BUILD_CONFIG_INCLUDES:
        # one entry per line, or several on one line
        for pattern in (r'\n\s*"' + re.escape(inc) + r'",?', r',\s*"' + re.escape(inc) + r'"', r'"' + re.escape(inc) + r'",\s*'):
            if re.search(pattern, s):
                s = re.sub(pattern, "", s)
                removed_includes.append(inc)
                break
    s = re.sub(r",(\s*\])", r"\1", s)  # trailing comma left before ]
    open(ts_path, "w").write(s)

print(f"{os.path.basename(pkg)}: exports={json.dumps(new_exports)}")
print(f"  scripts removed: {removed_scripts}")
print(f"  devDependencies removed: {removed_deps}")
print(f"  tsconfig includes removed: {removed_includes}")
