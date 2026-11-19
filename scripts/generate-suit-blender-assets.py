import json
import math
from pathlib import Path

import bpy
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = REPO_ROOT / "src/features/customizer/three-d/asset-manifest.json"
PUBLIC_ASSET_ROOT = REPO_ROOT / "public/models/suit-configurator"
SOURCE_ASSET_ROOT = REPO_ROOT / "assets/suit-configurator/blender"

FABRIC_SLOT = "Fabric_OverrideSlot"
BUTTON_SLOT = "Button_OverrideSlot"
LINING_SLOT = "Lining_OverrideSlot"


def main():
    manifest = json.loads(MANIFEST_PATH.read_text())

    build_asset(manifest["base"], create_mannequin)

    for asset in manifest["jackets"].values():
        build_asset(asset, create_jacket)

    for asset in manifest["lapels"].values():
        build_asset(asset, create_lapels)

    for asset in manifest["buttons"].values():
        build_asset(asset, create_buttons)

    for asset in manifest["pockets"].values():
        build_asset(asset, create_pockets)

    for asset in manifest["trousers"].values():
        build_asset(asset, create_trousers)

    for asset in manifest["vests"].values():
        build_asset(asset, create_vest)


def build_asset(asset, builder):
    clear_scene()
    create_world()
    root = bpy.data.objects.new(asset["rootNodeName"], None)
    bpy.context.scene.collection.objects.link(root)

    builder(asset, root)

    source_path = SOURCE_ASSET_ROOT / asset["path"].replace(".glb", ".blend")
    glb_path = PUBLIC_ASSET_ROOT / asset["path"]
    source_path.parent.mkdir(parents=True, exist_ok=True)
    glb_path.parent.mkdir(parents=True, exist_ok=True)

    select_asset(root)
    bpy.ops.wm.save_as_mainfile(filepath=str(source_path))
    select_asset(root)
    bpy.ops.export_scene.gltf(
        filepath=str(glb_path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
        export_materials="EXPORT",
    )
    print(f"Wrote {glb_path.relative_to(REPO_ROOT)}")


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)

    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)


def create_world():
    bpy.context.scene.render.engine = "BLENDER_EEVEE"
    bpy.context.scene.unit_settings.system = "METRIC"


def select_asset(root):
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)

    for child in root.children_recursive:
        child.select_set(True)

    bpy.context.view_layer.objects.active = root


def create_mannequin(asset, root):
    skin = material("Mannequin_MatteWarmGrey", (0.72, 0.69, 0.64, 1), 0.9)
    stand = material("Mannequin_StandBrushedSteel", (0.36, 0.34, 0.31, 1), 0.38, 0.18)

    add_loft(
        "Mannequin_Base",
        [
            (0.08, 0.0, 0.0, 0.16, 0.12),
            (0.35, 0.0, 0.0, 0.25, 0.16),
            (0.72, 0.0, 0.0, 0.30, 0.19),
            (1.05, 0.0, 0.0, 0.34, 0.21),
            (1.38, 0.0, 0.0, 0.38, 0.22),
            (1.62, 0.0, 0.0, 0.27, 0.18),
        ],
        skin,
        root,
        sides=32,
    )
    add_ellipsoid("Mannequin_Head", (0.0, 0.0, 1.91), (0.16, 0.145, 0.205), skin, root)
    add_cylinder("Mannequin_Neck", 0.068, 0.18, (0.0, 0.0, 1.68), skin, root, vertices=24)
    add_cylinder("Mannequin_Stand", 0.40, 0.055, (0.0, 0.0, 0.035), stand, root, vertices=48)
    add_cylinder("Mannequin_StandStem", 0.055, 0.20, (0.0, 0.0, 0.14), stand, root, vertices=24)


def create_jacket(asset, root):
    code = asset["code"]
    suffix = pascal_case(code)
    fabric = material(FABRIC_SLOT, (0.08, 0.12, 0.24, 1), 0.78, 0.015)
    lining = material(LINING_SLOT, (0.045, 0.06, 0.10, 1), 0.58, 0.02)
    is_double = code == "double-breasted-six-button"
    is_evening = code == "single-breasted-one-button"
    shoulder = 0.52 if is_double else 0.48
    hem = 0.76 if is_evening else 0.79

    add_loft(
        f"Jacket_{suffix}",
        [
            (hem, 0.0, 0.0, 0.34 if not is_double else 0.38, 0.19),
            (0.86, 0.0, 0.0, 0.39 if not is_double else 0.43, 0.225),
            (1.12, 0.0, 0.0, 0.42 if not is_double else 0.46, 0.24),
            (1.39, 0.0, 0.0, 0.45 if not is_double else 0.49, 0.255),
            (1.57, 0.0, 0.0, shoulder, 0.25),
            (1.64, 0.0, 0.0, shoulder - 0.02, 0.20),
        ],
        fabric,
        root,
        sides=36,
    )

    add_sleeve(
        f"Sleeve_Left_{suffix}",
        -1,
        fabric,
        root,
        shoulder_width=shoulder,
        sleeve_length=0.78 if is_evening else 0.84,
    )
    add_sleeve(
        f"Sleeve_Right_{suffix}",
        1,
        fabric,
        root,
        shoulder_width=shoulder,
        sleeve_length=0.78 if is_evening else 0.84,
    )

    # A narrow front edge gives the jacket a tailored opening without turning it into a flat slab.
    add_rounded_box(
        f"Jacket_FrontEdge_{suffix}",
        (0.0, -0.258, 1.13),
        (0.018, 0.026, 0.78 if not is_evening else 0.66),
        fabric,
        root,
        bevel=0.006,
    )
    add_prism(
        f"Jacket_Collar_{suffix}",
        [(-0.19, 1.61), (0.0, 1.68), (0.19, 1.61), (0.14, 1.56), (-0.14, 1.56)],
        0.018,
        fabric,
        root,
        front_y=-0.235,
        bevel=0.008,
    )
    if is_double:
        add_prism(
            f"Jacket_WrapPanel_{suffix}",
            [(0.02, 1.52), (0.37, 1.46), (0.31, 0.86), (0.02, 0.80)],
            0.022,
            fabric,
            root,
            front_y=-0.275,
            bevel=0.008,
        )
        add_rounded_box(
            f"Jacket_WrapEdge_{suffix}",
            (0.18, -0.30, 1.14),
            (0.018, 0.022, 0.57),
            fabric,
            root,
            bevel=0.005,
        )

    # Keep the lining behind the cloth. It is present for future open-jacket views but does not paint a dark rectangle over the front.
    add_prism(
        f"Lining_Jacket_{suffix}",
        [(-0.16, 1.55), (0.16, 1.55), (0.10, 1.16), (-0.10, 1.16)],
        -0.02,
        lining,
        root,
        front_y=0.16,
        bevel=0.004,
    )


def add_sleeve(name, side, fabric, root, shoulder_width, sleeve_length):
    points = [
        (side * (shoulder_width - 0.12), 0.0, 1.54),
        (side * (shoulder_width - 0.01), -0.002, 1.53),
        (side * (shoulder_width + 0.10), -0.005, 1.42),
        (side * (shoulder_width + 0.14), -0.02, 1.20),
        (side * (shoulder_width + 0.08), -0.045, 1.01),
        (side * (shoulder_width - 0.01), -0.06, 1.54 - sleeve_length),
    ]
    radii = [0.11, 0.145, 0.14, 0.125, 0.112, 0.098]
    add_path_tube(name, points, radii, fabric, root, sides=20)
    add_path_tube(
        f"{name}_Cuff",
        points[-2:],
        [0.116, 0.106],
        fabric,
        root,
        sides=20,
    )


def create_lapels(asset, root):
    style = asset["code"].replace("-lapel", "")
    suffix = pascal_case(style)
    fabric = material(FABRIC_SLOT, (0.08, 0.12, 0.24, 1), 0.72, 0.015)
    facing = material("Lapel_Facing", (0.035, 0.05, 0.10, 1), 0.65, 0.02)

    if style == "shawl":
        for side, label in [(-1, "Left"), (1, "Right")]:
            centers = [(side * x, z) for x, z in [(0.03, 1.57), (0.18, 1.40), (0.19, 1.17), (0.12, 0.98), (0.03, 0.88)]]
            add_ribbon_prism(
                f"Lapel_{label}_{suffix}",
                centers,
                0.075,
                fabric,
                root,
                front_y=-0.29,
                bevel=0.012,
            )
        return

    positive_points = (
        [(0.03, 1.58), (0.42, 1.63), (0.31, 1.45), (0.18, 1.03), (0.02, 1.14), (-0.04, 1.43)]
        if style == "peak"
        else [(0.03, 1.58), (0.37, 1.52), (0.25, 1.40), (0.18, 1.03), (0.02, 1.14), (-0.04, 1.43)]
    )

    for side, label in [(-1, "Left"), (1, "Right")]:
        points = [(side * x, z) for x, z in positive_points]
        add_prism(
            f"Lapel_{label}_{suffix}",
            points,
            0.024,
            fabric,
            root,
            front_y=-0.30,
            bevel=0.012,
        )
        facing_points = (
            [(0.035, 1.575), (0.34, 1.62), (0.29, 1.55), (0.07, 1.52)]
            if style == "peak"
            else [(0.035, 1.575), (0.30, 1.525), (0.25, 1.47), (0.07, 1.52)]
        )
        add_prism(
            f"LapelFacing_{label}_{suffix}",
            [(side * x, z) for x, z in facing_points],
            0.008,
            facing,
            root,
            front_y=-0.311,
            bevel=0.004,
        )


def create_buttons(asset, root):
    code = asset["code"]
    suffix = (
        "SmokedPearl"
        if code == "smoked-pearl-buttons"
        else "Covered"
        if code == "covered-buttons"
        else "Horn"
    )
    button = material(BUTTON_SLOT, (0.12, 0.075, 0.045, 1), 0.30, 0.02)

    positions = [(0.0, 1.17), (0.0, 0.97)]
    if code == "covered-buttons":
        positions.extend([(0.0, 1.17), (0.0, 0.97)])

    for index, (x, z) in enumerate(positions, start=1):
        add_button_disk(f"Buttons_{suffix}_{index}", (x, -0.315, z), 0.038, button, root)

    double_positions = [
        (-0.16, 1.24),
        (0.16, 1.24),
        (-0.16, 1.04),
        (0.16, 1.04),
        (-0.16, 0.84),
        (0.16, 0.84),
    ]
    for index, (x, z) in enumerate(double_positions, start=1):
        add_button_disk(
            f"Buttons_{suffix}_Double_{index}",
            (x, -0.315, z),
            0.038,
            button,
            root,
        )


def create_pockets(asset, root):
    code = asset["code"]
    fabric = material(FABRIC_SLOT, (0.08, 0.12, 0.24, 1), 0.78, 0.015)

    if code == "straight-flap-pockets":
        add_pocket_pair("StraightFlap", fabric, root, rotation_y=0.0, patch=False, welt=False)
        return

    if code == "slanted-flap-pockets":
        add_pocket_pair("SlantedFlap", fabric, root, rotation_y=0.12, patch=False, welt=False)
        return

    if code == "patch-pockets":
        add_pocket_pair("Patch", fabric, root, rotation_y=0.0, patch=True, welt=False)
        return

    add_pocket_pair("Jetted", fabric, root, rotation_y=0.0, patch=False, welt=True)


def add_pocket_pair(suffix, fabric, root, rotation_y, patch, welt):
    for side, label in [(-1, "Left"), (1, "Right")]:
        x = side * 0.265
        z = 0.91

        if patch:
            add_rounded_box(
                f"Pocket_{label}_{suffix}",
                (x, -0.276, z),
                (0.27, 0.042, 0.15),
                fabric,
                root,
                rotation=(0, rotation_y * side, 0),
                bevel=0.024,
            )
        elif welt:
            add_rounded_box(
                f"Pocket_{label}_{suffix}",
                (x, -0.292, z),
                (0.29, 0.028, 0.026),
                fabric,
                root,
                rotation=(0, rotation_y * side, 0),
                bevel=0.008,
            )
        else:
            add_rounded_box(
                f"Pocket_{label}_{suffix}",
                (x, -0.278, z),
                (0.29, 0.04, 0.064),
                fabric,
                root,
                rotation=(0, rotation_y * side, 0),
                bevel=0.012,
            )


def create_trousers(asset, root):
    code = asset["code"]
    suffix = {
        "side-adjusters": "SideAdjusters",
        "belt-loops": "BeltLoops",
        "single-pleat-trousers": "SinglePleat",
        "brace-buttons": "BraceButtons",
    }[code]
    fabric = material(FABRIC_SLOT, (0.08, 0.12, 0.24, 1), 0.78, 0.015)
    button = material(BUTTON_SLOT, (0.12, 0.075, 0.045, 1), 0.30, 0.02)

    for side, label in [(-1, "Left"), (1, "Right")]:
        add_loft(
            f"Trouser_{label}_{suffix}",
            [
                (0.08, side * 0.12, 0.0, 0.16, 0.145),
                (0.42, side * 0.12, 0.0, 0.17, 0.16),
                (0.76, side * 0.13, 0.0, 0.19, 0.19),
                (1.00, side * 0.14, 0.0, 0.22, 0.21),
            ],
            fabric,
            root,
            sides=24,
        )
        add_rounded_box(
            f"TrouserCrease_{label}_{suffix}",
            (side * 0.12, -0.15, 0.50),
            (0.012, 0.008, 0.73),
            fabric,
            root,
            bevel=0.004,
        )

    add_prism(
        f"Trouser_Seat_{suffix}",
        [(-0.22, 1.03), (0.22, 1.03), (0.17, 0.72), (0.0, 0.62), (-0.17, 0.72)],
        0.038,
        fabric,
        root,
        front_y=-0.235,
        bevel=0.012,
    )
    add_loft(
        f"Waistband_{suffix}",
        [(0.94, 0.0, 0.0, 0.36, 0.21), (1.075, 0.0, 0.0, 0.37, 0.22)],
        fabric,
        root,
        sides=32,
    )

    if code == "belt-loops":
        for index, x in enumerate([-0.27, -0.14, 0.0, 0.14, 0.27], start=1):
            name = (
                "BeltLoop_Left_BeltLoops"
                if index == 1
                else "BeltLoop_Right_BeltLoops"
                if index == 5
                else f"BeltLoop_{index}_BeltLoops"
            )
            add_rounded_box(name, (x, -0.218, 1.04), (0.028, 0.032, 0.16), fabric, root, bevel=0.006)

    if code == "side-adjusters":
        for side, label in [(-1, "Left"), (1, "Right")]:
            add_rounded_box(
                f"SideTab_{label}_SideAdjusters",
                (side * 0.35, -0.02, 1.015),
                (0.10, 0.045, 0.055),
                fabric,
                root,
                rotation=(0, side * 0.10, 0),
                bevel=0.008,
            )

    if code == "single-pleat-trousers":
        for side, label in [(-1, "Left"), (1, "Right")]:
            add_rounded_box(
                f"Pleat_{label}_SinglePleat",
                (side * 0.075, -0.218, 0.88),
                (0.018, 0.012, 0.25),
                fabric,
                root,
                rotation=(0, side * 0.035, 0),
                bevel=0.004,
            )

    if code == "brace-buttons":
        add_button_disk("BraceButton_Left_BraceButtons", (-0.12, -0.235, 1.06), 0.026, button, root)
        add_button_disk("BraceButton_Right_BraceButtons", (0.12, -0.235, 1.06), 0.026, button, root)


def create_vest(asset, root):
    fabric = material(FABRIC_SLOT, (0.08, 0.12, 0.24, 1), 0.78, 0.015)
    lining = material(LINING_SLOT, (0.045, 0.06, 0.10, 1), 0.58, 0.02)
    button = material(BUTTON_SLOT, (0.12, 0.075, 0.045, 1), 0.30, 0.02)

    vest_outline = [
        (-0.27, 1.52),
        (-0.08, 1.52),
        (0.0, 1.28),
        (0.08, 1.52),
        (0.27, 1.52),
        (0.20, 0.98),
        (0.06, 0.87),
        (0.0, 0.91),
        (-0.06, 0.87),
        (-0.20, 0.98),
    ]
    add_prism("Vest_MatchingWaistcoat", vest_outline, 0.04, fabric, root, front_y=-0.278, bevel=0.012)
    add_prism(
        "Vest_Lining_MatchingWaistcoat",
        [(-0.16, 1.46), (-0.06, 1.46), (0.0, 1.29), (0.06, 1.46), (0.16, 1.46), (0.12, 1.02), (0.0, 0.95), (-0.12, 1.02)],
        0.012,
        lining,
        root,
        front_y=0.06,
        bevel=0.004,
    )
    for index, z in enumerate([1.20, 1.10, 1.00, 0.92, 0.85], start=1):
        add_button_disk(f"Vest_Button_{index}", (0.0, -0.325, z), 0.026, button, root)


def add_loft(name, rings, material_value, root, sides=24, cap=True):
    vertices = []
    faces = []

    for z, center_x, center_y, radius_x, radius_y in rings:
        for index in range(sides):
            angle = 2 * math.pi * index / sides
            vertices.append(
                (
                    center_x + radius_x * math.cos(angle),
                    center_y + radius_y * math.sin(angle),
                    z,
                )
            )

    for ring_index in range(len(rings) - 1):
        start = ring_index * sides
        next_start = (ring_index + 1) * sides
        for index in range(sides):
            next_index = (index + 1) % sides
            faces.append((start + index, start + next_index, next_start + next_index, next_start + index))

    if cap:
        faces.append(tuple(reversed(range(sides))))
        last = (len(rings) - 1) * sides
        faces.append(tuple(last + index for index in range(sides)))

    return add_mesh(name, vertices, faces, material_value, root)


def add_path_tube(name, points, radii, material_value, root, sides=16):
    vertices = []
    faces = []
    vectors = [Vector(point) for point in points]

    for index, point in enumerate(vectors):
        if index == 0:
            tangent = (vectors[1] - point).normalized()
        elif index == len(vectors) - 1:
            tangent = (point - vectors[index - 1]).normalized()
        else:
            tangent = (vectors[index + 1] - vectors[index - 1]).normalized()

        basis_y = Vector((0.0, 1.0, 0.0))
        basis_side = tangent.cross(basis_y).normalized()
        for segment in range(sides):
            angle = 2 * math.pi * segment / sides
            offset = basis_y * math.cos(angle) * radii[index] + basis_side * math.sin(angle) * radii[index]
            vertices.append(tuple(point + offset))

    for ring_index in range(len(vectors) - 1):
        start = ring_index * sides
        next_start = (ring_index + 1) * sides
        for index in range(sides):
            next_index = (index + 1) % sides
            faces.append((start + index, start + next_index, next_start + next_index, next_start + index))

    faces.append(tuple(reversed(range(sides))))
    last = (len(vectors) - 1) * sides
    faces.append(tuple(last + index for index in range(sides)))
    return add_mesh(name, vertices, faces, material_value, root)


def add_prism(name, points, depth, material_value, root, front_y=-0.26, bevel=0.0):
    back_y = front_y + depth
    vertices = [(x, front_y, z) for x, z in points] + [(x, back_y, z) for x, z in points]
    count = len(points)
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]

    for index in range(count):
        next_index = (index + 1) % count
        faces.append((index, next_index, count + next_index, count + index))

    return add_mesh(name, vertices, faces, material_value, root, bevel=bevel)


def add_ribbon_prism(name, centers, width, material_value, root, front_y=-0.28, bevel=0.0):
    left = []
    right = []
    for index, (x, z) in enumerate(centers):
        previous = centers[max(0, index - 1)]
        following = centers[min(len(centers) - 1, index + 1)]
        tangent = Vector((following[0] - previous[0], following[1] - previous[1])).normalized()
        normal = Vector((-tangent.y, tangent.x))
        left.append((x + normal.x * width, z + normal.y * width))
        right.append((x - normal.x * width, z - normal.y * width))

    return add_prism(name, left + list(reversed(right)), 0.024, material_value, root, front_y=front_y, bevel=bevel)


def add_rounded_box(name, location, dimensions, material_value, root, rotation=(0, 0, 0), bevel=0.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.rotation_euler = rotation
    obj.data.materials.append(material_value)
    parent_to_root(obj, root)

    if bevel > 0:
        modifier = obj.modifiers.new("softened_edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        modifier.affect = "EDGES"
        obj.modifiers.new("weighted_normals", "WEIGHTED_NORMAL")

    shade_smooth(obj)
    return obj


def add_ellipsoid(name, location, scale, material_value, root):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material_value)
    parent_to_root(obj, root)
    shade_smooth(obj)
    return obj


def add_cylinder(name, radius, depth, location, material_value, root, rotation=(0, 0, 0), scale=(1, 1, 1), vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material_value)
    parent_to_root(obj, root)
    bevel = obj.modifiers.new("softened_edges", "BEVEL")
    bevel.width = min(radius * 0.18, depth * 0.22)
    bevel.segments = 3
    obj.modifiers.new("weighted_normals", "WEIGHTED_NORMAL")
    shade_smooth(obj)
    return obj


def add_button_disk(name, location, radius, material_value, root):
    return add_cylinder(
        name,
        radius,
        0.026,
        location,
        material_value,
        root,
        rotation=(math.pi / 2, 0, 0),
        vertices=32,
    )


def add_mesh(name, vertices, faces, material_value, root, bevel=0.0):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(material_value)
    parent_to_root(obj, root)

    if bevel > 0:
        modifier = obj.modifiers.new("softened_edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        modifier.affect = "EDGES"
        obj.modifiers.new("weighted_normals", "WEIGHTED_NORMAL")

    shade_smooth(obj)
    return obj


def parent_to_root(obj, root):
    obj.parent = root


def shade_smooth(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    obj.select_set(False)


def material(name, base_color, roughness, metalness=0):
    existing = bpy.data.materials.get(name)

    if existing:
        return existing

    mat = bpy.data.materials.new(name)
    mat.diffuse_color = base_color
    mat.use_nodes = True
    mat.use_backface_culling = False
    bsdf = mat.node_tree.nodes.get("Principled BSDF")

    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metalness
        if "Sheen Weight" in bsdf.inputs:
            bsdf.inputs["Sheen Weight"].default_value = 0.12 if name == FABRIC_SLOT else 0.0
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = 0.10 if BUTTON_SLOT in name else 0.0

    return mat


def pascal_case(value):
    return "".join(part[:1].upper() + part[1:] for part in value.split("-"))


if __name__ == "__main__":
    main()
