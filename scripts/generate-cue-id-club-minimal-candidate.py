import json
from pathlib import Path

import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

OUT = Path("public/cue-id/candidates/club-minimal-candidate-v1.glb")
META = Path("public/cue-id/candidates/club-minimal-candidate-v1.json")

BODY = PBRMaterial(
    name="body",
    baseColorFactor=[70, 76, 70, 255],
    metallicFactor=0.02,
    roughnessFactor=0.82,
)
DARK = PBRMaterial(
    name="dark",
    baseColorFactor=[22, 24, 22, 255],
    metallicFactor=0.02,
    roughnessFactor=0.86,
)
MID = PBRMaterial(
    name="mid",
    baseColorFactor=[48, 52, 48, 255],
    metallicFactor=0.03,
    roughnessFactor=0.80,
)
LIME = PBRMaterial(
    name="accent",
    baseColorFactor=[206, 255, 84, 255],
    metallicFactor=0.02,
    roughnessFactor=0.72,
)

SEMANTIC_NODE_NAMES = {
    "head",
    "clavicle",
    "shoulder_left",
    "shoulder_right",
    "upper_arm_left",
    "upper_arm_right",
    "elbow_left",
    "elbow_right",
    "forearm_left",
    "forearm_right",
    "hips",
    "thigh_left",
    "thigh_right",
    "knee_left",
    "knee_right",
    "shin_left",
    "shin_right",
}


def add(scene, name, mesh, material):
    mesh = mesh.copy()
    mesh.visual = TextureVisuals(material=material)
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


def elliptical_loft(rings, radial_sections=16):
    vertices = []
    for y, width, depth in rings:
        for angle in np.linspace(0, 2 * np.pi, radial_sections, endpoint=False):
            vertices.append([
                width * np.cos(angle),
                y,
                depth * np.sin(angle),
            ])

    faces = []
    ring_count = len(rings)
    for ring in range(ring_count - 1):
        a = ring * radial_sections
        b = (ring + 1) * radial_sections
        for i in range(radial_sections):
            nxt = (i + 1) % radial_sections
            faces.extend([
                [a + i, a + nxt, b + nxt],
                [a + i, b + nxt, b + i],
            ])

    top_center = len(vertices)
    bottom_center = top_center + 1
    vertices.extend([
        [0, rings[0][0] + 0.03, 0],
        [0, rings[-1][0] - 0.03, 0],
    ])

    for i in range(radial_sections):
        nxt = (i + 1) % radial_sections
        faces.append([top_center, i, nxt])
        last = (ring_count - 1) * radial_sections
        faces.append([bottom_center, last + nxt, last + i])

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

    head = elliptical_loft([
        (2.78, 0.22, 0.22),
        (2.66, 0.32, 0.27),
        (2.49, 0.35, 0.29),
        (2.34, 0.32, 0.27),
        (2.22, 0.26, 0.24),
        (2.15, 0.18, 0.20),
    ], radial_sections=16)
    add(scene, "head", head, BODY)

    neck = y_frustum(radius_top=0.145, radius_bottom=0.18, height=0.32, sections=16)
    neck.apply_translation([0, 2.02, 0])
    add(scene, "neck", neck, MID)

    clavicle = lofted_box([
        (2.00, 0.30, 0.20),
        (1.88, 0.64, 0.30),
        (1.78, 0.70, 0.32),
    ])
    add(scene, "clavicle", clavicle, DARK)

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

    arm_specs = [
        ("left", -0.83, 0.10, -0.12),
        ("right", 0.83, -0.05, 0.08),
    ]
    for side, x, upper_angle, forearm_angle in arm_specs:
        shoulder = trimesh.creation.icosphere(subdivisions=1, radius=0.235)
        shoulder.apply_scale([1.0, 0.9, 0.86])
        shoulder.apply_translation([x, 1.73, 0])
        add(scene, f"shoulder_{side}", shoulder, DARK)

        upper = y_frustum(radius_top=0.17, radius_bottom=0.145, height=0.58, sections=14)
        upper.apply_transform(rotation_matrix(upper_angle, [0, 0, 1]))
        upper.apply_translation([x + (-0.018 if side == "left" else 0.012), 1.39, 0])
        add(scene, f"upper_arm_{side}", upper, DARK)

        elbow_x = x + (-0.055 if side == "left" else 0.04)
        elbow = trimesh.creation.icosphere(subdivisions=1, radius=0.155)
        elbow.apply_scale([0.9, 0.9, 0.86])
        elbow.apply_translation([elbow_x, 1.05, 0])
        add(scene, f"elbow_{side}", elbow, DARK)

        forearm = y_frustum(radius_top=0.14, radius_bottom=0.115, height=0.56, sections=14)
        forearm.apply_transform(rotation_matrix(forearm_angle, [0, 0, 1]))
        forearm.apply_translation([
            elbow_x + (-0.025 if side == "left" else 0.02),
            0.73,
            -0.035 if side == "left" else 0.025,
        ])
        add(scene, f"forearm_{side}", forearm, DARK)

        hand = trimesh.creation.icosphere(subdivisions=1, radius=0.13)
        hand.apply_scale([0.80, 1.05, 0.70])
        hand.apply_translation([
            elbow_x + (-0.08 if side == "left" else 0.065),
            0.40,
            -0.04 if side == "left" else 0.03,
        ])
        add(scene, f"hand_{side}", hand, BODY)

    waist = lofted_box([
        (0.86, 0.56, 0.29),
        (0.60, 0.50, 0.27),
    ])
    add(scene, "waist", waist, MID)

    hips = trimesh.creation.icosphere(subdivisions=1, radius=0.56)
    hips.apply_scale([1.0, 0.38, 0.48])
    hips.apply_translation([0, 0.45, 0])
    add(scene, "hips", hips, MID)

    for side, x, angle, depth, lateral in [
        ("left", -0.29, -0.035, 0.03, -1),
        ("right", 0.30, 0.045, -0.025, 1),
    ]:
        hip_joint = trimesh.creation.icosphere(subdivisions=1, radius=0.22)
        hip_joint.apply_scale([0.9, 1.0, 0.9])
        hip_joint.apply_translation([x, 0.24, depth])
        add(scene, f"hip_joint_{side}", hip_joint, DARK)

        thigh = y_frustum(radius_top=0.205, radius_bottom=0.17, height=0.72, sections=14)
        thigh.apply_transform(rotation_matrix(angle, [0, 0, 1]))
        thigh.apply_translation([x, -0.11, depth])
        add(scene, f"thigh_{side}", thigh, DARK)

        knee = trimesh.creation.icosphere(subdivisions=1, radius=0.18)
        knee.apply_scale([0.9, 0.82, 0.9])
        knee.apply_translation([x + 0.012 * lateral, -0.49, depth])
        add(scene, f"knee_{side}", knee, DARK)

        shin = y_frustum(radius_top=0.165, radius_bottom=0.135, height=0.74, sections=14)
        shin.apply_transform(rotation_matrix(angle * 0.6, [0, 0, 1]))
        shin.apply_translation([x + 0.018 * lateral, -0.91, depth])
        add(scene, f"shin_{side}", shin, DARK)

        boot = trimesh.creation.box(extents=[0.31, 0.21, 0.52])
        boot.apply_translation([x + 0.032 * lateral, -1.33, -0.055])
        add(scene, f"boot_{side}", boot, DARK)

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

    missing_semantic_nodes = SEMANTIC_NODE_NAMES - set(scene.geometry.keys())
    if missing_semantic_nodes:
        raise RuntimeError(
            "Missing semantic CUE ID nodes: " + ", ".join(sorted(missing_semantic_nodes))
        )

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
