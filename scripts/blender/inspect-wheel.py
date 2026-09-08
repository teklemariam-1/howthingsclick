"""Render the detachable-cover wheel inspection from the saved editable scene."""
import bpy
from pathlib import Path
from mathutils import Vector
root = Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(root / 'work/cybercab-surface-study.blend'))
for obj in bpy.context.scene.objects:
    if obj.name.startswith('Detachable Cybercab aero cover'):
        for child in obj.children_recursive:
            child.hide_render = True
scene = bpy.context.scene
cam = scene.camera
cam.location = (2.3, -2.6, 1.05)
cam.rotation_euler = (Vector((1.4, -.73, .385)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.lens = 70
scene.render.resolution_x = 1100
scene.render.resolution_y = 900
scene.cycles.samples = 24
scene.render.filepath = str(root / 'work/cybercab-wheel-inspection.png')
bpy.ops.render.render(write_still=True)
