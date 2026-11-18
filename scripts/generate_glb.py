"""
Phase 2: Free Image-to-GLB Conversion (1 Piece Only — King)
Uses `gradio_client` to send `assets/blueprints/king_clean.png` to the free Hugging Face Space
`tencent/Hunyuan3D-2` (endpoints `/shape_generation` or `/generation_all`) with fallback to
`JeffreyXiang/TRELLIS` (and mirror Spaces if ZeroGPU is busy), exporting `assets/models/king.glb`
and reporting file size, vertex count, and face count via `trimesh`.
"""

import os
import shutil
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_IMAGE = PROJECT_ROOT / "assets" / "blueprints" / "king_clean.png"
OUTPUT_GLB = PROJECT_ROOT / "assets" / "models" / "king.glb"


def extract_glb_path(result):
    """Recursively searches a Gradio result payload for a .glb file path."""
    if isinstance(result, str) and result.lower().endswith(".glb") and Path(result).exists():
        return Path(result)
    if isinstance(result, dict):
        for k in ("value", "path", "mesh", "glb"):
            if k in result:
                found = extract_glb_path(result[k])
                if found:
                    return found
        for v in result.values():
            found = extract_glb_path(v)
            if found:
                return found
    if isinstance(result, (list, tuple)):
        for item in result:
            found = extract_glb_path(item)
            if found:
                return found
    return None


def try_hunyuan3d(image_path: Path):
    from gradio_client import Client, handle_file

    spaces = [
        "tencent/Hunyuan3D-2",
        "tencent/Hunyuan3D-2mv",
        "tencent/Hunyuan3D-2mini-Turbo",
    ]
    for space_id in spaces:
        print(f"[Hunyuan3D] Connecting to {space_id} ...")
        try:
            client = Client(space_id)
            api_info = client.view_api(return_format="dict")
            named_endpoints = api_info.get("named_endpoints", {})
            print(f"[Hunyuan3D] Available endpoints on {space_id}: {list(named_endpoints.keys())}")

            for ep in ["/shape_generation", "/generation_all", "/predict"]:
                if ep in named_endpoints:
                    print(f"[Hunyuan3D] Calling {space_id} endpoint {ep} ...")
                    try:
                        res = client.predict(
                            image=handle_file(str(image_path)),
                            api_name=ep,
                        )
                    except TypeError:
                        # Fallback positional call using defaults from endpoint signature
                        res = client.predict(
                            handle_file(str(image_path)),
                            api_name=ep,
                        )
                    glb = extract_glb_path(res)
                    if glb:
                        return glb
        except Exception as exc:
            print(f"[Hunyuan3D] {space_id} failed: {exc}")
    return None


def try_trellis(image_path: Path):
    from gradio_client import Client, handle_file

    spaces = [
        "JeffreyXiang/TRELLIS",
        "hysts/TRELLIS",
        "stabilityai/TripoSR",
    ]
    for space_id in spaces:
        print(f"[Fallback Space] Connecting to {space_id} ...")
        try:
            client = Client(space_id)
            api_info = client.view_api(return_format="dict")
            named_endpoints = api_info.get("named_endpoints", {})
            print(f"[Fallback Space] Available endpoints on {space_id}: {list(named_endpoints.keys())}")

            # Try start_session if required by TRELLIS
            if "/start_session" in named_endpoints:
                try:
                    client.predict(api_name="/start_session")
                except Exception:
                    pass

            for ep in ["/image_to_3d", "/generate_and_extract_glb", "/extract_glb", "/run", "/predict"]:
                if ep in named_endpoints:
                    print(f"[Fallback Space] Calling {space_id} endpoint {ep} ...")
                    try:
                        res = client.predict(handle_file(str(image_path)), api_name=ep)
                        glb = extract_glb_path(res)
                        if glb:
                            return glb
                    except Exception as inner_exc:
                        print(f"[Fallback Space] {ep} on {space_id} error: {inner_exc}")
        except Exception as exc:
            print(f"[Fallback Space] {space_id} failed: {exc}")
    return None


def verify_and_report_glb(glb_path: Path):
    import trimesh

    scene_or_mesh = trimesh.load(str(glb_path), force="mesh")
    verts = len(scene_or_mesh.vertices)
    faces = len(scene_or_mesh.faces)
    size_kb = glb_path.stat().st_size / 1024.0
    print("=" * 60)
    print(f"GLB EXPORT VERIFIED: {glb_path}")
    print(f"File Size    : {size_kb:.2f} KB ({glb_path.stat().st_size:,} bytes)")
    print(f"Vertex Count : {verts:,}")
    print(f"Face Count   : {faces:,}")
    print(f"Watertight   : {scene_or_mesh.is_watertight}")
    print(f"Bounds (min) : {scene_or_mesh.bounds[0].round(4).tolist()}")
    print(f"Bounds (max) : {scene_or_mesh.bounds[1].round(4).tolist()}")
    print("=" * 60)


def main():
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--piece", default="queen")
    args = parser.parse_args()

    input_image = PROJECT_ROOT / "assets" / "blueprints" / f"{args.piece}_clean.png"
    output_glb = PROJECT_ROOT / "assets" / "models" / f"{args.piece}.glb"

    if not input_image.exists():
        raise FileNotFoundError(f"Missing input image: {input_image}")

    output_glb.parent.mkdir(parents=True, exist_ok=True)

    glb_candidate = try_hunyuan3d(input_image)
    if glb_candidate is None:
        glb_candidate = try_trellis(input_image)

    if glb_candidate is not None and glb_candidate.exists():
        shutil.copy2(glb_candidate, output_glb)
        verify_and_report_glb(output_glb)
        return

    print("[ERROR] Remote Hugging Face Spaces did not return a GLB.")
    sys.exit(1)


if __name__ == "__main__":
    main()
