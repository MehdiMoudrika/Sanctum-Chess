"""
Automated PBR Texture & Depth Map Generator for Sanctum Chess ("Celestial Gothic Temple Sanctum").
Generates:
  - assets/sanctum_diffuse.png      (1024x682 high-craft diffuse albedo, rich saturation & contrast)
  - assets/sanctum_depth.png        (1024x682 clean architectural heightmap: 100% flat marble floor + stepped outer balconies/walls)
  - assets/sanctum_normal.png       (1024x682 crisp micro-detail normal map for gold filigree & marble veins, NO wobbly macro gradients)
  - assets/sanctum_roughness.png    (1024x682 ORM packed map: R=AO, G=Roughness, B=Metalness)
  - assets/sanctum_pano.jpg         (1024x571 360 equirectangular cathedral dome for standing walls, pillars & vaulted ceiling)
Also syncs all generated files to www/assets/ for Android Capacitor builds.
"""
import shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance
from scipy.ndimage import gaussian_filter, sobel, median_filter

ROOT = Path(__file__).resolve().parent.parent
ASSETS_DIR = ROOT / "assets"
WWW_ASSETS_DIR = ROOT / "www" / "assets"

UPLOAD_DIR = Path(r"C:/Users/ULTRAPC/.gemini/antigravity/brain/c228f4a9-a7a5-4555-81a4-b355e9691261/.user_uploaded")
SRC_DIFFUSE = UPLOAD_DIR / "media_1792941202847_84bfb737.jpg"
SRC_DEPTH   = UPLOAD_DIR / "media_1792941202786_0ccf1d02.png"
SRC_PANO    = UPLOAD_DIR / "media_1792941430865_3ea87dc9.jpg"


def generate_maps():
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    WWW_ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Load & Enhance Diffuse Image (1024x682) so royal blues and gold filigree are vibrant, never faded
    diffuse_img = Image.open(SRC_DIFFUSE).convert("RGB")
    diffuse_img = ImageEnhance.Color(diffuse_img).enhance(1.18)
    diffuse_img = ImageEnhance.Contrast(diffuse_img).enhance(1.08)
    w, h = diffuse_img.size
    diffuse_path = ASSETS_DIR / "sanctum_diffuse.png"
    diffuse_img.save(diffuse_path, "PNG", optimize=True)
    print(f"[1/5] Saved vibrant {diffuse_path} ({w}x{h})")

    rgb = np.asarray(diffuse_img, dtype=np.float32) / 255.0
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    luma = 0.299 * r + 0.587 * g + 0.114 * b

    # 2. Clean Architectural Depth Map (NO organic bumps or molehill wobble!)
    # The entire central marble compass courtyard & surrounding dark-blue marble border
    # is a flat stone floor (elevation = 0.0). Only the outer architectural walls,
    # staircases, and balconies rise cleanly at the perimeter.
    if SRC_DEPTH.exists():
        raw_depth_img = Image.open(SRC_DEPTH).convert("L").resize((w, h), Image.Resampling.BICUBIC)
        raw_depth = np.asarray(raw_depth_img, dtype=np.float32) / 255.0
    else:
        raw_depth = gaussian_filter(luma, sigma=16.0)

    # Heavy box/median + gaussian smoothing on raw_depth so foliage/candles don't create spiky cones
    arch_depth = median_filter(raw_depth, size=15)
    arch_depth = gaussian_filter(arch_depth, sigma=14.0)
    d_min, d_max = arch_depth.min(), arch_depth.max()
    arch_depth = (arch_depth - d_min) / max(d_max - d_min, 1e-5)

    # Rectangular courtyard mask matching the exact architectural layout of sanctum_diffuse.png:
    # Inner marble compass floor + dark blue marble border spans x in [-0.56, 0.56], y in [-0.46, 0.48].
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    nx = (xx / w - 0.5) * 2.0   # -1 to 1
    ny = (yy / h - 0.51) * 2.0  # -1 to 1

    # Box distance (Chebyshev/superellipse) so the flat floor is rectangular like the temple hall, not a circular crater
    dx = np.maximum(0.0, np.abs(nx) - 0.54) / (1.0 - 0.54)
    dy = np.maximum(0.0, np.abs(ny) - 0.44) / (1.0 - 0.44)
    rect_dist = np.clip(np.sqrt(dx * dx + dy * dy), 0.0, 1.0)
    perimeter_mask = rect_dist * rect_dist * (3.0 - 2.0 * rect_dist)

    # Quantize/terrace slightly + smooth so architectural steps feel planar and solid
    final_depth = arch_depth * perimeter_mask
    final_depth = np.clip(final_depth, 0.0, 1.0)

    depth_u8 = (final_depth * 255.0).astype(np.uint8)
    depth_path = ASSETS_DIR / "sanctum_depth.png"
    Image.fromarray(depth_u8, mode="L").save(depth_path, "PNG", optimize=True)
    print(f"[2/5] Saved planar architectural {depth_path} (100% flat marble courtyard)")

    # 3. Crisp Micro-Detail Tangent-Space Normal Map (sanctum_normal.png)
    # Derived ONLY from high-frequency gold inlay bevels and marble stone cracks (sigma=1.5 high-pass)
    # so flat surfaces stay razor-flat while gold filigree glints sharply under candle point lights!
    gold_score = np.clip((r * 0.6 + g * 0.4 - b) * 2.8, 0.0, 1.0) * np.clip(luma * 1.5, 0.0, 1.0)
    micro_height = (luma - gaussian_filter(luma, sigma=2.2)) * 0.65 + gold_score * 0.35
    micro_height = gaussian_filter(micro_height, sigma=0.55)

    gx = sobel(micro_height, axis=1)
    gy = sobel(micro_height, axis=0)

    strength = 2.4
    nx_map = -gx * strength
    ny_map = gy * strength
    nz_map = np.ones_like(nx_map)

    norm_len = np.sqrt(nx_map ** 2 + ny_map ** 2 + nz_map ** 2)
    nx_map /= norm_len
    ny_map /= norm_len
    nz_map /= norm_len

    normal_rgb = np.stack([
        (nx_map * 0.5 + 0.5) * 255.0,
        (ny_map * 0.5 + 0.5) * 255.0,
        (nz_map * 0.5 + 0.5) * 255.0
    ], axis=-1).astype(np.uint8)

    normal_path = ASSETS_DIR / "sanctum_normal.png"
    Image.fromarray(normal_rgb, mode="RGB").save(normal_path, "PNG", optimize=True)
    print(f"[3/5] Saved crisp filigree {normal_path} (zero wobble)")

    # 4. PBR Roughness / Metalness Mask (sanctum_roughness.png)
    # Prevent non-gold marble from having high metalness or muddy glossy blobs.
    # ONLY true gold inlay gets high metalness (Blue channel); marble & blue banners stay dielectric (metalness ~0.02)
    # so their diffuse colors stay 100% rich and saturated!
    blue_banner_score = np.clip((b - (r * 0.55 + g * 0.45)) * 2.8, 0.0, 1.0)
    marble_score = np.clip(1.0 - gold_score - blue_banner_score, 0.0, 1.0)

    roughness = (
        0.38 * marble_score
        + 0.18 * gold_score
        + 0.78 * blue_banner_score
    )
    roughness = np.clip(roughness, 0.14, 0.92)

    # Strict gold threshold so marble never turns dark/metallic
    strict_gold = np.clip((gold_score - 0.22) / 0.55, 0.0, 1.0)
    metalness = np.clip(strict_gold * 0.92, 0.0, 0.92)

    # Clean AO in Red channel (keep high so colors are never darkened/muddy)
    ao = np.clip(0.78 + luma * 0.22, 0.75, 1.0)

    orm_rgb = np.stack([
        ao * 255.0,         # R = Ambient Occlusion
        roughness * 255.0,  # G = Roughness
        metalness * 255.0   # B = Metalness
    ], axis=-1).astype(np.uint8)

    roughness_path = ASSETS_DIR / "sanctum_roughness.png"
    Image.fromarray(orm_rgb, mode="RGB").save(roughness_path, "PNG", optimize=True)
    print(f"[4/5] Saved clean dielectric/gold {roughness_path}")

    # 5. Enhance & Save 360 Panorama for Surrounding Standing Cathedral Walls & Vaulted Ceiling
    if SRC_PANO.exists():
        pano_img = Image.open(SRC_PANO).convert("RGB")
        pano_img = ImageEnhance.Color(pano_img).enhance(1.18)
        pano_img = ImageEnhance.Contrast(pano_img).enhance(1.06)
        pano_path = ASSETS_DIR / "sanctum_pano.jpg"
        pano_img.save(pano_path, "JPEG", quality=94, optimize=True)
        print(f"[5/5] Saved vibrant 360 cathedral dome {pano_path}")

    for fname in ["sanctum_diffuse.png", "sanctum_depth.png", "sanctum_normal.png", "sanctum_roughness.png", "sanctum_pano.jpg"]:
        src = ASSETS_DIR / fname
        if src.exists():
            shutil.copy2(src, WWW_ASSETS_DIR / fname)
    print("Synced all Sanctum PBR maps to www/assets/")


if __name__ == "__main__":
    generate_maps()
