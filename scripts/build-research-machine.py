"""Visual reconstruction from GI's supplied front photograph, not engineering CAD.

Run with the installed Blender in background mode; never changes the open GUI scene.
Normalized dimensions are visual proportions, not product specifications.
"""
import bpy
import math
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs/research'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)

def material(name, colour, metallic=0, roughness=.3):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*colour, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return mat

steel = material('Satin stainless steel', (.56, .58, .59), .9, .29)
edge = material('Polished edge steel', (.66, .68, .7), .94, .19)
black = material('Smoked black enamel', (.013, .017, .019), .38, .23)
gasket = material('Recessed rubber seals', (.009, .011, .012), .02, .58)
screen = material('Dark touchscreen glass', (.018, .025, .027), .36, .12)
objects = []

# A subtle physically based brushed finish, baked into a portable normal map.
# This is an asset texture in Blender, not a UI approximation.
rng = np.random.default_rng(48)
size = 512
normal_pixels = np.empty((size,size,4), dtype=np.float32)
streaks = rng.normal(0,.017,(size,1))
normal_pixels[:,:,0] = .5 + streaks
normal_pixels[:,:,1] = .5 + rng.normal(0,.002,(size,size))
normal_pixels[:,:,2] = 1.0
normal_pixels[:,:,3] = 1.0
normal_image = bpy.data.images.new('Fine brushed stainless normal',width=size,height=size)
normal_image.colorspace_settings.name = 'Non-Color'
normal_image.pixels.foreach_set(normal_pixels.ravel())
normal_image.pack()
nodes = steel.node_tree.nodes
texture = nodes.new('ShaderNodeTexImage')
texture.image = normal_image
normal_node = nodes.new('ShaderNodeNormalMap')
normal_node.inputs['Strength'].default_value = .22
steel.node_tree.links.new(texture.outputs['Color'],normal_node.inputs['Color'])
steel.node_tree.links.new(normal_node.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])

def box(name, position, size, mat, bevel=.004):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Precision radiused edges', 'BEVEL')
        mod.width = bevel
        mod.segments = 5
        bpy.ops.object.modifier_apply(modifier=mod.name)
        normal = obj.modifiers.new('Face-weighted normals', 'WEIGHTED_NORMAL')
        normal.keep_sharp = True
        bpy.ops.object.modifier_apply(modifier=normal.name)
    objects.append(obj)
    return obj

def cylinder(name, position, radius, depth, mat, rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=radius, depth=depth, location=position, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    bevel = obj.modifiers.new('Machined rim', 'BEVEL')
    bevel.width = .0012
    bevel.segments = 3
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    objects.append(obj)
    return obj

# Cabinet faces and realistic small construction details, front is negative Y.
box('Cabinet body', (0,0,.59), (.68,.56,1.10), steel, .009)
box('Door shadow gap', (0,-.283,.586), (.660,.008,1.075), gasket, .007)
box('Front stainless door', (0,-.292,.586), (.646,.014,1.06), steel, .007)
# One continuous L-shaped front, so reflections have no overlapping faces.
outline = [(-.239,.091),(.295,.091),(.295,.905),(-.073,.905),(-.073,.582),(-.239,.582)]
verts = [(x,y,z) for y in [-.300,-.308] for x,z in outline]
n = len(outline)
faces = [tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
mesh = bpy.data.meshes.new('Continuous enamel face')
mesh.from_pydata(verts,[],faces)
mesh.update()
panel = bpy.data.objects.new('Continuous black front panel',mesh)
bpy.context.scene.collection.objects.link(panel)
panel.data.materials.append(black)
bevel = panel.modifiers.new('Soft enamel edge','BEVEL')
bevel.width = .004
bevel.segments = 5
bpy.context.view_layer.objects.active = panel
bpy.ops.object.modifier_apply(modifier=bevel.name)
objects.append(panel)
box('Touchscreen recess', (-.164,-.304,.688), (.15,.008,.195), gasket, .008)
box('Touchscreen', (-.164,-.310,.688), (.138,.004,.181), screen, .005)
for height in [.17,.86]:
    cylinder('Handle standoff', (-.289,-.336,height), .010,.06,edge,(math.pi/2,0,0))
cylinder('Door handle', (-.289,-.370,.515), .012,.71,edge)
for height in [.20,.90]:
    box('Hinge', (-.337,-.20,height), (.016,.060,.053), edge,.003)
for x in [-.27,.27]:
    for y in [-.22,.22]:
        cylinder('Adjustable foot', (x,y,.028), .026,.046,gasket)
        cylinder('Foot stem', (x,y,.055), .015,.016,edge)
box('Rear service seam', (0,.284,.59), (.605,.008,1.005), gasket,.004)
box('Rear service panel', (0,.290,.59), (.596,.008,.995), steel,.004)
for row in range(11):
    box('Rear ventilation slot', (0,.296,.76+row*.016), (.37,.003,.006), gasket,.002)
for x in [-.274,.274]:
    for z in [.14,.58,1.035]:
        cylinder('Panel fastener', (x,.299,z), .0038,.0025,edge,(math.pi/2,0,0))
        box('Fastener slot', (x,.301,z), (.004,.001,.0009),gasket,.0002)
box('Lower service inlet surround', (.13,.298,.24), (.078,.008,.055), gasket,.005)
box('Lower service inlet', (.13,.304,.24), (.06,.004,.033), black,.003)

# Export only the appliance, with native GLB materials and bevelled geometry.
bpy.ops.object.select_all(action='DESELECT')
for obj in objects:
    obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'cooking-machine.glb'), export_format='GLB', use_selection=True, export_cameras=False, export_lights=False, export_animations=False, export_extras=False)

# Matching product poster for fast first paint, no-WebGL fallback and principles.
floor = material('Studio warm white', (.91,.91,.895),0,.85)
ground = box('Studio ground', (0,0,-.004), (200,200,.01),floor,0)
ground.is_shadow_catcher = True
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.render.film_transparent = True
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 1000
scene.render.resolution_y = 1100
scene.render.resolution_percentage = 100
scene.world = bpy.data.worlds.new('Soft studio ambience')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.91,.92,.94,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35
def area(name, pos, energy, size, target):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.shape = 'RECTANGLE'
    data.size = size
    data.size_y = size*1.7
    obj = bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.location = pos
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
area('Left softbox', (-2,-2,2.8),180,2,(0,0,.6))
area('Right vertical reflection', (2,-1,2),110,1.5,(0,0,.6))
area('Rim light', (0,2,3),220,2,(0,0,.6))
camdata = bpy.data.cameras.new('Product camera')
cam = bpy.data.objects.new('Product camera',camdata)
scene.collection.objects.link(cam)
cam.location = (1.50,-4,1.50)
cam.rotation_euler = (Vector((0,0,.58))-cam.location).to_track_quat('-Z','Y').to_euler()
camdata.type = 'ORTHO'
camdata.ortho_scale = 1.54
scene.camera = cam
scene.view_settings.view_transform = 'AgX'
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
bpy.context.preferences.filepaths.save_version = 0
scene.render.filepath = str(ROOT/'assets/research/machine-poster.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/research/cooking-machine.blend'))
bpy.ops.render.render(write_still=True)
print('GI research model and poster complete')
