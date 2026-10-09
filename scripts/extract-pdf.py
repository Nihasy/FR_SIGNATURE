"""Extrait les photos du dossier de présentation PDF vers _ref/img (utilisées par scripts/seed.mjs).

Usage : pip install pymupdf && python scripts/extract-pdf.py "FRS2026...pdf" [_ref/img]
Les fichiers sont nommés p<page>_<index>.jpeg, comme attendu par scripts/seed-manifest.json.
"""
import os
import sys

import pymupdf

src = sys.argv[1] if len(sys.argv) > 1 else "FRS2026...pdf"
out = sys.argv[2] if len(sys.argv) > 2 else "_ref/img"
os.makedirs(out, exist_ok=True)

doc = pymupdf.open(src)
seen = set()
count = 0
for i, page in enumerate(doc):
    for j, im in enumerate(page.get_images(full=True)):
        xref = im[0]
        if xref in seen:
            continue
        seen.add(xref)
        info = doc.extract_image(xref)
        if info["width"] < 400:
            continue
        with open(os.path.join(out, f"p{i:02d}_{j}.{info['ext']}"), "wb") as f:
            f.write(info["image"])
        count += 1
print(f"{count} images extraites dans {out}")
