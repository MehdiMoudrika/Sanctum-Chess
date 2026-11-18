"""
Phase 1: Blueprint Slicing & Isolation Script
Supports isolating individual pieces (king, queen, ...) from the 2D blueprint,
removing the blueprint background, dimension lines, and text callouts into
`assets/blueprints/<piece>_clean.png`.
"""

import argparse
import json
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BLUEPRINT_CANDIDATES = [
    PROJECT_ROOT / "assets" / "blueprints" / "blueprint_full.jpg",
    Path(r"C:\Users\ULTRAPC\.gemini\antigravity\brain\f31cca4d-fa24-4f3e-8f70-0ad500c37211\.user_uploaded\media_1792157171605_f042cb5f.jpg"),
]


def get_bbox_via_gemini(image_path: Path, piece_label: str):
    """Optionally queries Google Gemini API (`google-genai`) if GEMINI_API_KEY is set."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        img = Image.open(image_path)
        prompt = (
            f"Return the 2D bounding box [ymin, xmin, ymax, xmax] normalized 0-1000 "
            f"for ONLY the painted 3D-style {piece_label} figure in the blueprint, "
            f"excluding text labels and dimension lines. Return JSON: {{\"box_2d\": [ymin, xmin, ymax, xmax]}}"
        )
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[img, prompt],
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        data = json.loads(response.text)
        if "box_2d" in data and len(data["box_2d"]) == 4:
            return data["box_2d"]
    except Exception as exc:
        print(f"[info] Gemini API bbox lookup skipped/fallback ({exc})")
    return None


PIECE_SPECS = {
    "king": {
        "label": "KING: REGAL ELVEN LORD",
        "crop": (0.140, 0.165, 0.358, 0.868),
        "poly": [
            (0.14, 0.16),
            (0.25, 0.08),
            (0.44, 0.01),
            (0.52, 0.11),
            (0.68, 0.15),
            (0.78, 0.18),
            (0.85, 0.01),
            (0.99, 0.01),
            (0.99, 0.28),
            (0.80, 0.45),
            (0.72, 0.83),
            (0.74, 0.99),
            (0.02, 0.99),
            (0.02, 0.75),
            (0.13, 0.25),
        ],
    },
    "queen": {
        "label": "QUEEN: SYLVAN FAIRY SORCERESS",
        # Panel #2 bounds with generous headroom above upper fairy wing tips
        "crop": (0.555, 0.112, 0.696, 0.466),
        "max_hole_fill": 20,
        # Polygon inside crop window that keeps all 4 wings, scepter tip & shaft, gown train, and pedestal
        # while excluding the left 5.5" dimension line and the right "Jewely Lelicy Pattrers" text label
        "poly": [
            (0.05, 0.04),   # Just inside upper-left dimension tick, preserving wing tip
            (0.14, 0.00),   # Top edge above upper-left wing tip
            (0.85, 0.00),   # Full headroom above upper-right fairy wing tip
            (0.99, 0.12),   # Right lotus crystal scepter head
            (0.99, 0.34),   # Below scepter head
            (0.83, 0.45),   # Inward along scepter shaft (excludes right text callout)
            (0.75, 0.68),   # Lower scepter shaft & gown right edge
            (0.84, 0.99),   # Pedestal base right
            (0.04, 0.99),   # Pedestal base left & flowing gown train
            (0.03, 0.80),   # Gown train tip on bottom-left
            (0.15, 0.56),   # Left hand / lower-left wing
            (0.05, 0.24),   # Outer edge of upper-left wing
        ],
    },
    "rook": {
        "label": "ROOK: SANCTUM MILKY-QUARTZ TOWER",
        # Panel #5 bounds covering 100% of summit amethyst crystal, crenellations, spiral staircase, base crystals & pedestal
        "crop": (0.576, 0.508, 0.682, 0.875),
        "max_hole_fill": 140,
        # Tight polygon inside crop window excluding left "2.8"" dimension line,
        # top-right "Milky Quartz" pointer line, and bottom-right "2.5"" dimension ticks
        "poly": [
            (0.08, 0.08),   # Upper-left battlement crown
            (0.38, 0.00),   # Full headroom above central amethyst summit crystal
            (0.62, 0.00),   # Full headroom above central amethyst summit crystal
            (0.88, 0.08),   # Upper-right battlement crown (inside "Milky Quartz" pointer line)
            (0.88, 0.24),   # Right edge of upper crown
            (0.80, 0.45),   # Follow spiral staircase outer curve (excludes right 2.5" tick line)
            (0.92, 0.68),   # Right base crystal shard tip
            (0.96, 0.99),   # Bottom-right pedestal base
            (0.04, 0.99),   # Bottom-left pedestal base
            (0.06, 0.66),   # Left base crystal shard tip
            (0.12, 0.35),   # Left spiral staircase & shaft
        ],
    },
    "bishop": {
        "label": "BISHOP: ARCANE CRYSTAL MAGE",
        # Panel #3 bounds covering 100% of floating quartz staff crystal tip, hood, shoulder crystal clusters, cape & pedestal
        "crop": (0.742, 0.118, 0.860, 0.468),
        "max_hole_fill": 420,
        "bg_lum_max": 86.0,
        "bg_blue_min": 12.5,
        "dark_lum_max": 42.0,
        # Polygon inside crop window keeping left shoulder crystal spikes, hood, quartz staff head + shaft, and pedestal
        # while excluding the left "Arcane Mage" and "Quartz Staff" text callouts and leader lines
        "poly": [
            (0.10, 0.18),   # Just outside upper-left shoulder crystal tip (excludes "Arcane Mage" line)
            (0.32, 0.08),   # Above hood left slope
            (0.55, 0.05),   # Above hood peak
            (0.72, 0.00),   # Full headroom above floating crystal on Quartz Staff
            (0.99, 0.00),   # Top-right above Quartz Staff
            (0.99, 0.35),   # Right of Quartz Staff head & hand
            (0.92, 0.99),   # Bottom-right pedestal & staff base
            (0.08, 0.99),   # Bottom-left pedestal & cape base
            (0.02, 0.72),   # Left flowing cape outer edge
            (0.10, 0.38),   # Below left shoulder crystals (excludes "Quartz Staff" line)
            (0.05, 0.25),   # Outer tip of lower-left shoulder crystal
        ],
    },
    "knight": {
        "label": "KNIGHT: WINGED GRIFFIN / PEGASUS",
        # Panel #4 bounds covering 100% of swept feathered crystal wing tips, rearing head, raised front hooves & pedestal
        "crop": (0.330, 0.514, 0.506, 0.878),
        "max_hole_fill": 120,
        "bg_lum_max": 94.0,
        "bg_blue_min": 11.0,
        "dark_lum_max": 45.0,
        # Polygon inside crop window keeping all left & upper wing feather tips, head/ears, raised hooves, tail & pedestal
        # while excluding the top horizontal panel line, "Winged Griffin / Pegasus" leader line (top-right),
        # "Jeweled Chest" leader line (bottom-right), and "Prismatic Diamond" leader line (bottom-left)
        "poly": [
            (0.01, 0.03),   # Outer primary left wing tip
            (0.42, 0.01),   # Top edge just above inner right wing tip (below panel divider)
            (0.55, 0.01),   # Above inner wing tip
            (0.66, 0.14),   # Between inner wing and Pegasus ears
            (0.79, 0.14),   # Above Pegasus ears (inside "Winged Griffin / Pegasus" pointer line)
            (0.90, 0.24),   # Around Pegasus muzzle
            (0.86, 0.36),   # Below muzzle / front of neck
            (0.99, 0.46),   # Outer front hoof (rightmost)
            (0.99, 0.66),   # Below outer front hoof
            (0.84, 0.72),   # Below inner raised front hoof (excludes "Jeweled Chest" pointer line)
            (0.75, 0.82),   # Above right pedestal rim
            (0.80, 0.99),   # Bottom-right pedestal base
            (0.26, 0.99),   # Bottom-left pedestal base
            (0.28, 0.72),   # Left of hind legs & flowing tail (excludes "Prismatic Diamond" line on lower-left)
            (0.18, 0.48),   # Lower edge of swept left wing feathers
            (0.01, 0.22),   # Left wing outer feather edge
        ],
    },
    "pawn": {
        "label": "PAWN: DISCIPLINED CRYSTAL GOBLIN",
        # Panel #6 bounds covering 100% of diamond spear tip, pointed goblin ears, crystal kite shield, armored stance & pedestal
        "crop": (0.740, 0.542, 0.885, 0.876),
        "max_hole_fill": 120,
        "bg_lum_max": 90.0,
        "bg_blue_min": 11.5,
        "dark_lum_max": 42.0,
        # Polygon inside crop window keeping spear tip & shaft, both pointed ears, kite shield, legs & pedestal
        # while excluding the top-left "6" box and the top-right "Disciplined Goblin" text & leader line
        "poly": [
            (0.01, 0.00),   # Top-left above diamond spear tip
            (0.18, 0.00),   # Right of diamond spear tip
            (0.24, 0.20),   # Between spear tip and left goblin ear
            (0.54, 0.16),   # Above goblin head crown
            (0.84, 0.20),   # Above right goblin ear (below "Disciplined Goblin" text)
            (0.75, 0.29),   # Dip just inside the "Disciplined Goblin" leader line before kite shield top
            (0.99, 0.40),   # Right upper corner of crystal kite shield
            (0.99, 0.80),   # Right lower edge & bottom tip of crystal kite shield
            (0.94, 0.99),   # Bottom-right pedestal base
            (0.22, 0.99),   # Bottom-left pedestal base & spear butt
            (0.10, 0.58),   # Left of armored right hand holding spear
            (0.01, 0.28),   # Left of upper spear blade
        ],
    },
}


def isolate_piece(piece_key: str):
    if piece_key not in PIECE_SPECS:
        raise ValueError(f"Unknown piece key: {piece_key}")

    src_path = next((p for p in BLUEPRINT_CANDIDATES if p.exists()), None)
    if src_path is None:
        raise FileNotFoundError("Could not locate the blueprint image.")

    spec = PIECE_SPECS[piece_key]
    output_path = PROJECT_ROOT / "assets" / "blueprints" / f"{piece_key}_clean.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    img = Image.open(src_path).convert("RGBA")
    w, h = img.size
    print(f"Loaded blueprint: {src_path} ({w}x{h}) for piece '{piece_key}'")

    get_bbox_via_gemini(src_path, spec["label"])

    rx0, ry0, rx1, ry1 = spec["crop"]
    x0, y0, x1, y1 = int(w * rx0), int(h * ry0), int(w * rx1), int(h * ry1)
    crop_rgba = img.crop((x0, y0, x1, y1))
    cw, ch = crop_rgba.size

    inclusion_poly = [(int(cw * px), int(ch * py)) for px, py in spec["poly"]]
    poly_mask = Image.new("L", (cw, ch), 0)
    ImageDraw.Draw(poly_mask).polygon(inclusion_poly, fill=255)

    arr = np.array(crop_rgba, dtype=np.float32)
    r, g, b, _ = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]

    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    # Blueprint background is cold navy-cyan (G >= R and B > G > R), whereas purple cape has R > G
    navy_coldness = (b - r) - 0.65 * np.maximum(0.0, r - g)

    bg_lum_max = spec.get("bg_lum_max", 102.0)
    bg_blue_min = spec.get("bg_blue_min", 10.0)
    dark_lum_max = spec.get("dark_lum_max", 52.0)

    # Key out blueprint dark navy slate background & outer blue glow halo
    bg_score = np.clip((bg_lum_max - luminance) / 26.0, 0.0, 1.0) * np.clip((navy_coldness - bg_blue_min) / 13.0, 0.0, 1.0)
    dark_bg = np.clip((dark_lum_max - luminance) / 14.0, 0.0, 1.0)
    bg_total = np.maximum(bg_score, dark_bg)

    combined_alpha = np.where(bg_total > 0.45, 0.0, 1.0 - bg_total)

    poly_np = np.array(poly_mask, dtype=np.float32) / 255.0
    final_alpha = combined_alpha * poly_np

    try:
        from scipy import ndimage
        fg_binary = final_alpha > 0.25
        labeled, num_features = ndimage.label(fg_binary)
        if num_features > 0:
            sizes = ndimage.sum(fg_binary, labeled, range(1, num_features + 1))
            max_size = max(sizes)
            keep_labels = {idx + 1 for idx, s in enumerate(sizes) if s >= max(25, max_size * 0.003)}
            keep_mask = np.isin(labeled, list(keep_labels))

            # Fill internal shadow pinholes while keeping real exterior background open
            max_hole = spec.get("max_hole_fill", 90)
            inv_mask = ~keep_mask
            hole_labels, num_holes = ndimage.label(inv_mask)
            if num_holes > 0:
                hole_sizes = ndimage.sum(inv_mask, hole_labels, range(1, num_holes + 1))
                # Never fill hole label that touches image border (label 1)
                border_labels = set(np.unique(hole_labels[0, :])) | set(np.unique(hole_labels[-1, :])) | set(np.unique(hole_labels[:, 0])) | set(np.unique(hole_labels[:, -1]))
                tiny_holes = {
                    idx + 1
                    for idx, s in enumerate(hole_sizes)
                    if (idx + 1) not in border_labels and s < max_hole
                }
                keep_mask = keep_mask | np.isin(hole_labels, list(tiny_holes))

            keep_mask_img = Image.fromarray((keep_mask * 255).astype(np.uint8), mode="L")
            keep_mask_soft = np.array(keep_mask_img.filter(ImageFilter.GaussianBlur(radius=0.5)), dtype=np.float32) / 255.0
            final_alpha = np.where(keep_mask, 1.0, keep_mask_soft)
    except Exception as exc:
        print(f"[info] scipy connected-component filter skipped ({exc})")

    out_arr = np.array(crop_rgba, dtype=np.uint8)
    out_arr[..., 3] = (np.clip(final_alpha, 0.0, 1.0) * 255).astype(np.uint8)

    raw_out = Image.fromarray(out_arr, mode="RGBA")
    bbox = raw_out.getbbox()
    if bbox:
        raw_out = raw_out.crop(bbox)

    rw, rh = raw_out.size
    canvas_side = int(max(rw, rh) * 1.12)
    square_out = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    paste_x = (canvas_side - rw) // 2
    paste_y = (canvas_side - rh) // 2
    square_out.paste(raw_out, (paste_x, paste_y), raw_out)

    # Upscale to 1024x1024 with Lanczos + subtle unsharp detail enhancement for 3D generation
    target_res = 1024
    if canvas_side < target_res:
        upscaled = square_out.resize((target_res, target_res), Image.Resampling.LANCZOS)
        r_ch, g_ch, b_ch, a_ch = upscaled.split()
        rgb_sharp = Image.merge("RGB", (r_ch, g_ch, b_ch)).filter(
            ImageFilter.UnsharpMask(radius=1.4, percent=135, threshold=2)
        )
        # Keep alpha crisp and smooth
        a_smooth = a_ch.filter(ImageFilter.GaussianBlur(radius=0.6))
        a_np = np.array(a_smooth, dtype=np.float32)
        a_crisp = Image.fromarray(np.clip((a_np - 24.0) * (255.0 / 210.0), 0, 255).astype(np.uint8), mode="L")
        r2, g2, b2 = rgb_sharp.split()
        square_out = Image.merge("RGBA", (r2, g2, b2, a_crisp))

    square_out.save(output_path, "PNG")
    print(f"Saved clean upscaled {piece_key} PNG to: {output_path} ({square_out.size[0]}x{square_out.size[1]})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--piece", default="queen", choices=list(PIECE_SPECS.keys()))
    args = parser.parse_args()
    isolate_piece(args.piece)
