"""
Optimizes high-poly sculpted .glb meshes from `assets/models/orig/*.glb` into
`assets/models/*.glb` using quadric mesh decimation (`fast_simplification` + `trimesh`)
after removing degenerate zero-area triangles so all 32 pieces render at a locked
120 FPS in Three.js while preserving crisp silhouette, facial features, and crystal facets.
"""

from pathlib import Path
import numpy as np
import trimesh
import fast_simplification

MODELS_DIR = Path(__file__).resolve().parent.parent / "assets" / "models"
ORIG_DIR = MODELS_DIR / "orig"

TARGET_FACES = {
    "king": 20000,
    "queen": 20000,
    "rook": 18000,
    "bishop": 18000,
    "knight": 18000,
    "pawn": 12000,
}


def load_as_single_trimesh(path: Path) -> trimesh.Trimesh:
    loaded = trimesh.load(str(path), force="mesh")
    if isinstance(loaded, trimesh.Scene):
        meshes = [g for g in loaded.geometry.values() if isinstance(g, trimesh.Trimesh)]
        return trimesh.util.concatenate(meshes)
    return loaded


def optimize_piece(piece_key: str, target_faces: int):
    src_path = ORIG_DIR / f"{piece_key}.glb"
    dst_path = MODELS_DIR / f"{piece_key}.glb"
    if not src_path.exists():
        src_path = dst_path
    if not src_path.exists():
        print(f"[skip] {src_path} not found")
        return

    mesh = load_as_single_trimesh(src_path)
    orig_v = len(mesh.vertices)
    orig_f = len(mesh.faces)
    orig_kb = src_path.stat().st_size / 1024.0

    # Clean degenerate/duplicate faces before quadric simplification
    mesh.merge_vertices()
    mesh.update_faces(mesh.nondegenerate_faces())
    mesh.update_faces(mesh.unique_faces())
    mesh.remove_unreferenced_vertices()

    clean_f = len(mesh.faces)
    verts = np.ascontiguousarray(mesh.vertices, dtype=np.float32)
    faces = np.ascontiguousarray(mesh.faces, dtype=np.int32)

    target_reduction = float(np.clip(1.0 - (target_faces / float(clean_f)), 0.05, 0.98))
    pts_out, faces_out = fast_simplification.simplify(
        verts, faces, target_reduction=target_reduction, agg=7
    )

    dec_mesh = trimesh.Trimesh(vertices=pts_out, faces=faces_out, process=True)
    _ = dec_mesh.vertex_normals  # Precompute smooth vertex normals

    dec_mesh.export(str(dst_path), file_type="glb")
    new_kb = dst_path.stat().st_size / 1024.0
    print(
        f"[optimized] {piece_key}.glb: {orig_f:,} -> {len(dec_mesh.faces):,} faces "
        f"({orig_v:,} -> {len(dec_mesh.vertices):,} verts) | {orig_kb:.1f} KB -> {new_kb:.1f} KB "
        f"| bounds={np.round(dec_mesh.bounds, 3).tolist()}"
    )


if __name__ == "__main__":
    for piece, tgt in TARGET_FACES.items():
        optimize_piece(piece, tgt)
