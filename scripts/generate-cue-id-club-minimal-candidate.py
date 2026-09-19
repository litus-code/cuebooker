import argparse
import json
from pathlib import Path

import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

QUALITY_PROFILES = {
    "light": {
        "suffix": "",
        "radial_sections": 14,
        "head_sections": 16,
        "sphere_subdivisions": 1,
        "torus_major": 20,
        "torus_minor": 8,
        "glasses_major": 18,
        "glasses_minor": 6,
        "cup_sections": 12,
    },
    "medium": {
        "suffix": "-medium",
        "radial_sections": 24,
        "head_sections": 24,
        "sphere_subdivisions": 2,
        "torus_major": 28,
        "torus_minor": 10,
        "glasses_major": 24,
        "glasses_minor": 8,
        "cup_sections": 18,
    },
    "high": {
        "suffix": "-high",
        "radial_sections": 32,
        "head_sections": 32,
        "sphere_subdivisions": 3,
        "torus_major": 36,
        "torus_minor": 12,
        "glasses_major": 32,
        "glasses_minor": 10,
        "cup_sections": 24,
    },
}


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--quality",
        choices=tuple(QUALITY_PROFILES),
        default="light",
    )
    return parser.parse_args()


ARGS = parse_args()
QUALITY = ARGS.quality
PROFILE = QUALITY_PROFILES[QUALITY]
SUFFIX = PROFILE["suffix"]
OUT = Path(f"public/cue-id/candidates/club-minimal-candidate{SUFFIX}-v1.glb")
META = Path(f"public/cue-id/candidates/club-minimal-candidate{SUFFIX}-v1.json")

BODY = PBRMaterial(
    name="body",
    baseColorFactor=[70 / 255, 76 / 255, 70 / 255, 1.0],
    metallicFactor=0.02,
    roughnessFactor=0.82,
)
DARK = PBRMaterial(
    name="dark",
    baseColorFactor=[22 / 255, 24 / 255, 22 / 255, 1.0],
    metallicFactor=0.02,
    roughnessFactor=0.86,
)
MID = PBRMaterial(
    name="mid",
    baseColorFactor=[48 / 255, 52 / 255, 48 / 255, 1.0],
    metallicFactor=0.03,
    roughnessFactor=0.80,
)
LIME = PBRMaterial(
    name="accent",
    baseColorFactor=[206 / 255, 1.0, 84 / 255, 1.0],
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

SEMANTIC_OUTFIT_NODE_NAMES = {
    "tee_volume",
    "accent_seam",
    "outfit_tank",
    "outfit_tank_accent",
    "outfit_hoodie",
    "outfit_hood",
    "outfit_hoodie_accent",
    "outfit_bomber",
    "outfit_bomber_collar",
    "outfit_bomber_accent",
}

SEMANTIC_ACCESSORY_NODE_NAMES = {
    "accessory_headphones_band",
    "accessory_headphones_cup_left",
    "accessory_headphones_cup_right",
    "accessory_cap_crown",
    "accessory_cap_brim",
    "accessory_glasses_left",
    "accessory_glasses_right",
    "accessory_glasses_bridge",
}


def add(scene, name, mesh, material):
    mesh = mesh.copy()
    mesh.visual = TextureVisuals(material=material)
    scene.add_geometry(mesh, node_name=name, geom_name=name)


def y_cylinder(radius, height, sections=None):
    sections = sections or PROFILE["radial_sections"]
    mesh = trimesh.creation.cylinder(radius=radius, height=height, sections=sections)
    mesh.apply_transform(rotation_matrix(np.pi / 2, [1, 0, 0]))
    return mesh


def y_frustum(radius_top, radius_bottom, height, sections=None):
    sections = sections or PROFILE["radial_sections"]
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


def elliptical_loft(rings, radial_sections=None):
    radial_sections = radial_sections or PROFILE["head_sections"]
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
    ], radial_sections=PROFILE["head_sections"])
    add(scene, "head", head, BODY)

    neck = y_frustum(radius_top=0.145, radius_bottom=0.18, height=0.32, sections=PROFILE["radial_sections"])
    neck.apply_translation([0, 2.02, 0])
    add(scene, "neck", neck, MID)

    clavicle = lofted_box([
        (2.00, 0.30, 0.20),
        (1.88, 0.64, 0.30),
        (1.78, 0.70, 0.32),
    ])
    add(scene, "clavicle", clavicle, DARK)

    torso = elliptical_loft([
        (1.92, 0.66, 0.30),
        (1.78, 0.72, 0.33),
        (1.52, 0.69, 0.34),
        (1.16, 0.62, 0.32),
        (0.78, 0.53, 0.28),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "torso", torso, BODY)

    tee = elliptical_loft([
        (1.91, 0.76, 0.36),
        (1.74, 0.79, 0.37),
        (1.48, 0.72, 0.36),
        (1.12, 0.65, 0.34),
        (0.82, 0.58, 0.31),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "tee_volume", tee, DARK)

    seam = trimesh.creation.box(extents=[0.82, 0.028, 0.036])
    seam.apply_translation([0, 1.53, -0.348])
    add(scene, "accent_seam", seam, LIME)

    tank = elliptical_loft([
        (1.74, 0.54, 0.32),
        (1.52, 0.58, 0.32),
        (1.16, 0.58, 0.31),
        (0.82, 0.55, 0.29),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "outfit_tank", tank, DARK)

    tank_accent = trimesh.creation.box(extents=[0.62, 0.026, 0.034])
    tank_accent.apply_translation([0, 1.40, -0.328])
    add(scene, "outfit_tank_accent", tank_accent, LIME)

    hoodie = elliptical_loft([
        (1.94, 0.80, 0.39),
        (1.72, 0.82, 0.40),
        (1.48, 0.76, 0.38),
        (1.10, 0.68, 0.35),
        (0.78, 0.62, 0.33),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "outfit_hoodie", hoodie, DARK)

    hood = trimesh.creation.torus(
        major_radius=0.29,
        minor_radius=0.085,
        major_sections=PROFILE["torus_major"],
        minor_sections=PROFILE["torus_minor"],
    )
    hood.apply_transform(rotation_matrix(np.pi / 2, [1, 0, 0]))
    hood.apply_translation([0, 1.99, 0.11])
    add(scene, "outfit_hood", hood, DARK)

    hoodie_accent = trimesh.creation.box(extents=[0.70, 0.028, 0.036])
    hoodie_accent.apply_translation([0, 1.35, -0.392])
    add(scene, "outfit_hoodie_accent", hoodie_accent, LIME)

    bomber = elliptical_loft([
        (1.90, 0.82, 0.40),
        (1.72, 0.85, 0.41),
        (1.46, 0.80, 0.40),
        (1.12, 0.71, 0.36),
        (0.92, 0.63, 0.34),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "outfit_bomber", bomber, DARK)

    bomber_collar = trimesh.creation.torus(
        major_radius=0.25,
        minor_radius=0.060,
        major_sections=PROFILE["torus_major"],
        minor_sections=PROFILE["torus_minor"],
    )
    bomber_collar.apply_transform(rotation_matrix(np.pi / 2, [1, 0, 0]))
    bomber_collar.apply_translation([0, 1.91, 0.01])
    add(scene, "outfit_bomber_collar", bomber_collar, MID)

    bomber_accent = trimesh.creation.box(extents=[0.74, 0.028, 0.036])
    bomber_accent.apply_translation([0, 1.32, -0.402])
    add(scene, "outfit_bomber_accent", bomber_accent, LIME)

    arm_specs = [
        ("left", -0.83, 0.10, -0.12),
        ("right", 0.83, -0.05, 0.08),
    ]
    for side, x, upper_angle, forearm_angle in arm_specs:
        shoulder = trimesh.creation.icosphere(subdivisions=PROFILE["sphere_subdivisions"], radius=0.205)
        shoulder.apply_scale([1.0, 0.92, 0.86])
        shoulder.apply_translation([x, 1.73, 0])
        add(scene, f"shoulder_{side}", shoulder, DARK)

        upper = y_frustum(radius_top=0.17, radius_bottom=0.145, height=0.58, sections=PROFILE["radial_sections"])
        upper.apply_transform(rotation_matrix(upper_angle, [0, 0, 1]))
        upper.apply_translation([x + (-0.018 if side == "left" else 0.012), 1.39, 0])
        add(scene, f"upper_arm_{side}", upper, DARK)

        elbow_x = x + (-0.055 if side == "left" else 0.04)
        elbow = trimesh.creation.icosphere(subdivisions=PROFILE["sphere_subdivisions"], radius=0.132)
        elbow.apply_scale([0.92, 0.88, 0.86])
        elbow.apply_translation([elbow_x, 1.05, 0])
        add(scene, f"elbow_{side}", elbow, DARK)

        forearm = y_frustum(radius_top=0.14, radius_bottom=0.115, height=0.56, sections=PROFILE["radial_sections"])
        forearm.apply_transform(rotation_matrix(forearm_angle, [0, 0, 1]))
        forearm.apply_translation([
            elbow_x + (-0.025 if side == "left" else 0.02),
            0.73,
            -0.035 if side == "left" else 0.025,
        ])
        add(scene, f"forearm_{side}", forearm, DARK)

        hand = trimesh.creation.icosphere(subdivisions=PROFILE["sphere_subdivisions"], radius=0.13)
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

    hips = elliptical_loft([
        (0.66, 0.50, 0.27),
        (0.52, 0.56, 0.30),
        (0.38, 0.55, 0.30),
        (0.24, 0.48, 0.27),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "hips", hips, MID)

    for side, x, angle, depth, lateral in [
        ("left", -0.29, -0.035, 0.03, -1),
        ("right", 0.30, 0.045, -0.025, 1),
    ]:
        hip_joint = trimesh.creation.icosphere(subdivisions=PROFILE["sphere_subdivisions"], radius=0.185)
        hip_joint.apply_scale([0.88, 1.0, 0.88])
        hip_joint.apply_translation([x, 0.24, depth])
        add(scene, f"hip_joint_{side}", hip_joint, DARK)

        thigh = y_frustum(radius_top=0.205, radius_bottom=0.17, height=0.72, sections=PROFILE["radial_sections"])
        thigh.apply_transform(rotation_matrix(angle, [0, 0, 1]))
        thigh.apply_translation([x, -0.11, depth])
        add(scene, f"thigh_{side}", thigh, DARK)

        knee = trimesh.creation.icosphere(subdivisions=PROFILE["sphere_subdivisions"], radius=0.15)
        knee.apply_scale([0.90, 0.82, 0.88])
        knee.apply_translation([x + 0.012 * lateral, -0.49, depth])
        add(scene, f"knee_{side}", knee, DARK)

        shin = y_frustum(radius_top=0.165, radius_bottom=0.135, height=0.74, sections=PROFILE["radial_sections"])
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
        major_sections=PROFILE["torus_major"],
        minor_sections=PROFILE["torus_minor"],
    )
    band.apply_transform(rotation_matrix(np.pi / 2, [1, 0, 0]))
    band.apply_translation([0, 2.05, 0.02])
    add(scene, "accessory_headphones_band", band, DARK)

    for side, x in (("left", -0.35), ("right", 0.35)):
        cup = trimesh.creation.cylinder(
            radius=0.12,
            height=0.08,
            sections=PROFILE["cup_sections"],
        )
        cup.apply_transform(rotation_matrix(np.pi / 2, [0, 1, 0]))
        cup.apply_translation([x, 1.98, 0.02])
        add(scene, f"accessory_headphones_cup_{side}", cup, DARK)

    cap = trimesh.creation.icosphere(subdivisions=PROFILE["sphere_subdivisions"], radius=0.34)
    cap.apply_scale([1.05, 0.34, 0.95])
    cap.apply_translation([0, 2.79, 0])
    add(scene, "accessory_cap_crown", cap, DARK)

    cap_brim = trimesh.creation.box(extents=[0.42, 0.05, 0.28])
    cap_brim.apply_translation([0, 2.71, -0.26])
    add(scene, "accessory_cap_brim", cap_brim, DARK)

    for side, x in (("left", -0.17), ("right", 0.17)):
        lens = trimesh.creation.torus(
            major_radius=0.14,
            minor_radius=0.018,
            major_sections=PROFILE["glasses_major"],
            minor_sections=PROFILE["glasses_minor"],
        )
        lens.apply_translation([x, 2.49, -0.295])
        add(scene, f"accessory_glasses_{side}", lens, DARK)

    bridge = trimesh.creation.box(extents=[0.12, 0.025, 0.025])
    bridge.apply_translation([0, 2.49, -0.295])
    add(scene, "accessory_glasses_bridge", bridge, DARK)

    required_nodes = (
        SEMANTIC_NODE_NAMES
        | SEMANTIC_OUTFIT_NODE_NAMES
        | SEMANTIC_ACCESSORY_NODE_NAMES
    )
    missing_semantic_nodes = required_nodes - set(scene.geometry.keys())
    if missing_semantic_nodes:
        raise RuntimeError(
            "Missing semantic CUE ID nodes: " + ", ".join(sorted(missing_semantic_nodes))
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    scene.export(OUT)

    triangles = sum(len(geometry.faces) for geometry in scene.geometry.values())
    vertices = sum(len(geometry.vertices) for geometry in scene.geometry.values())

    metadata = {
        "id": f"club-minimal-candidate-{QUALITY}-v1",
        "purpose": "candidate",
        "quality": QUALITY,
        "generator": "Cuebooker procedural Club Minimal generator",
        "bytes": OUT.stat().st_size,
        "triangles": triangles,
        "vertices": vertices,
        "materials": 4,
        "embeddedMaterials": 4,
        "runtimeMaterials": 4,
        "materialStrategy": "embedded_shared_pbr_mutated_runtime",
        "textures": 0,
        "artDirection": "club_minimal_v1",
        "status": "candidate_not_production",
    }
    META.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metadata))


if __name__ == "__main__":
    build()
