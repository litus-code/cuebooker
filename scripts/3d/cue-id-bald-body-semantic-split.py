import argparse
import os
import numpy as np
import trimesh


def load_mesh(path):
    scene = trimesh.load(path, force="scene")
    if len(scene.geometry) != 1:
        raise RuntimeError(f"Expected one geometry, got {len(scene.geometry)}")
    return next(iter(scene.geometry.values()))


def vertex_rgb(mesh):
    texture = mesh.visual.material.baseColorTexture.convert("RGB")
    image = np.asarray(texture)
    uv = np.asarray(mesh.visual.uv)
    height, width = image.shape[:2]
    x = np.clip((uv[:, 0] * (width - 1)).astype(np.int32), 0, width - 1)
    y = np.clip(((1 - uv[:, 1]) * (height - 1)).astype(np.int32), 0, height - 1)
    return image[y, x]


def semantic_labels(mesh, body):
    vertices = np.asarray(mesh.vertices)
    faces = np.asarray(mesh.faces)
    rgb = vertex_rgb(mesh).astype(np.float32)
    face_centers = vertices[faces].mean(axis=1)
    face_rgb = rgb[faces].mean(axis=1)

    ymin, ymax = vertices[:, 1].min(), vertices[:, 1].max()
    yn = (face_centers[:, 1] - ymin) / (ymax - ymin)
    brightness = face_rgb.mean(axis=1)

    # A neutral bald base deliberately has no hair semantic. Brows, lashes and
    # other facial texture details remain part of skin until a dedicated face
    # material pass is authored.
    labels = np.full(len(faces), "skin", dtype=object)

    if body == "male":
        underwear = (yn > 0.48) & (yn < 0.66) & (brightness < 82)
    else:
        underwear = (
            (((yn > 0.63) & (yn < 0.76)) | ((yn > 0.46) & (yn < 0.61)))
            & (brightness < 82)
        )

    labels[underwear] = "underwear"
    return labels


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--body", choices=["male", "female"], required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    mesh = load_mesh(args.input)
    labels = semantic_labels(mesh, args.body)

    scene = trimesh.Scene()

    for group in ("skin", "underwear"):
        face_ids = np.where(labels == group)[0]
        if not len(face_ids):
            continue

        submesh = mesh.submesh([face_ids], append=True, repair=False)
        submesh.metadata["cue_semantic"] = group

        name = f"cue_{args.body}_{group}"
        scene.add_geometry(submesh, geom_name=name, node_name=name)

        print(group, len(submesh.vertices), len(submesh.faces))

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    scene.export(args.output)

    check = trimesh.load(args.output, force="scene")
    print("roundtrip geometries", list(check.geometry.keys()))
    print("triangles", sum(len(geometry.faces) for geometry in check.geometry.values()))


if __name__ == "__main__":
    main()
