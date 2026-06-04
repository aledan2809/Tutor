#!/usr/bin/env python3
"""Clip-extract exam figures via the 4uPDF backend /api/extract-region (Pro hi-DPI region render),
then build a montage PNG for vision verification. Mirrors extract.py but uses the deployed 4uPDF
region renderer instead of local fitz (playbook §2.6 method (a)).

Spec JSON: { "pdf": "<abs>", "dpi": 300, "outdir": "public/exam-figures", "tag": "2022-test-01",
  "endpoint": "http://localhost:8099/api/extract-region", "token_file": "/tmp/figtoken.txt",
  "page_w": 595, "page_h": 842, "pad": 3,
  "figures": [ {"name":"en-viii-2022-mate-test-01-s2-1","page":3,"bbox":[384,709,530,723]}, ... ] }
bbox = [x0,y0,x1,y1] in PDF points (top-left origin). Converted to page fractions for the API.
Usage: python3 extract_4updf.py spec.json   -> writes PNGs + _montage_<tag>.png
"""
import json, sys, os, fitz, requests

spec = json.load(open(sys.argv[1]))
W = spec.get("page_w", 595); H = spec.get("page_h", 842)
pad = spec.get("pad", 3); dpi = spec.get("dpi", 300)
outdir = os.path.expanduser(spec["outdir"]); os.makedirs(outdir, exist_ok=True)
endpoint = spec.get("endpoint", "http://localhost:8099/api/extract-region")
token = open(os.path.expanduser(spec["token_file"])).read().strip()
pdf_path = os.path.expanduser(spec["pdf"])
headers = {"Authorization": f"Bearer {token}"}

tiles = []
for f in spec["figures"]:
    x0, y0, x1, y1 = f["bbox"]
    fx0 = max(0.0, (x0 - pad) / W); fy0 = max(0.0, (y0 - pad) / H)
    fx1 = min(1.0, (x1 + pad) / W); fy1 = min(1.0, (y1 + pad) / H)
    data = {"page": str(f["page"]), "fx0": f"{fx0:.5f}", "fy0": f"{fy0:.5f}",
            "fx1": f"{fx1:.5f}", "fy1": f"{fy1:.5f}", "dpi": str(dpi)}
    with open(pdf_path, "rb") as fh:
        files = {"file": (os.path.basename(pdf_path), fh, "application/pdf")}
        r = requests.post(endpoint, headers=headers, data=data, files=files, timeout=120)
    if r.status_code != 200 or not r.content or r.content[:4] != b"\x89PNG":
        print(f"  ✗ {f['name']}: HTTP {r.status_code} len={len(r.content)} body={r.content[:200]!r}")
        sys.exit(1)
    out = os.path.join(outdir, f["name"] + ".png")
    with open(out, "wb") as o:
        o.write(r.content)
    tiles.append((f["name"], out))
    print(f"  ✓ {f['name']}.png  ({len(r.content)} bytes @ {dpi} DPI)")

# montage: grid of tiles with labels, for vision verification
cols = spec.get("montage_cols", 3)
cell_w, cell_h = 360, 300
rows = (len(tiles) + cols - 1) // cols
tag = spec.get("tag", "x")
M = fitz.open(); mp = M.new_page(width=cols * cell_w, height=rows * cell_h)
for i, (name, path) in enumerate(tiles):
    rr, cc = divmod(i, cols)
    x = cc * cell_w; y = rr * cell_h
    img_rect = fitz.Rect(x + 5, y + 22, x + cell_w - 5, y + cell_h - 5)
    mp.insert_image(img_rect, filename=path, keep_proportion=True)
    mp.insert_text((x + 6, y + 16), name.replace(f"en-viii-{tag.split('-')[0]}-mate-", ""), fontsize=10)
    mp.draw_rect(fitz.Rect(x, y, x + cell_w, y + cell_h), color=(0.7, 0.7, 0.7), width=0.5)
montage = os.path.join(outdir, "_montage_" + tag + ".png")
M[0].get_pixmap(matrix=fitz.Matrix(1.6, 1.6)).save(montage)
print(f"\nMONTAGE -> {montage}")
