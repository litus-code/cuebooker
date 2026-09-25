import argparse, json, os
from pathlib import Path
import numpy as np
import trimesh
from PIL import Image, ImageDraw

COLORS = {
    "skin": (235, 178, 142),
    "hair": (48, 36, 31),
    "underwear": (38, 38, 42),
    "eyes_details": (84, 170, 235),
    "other": (170, 170, 170),
}

def load_mesh(path):
    scene = trimesh.load(path, force="scene")
    if len(scene.geometry) != 1:
        raise RuntimeError(f"Expected one Meshy geometry, got {len(scene.geometry)}")
    return next(iter(scene.geometry.values()))

def sample_vertex_rgb(mesh):
    texture = mesh.visual.material.baseColorTexture.convert("RGB")
    image = np.asarray(texture)
    uv = np.asarray(mesh.visual.uv)
    height, width = image.shape[:2]
    x = np.clip((uv[:, 0] * (width - 1)).astype(np.int32), 0, width - 1)
    y = np.clip(((1 - uv[:, 1]) * (height - 1)).astype(np.int32), 0, height - 1)
    return image[y, x]

def classify(mesh, body):
    vertices = np.asarray(mesh.vertices)
    faces = np.asarray(mesh.faces)
    rgb = sample_vertex_rgb(mesh).astype(np.float32)
    face_centers = vertices[faces].mean(axis=1)
    face_rgb = rgb[faces].mean(axis=1)

    ymin, ymax = vertices[:, 1].min(), vertices[:, 1].max()
    yn = (face_centers[:, 1] - ymin) / (ymax - ymin)

    brightness = face_rgb.mean(axis=1)
    chroma = face_rgb.max(axis=1) - face_rgb.min(axis=1)
    skinlike = (
        (face_rgb[:, 0] > face_rgb[:, 1] * 1.18)
        & (face_rgb[:, 1] > face_rgb[:, 2] * 1.08)
        & (brightness > 70)
    )
    dark = brightness < 72
    whiteish = (brightness > 170) & (chroma < 45)

    labels = np.full(len(faces), "other", dtype=object)
    labels[skinlike] = "skin"

    head = yn > 0.78
    labels[head & dark] = "hair"

    if body == "male":
        underwear_band = (yn > 0.48) & (yn < 0.66)
    else:
        bra = (yn > 0.63) & (yn < 0.76)
        brief = (yn > 0.46) & (yn < 0.61)
        underwear_band = bra | brief

    labels[underwear_band & dark] = "underwear"

    eye_zone = (yn > 0.80) & (yn < 0.91) & (np.abs(face_centers[:, 0]) < 0.11)
    labels[eye_zone & whiteish] = "eyes_details"

    return labels, face_centers

def make_preview(mesh, labels, face_centers, out_path, title):
    width, height = 900, 1200
    xmin, xmax = mesh.bounds[:, 0]
    ymin, ymax = mesh.bounds[:, 1]
    order = np.argsort(face_centers[:, 2])[::-1]

    image = Image.new("RGB", (width, height), (18, 20, 23))
    draw = ImageDraw.Draw(image)

    step = max(1, len(order) // 160000)
    for index in order[::step]:
        x = int(30 + (face_centers[index, 0] - xmin) / (xmax - xmin) * (width - 60))
        y = int(height - 30 - (face_centers[index, 1] - ymin) / (ymax - ymin) * (height - 80))
        draw.point((x, y), fill=COLORS.get(labels[index], COLORS["other"]))

    draw.rectangle((0, 0, width, 42), fill=(0, 0, 0))
    draw.text((16, 12), title, fill="white")

    legend_y = 55
    for label, color in COLORS.items():
        draw.rectangle((15, legend_y, 35, legend_y + 20), fill=color)
        draw.text((45, legend_y + 2), label, fill="white")
        legend_y += 28

    image.save(out_path)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--body", choices=["male", "female"], required=True)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)
    mesh = load_mesh(args.input)
    labels, face_centers = classify(mesh, args.body)

    counts = {key: int(np.sum(labels == key)) for key in COLORS}
    total = len(labels)
    report = {
        "body": args.body,
        "source": os.path.basename(args.input),
        "vertices": int(len(mesh.vertices)),
        "triangles": int(len(mesh.faces)),
        "bounds": mesh.bounds.tolist(),
        "semanticFaces": counts,
        "semanticPct": {key: round(value * 100 / total, 2) for key, value in counts.items()},
        "status": "audit-only",
        "modifiesGeometry": False,
        "notes": [
            "Heuristic semantic segmentation from PBR base color + normalized body position.",
            "Requires visual approval before creating material slots or removing default hair.",
        ],
    }

    Path(args.output_dir, f"{args.body}-semantic-audit.json").write_text(
        json.dumps(report, indent=2)
    )
    make_preview(
        mesh,
        labels,
        face_centers,
        str(Path(args.output_dir, f"{args.body}-semantic-front.png")),
        f"CUE ID {args.body.upper()} semantic audit",
    )

    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
