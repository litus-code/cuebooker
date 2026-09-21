# Inspect Blender Studio CC0 stylized human base meshes for CUE ID.
#
# Evidence-only probe. It does not create a lab or production asset.

import bpy
import json
import os
import sys

from mathutils import Vector


TARGET_COLLECTIONS = (
    "Body Male - Stylized",
    "Body Female - Stylized",
)


def arg(flag):
    if "--" not in sys.argv:
        return None
    extra = sys.argv[sys.argv.index("--") + 1:]
    try:
        return extra[extra.index(flag) + 1]
    except (ValueError, IndexError):
        return None


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        if collection.users == 0:
            bpy.data.collections.remove(collection)


def library_index(blend_path):
    with bpy.data.libraries.load(blend_path, link=False) as (data_from, _data_to):
        return {
            "collections": sorted(data_from.collections),
            "objects": sorted(data_from.objects),
        }


def append_collection(blend_path, collection_name):
    before = set(bpy.data.collections.keys())
    directory = os.path.join(blend_path, "Collection")
    bpy.ops.wm.append(
        filepath=os.path.join(directory, collection_name),
        directory=directory + os.sep,
        filename=collection_name,
        link=False,
    )

    created = [
        collection
        for name, collection in bpy.data.collections.items()
        if name not in before
    ]
    target = bpy.data.collections.get(collection_name)
    if target:
        return target
    if created:
        return created[-1]
    raise RuntimeError(f"Collection was not appended: {collection_name}")


def recursive_objects(collection):
    result = set(collection.objects)
    for child in collection.children:
        result.update(recursive_objects(child))
    return list(result)


def evaluated_bounds(objects):
    points = []
    depsgraph = bpy.context.evaluated_depsgraph_get()

    for obj in objects:
        if obj.type != "MESH":
            continue
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        try:
            points.extend(evaluated.matrix_world @ vertex.co for vertex in mesh.vertices)
        finally:
            evaluated.to_mesh_clear()

    if not points:
        raise RuntimeError("No evaluated mesh points in appended collection")

    minimum = Vector((
        min(p.x for p in points),
        min(p.y for p in points),
        min(p.z for p in points),
    ))
    maximum = Vector((
        max(p.x for p in points),
        max(p.y for p in points),
        max(p.z for p in points),
    ))
    return minimum, maximum


def mesh_stats(objects):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated_triangles = 0
    evaluated_vertices = 0
    raw_triangles = 0
    raw_vertices = 0
    materials = set()
    mesh_names = []
    modifiers = {}

    for obj in objects:
        if obj.type != "MESH":
            continue
        mesh_names.append(obj.name)

        obj.data.calc_loop_triangles()
        raw_triangles += len(obj.data.loop_triangles)
        raw_vertices += len(obj.data.vertices)
        modifiers[obj.name] = [
            {
                "name": modifier.name,
                "type": modifier.type,
                "showViewport": bool(modifier.show_viewport),
                "showRender": bool(modifier.show_render),
            }
            for modifier in obj.modifiers
        ]

        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        try:
            mesh.calc_loop_triangles()
            evaluated_triangles += len(mesh.loop_triangles)
            evaluated_vertices += len(mesh.vertices)
        finally:
            evaluated.to_mesh_clear()

        for slot in obj.material_slots:
            if slot.material:
                materials.add(slot.material.name)

    return {
        "meshObjects": sorted(mesh_names),
        "rawVertices": raw_vertices,
        "rawTriangles": raw_triangles,
        "evaluatedVertices": evaluated_vertices,
        "evaluatedTriangles": evaluated_triangles,
        "modifiers": modifiers,
        "materials": sorted(materials),
    }


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_collection(collection, output_path):
    objects = recursive_objects(collection)
    minimum, maximum = evaluated_bounds(objects)
    center = (minimum + maximum) * 0.5
    height = max(maximum.z - minimum.z, 0.1)

    camera_data = bpy.data.cameras.new("cue_probe_camera")
    camera = bpy.data.objects.new("cue_probe_camera", camera_data)
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera
    camera.data.lens = 62
    camera.location = (
        center.x + height * 0.10,
        center.y - height * 1.85,
        center.z + height * 0.03,
    )
    look_at(camera, center)

    for name, relative, energy, size_factor in [
        ("cue_probe_key", (-0.7, -1.0, 0.5), 700.0, 0.9),
        ("cue_probe_fill", (0.8, -0.5, 0.2), 350.0, 1.1),
        ("cue_probe_rim", (0.0, 0.9, 0.45), 500.0, 0.8),
    ]:
        data = bpy.data.lights.new(name=name, type="AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = height * size_factor
        light = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(light)
        light.location = (
            center.x + relative[0] * height,
            center.y + relative[1] * height,
            center.z + relative[2] * height,
        )
        look_at(light, center)

    world = bpy.data.worlds.new("cue_probe_world")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background:
        background.inputs["Color"].default_value = (0.025, 0.028, 0.033, 1.0)
        background.inputs["Strength"].default_value = 0.28
    bpy.context.scene.world = world

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 768
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)

    return mesh_stats(objects)


def main():
    blend_path = arg("--blend")
    output_dir = arg("--output-dir")

    if not blend_path or not output_dir:
        raise SystemExit("Require --blend and --output-dir")

    blend_path = os.path.abspath(blend_path)
    output_dir = os.path.abspath(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    index = library_index(blend_path)
    report = {
        "status": "blender_studio_stylized_base_probe",
        "source": "Blender Human Base Meshes v1.4.1",
        "license": "CC0",
        "productionReady": False,
        "labCandidateReady": False,
        "libraryIndex": index,
        "targets": {},
    }

    missing = [name for name in TARGET_COLLECTIONS if name not in index["collections"]]
    if missing:
        report["missingTargets"] = missing
        with open(os.path.join(output_dir, "probe-report.json"), "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=2)
            handle.write("\n")
        raise RuntimeError("Missing expected stylized collections: " + ", ".join(missing))

    for collection_name in TARGET_COLLECTIONS:
        clear_scene()
        collection = append_collection(blend_path, collection_name)
        slug = "male" if "Male" in collection_name else "female"
        stats = render_collection(
            collection,
            os.path.join(output_dir, f"blender-studio-{slug}-stylized.png"),
        )
        report["targets"][slug] = {
            "collection": collection_name,
            **stats,
        }

    with open(os.path.join(output_dir, "probe-report.json"), "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print("[CUE ID Blender Studio base probe]")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
