"""Offline geometry review of the shortened rear fascia and the Cybercab cabin."""
import bpy,sys
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[2]
bpy.ops.wm.open_mainfile(filepath=str(root/'work/cybercab-surface-study.blend'))
scene=bpy.context.scene;cam=scene.camera
scene.render.resolution_x=1200;scene.render.resolution_y=820;scene.cycles.samples=20
views=[('rear',( -6.1,-5.6,2.7),(0,0,.67),58),('cabin',(.18,-1.52,1.19),(-.22,.08,.84),27),('dashboard',(-.72,0,1.18),(.46,0,.955),24)]
if '--rear' in sys.argv:views=views[:1]
if '--cabin' in sys.argv:views=views[1:]
for name,location,target,lens in views:
    if name!='rear':
        # Remove the near door for asset inspection; the site's door opens on its hinge.
        for obj in scene.objects:
            if obj.get('assembly')=='door_1':
                obj.hide_render=True
        if name=='cabin':
            bpy.ops.object.light_add(type='AREA',location=(0,-1.15,1.9))
            light=bpy.context.object;light.data.energy=65;light.data.size=1.4
            light.rotation_euler=(Vector((-.2,0,.7))-light.location).to_track_quat('-Z','Y').to_euler()
    cam.location=location;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=lens
    scene.render.filepath=str(root/('work/cybercab-'+name+'-v3.png'))
    bpy.ops.render.render(write_still=True)
