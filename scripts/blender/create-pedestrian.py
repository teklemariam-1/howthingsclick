"""Build the MIT-licensed Microsoft Rocketbox pedestrian and in-place motion clips.
Source files: work/rocketbox (see public/models/pedestrian-credits.md).
Run with Blender --background --python scripts/blender/create-pedestrian.py.
"""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector, Matrix
ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'work/rocketbox'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.scene.render.fps = 30

def load_fbx(name):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=str(SOURCE/name), use_anim=True)
    return [o for o in bpy.data.objects if o not in before]

avatar_objects = load_fbx('Male_Adult_01.fbx')
arm = next(o for o in avatar_objects if o.type == 'ARMATURE')
mesh = next(o for o in avatar_objects if o.type == 'MESH')
arm.name = 'PedestrianSkeleton'
mesh.name = 'PedestrianClothedBody'
arm.animation_data_clear()
for b in arm.pose.bones:
    b.rotation_mode = 'QUATERNION'

# Small embedded textures, original UVs, skin and cloth normals.
texture_dir = ROOT/'work/pedestrian-textures'
texture_dir.mkdir(parents=True, exist_ok=True)
for mat in mesh.data.materials:
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    out = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = .84 if 'body' in mat.name else .66
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    def texture(suffix, normal=False):
        image = bpy.data.images.load(str(SOURCE/(mat.name+'_'+suffix+'.tga')), check_existing=False)
        if normal: image.colorspace_settings.name = 'Non-Color'
        size = 512 if normal or 'opacity' in mat.name else 1024
        image.scale(size, size)
        extension = 'png' if normal or 'opacity' in mat.name else 'jpg'
        image.filepath_raw = str(texture_dir/(mat.name+'_'+suffix+'.'+extension))
        image.file_format = 'PNG' if extension == 'png' else 'JPEG'
        image.save()
        node = nodes.new('ShaderNodeTexImage')
        node.image = image
        return node
    color = texture('color')
    links.new(color.outputs['Color'], bsdf.inputs['Base Color'])
    if 'opacity' in mat.name:
        bsdf.inputs['Roughness'].default_value = 1
        bsdf.inputs['Specular IOR Level'].default_value = 0
        cutoff = nodes.new('ShaderNodeMath')
        cutoff.operation = 'GREATER_THAN'
        cutoff.inputs[1].default_value = .4
        links.new(color.outputs['Alpha'], cutoff.inputs[0])
        links.new(cutoff.outputs[0], bsdf.inputs['Alpha'])
        mat.surface_render_method = 'DITHERED'
        mat.use_backface_culling = False
    else:
        normal = texture('normal', True)
        bump = nodes.new('ShaderNodeNormalMap')
        bump.inputs['Strength'].default_value = .65
        links.new(normal.outputs['Color'], bump.inputs['Color'])
        links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])

# Replace the old flat hair cards with a close-cropped scalp, avoiding hard
# alpha edges and sorting artifacts in a moving web scene.
import bmesh
bm = bmesh.new();bm.from_mesh(mesh.data)
hair_card_index = next(i for i,m in enumerate(mesh.data.materials) if 'opacity' in m.name)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index == hair_card_index], context='FACES')
bm.to_mesh(mesh.data);bm.free()
bpy.context.view_layer.update()
top = max((mesh.matrix_world @ v.co).z for v in mesh.data.vertices)
hair = bpy.data.materials.new('Short cropped hair')
hair.diffuse_color = (.036,.02,.011,1)
hair.use_nodes = True
hair_bsdf = hair.node_tree.nodes.get('Principled BSDF')
hair_bsdf.inputs['Base Color'].default_value=(.036,.02,.011,1)
hair_bsdf.inputs['Roughness'].default_value=.96
hair_bsdf.inputs['Specular IOR Level'].default_value=.12
mesh.data.materials.append(hair)
head_index = next(i for i,m in enumerate(mesh.data.materials) if m.name == 'm002_head')
for face in mesh.data.polygons:
    if face.material_index == head_index:
        height = sum((mesh.matrix_world @ mesh.data.vertices[i].co).z for i in face.vertices)/len(face.vertices)
        if height > top-.115: face.material_index=len(mesh.data.materials)-1

actions = []
for filename, clip_name in [('m_walk_neutral.max.fbx','Walk'), ('m_idle_breathe_01.max.fbx','Idle')]:
    source_objects = load_fbx(filename)
    source_arm = next(o for o in source_objects if o.type == 'ARMATURE')
    first,last = map(int, source_arm.animation_data.action.frame_range)
    arm.animation_data_clear()
    # Retarget absolute poses: FBX motion files have their own first-frame bind pose.
    # Copying F-curves alone would bend limbs around the wrong rest axes.
    for frame in range(first, last+1):
        bpy.context.scene.frame_set(frame)
        arm.location = source_arm.location
        arm.location.x = arm.location.y = 0
        arm.rotation_euler = source_arm.rotation_euler
        arm.scale = source_arm.scale
        for bone in arm.pose.bones:
            if bone.name not in source_arm.pose.bones: continue
            parent = bone.parent
            if parent:
                relative = parent.bone.matrix_local.inverted() @ bone.bone.matrix_local
                placed = parent.matrix @ relative
                facial = any(p.name == 'Bip01 Head' for p in bone.parent_recursive)
                bone.matrix = placed if facial else Matrix.LocRotScale(
                    placed.translation, source_arm.pose.bones[bone.name].matrix.to_quaternion(), Vector((1,1,1)))
            else:
                bone.matrix = source_arm.pose.bones[bone.name].matrix.copy()
        bpy.context.view_layer.update()
        evaluated = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get())
        sole = min((mesh.matrix_world @ Vector(c)).z for c in evaluated.bound_box)
        arm.location.z -= sole
        bpy.context.view_layer.update()
        arm.keyframe_insert('location', frame=frame)
        arm.keyframe_insert('rotation_euler', frame=frame)
        arm.keyframe_insert('scale', frame=frame)
        for bone in arm.pose.bones:
            bone.keyframe_insert('location', frame=frame)
            bone.keyframe_insert('rotation_quaternion', frame=frame)
            bone.keyframe_insert('scale', frame=frame)
    action = arm.animation_data.action
    action.name = clip_name
    action.use_fake_user = True
    actions.append(action)
    for o in source_objects:
        bpy.data.objects.remove(o, do_unlink=True)

# Export only the person. Normalization places the sole on the road, at adult height.
for o in avatar_objects:
    if o not in [arm,mesh]:
        bpy.data.objects.remove(o, do_unlink=True)
arm.animation_data_clear()
arm.animation_data_create()
arm.animation_data.action = actions[1]
arm.animation_data.action_slot = actions[1].slots[0]
bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
bounds = [mesh.matrix_world @ Vector(c) for c in mesh.evaluated_get(dg).bound_box]
minimum = min(v.z for v in bounds)
maximum = max(v.z for v in bounds)
normalizer = bpy.data.objects.new('Pedestrian', None)
bpy.context.collection.objects.link(normalizer)
arm.parent = normalizer
scale = 1.74/(maximum-minimum)
normalizer.scale = (scale,scale,scale)
normalizer.location.z = -minimum*scale
normalizer['source'] = 'Microsoft Rocketbox / Male_Adult_01 / MIT'
normalizer['heightMetres'] = 1.74
normalizer['motion'] = 'Retargeted Walk and Idle; planar root motion removed'
arm.animation_data.action = None
for action in actions:
    track = arm.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, 1, action)
    strip.action_slot = action.slots[0]
    track.mute = False
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 83
bpy.ops.object.select_all(action='DESELECT')
for o in [normalizer,arm,mesh]:
    o.select_set(True)
bpy.context.view_layer.objects.active = arm
output = ROOT/'public/models/pedestrian.glb'
bpy.ops.export_scene.gltf(
    filepath=str(output),export_format='GLB',use_selection=True,
    export_animations=True,export_animation_mode='NLA_TRACKS',
    export_force_sampling=True,export_frame_range=False,
    export_materials='EXPORT',export_image_format='AUTO',
    export_skins=True,export_extras=True)
print('EXPORTED',output.stat().st_size,'bytes')

# A reusable studio inspection scene, separate from the runtime asset.
for track in arm.animation_data.nla_tracks: track.mute = True
arm.animation_data.action = actions[0]
arm.animation_data.action_slot = actions[0].slots[0]
bpy.context.scene.frame_set(12)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.resolution_x = 800
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.world.color = (.25,.25,.25)
bpy.ops.mesh.primitive_plane_add(size=200)
floor = bpy.context.object
floor.name = 'Studio floor'
mat = bpy.data.materials.new('Studio floor');mat.diffuse_color=(.13,.16,.18,1)
floor.data.materials.append(mat)
for name,loc,energy,size in [
    ('Key',(2,-4,5),650,4),('Fill',(-3,-1,2.5),400,3),('Rim',(0,3,4),700,3)]:
    data = bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
    o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=loc
    o.rotation_euler=(Vector((0,0,.9))-o.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('ReviewCamera');cam=bpy.data.objects.new('ReviewCamera',data)
scene.collection.objects.link(cam);scene.camera=cam
cam.location=(2.3,-3.8,1.9);data.lens=65
cam.rotation_euler=(Vector((0,0,.92))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/pedestrian.blend'))
if '--no-render' not in sys.argv:
    scene.render.filepath=str(ROOT/'work/pedestrian-walk-review.png')
    bpy.ops.render.render(write_still=True)
print('PEDESTRIAN_READY')
