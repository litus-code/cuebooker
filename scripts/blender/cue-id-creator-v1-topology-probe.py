# CUE ID V1 CC0 topology comparison. Lab authoring evidence only.
import bpy, importlib, json, os, sys, zipfile
from mathutils import Vector

TOPOLOGIES = ("proxy741", "male1591", "female1605")
FACE = [
    ("head-oval", .16), ("l-cheek-bones-incr", .08), ("r-cheek-bones-incr", .07),
    ("chin-width-decr", .07), ("chin-prominent-decr", .04),
    ("nose-scale-horiz-decr", .05), ("mouth-scale-horiz-incr", .04),
    ("asym-cheek-1-l", .025), ("asym-mouth-1-r", .018), ("asym-nose-2-l", .012),
]

def arg(name):
    extra = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    return extra[extra.index(name)+1] if name in extra else None

def mpfb(suffix, symbol):
    for name in list(sys.modules):
        if name.endswith(suffix):
            module = importlib.import_module(name)
            if hasattr(module, symbol):
                return getattr(module, symbol)
    raise RuntimeError("MPFB symbol unavailable: " + suffix + "." + symbol)

def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

def material(obj, name, rgba):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = rgba
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def look_at(obj, target):
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat("-Z", "Y").to_euler()

def stats(obj):
    deps = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(deps)
    mesh = evaluated.to_mesh()
    try:
        mesh.calc_loop_triangles()
        pts = [evaluated.matrix_world @ v.co for v in mesh.vertices]
        lo = Vector((min(v.x for v in pts), min(v.y for v in pts), min(v.z for v in pts)))
        hi = Vector((max(v.x for v in pts), max(v.y for v in pts), max(v.z for v in pts)))
        return {
            "vertices": len(mesh.vertices), "triangles": len(mesh.loop_triangles),
            "min": list(lo), "max": list(hi),
            "height": hi.z-lo.z, "width": hi.x-lo.x, "depth": hi.y-lo.y,
        }
    finally:
        evaluated.to_mesh_clear()

def render(path, box, portrait=False):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.show_shadows = True
    scene.display.shading.show_cavity = True
    scene.display.shading.cavity_type = "WORLD"
    scene.render.resolution_x = 768
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = path

    cam_data = bpy.data.cameras.new("Camera")
    cam_data.type = "ORTHO"
    cam = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam

    h = box["height"]
    center_z = (box["min"][2] + box["max"][2]) / 2
    if portrait:
        target = (0, 0, box["max"][2] - h*.16)
        cam_data.ortho_scale = h*.46
    else:
        target = (0, 0, center_z)
        cam_data.ortho_scale = h*1.08
    cam.location = (h*.10, -h*3.0, target[2])
    look_at(cam, target)
    bpy.ops.render.render(write_still=True)

def main():
    pack, out = arg("--asset-pack"), arg("--output-dir")
    if not pack or not out:
        raise SystemExit("Require --asset-pack and --output-dir")
    os.makedirs(out, exist_ok=True)

    Human = mpfb("mpfb.services.humanservice", "HumanService")
    Target = mpfb("mpfb.services.targetservice", "TargetService")
    Asset = mpfb("mpfb.services.assetservice", "AssetService")
    Location = mpfb("mpfb.services.locationservice", "LocationService")

    with zipfile.ZipFile(pack) as z:
        z.extractall(Location.get_user_data())
    Asset.update_all_asset_lists()

    report = {"status":"topology_probe_only","productionReady":False,"labCandidateReady":False,"topologies":{}}

    for topology in TOPOLOGIES:
        clear()
        macro = Target.get_default_macro_info_dict()
        macro.update({"gender":.5,"age":.46,"muscle":.43,"weight":.48,"height":.54,"proportions":.53})
        human = Human.create_human(macro_detail_dict=macro, scale=.1, feet_on_ground=True)
        stack = [{"target":name,"value":value} for name,value in FACE]
        missing = [x["target"] for x in stack if Target.target_full_path(x["target"]) is None]
        if missing:
            raise RuntimeError("Missing targets: " + ", ".join(missing))
        Target.bulk_load_targets(human, stack)
        Target.bake_targets(human)

        proxy_path = Asset.find_asset_absolute_path(topology + ".proxy", asset_subdir="proxymeshes")
        if not proxy_path:
            raise RuntimeError("Missing system proxy: " + topology)
        proxy = Human.add_mhclo_asset(proxy_path, human, asset_type="Proxymeshes",
                                     subdiv_levels=0, material_type="NONE", set_up_rigging=False)
        proxy.name = "cue_probe_" + topology
        material(proxy, "cue_probe_skin", (.48,.28,.20,1))

        eye_path = Asset.find_asset_absolute_path("low-poly.mhclo", asset_subdir="eyes")
        if eye_path:
            eyes = Human.add_mhclo_asset(eye_path, human, asset_type="Eyes",
                                        subdiv_levels=0, material_type="NONE", set_up_rigging=False)
            material(eyes, "cue_probe_eyes", (.82,.82,.80,1))

        human.hide_render = True
        box = stats(proxy)
        report["topologies"][topology] = box
        render(os.path.join(out, topology+"-full.png"), box, False)
        render(os.path.join(out, topology+"-portrait.png"), box, True)

    with open(os.path.join(out, "topology-probe-report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2); f.write("\n")
    print("[CUE topology probe]", json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
