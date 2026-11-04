"""Rewrite @/ and @stores/ imports to # subpath imports in one package's src, and
add the matching `imports` field to its package.json.

usage: python3 to_subpath.py <package dir>
"""

import json
import os
import re
import sys
from collections import OrderedDict

pkg = os.path.abspath(sys.argv[1])
src = os.path.join(pkg, "src")
spec_re = re.compile(r"""(['"])@(stores)?/([^'"]+)\1""")
exts = set()
changed = []


def resolve(rel):
    p = os.path.join(src, rel)
    if os.path.isfile(p):
        return rel, os.path.splitext(rel)[1]
    if os.path.isfile(p + ".ts"):
        return rel, ".ts"
    if os.path.isfile(os.path.join(p, "index.ts")):
        return rel + "/index", ".ts"
    raise SystemExit(f"unresolved: {rel}")


def repl(m):
    q, stores, rest = m.groups()
    rel = ("stores/" + rest) if stores else rest
    rel, ext = resolve(rel)
    if ext != ".ts":
        exts.add(ext)
    return f"{q}#{rel}{q}"


for root, _, files in os.walk(src):
    for f in files:
        if not f.endswith((".ts", ".vue", ".mts", ".tsx")):
            continue
        path = os.path.join(root, f)
        s = open(path).read()
        s2 = spec_re.sub(repl, s)
        if s2 != s:
            open(path, "w").write(s2)
            changed.append(os.path.relpath(path, pkg))

imports = OrderedDict([("#*", "./src/*.ts")])
for ext in sorted(exts):
    imports[f"#*{ext}"] = f"./src/*{ext}"

pj = os.path.join(pkg, "package.json")
data = json.load(open(pj), object_pairs_hook=OrderedDict)
data["imports"] = imports
open(pj, "w").write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

print(f"{len(changed)} files rewritten; imports = {dict(imports)}")
