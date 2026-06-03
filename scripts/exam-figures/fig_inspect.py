import fitz, sys
pdf = sys.argv[1]
pages = [int(x) for x in sys.argv[2].split(",")] if len(sys.argv)>2 else None
doc = fitz.open(pdf)
for pno in range(len(doc)):
    if pages and (pno+1) not in pages: continue
    page = doc[pno]
    r = page.rect
    print(f"\n=== PAGE {pno+1}  size={r.width:.0f}x{r.height:.0f} ===")
    imgs = page.get_image_info(xrefs=True)
    for im in imgs:
        b = im["bbox"]
        print(f"  IMG xref={im.get('xref')} bbox=({b[0]:.0f},{b[1]:.0f},{b[2]:.0f},{b[3]:.0f}) w={b[2]-b[0]:.0f} h={b[3]-b[1]:.0f}")
    # cluster vector drawings by bbox, ignore tiny + page-border + full-width grids
    drws = page.get_drawings()
    # union bbox of right-half drawings (figures live x>290)
    rights = []
    for d in drws:
        b = d["rect"]
        w, h = b.width, b.height
        if w < 3 and h < 3: continue
        rights.append((b.x0,b.y0,b.x1,b.y1,w,h))
    # print drawing extent histogram by y-band on right column
    print(f"  drawings total={len(drws)}  (showing right-column x0>=290, w/h>20)")
    for (x0,y0,x1,y1,w,h) in rights:
        if x0>=290 and (w>20 or h>20):
            print(f"    DRW bbox=({x0:.0f},{y0:.0f},{x1:.0f},{y1:.0f}) w={w:.0f} h={h:.0f}")
doc.close()
