import json
from pathlib import Path

import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix

OUT = Path("public/cue-id/candidates/club-minimal-candidate-v1.glb")
META = Path("public/cue-id/candidates/club-minimal-candidate-v1.json")

BODY = (70, 76, 70, 255)
DARK = (22, 24, 22, 255)
MID = (48, 52, 48, 255)
LIME = (206, 255, 84, 255)


def add(scene, name, mesh, color):
    mesh = mesh.copy()
    mesh.visual.face_colors = np.array(color, dtype=np.uint8)
    scene.add_geometry(mesh, node_name=name, geom_name=name)


def build():
    scene = trimesh.Scene()

    head = trimesh.creation.icosphere(subdivisions=2, radius=0.46)
    head.apply_scale([0.82, 1.0, 0.78])
    head.apply_translation([0, 2.62, 0])
    add(scene, "head", head, BODY)

    neck = trimesh.creation.cylinder(radius=0.18, height=0.34, sections=16)
    neck.apply_translation([0, 2.18, 0])
    add(scene, "neck", neck, MID)

    points = []
    for y, width, depth in [(1.95, 0.78, 0.34), (0.75, 0.58, 0.30)]:
        for x in (-width, width):
            for z in (-depth, depth):
                points.append([x, y, z])
    torso = trimesh.Trimesh(vertices=np.array(points), faces=[]).convex_hull
    add(scene, "torso", torso, BODY)

    tee = trimesh.creation.box(extents=[1.45, 1.15, 0.08])
    tee.apply_translation([0, 1.36, -0.36])
    add(scene, "tee_front", tee, DARK)

    seam = trimesh.creation.box(extents=[0.9, 0.035, 0.045])
    seam.apply_translation([0, 1.55, -0.415])
    add(scene, "accent_seam", seam, LIME)

    for side, x, angle in [("left", -0.93, 0.08), ("right", 0.93, -0.04)]:
        upper = trimesh.creation.cylinder(radius=0.18, height=1.15, sections=14)
        upper.apply_transform(rotation_matrix(angle, [0, 0, 1]))
        upper.apply_translation([x, 1.35, 0])
        add(scene, f"arm_{side}", upper, DARK)

        hand = trimesh.creation.icosphere(subdivisions=1, radius=0.19)
        hand.apply_scale([0.8, 1.0, 0.7])
        hand.apply_translation([x + (-0.05 if side == "left" else 0.04), 0.72, 0])
        add(scene, f"hand_{side}", hand, BODY)

    hips = trimesh.creation.box(extents=[1.05, 0.42, 0.58])
    hips.apply_translation([0, 0.48, 0])
    add(scene, "hips", hips, MID)

    for index, (x, y, z, angle) in enumerate([
        (-0.34, -0.52, 0.02, -0.02),
        (0.36, -0.54, -0.03, 0.03),
    ]):
        leg = trimesh.creation.cylinder(radius=0.21, height=1.55, sections=14)
        leg.apply_transform(rotation_matrix(angle, [0, 0, 1]))
        leg.apply_translation([x, y, z])
        add(scene, f"leg_{index}", leg, DARK)

        boot = trimesh.creation.box(extents=[0.43, 0.28, 0.75])
        boot.apply_translation([x, -1.42, -0.12])
        add(scene, f"boot_{index}", boot, (18, 19, 18, 255))

    # restrained DJ cue: headphones around the neck, not gaming-headset styling
    band = trimesh.creation.torus(
        major_radius=0.36,
        minor_radius=0.045,
        major_sections=24,
        minor_sections=8,
    )
    band.apply_transform(rotation_matrix(np.pi / 2, [1, 0, 0]))
    band.apply_translation([0, 2.05, 0.02])
    add(scene, "headphone_band", band, DARK)

    for x in (-0.35, 0.35):
        cup = trimesh.creation.cylinder(radius=0.13, height=0.09, sections=12)
        cup.apply_transform(rotation_matrix(np.pi / 2, [0, 1, 0]))
        cup.apply_translation([x, 1.98, 0.02])
        add(scene, f"headphone_cup_{x}", cup, DARK)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    scene.export(OUT)

    triangles = sum(len(geometry.faces) for geometry in scene.geometry.values())
    vertices = sum(len(geometry.vertices) for geometry in scene.geometry.values())

    metadata = {
        "id": "club-minimal-candidate-v1",
        "purpose": "candidate",
        "generator": "Cuebooker procedural Club Minimal generator",
        "bytes": OUT.stat().st_size,
        "triangles": triangles,
        "vertices": vertices,
        "materials": 4,
        "textures": 0,
        "artDirection": "club_minimal_v1",
        "status": "candidate_not_production",
    }
    META.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metadata))


if __name__ == "__main__":
    build()
