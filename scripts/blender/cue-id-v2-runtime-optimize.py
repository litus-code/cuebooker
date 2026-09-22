import bpy
import json
import os
import sys

def arg(flag, default=None):
    if "--" not in sys.argv:
        return default
    values = sys.argv[sys.argv.index("--") + 1:]
    try:
        index = values.index(flag)
    except ValueError:
        return default
    return values[index + 1] if index + 1 < len(values) else default

input_path = arg("--input")
body = arg("--body")
output_path = arg("--output")
max_texture = int(arg("--max-texture", "1024"))

if not input_path or not output_path:
    raise SystemExit("--input and --output are required")
if body not in {"male", "female"}:
    raise SystemExit("--body must be male or female")

bpy.ops.wm.open_mainfile(filepath=os.path.abspath(input_path))

rig = bpy.data.objects.get("cue_rig")
skin = bpy.data.objects.get(f"cue_{body}_skin")
underwear = bpy.data.objects.get(f"cue_{body}_underwear")

if not rig or not skin or not underwear:
    raise RuntimeError("Expected cue_rig + V2 skin/underwear semantic meshes")

# Freeze runtime export in a clean neutral state.
if rig.animation_data:
    rig.animation_data.action = None
    for track in rig.animation_data.nla_tracks:
        track.mute = True

for pose_bone in rig.pose.bones:
    pose_bone.location = (0.0, 0.0, 0.0)
    pose_bone.rotation_mode = "QUATERNION"
    pose_bone.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
    pose_bone.scale = (1.0, 1.0, 1.0)

bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()

image_report = []
for image in bpy.data.images:
    if image.source != "FILE" and not image.packed_file:
        continue
    width, height = image.size
    if width <= 0 or height <= 0:
        continue

    before = [int(width), int(height)]
    largest = max(width, height)

    if largest > max_texture:
        scale = max_texture / float(largest)
        target_w = max(1, int(round(width * scale)))
        target_h = max(1, int(round(height * scale)))
        image.scale(target_w, target_h)
        try:
            image.pack()
        except RuntimeError:
            pass

    image_report.append({
        "name": image.name,
        "before": before,
        "after": [int(image.size[0]), int(image.size[1])]
    })

bpy.ops.object.select_all(action="DESELECT")
for obj in (rig, skin, underwear):
    obj.select_set(True)
bpy.context.view_layer.objects.active = rig

output_path = os.path.abspath(output_path)
os.makedirs(os.path.dirname(output_path), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format="GLB",
    use_selection=True,
    export_yup=True,
    export_apply=False,
    export_skins=True,
    export_animations=False,
    export_morph=False,
    export_cameras=False,
    export_lights=False,
    export_extras=False,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
)

report = {
    "status": "cue-id-v2-runtime-medium-candidate",
    "body": body,
    "geometryChanged": False,
    "rigChanged": False,
    "weightsChanged": False,
    "animationsExported": False,
    "maxTexture": max_texture,
    "images": image_report,
    "bytes": os.path.getsize(output_path),
    "productionReady": False,
    "notes": [
        "Runtime optimization candidate only.",
        "Body geometry, rest rig and skin weights are unchanged.",
        "Only texture resolution and delivery encoding are optimized.",
        "Must pass visual comparison in /cue-id before replacing the current lab asset."
    ]
}

report_path = os.path.splitext(output_path)[0] + ".optimization-report.json"
with open(report_path, "w", encoding="utf-8") as handle:
    json.dump(report, handle, indent=2)
    handle.write("\n")

print(json.dumps(report, indent=2))
