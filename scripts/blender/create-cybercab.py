"""Original reference-based Cybercab surface study. Run in Blender background mode.
Uses work/cybercab-base.glb for the modeling reference and optional studio render.
Exports independent named surfaces for the browser's existing moving assemblies.
"""
import bpy, math, json, os
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/models';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'work/cybercab-base.glb'))
base=list(bpy.context.scene.objects)
def material(name,color,metal=.6,rough=.26):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Coat Weight'].default_value=.35
 return m
gold=material('Reference champagne finish',(.50,.38,.21),.64,.27)
glass=material('Smoked curved glazing',(.015,.032,.043),.55,.13)
refined=[]
# Web coordinate convention: X forward, Y up, Z lateral. Blender is Z up.
def convert(v):return (v[0],-v[2],v[1])
def make(name,verts,faces,mat):
 old=bpy.data.objects.get(name)
 if old:old.hide_render=True;old.hide_set(True);old.name='reference_'+name
 mesh=bpy.data.meshes.new(name+'_mesh');mesh.from_pydata([convert(v) for v in verts],[],faces);mesh.update()
 o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(mat)
 for p in mesh.polygons:p.use_smooth=True
 solid=o.modifiers.new('Panel thickness','SOLIDIFY');solid.thickness=.008;solid.offset=0
 bevel=o.modifiers.new('Rolled panel edge','BEVEL');bevel.width=.004;bevel.segments=3;bevel.limit_method='ANGLE'
 bpy.context.view_layer.objects.active=o
 for modifier in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=modifier.name)
 refined.append(o);return o
def grid(name,nu,nv,fn,mat):
 v=[fn(i/nu,j/nv) for i in range(nu+1) for j in range(nv+1)]
 f=[]
 for i in range(nu):
  for j in range(nv):
   n=i*(nv+1)+j;f.append((n,n+1,n+nv+2,n+nv+1))
 return make(name,v,f,mat)
def cat(rows,t):
 u=min(len(rows)-1-1e-6,max(0,t*(len(rows)-1)));i=int(u);a=u-i
 p0=rows[max(0,i-1)];p1=rows[i];p2=rows[min(len(rows)-1,i+1)];p3=rows[min(len(rows)-1,i+2)]
 return [.5*((2*p1[k])+(-p0[k]+p2[k])*a+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*a*a+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*a*a*a) for k in range(len(p1))]
hood=[[.7,1.005,.755,.014],[1,.95,.8,.045],[1.35,.87,.858,.056],[1.75,.8,.875,.045],[2.12,.735,.82,.016],[2.22,.69,.72,.012]]
hatch=[[-2.2,.9,.82,.014],[-1.95,.98,.872,.015],[-1.5,1.065,.86,.018],[-1.05,1.19,.78,.022],[-.64,1.34,.68,.025],[-.24,1.39,.647,.018],[.04,1.386,.643,.012]]
wind=[[.72,1.003,.755,0],[.59,1.13,.725,.004],[.28,1.365,.641,.01],[.04,1.39,.643,.01]]
for name,rows,mat in [('body_hood',hood,gold),('body_hatch',hatch,gold),('body_windshield',wind,glass)]:
 def loft(u,v,rows=rows):
  x,y,w,b=cat(rows,u);a=v*2-1;return [x,y+b*(1-a*a),w*a]
 grid(name,100,48,loft,mat)
def roof_at(x):
 rows=hatch if x<=.04 else wind
 points=sorted([cat(rows,i/400) for i in range(401)],key=lambda p:p[0])
 for a,b in zip(points,points[1:]):
  if a[0]<=x<=b[0]:
   q=(x-a[0])/max(1e-8,b[0]-a[0]);return (a[1]+(b[1]-a[1])*q,a[2]+(b[2]-a[2])*q)
 return (points[-1][1],points[-1][2])
for side in [-1,1]:
 def door(u,v):
  left=-.968-.069*v;right=.82-.085*v;x=left+(right-left)*u;y=.335+v*.667
  z=.834+.033*math.sin(v*math.pi*.75)+.012*math.sin(u*math.pi)*math.sin(v*math.pi)
  return [x,y,side*z]
 grid('body_door_'+str(side),70,30,door,gold)
 def window(u,v):
  left=-1.038+.438*v;right=.73-.5*v
  x=left+(right-left)*u
  topx=-.6+.83*u;topheight,topwidth=roof_at(topx)
  y=1.014+(topheight-.028-1.014)*v
  z=.86+(topwidth+.009-.86)*v+.005*math.sin(math.pi*u)*math.sin(math.pi*v)
  return [x,y,side*z]
 grid('body_window_'+str(side),56,24,window,glass)
 # Two continuous fenders plus a shaped rocker, all in one replaceable mesh.
 verts=[];faces=[]
 def piece(x0,x1,n,front):
  start=len(verts)
  for i in range(n+1):
   x=x0+(x1-x0)*i/n;cx=1.4 if front else -1.39
   d=x-cx;r=.415
   lo=max(.278,.385+math.sqrt(max(0,r*r-d*d))) if abs(d)<r else .278
   if front:
    # Interpolate the hood shoulder without forcing a flat side slab.
    rs=hood
   else:rs=hatch[:4]
   # Height/width on measured silhouette control stations.
   stations=sorted(rs,key=lambda r:r[0])
   a=stations[0];b=stations[-1]
   for k in range(len(stations)-1):
    if stations[k][0]<=x<=stations[k+1][0]:a,b=stations[k],stations[k+1];break
   q=max(0,min(1,(x-a[0])/max(.001,b[0]-a[0])));hi=a[1]+(b[1]-a[1])*q;upper=a[2]+(b[2]-a[2])*q
   for j in range(17):
    v=j/16;y=lo+(hi-lo)*v
    edge=.824+(.059*math.sin(v*math.pi*.75));z=edge*(1-v*v)+upper*v*v
    z+=.012*math.exp(-((abs(d)-.417)/.11)**2)*(1-v)
    verts.append([x,y,side*z])
  for i in range(n):
   for j in range(16):
    a=start+i*17+j;faces.append((a,a+1,a+18,a+17))
 piece(.744,2.22,84,True);piece(-2.2,-1.038,84,False)
 start=len(verts)
 for i in range(51):
  x=-1.04+1.865*i/50
  for j in range(7):verts.append([x,.272+j*.01,side*(.836+.02*math.sin(j/6*math.pi))])
 for i in range(50):
  for j in range(6):
   n=start+i*7+j;faces.append((n,n+1,n+8,n+7))
 # A continuous roof rail closes the canopy seam above the door glass.
 start=len(verts)
 for i in range(65):
  x=-.604+.84*i/64;rh,rw=roof_at(x)
  for j in range(5):
   v=j/4;verts.append([x,rh-.032*(1-v),side*(rw+.014*(1-v))])
 for i in range(64):
  for j in range(4):
   n=start+i*5+j;faces.append((n,n+1,n+6,n+5))
 make('body_fender_'+str(side),verts,faces,gold)
# Curved bumper surfaces, with a tight junction under the light bars.
def front(u,v):
 z=(u*2-1)*(.794+.037*v);y=.295+v*.397;x=2.19+.04*math.sin(v*math.pi)-.10*(abs(z)/.831)**8
 return [x,y,z]
def rear(u,v):
 z=(u*2-1)*(.78+.047*v);y=.3+v*.536;x=-2.196+.06*(abs(z)/.827)**8-.014*math.sin(v*math.pi)
 return [x,y,z]
grid('body_front',64,24,front,gold);grid('body_rear',64,24,rear,gold)
# Export only the refined, detachable surfaces. Other mechanisms remain authored in Three.js.
bpy.ops.object.select_all(action='DESELECT')
for o in refined:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'cybercab-body.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_materials='EXPORT')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/cybercab-surface-study.blend'))
report={'objects':[o.name for o in refined],'vertices':sum(len(o.data.vertices) for o in refined),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in refined),'assetBytes':(OUT/'cybercab-body.glb').stat().st_size,'blender':bpy.app.version_string,'originalModel':True}
(ROOT/'work/cybercab-blender-report.json').write_text(json.dumps(report,indent=2))
# Reference render validates the exported shape without opening a browser.
floor=material('Studio floor',(.07,.085,.09),.1,.5)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.018));bpy.context.object.data.materials.append(floor)
world=bpy.data.worlds.new('Studio') if not bpy.data.worlds else bpy.data.worlds[0];bpy.context.scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.13,.17,.2,1);world.node_tree.nodes['Background'].inputs[1].default_value=.45
def area(name,location,power,size,color):
 bpy.ops.object.light_add(type='AREA',location=location);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='RECTANGLE';o.data.size=size;o.data.size_y=size*.65;o.data.color=color;o.rotation_euler=(Vector((0,0,.7))-o.location).to_track_quat('-Z','Y').to_euler()
area('Long softbox',(0,-3,6),1000,6,(.87,.94,1))
area('Warm shoulder rim',(-3,3,4),1300,5,(1,.86,.65))
area('Front fill',(5,2,3),700,4,(.85,.95,1))
bpy.ops.object.camera_add(location=(6.7,-6.5,3.7));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=58
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=760;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'work/cybercab-blender-preview.png')
bpy.ops.render.render(write_still=True)
print(json.dumps(report))
