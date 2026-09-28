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
    baseColorFactor=[58 / 255, 64 / 255, 58 / 255, 1.0],
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
    baseColorFactor=[38 / 255, 42 / 255, 38 / 255, 1.0],
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
    "hip_joint_left",
    "hip_joint_right",
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
    "outfit_tee_sleeve_left",
    "outfit_tee_sleeve_right",
    "outfit_hoodie_upper_sleeve_left",
    "outfit_hoodie_upper_sleeve_right",
    "outfit_hoodie_forearm_sleeve_left",
    "outfit_hoodie_forearm_sleeve_right",
    "outfit_bomber_upper_sleeve_left",
    "outfit_bomber_upper_sleeve_right",
    "outfit_bomber_forearm_sleeve_left",
    "outfit_bomber_forearm_sleeve_right",
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
    for ring in rings:
        y, width, depth = ring[:3]
        z_offset = ring[3] if len(ring) > 3 else 0.0
        for angle in np.linspace(0, 2 * np.pi, radial_sections, endpoint=False):
            vertices.append([
                width * np.cos(angle),
                y,
                z_offset + depth * np.sin(angle),
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


def garment_sleeve(rings, angle, translation):
    sleeve = elliptical_loft(
        rings,
        radial_sections=PROFILE["radial_sections"],
    )
    sleeve.apply_transform(rotation_matrix(angle, [0, 0, 1]))
    sleeve.apply_translation(translation)
    return sleeve


def build():
    scene = trimesh.Scene()

    head = elliptical_loft([
        (2.84, 0.17, 0.185,  0.010),
        (2.74, 0.275, 0.230, 0.004),
        (2.59, 0.325, 0.270, -0.010),
        (2.45, 0.335, 0.282, -0.026),
        (2.32, 0.292, 0.252, -0.040),
        (2.20, 0.222, 0.205, -0.052),
        (2.10, 0.148, 0.168, -0.060),
    ], radial_sections=PROFILE["head_sections"])
    add(scene, "head", head, BODY)

    for side, x in (("left", -0.335), ("right", 0.335)):
        ear = trimesh.creation.icosphere(
            subdivisions=PROFILE["sphere_subdivisions"],
            radius=0.085,
        )
        ear.apply_scale([0.42, 0.95, 0.55])
        ear.apply_translation([x, 2.43, -0.028])
        add(scene, f"ear_{side}", ear, BODY)

    neck = y_frustum(radius_top=0.145, radius_bottom=0.18, height=0.32, sections=PROFILE["radial_sections"])
    neck.apply_translation([0, 2.02, 0])
    add(scene, "neck", neck, MID)

    clavicle = elliptical_loft([
        (2.00, 0.28, 0.19),
        (1.94, 0.46, 0.245),
        (1.86, 0.62, 0.292),
        (1.76, 0.695, 0.315),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "clavicle", clavicle, DARK)

    torso = elliptical_loft([
        (1.93, 0.63, 0.285),
        (1.82, 0.69, 0.318),
        (1.66, 0.715, 0.338),
        (1.48, 0.695, 0.345),
        (1.24, 0.655, 0.332),
        (1.02, 0.595, 0.305),
        (0.78, 0.515, 0.276),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "torso", torso, BODY)

    tee = elliptical_loft([
        (1.92, 0.67, 0.325),
        (1.84, 0.75, 0.355),
        (1.70, 0.785, 0.372),
        (1.50, 0.75, 0.365),
        (1.20, 0.675, 0.345),
        (0.98, 0.625, 0.325),
        (0.82, 0.585, 0.305),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "tee_volume", tee, DARK)

    seam = trimesh.creation.box(extents=[0.82, 0.028, 0.036])
    seam.apply_translation([0, 1.53, -0.348])
    add(scene, "accent_seam", seam, LIME)

    tank = elliptical_loft([
        (1.79, 0.43, 0.285),
        (1.67, 0.49, 0.305),
        (1.48, 0.545, 0.322),
        (1.20, 0.575, 0.315),
        (0.96, 0.555, 0.300),
        (0.82, 0.525, 0.282),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "outfit_tank", tank, DARK)

    tank_accent = trimesh.creation.box(extents=[0.62, 0.026, 0.034])
    tank_accent.apply_translation([0, 1.40, -0.328])
    add(scene, "outfit_tank_accent", tank_accent, LIME)

    hoodie = elliptical_loft([
        (1.97, 0.72, 0.370),
        (1.88, 0.79, 0.405),
        (1.74, 0.845, 0.425),
        (1.52, 0.825, 0.418),
        (1.22, 0.765, 0.395),
        (0.98, 0.705, 0.365),
        (0.76, 0.655, 0.340),
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
        (1.91, 0.70, 0.365),
        (1.83, 0.80, 0.410),
        (1.69, 0.885, 0.442),
        (1.48, 0.855, 0.432),
        (1.24, 0.785, 0.405),
        (1.06, 0.705, 0.368),
        (0.96, 0.605, 0.330),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "outfit_bomber", bomber, DARK)

    bomber_collar = trimesh.creation.torus(
        major_radius=0.25,
        minor_radius=0.060,
        major_sections=PROFILE["torus_major"],
        minor_sections=PROFILE["torus_minor"],
    )
    bomber_collar.apply_transform(rotation_matrix(np.pi / 2, [1, 0, 0]))
    bomber_collar.apply_translation([0, 1.90, 0.015])
    add(scene, "outfit_bomber_collar", bomber_collar, MID)

    bomber_accent = trimesh.creation.box(extents=[0.74, 0.028, 0.036])
    bomber_accent.apply_translation([0, 1.32, -0.402])
    add(scene, "outfit_bomber_accent", bomber_accent, LIME)

    arm_specs = [
        ("left", -0.72, 0.085, -0.105),
        ("right", 0.72, -0.040, 0.070),
    ]

    for side, x, upper_angle, forearm_angle in arm_specs:
        lateral_upper = -0.015 if side == "left" else 0.010
        elbow_x = x + (-0.045 if side == "left" else 0.035)
        lateral_forearm = -0.025 if side == "left" else 0.020
        forearm_depth = -0.035 if side == "left" else 0.025

        tee_sleeve = garment_sleeve(
            [
                (0.16, 0.205, 0.180),
                (0.00, 0.195, 0.172),
                (-0.16, 0.178, 0.158),
            ],
            upper_angle,
            [x + lateral_upper, 1.55, 0],
        )
        add(scene, f"outfit_tee_sleeve_{side}", tee_sleeve, DARK)

        hoodie_upper_sleeve = garment_sleeve(
            [
                (0.31, 0.205, 0.185),
                (0.02, 0.195, 0.175),
                (-0.31, 0.170, 0.150),
            ],
            upper_angle,
            [x + lateral_upper, 1.37, 0],
        )
        add(scene, f"outfit_hoodie_upper_sleeve_{side}", hoodie_upper_sleeve, DARK)

        hoodie_forearm_sleeve = garment_sleeve(
            [
                (0.29, 0.170, 0.150),
                (0.02, 0.158, 0.142),
                (-0.29, 0.128, 0.116),
            ],
            forearm_angle,
            [elbow_x + lateral_forearm, 0.73, forearm_depth],
        )
        add(scene, f"outfit_hoodie_forearm_sleeve_{side}", hoodie_forearm_sleeve, DARK)

        bomber_upper_sleeve = garment_sleeve(
            [
                (0.31, 0.220, 0.198),
                (0.02, 0.210, 0.190),
                (-0.31, 0.178, 0.160),
            ],
            upper_angle,
            [x + lateral_upper, 1.37, 0],
        )
        add(scene, f"outfit_bomber_upper_sleeve_{side}", bomber_upper_sleeve, DARK)

        bomber_forearm_sleeve = garment_sleeve(
            [
                (0.29, 0.180, 0.162),
                (0.02, 0.168, 0.150),
                (-0.29, 0.136, 0.122),
            ],
            forearm_angle,
            [elbow_x + lateral_forearm, 0.73, forearm_depth],
        )
        add(scene, f"outfit_bomber_forearm_sleeve_{side}", bomber_forearm_sleeve, DARK)

        shoulder = elliptical_loft([
            (0.13, 0.145, 0.122),
            (0.03, 0.158, 0.132),
            (-0.13, 0.142, 0.118),
        ], radial_sections=PROFILE["radial_sections"])
        shoulder.apply_transform(rotation_matrix(
            upper_angle * 0.22,
            [0, 0, 1],
        ))
        shoulder.apply_translation([x, 1.70, 0])
        add(scene, f"shoulder_{side}", shoulder, DARK)

        upper = elliptical_loft([
            (0.29, 0.17, 0.15),
            (0.02, 0.16, 0.14),
            (-0.29, 0.14, 0.12),
        ], radial_sections=PROFILE["radial_sections"])
        upper.apply_transform(rotation_matrix(upper_angle, [0, 0, 1]))
        upper.apply_translation([x + (-0.015 if side == "left" else 0.010), 1.37, 0])
        add(scene, f"upper_arm_{side}", upper, DARK)

        elbow = elliptical_loft([
            (0.10, 0.095, 0.088),
            (0.02, 0.102, 0.092),
            (-0.09, 0.090, 0.082),
        ], radial_sections=PROFILE["radial_sections"])
        elbow.apply_transform(rotation_matrix(
            upper_angle * 0.35,
            [0, 0, 1],
        ))
        elbow.apply_translation([elbow_x, 1.05, 0])
        add(scene, f"elbow_{side}", elbow, DARK)

        forearm = elliptical_loft([
            (0.28, 0.14, 0.125),
            (0.02, 0.13, 0.115),
            (-0.28, 0.108, 0.10),
        ], radial_sections=PROFILE["radial_sections"])
        forearm.apply_transform(rotation_matrix(forearm_angle, [0, 0, 1]))
        forearm.apply_translation([
            elbow_x + lateral_forearm,
            0.73,
            forearm_depth,
        ])
        add(scene, f"forearm_{side}", forearm, DARK)

        hand = elliptical_loft([
            (0.14, 0.105, 0.082),
            (0.02, 0.112, 0.080),
            (-0.12, 0.085, 0.062),
        ], radial_sections=PROFILE["radial_sections"])
        hand.apply_transform(rotation_matrix(
            -0.055 if side == "left" else 0.045,
            [0, 0, 1],
        ))
        hand.apply_translation([
            elbow_x + (-0.075 if side == "left" else 0.060),
            0.39,
            -0.038 if side == "left" else 0.028,
        ])
        add(scene, f"hand_{side}", hand, BODY)

    waist = elliptical_loft([
        (0.86, 0.505, 0.265),
        (0.76, 0.480, 0.255),
        (0.66, 0.455, 0.248),
        (0.58, 0.445, 0.242),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "waist", waist, MID)

    hips = elliptical_loft([
        (0.68, 0.455, 0.248),
        (0.58, 0.485, 0.265),
        (0.46, 0.505, 0.278),
        (0.34, 0.490, 0.272),
        (0.22, 0.445, 0.252),
    ], radial_sections=PROFILE["radial_sections"])
    add(scene, "hips", hips, MID)

    for side, x, angle, depth, lateral in [
        ("left", -0.29, -0.035, 0.03, -1),
        ("right", 0.30, 0.045, -0.025, 1),
    ]:
        hip_joint = elliptical_loft([
            (0.14, 0.138, 0.126),
            (0.03, 0.148, 0.132),
            (-0.14, 0.132, 0.118),
        ], radial_sections=PROFILE["radial_sections"])
        hip_joint.apply_transform(rotation_matrix(
            angle * 0.30,
            [0, 0, 1],
        ))
        hip_joint.apply_translation([x, 0.23, depth])
        add(scene, f"hip_joint_{side}", hip_joint, DARK)

        thigh = elliptical_loft([
            (0.42, 0.205, 0.18),
            (0.10, 0.192, 0.168),
            (-0.42, 0.158, 0.140),
        ], radial_sections=PROFILE["radial_sections"])
        thigh.apply_transform(rotation_matrix(angle, [0, 0, 1]))
        thigh.apply_translation([x, -0.18, depth])
        add(scene, f"thigh_{side}", thigh, DARK)

        knee = elliptical_loft([
            (0.105, 0.112, 0.100),
            (0.018, 0.118, 0.106),
            (-0.105, 0.106, 0.094),
        ], radial_sections=PROFILE["radial_sections"])
        knee.apply_transform(rotation_matrix(
            angle * 0.35,
            [0, 0, 1],
        ))
        knee.apply_translation([x + 0.012 * lateral, -0.62, depth])
        add(scene, f"knee_{side}", knee, DARK)

        shin = elliptical_loft([
            (0.44, 0.160, 0.145),
            (0.10, 0.148, 0.135),
            (-0.44, 0.122, 0.108),
        ], radial_sections=PROFILE["radial_sections"])
        shin.apply_transform(rotation_matrix(angle * 0.6, [0, 0, 1]))
        shin.apply_translation([x + 0.018 * lateral, -1.10, depth])
        add(scene, f"shin_{side}", shin, DARK)

        boot = lofted_box([
            (0.12, 0.145, 0.155),
            (0.02, 0.150, 0.170),
            (-0.08, 0.155, 0.205),
            (-0.14, 0.148, 0.245),
        ])
        boot.apply_transform(rotation_matrix(
            -0.015 * lateral,
            [0, 0, 1],
        ))
        boot.apply_translation([x + 0.032 * lateral, -1.60, -0.050])
        add(scene, f"boot_{side}", boot, DARK)

    # restrained DJ cue: headphones around the neck, not gaming-headset styling
    band = trimesh.creation.torus(
        major_radius=0.335,
        minor_radius=0.038,
        major_sections=PROFILE["torus_major"],
        minor_sections=PROFILE["torus_minor"],
    )
    band.apply_transform(rotation_matrix(np.pi / 2, [1, 0, 0]))
    band.apply_translation([0, 2.035, 0.015])
    add(scene, "accessory_headphones_band", band, DARK)

    for side, x in (("left", -0.35), ("right", 0.35)):
        cup = trimesh.creation.cylinder(
            radius=0.105,
            height=0.072,
            sections=PROFILE["cup_sections"],
        )
        cup.apply_transform(rotation_matrix(np.pi / 2, [0, 1, 0]))
        cup.apply_translation([x * 0.94, 1.965, 0.018])
        add(scene, f"accessory_headphones_cup_{side}", cup, DARK)

    cap = trimesh.creation.icosphere(subdivisions=PROFILE["sphere_subdivisions"], radius=0.33)
    cap.apply_scale([1.02, 0.30, 0.92])
    cap.apply_translation([0, 2.785, 0.015])
    add(scene, "accessory_cap_crown", cap, DARK)

    cap_brim = trimesh.creation.box(extents=[0.40, 0.038, 0.25])
    cap_brim.apply_translation([0, 2.705, -0.255])
    add(scene, "accessory_cap_brim", cap_brim, DARK)

    for side, x in (("left", -0.17), ("right", 0.17)):
        lens = trimesh.creation.torus(
            major_radius=0.135,
            minor_radius=0.015,
            major_sections=PROFILE["glasses_major"],
            minor_sections=PROFILE["glasses_minor"],
        )
        lens.apply_scale([1.12, 0.74, 1.0])
        lens.apply_translation([x, 2.485, -0.292])
        add(scene, f"accessory_glasses_{side}", lens, DARK)

    bridge = trimesh.creation.box(extents=[0.10, 0.018, 0.020])
    bridge.apply_translation([0, 2.485, -0.292])
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
