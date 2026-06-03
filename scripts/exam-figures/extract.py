#!/usr/bin/env python3
"""Clip-extract exam figures from a subiect PDF per a JSON spec, + build a montage for vision verify.
Spec JSON: { "pdf": "<abs>", "zoom": 3, "pad": 5, "outdir": "public/exam-figures",
  "figures": [ {"name":"en-viii-2025-mate-simulare-s2-1","page":3,"bbox":[360,576,534,615]}, ... ] }
Usage: python3 extract.py spec.json            -> writes PNGs + montage.png
"""
import fitz, json, sys, os
spec = json.load(open(sys.argv[1]))
doc = fitz.open(spec["pdf"])
zoom = spec.get("zoom", 3); pad = spec.get("pad", 5)
outdir = os.path.expanduser(spec["outdir"]); os.makedirs(outdir, exist_ok=True)
mat = fitz.Matrix(zoom, zoom)
tiles = []
for f in spec["figures"]:
    page = doc[f["page"]-1]
    x0,y0,x1,y1 = f["bbox"]
    clip = fitz.Rect(x0-pad, y0-pad, x1+pad, y1+pad)
    pix = page.get_pixmap(matrix=mat, clip=clip)
    out = os.path.join(outdir, f["name"]+".png")
    pix.save(out)
    tiles.append((f["name"], out, pix.width, pix.height))
    print(f"  wrote {f['name']}.png  {pix.width}x{pix.height}")
# montage: grid of tiles with labels, for vision verification
cols = spec.get("montage_cols", 3)
cell_w, cell_h = 360, 300
rows = (len(tiles)+cols-1)//cols
M = fitz.open()
mp = M.new_page(width=cols*cell_w, height=rows*cell_h)
for i,(name,path,w,h) in enumerate(tiles):
    r,c = divmod(i, cols)
    x = c*cell_w; y = r*cell_h
    # fit image into cell with margin for label
    img_rect = fitz.Rect(x+5, y+22, x+cell_w-5, y+cell_h-5)
    mp.insert_image(img_rect, filename=path, keep_proportion=True)
    mp.insert_text((x+6, y+16), name.replace("en-viii-2025-mate-simulare-",""), fontsize=10)
    mp.draw_rect(fitz.Rect(x,y,x+cell_w,y+cell_h), color=(0.7,0.7,0.7), width=0.5)
montage = os.path.join(outdir, "_montage_"+spec.get("tag","x")+".png")
M[0].get_pixmap(matrix=fitz.Matrix(1.6,1.6)).save(montage)
print(f"\nMONTAGE -> {montage}")
doc.close()
