import bpy
import os
import sys

def arg(flag: str):
    if "--" not in sys.argv:
        return None
    values = sys.argv[sys.argv.index("--") + 1:]
    try:
        index = values.index(flag)
    except ValueError:
        return None
    return values[index + 1] if index + 1 < len(values) else None

body = arg("--body")
output = arg("--output")

if body not in {"male", "female"}:
    raise SystemExit("--body must be male or female")
if not output:
    raise SystemExit("--output is required")

output = os.path.abspath(output)
os.makedirs(os.path.dirname(output), exist_ok=True)

rig = bpy.data.objects.get("cue_rig")
semantic = [
    bpy.data.objects.get(f"cue_{body}_skin"),
    bpy.data.objects.get(f"cue_{body}_hair"),
    bpy.data.objects.get(f"cue_{body}_underwear"),
]

if not rig or any(item is None for item in semantic):
    raise RuntimeError("V10 rig or semantic body meshes are missing")

bpy.ops.object.mode_set(mode="OBJECT") if bpy.context.object and bpy.context.object.mode != "OBJECT" else None
bpy.ops.object.select_all(action="DESELECT")

for obj in [rig, *semantic]:
    obj.select_set(True)

bpy.context.view_layer.objects.active = rig

bpy.ops.export_scene.gltf(
    filepath=output,
    export_format="GLB",
    use_selection=True,
    export_skins=True,
    export_animations=True,
    export_animation_mode="ACTIONS",
    export_morph=True,
    export_yup=True,
    export_optimize_animation_size=True,
    export_meshopt_compression_enable=True,
    export_meshopt_extension="EXT_meshopt_compression",
)

print(f"CUE ID V10 web GLB exported: {output}")
