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
    vertex_colors = np.tile(np.array(color, dtype=np.uint8), (len(mesh.vertices), 1))
    mesh.visual.vertex_colors = vertex_colors
    scene.add_geometry(mesh, node_name=name, geom_name=name)


def y_cylinder(radius, height, sections=14):
    mesh = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    mesh.apply_transform(rotation_matrix(np.pi / 2, [1, 0, 0]))
    return mesh


def y_frustum(radius_top, radius_bottom, height, sections=14):
    angles = np.linspace(0, 2 * np.pi, sections, endpoint=False)
    y_top = height / 2
    y_bottom = -height / 2
    vertices = []
    for y, radius in ((y_top, radius_top), (y_bottom, radius_bottom)):
        for angle in angles:
            vertices.append([radius * np.cos(angle), y, radius * np.sin(angle)])

    faces = []
    for i in range(sections):
        nxt = (i + 1) % sections
        faces.extend([
            [i, nxt, sections + nxt],
            [i, sections + nxt, sections + i],
        ])

    top_center = len(vertices)
    bottom_center = top_center + 1
    vertices.extend([[0, y_top, 0], [0, y_bottom, 0]])

    for i in range(sections):
        nxt = (i + 1) % sections
        faces.append([top_center, i, nxt])
        faces.append([bottom_center, sections + nxt, sections + i])

    return trimesh.Trimesh(
        vertices=np.array(vertices),
        faces=np.array(faces),
        process=False,
    )


def lofted_box(sections):
    vertices = []
    for y, width, depth in sections:
        vertices.extend([
            [-width, y, -depth],
            [ width, y, -depth],
            [ width, y,  depth],
            [-width, y,  depth],
        ])

    faces = []
    count = len(sections)
    for level in range(count - 1):
        a = level * 4
        b = (level + 1) * 4
        for edge in range(4):
            nxt = (edge + 1) % 4
            faces.extend([
                [a + edge, a + nxt, b + nxt],
                [a + edge, b + nxt, b + edge],
            ])

    faces.extend([[0, 2, 1], [0, 3, 2]])
    last = (count - 1) * 4
    faces.extend([[last, last + 1, last + 2], [last, last + 2, last + 3]])

    return trimesh.Trimesh(
        vertices=np.array(vertices),
        faces=np.array(faces),
        process=False,
    )


def build():
    scene = trimesh.Scene()

    head = trimesh.creation.icosphere(subdivisions=2, radius=0.40)
    head.apply_scale([0.84, 1.0, 0.78])
    head.apply_translation([0, 2.48, 0])
    add(scene, "head", head, BODY)

    neck = y_cylinder(radius=0.16, height=0.34, sections=16)
    neck.apply_translation([0, 2.03, 0])
    add(scene, "neck", neck, MID)

    top_y, top_w, top_d = 1.90, 0.72, 0.32
    bottom_y, bottom_w, bottom_d = 0.72, 0.55, 0.28
    torso_vertices = np.array([
        [-top_w, top_y, -top_d],
        [ top_w, top_y, -top_d],
        [ top_w, top_y,  top_d],
        [-top_w, top_y,  top_d],
        [-bottom_w, bottom_y, -bottom_d],
        [ bottom_w, bottom_y, -bottom_d],
        [ bottom_w, bottom_y,  bottom_d],
        [-bottom_w, bottom_y,  bottom_d],
    ])
    torso_faces = np.array([
        [0, 1, 2], [0, 2, 3],
        [4, 6, 5], [4, 7, 6],
        [0, 4, 5], [0, 5, 1],
        [1, 5, 6], [1, 6, 2],
        [2, 6, 7], [2, 7, 3],
        [3, 7, 4], [3, 4, 0],
    ])
    torso = trimesh.Trimesh(vertices=torso_vertices, faces=torso_faces, process=False)
    add(scene, "torso", torso, BODY)

    tee = lofted_box([
        (1.86, 0.75, 0.35),
        (1.55, 0.69, 0.34),
        (0.82, 0.57, 0.30),
    ])
    add(scene, "tee_volume", tee, DARK)

    seam = trimesh.creation.box(extents=[0.82, 0.028, 0.036])
    seam.apply_translation([0, 1.53, -0.348])
    add(scene, "accent_seam", seam, LIME)

    for side, x, angle in [("left", -0.83, 0.10), ("right", 0.83, -0.05)]:
        shoulder = trimesh.creation.icosphere(subdivisions=1, radius=0.24)
        shoulder.apply_scale([1.0, 0.9, 0.88])
        shoulder.apply_translation([x, 1.73, 0])
        add(scene, f"shoulder_{side}", shoulder, DARK)

        upper = y_frustum(radius_top=0.17, radius_bottom=0.135, height=1.08, sections=14)
        upper.apply_transform(rotation_matrix(angle, [0, 0, 1]))
        upper.apply_translation([x + (-0.025 if side == "left" else 0.015), 1.18, 0])
        add(scene, f"arm_{side}", upper, DARK)

        hand = trimesh.creation.icosphere(subdivisions=1, radius=0.145)
        hand.apply_scale([0.82, 1.08, 0.72])
        hand.apply_translation([x + (-0.075 if side == "left" else 0.055), 0.57, 0])
        add(scene, f"hand_{side}", hand, BODY)

    hips = trimesh.creation.icosphere(subdivisions=1, radius=0.58)
    hips.apply_scale([1.0, 0.40, 0.50])
    hips.apply_translation([0, 0.48, 0])
    add(scene, "hips", hips, MID)

    for index, (x, y, z, angle) in enumerate([
        (-0.30, -0.47, 0.03, -0.035),
        (0.31, -0.52, -0.025, 0.045),
    ]):
        hip_joint = trimesh.creation.icosphere(subdivisions=1, radius=0.23)
        hip_joint.apply_scale([0.9, 1.0, 0.9])
        hip_joint.apply_translation([x, 0.27, z])
        add(scene, f"hip_joint_{index}", hip_joint, DARK)

        leg = y_frustum(radius_top=0.21, radius_bottom=0.145, height=1.48, sections=14)
        leg.apply_transform(rotation_matrix(angle, [0, 0, 1]))
        leg.apply_translation([x, y, z])
        add(scene, f"leg_{index}", leg, DARK)

        boot = trimesh.creation.box(extents=[0.32, 0.22, 0.54])
        boot.apply_translation([x + (-0.02 if index == 0 else 0.02), -1.33, -0.06])
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
        cup = trimesh.creation.cylinder(radius=0.12, height=0.08, sections=12)
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
