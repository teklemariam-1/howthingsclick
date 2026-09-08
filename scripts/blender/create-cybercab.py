"""Reference-based Cybercab exterior, built from shared surface profiles.
Rebuild: node scripts/blender/export-reference.mjs
Then: blender --background --python scripts/blender/create-cybercab.py
"""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/models';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'work/cybercab-base.glb'))
def mat(name,color,metal=0,rough=.3,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;p.inputs['Coat Weight'].default_value=.4
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m
gold=mat('paint',(.503,.36,.181),.64,.28)
glass=mat('glass',(.012,.023,.019),.05,.08)
glass.node_tree.nodes.get('Principled BSDF').inputs['Transmission Weight'].default_value=.45
trim=mat('trim',(.012,.019,.023),.35,.3)
white=mat('headlamp',(.68,.91,1),.15,.2,2)
red=mat('taillamp',(.8,.012,.01),.1,.24,2)
refined=[]
def cv(p):return (p[0],-p[2],p[1])
def old_hide(name):
 o=bpy.data.objects.get(name)
 if o:o.hide_render=True;o.hide_set(True);o.name='reference_'+name
def finish(o,name,material,assembly='body',solid=.006):
 if bpy.data.objects.get(name)!=o:old_hide(name)
 o.name=name;o.data.materials.append(material)
 for p in o.data.polygons:p.use_smooth=True
 if solid:
  mod=o.modifiers.new('Panel thickness','SOLIDIFY');mod.thickness=solid;mod.offset=-1
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 o['assembly']=assembly;o['surface']=material.name
 refined.append(o);return o
def mesh(name,verts,faces,material,assembly='body',solid=.006):
 d=bpy.data.meshes.new(name+'_mesh');d.from_pydata([cv(p) for p in verts],[],faces);d.update()
 o=bpy.data.objects.new(name+'_new',d);bpy.context.collection.objects.link(o)
 return finish(o,name,material,assembly,solid)
def grid(name,nu,nv,fn,material,assembly='body',solid=.006):
 vs=[fn(i/nu,j/nv) for i in range(nu+1) for j in range(nv+1)]
 fs=[]
 for i in range(nu):
  for j in range(nv):
   a=i*(nv+1)+j;fs.append((a,a+1,a+nv+2,a+nv+1))
 return mesh(name,vs,fs,material,assembly,solid)
def tube(name,points,radius,material,assembly='body',closed=False):
 old_hide(name)
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=2;d.bevel_depth=radius;d.bevel_resolution=3
 s=d.splines.new('POLY');s.points.add(len(points)-1)
 for v,p in zip(s.points,points):v.co=(*cv(p),1)
 bpy.ops.object.select_all(action='DESELECT')
 s.use_cyclic_u=closed;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True)
 bpy.ops.object.convert(target='MESH');o=bpy.context.object;o.select_set(False)
 return finish(o,name,material,assembly,0)
def lerp(a,b,t):return a+(b-a)*t
def smooth(t):t=max(0,min(1,t));return t*t*(3-2*t)
def cat(rows,t):
 u=min(len(rows)-1-1e-8,max(0,t*(len(rows)-1)));i=int(u);a=u-i
 p=[rows[max(0,min(len(rows)-1,j))] for j in [i-1,i,i+1,i+2]]
 return [.5*(2*p[1][k]+(-p[0][k]+p[2][k])*a+(2*p[0][k]-5*p[1][k]+4*p[2][k]-p[3][k])*a*a+(-p[0][k]+3*p[1][k]-3*p[2][k]+p[3][k])*a*a*a) for k in range(len(p[0]))]
def sample(rows,x):
 points=sorted([cat(rows,i/200) for i in range(201)],key=lambda p:p[0])
 for a,b in zip(points,points[1:]):
  if a[0]<=x<=b[0]:
   t=(x-a[0])/max(1e-8,b[0]-a[0]);return [lerp(a[k],b[k],t) for k in range(len(a))]
 return points[0] if x<points[0][0] else points[-1]
hood=[[.76,.993,.81,.008],[1.08,.937,.851,.019],[1.48,.865,.878,.022],[1.87,.775,.865,.017],[2.13,.704,.817,.012],[2.245,.667,.724,.009]]
hatch=[[-2.23,.942,.819,.008],[-1.89,1.035,.864,.012],[-1.42,1.185,.825,.012],[-.94,1.333,.735,.018],[-.50,1.39,.66,.02],[-.13,1.394,.648,.013],[.19,1.365,.648,.003]]
wind=[[.76,1.004,.795,.001],[.62,1.11,.754,.003],[.38,1.29,.688,.007],[.19,1.357,.648,.003]]
for name,rows,ma in [('body_hood',hood,gold),('body_hatch',hatch,gold),('body_windshield',wind,glass)]:
 def loft(u,v,rows=rows):
  x,y,w,b=cat(rows,u);a=v*2-1;z=w*a
  x-=.15*(abs(z)/.82)**5*smooth((x-1.95)/.295)
  x+=.10*(abs(z)/.85)**5*smooth((-x-1.95)/.28)
  return [x,y+b*(1-a*a),z]
 grid(name,72,40,loft,ma)
def roof(x):return sample(hatch,x)
def door_edge(v,rear=False):
 if rear:return [lerp(-.53,-.695,v),lerp(.305,1.064,v)]
 return [lerp(.865,.735,v),lerp(.305,1.006,v)]
def lateral(y,x=0):
 # Physical height controls curvature; wheel-arch tessellation cannot create dents.
 h=max(0,min(1,(y-.27)/.83))
 return .842+.036*math.sin(h*math.pi*.73)-.025*max(0,abs(x)-1.9)/.35
for side in [-1,1]:
 assembly='door_'+str(side)
 def door(u,v):
  l=door_edge(v,True);r=door_edge(v);x=lerp(l[0],r[0],u);y=lerp(l[1],r[1],u)
  z=lateral(y,x)+.002*math.sin(math.pi*u)*math.sin(math.pi*v)
  return [x,y,side*z]
 grid('body_door_'+str(side),56,32,door,gold,assembly)
 def window(u,v):
  bx=lerp(-.69,.728,u);by=lerp(1.074,1.014,u);bz=lateral(by,bx)-.003
  tx=lerp(-.548,.183,u);rr=roof(tx);ty=rr[1]-.029;tz=rr[2]+.008
  return [lerp(bx,tx,v),lerp(by,ty,v),side*lerp(bz,tz,v)]
 grid('body_window_'+str(side),52,28,window,glass,assembly)
 # Precise narrow seals replace the oversized black pipes.
 outline=[door(i/50,0) for i in range(51)]+[door(1,i/30) for i in range(1,31)]+[door(1-i/50,1) for i in range(1,51)]+[door(0,1-i/30) for i in range(1,30)]
 tube('detail_door_seal_'+str(side),outline,.0022,trim,assembly,True)
 glass_outline=[window(i/50,0) for i in range(51)]+[window(1,i/30) for i in range(1,31)]+[window(1-i/50,1) for i in range(1,51)]+[window(0,1-i/30) for i in range(1,30)]
 tube('detail_window_seal_'+str(side),glass_outline,.004,trim,assembly,True)
 # Gold A-pillar bridges the windshield inset and the side-window edge.
 def pillar(u,v):
  p=window(1,v);w=cat(wind,v)
  return [lerp(p[0]+.005,w[0],u),lerp(p[1]+.001,w[1],u),lerp(p[2],side*w[2],u)]
 grid('detail_A_pillar_'+str(side),12,52,pillar,gold,assembly)
 # The rear quarter window and B-pillar follow the same roof profile.
 def quarter(u,v):
  bx=lerp(-.716,-1.33,u);by=lerp(1.078,1.195,u);bz=lerp(.865,.82,u)
  tx=lerp(-.57,-1.33,u);rr=roof(tx);ty=rr[1]-.03;tz=rr[2]+.005
  return [lerp(bx,tx,v),lerp(by,ty,v),side*lerp(bz,tz,v)]
 grid('detail_quarter_glass_'+str(side),38,20,quarter,glass)
 tube('detail_B_pillar_'+str(side),[quarter(0,i/24) for i in range(25)],.014,trim)
 # Shared fender panels, with circular arches and a continuous belt crease.
 verts=[];faces=[]
 def fender(x0,x1,n,front):
  start=len(verts)
  for i in range(n+1):
   x=lerp(x0,x1,i/n);cx=1.4 if front else -1.39;d=x-cx;r=.411
   base=.268 if front else .268+.164*smooth((-x-1.78)/.45)
   lower=max(base,.385+math.sqrt(max(0,r*r-d*d))) if abs(d)<r else base
   if front:row=sample(hood,x);height=row[1];width=row[2]
   else:
    if x< -1.33:row=roof(x);height=row[1];width=row[2]
    else:
     t=(x+1.33)/(.635);height=lerp(1.195,1.066,t);width=lerp(.82,.869,t)
   for j in range(25):
    y=lerp(lower,height,j/24);z=lateral(y,x)
    blend=smooth((y-(height-.105))/.105);z=lerp(z,width,blend)
    actual_x=x
    if front:
     edge=lerp(.865,.735,max(0,min(1,(y-.305)/.701)))
     actual_x=x+(edge-.735)*max(0,1-(x-.735)/.3)**2
    actual_x-=.15*(z/.82)**5*smooth((x-1.95)/.295)
    actual_x+=.10*(z/.85)**5*smooth((-x-1.95)/.28)
    verts.append([actual_x,y,side*z])
  for i in range(n):
   for j in range(24):
    a=start+i*25+j;faces.append((a,a+1,a+26,a+25))
 fender(.735,2.245,94,True);fender(-2.23,-.695,98,False)
 # Fill the triangular strip behind the slanted rear door edge.
 start=len(verts)
 for i in range(33):
  v=i/32;edge=door_edge(v,True);y=edge[1]
  for j in range(7):x=lerp(-.695,edge[0]-.005,j/6);verts.append([x,y,side*lateral(y,x)])
 for i in range(32):
  for j in range(6):a=start+i*7+j;faces.append((a,a+1,a+8,a+7))
 # Roof rail integrates the quarter glazing into the roof.
 start=len(verts)
 for i in range(73):
  x=lerp(-1.33,.19,i/72);rr=roof(x)
  for j in range(6):
   t=j/5;verts.append([x,rr[1]-.03*(1-t),side*(rr[2]+.012*(1-t))])
 for i in range(72):
  for j in range(5):a=start+i*6+j;faces.append((a,a+1,a+7,a+6))
 mesh('body_fender_'+str(side),verts,faces,gold)
 # Wheel-well liners add depth instead of a razor-thin cut edge.
 for cx in [-1.39,1.4]:
  def arch(u,v,cx=cx):
   a=-.28+u*(math.pi+.56);r=.407
   return [cx+math.cos(a)*r,.385+math.sin(a)*r,side*lerp(.862,.635,v)]
  grid('detail_arch_'+str(cx)+'_'+str(side),82,6,arch,trim,solid=.003)
  lip=[[cx+math.cos(-.28+i/80*(math.pi+.56))*.413,.385+math.sin(-.28+i/80*(math.pi+.56))*.413,side*.864] for i in range(81)]
  tube('detail_arch_lip_'+str(cx)+'_'+str(side),lip,.0045,gold)
 def rocker(u,v):
  return [lerp(-.96,.975,u),.247+v*.059,side*(.84+.022*math.sin(v*math.pi))]
 grid('detail_rocker_'+str(side),48,8,rocker,trim)
 # Fine hood shut line / cowl.
 tube('detail_hood_edge_'+str(side),[[x-.15*(w/.82)**5*smooth((x-1.95)/.295),y+.002,side*w] for x,y,w,b in [cat(hood,i/80) for i in range(81)]],.002,trim)
def front(u,v):
 y=lerp(.268,.667,v);w=lerp(lateral(y,2.245),.724,smooth((y-(.667-.105))/.105))
 z=(u*2-1)*w;y+=.009*(1-(u*2-1)**2)*v**8
 return [2.245-.15*(abs(z)/.82)**5,y,z]
def rear_width(y):return lerp(lateral(y,-2.23),.819,smooth((y-(.942-.105))/.105))
def rear(u,v):
 y=lerp(.432,.877,v);w=rear_width(y)
 z=(u*2-1)*w
 return [-2.23+.10*(abs(z)/.85)**5,y,z]
grid('body_front',84,30,front,gold);grid('body_rear',84,30,rear,gold)
def front_light(u,v):
 z=lerp(-.717,.717,u);h=.667+.009*(1-(z/.724)**2)-.018
 return [2.250-.15*(abs(z)/.82)**5,h+(v-.5)*.018,z]
grid('detail_headlight',96,3,front_light,white,solid=.002)
grid('detail_headlight_recess',96,3,lambda u,v:[front_light(u,v)[0]-.003,.667+.009*(1-(lerp(-.722,.722,u)/.724)**2)-.018+(v-.5)*.030,lerp(-.722,.722,u)],trim,solid=.002)
def rear_light(u,v):
 z=lerp(-.795,.795,u)
 return [-2.242+.10*(abs(z)/.85)**5,.879+(v-.5)*.018,z]
grid('detail_taillight',96,3,rear_light,red,solid=.002)
def rear_applique(u,v):
 y=lerp(.873,.943,v);z=(u*2-1)*rear_width(y)
 return [-2.238+.10*(abs(z)/.85)**5,y,z]
grid('detail_rear_applique',96,8,rear_applique,trim,solid=.002)
for side in [-1,1]:
 def wing(u,v):
  x=lerp(.95,1.095,u);y=.887+.045*v*(1-u)
  return [x,y,side*(lateral(y,x)+.006)]
 grid('detail_camera_recess_'+str(side),10,5,wing,trim)
# Under-bumper contours follow the body corners instead of rectangular blocks.
grid('detail_front_valance',80,10,lambda u,v:[2.24-.15*(abs(lerp(-.818,.818,u))/.82)**5,lerp(.185,.273,v),lerp(-.818,.818,u)],trim)
def lower_rear(u,v):
 y=lerp(.208,.434,v);w=lerp(.798,.835,v);z=lerp(-w,w,u)
 return [-2.249+.075*(1-v)**2+.10*(abs(z)/.85)**5,y,z]
grid('detail_rear_valance',80,14,lower_rear,trim)
for side in [-1,1]:
 def rear_wrap(u,v):
  x=lerp(-2.23,-1.806,u);top=.268+.164*smooth((-x-1.78)/.45)
  y=lerp(.208,top,v);z=lateral(top,x)+.009-.02*(1-v)
  return [x+.10*(z/.85)**5*smooth((-x-1.95)/.28),y,side*z]
 grid('detail_rear_bumper_return_'+str(side),36,12,rear_wrap,trim)
# Build the cabin with the same attachment metadata as the exterior.
sys.path.insert(0,str(Path(__file__).parent))
from cybercab_interior import build_interior
build_interior(mat,mesh,grid,tube,finish,cv)
# Remove legacy trim/lights from the reference rendering; runtime hides the same named pieces.
for o in bpy.context.scene.objects:
 if o.name.startswith('legacy_'):o.hide_render=True;o.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
for o in refined:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'cybercab-body.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_extras=True)
report={'panels':len(refined),'vertices':sum(len(o.data.vertices) for o in refined),'triangles':sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in refined),'assetBytes':(OUT/'cybercab-body.glb').stat().st_size}
(ROOT/'work/cybercab-blender-report.json').write_text(json.dumps(report,indent=2))
# Apply the original display texture only after geometry export; the browser loads this small PNG separately.
screen_material=bpy.data.materials.get('display')
if screen_material and (OUT/'cybercab-display.png').exists():
 nodes=screen_material.node_tree.nodes;tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(OUT/'cybercab-display.png'));tex.image.pack()
 p=nodes.get('Principled BSDF');screen_material.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color']);screen_material.node_tree.links.new(tex.outputs['Color'],p.inputs['Emission Color'])
 p.inputs['Emission Strength'].default_value=.7
# Reusable offline studio angles for geometry review.
floor=mat('Studio floor',(.045,.058,.064),.1,.6)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.008));bpy.context.object.data.materials.append(floor)
world=bpy.data.worlds.new('Studio');bpy.context.scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.17,.20,.24,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5
def area(name,loc,power,size,color):
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape='RECTANGLE';o.data.size=size;o.data.size_y=size*.5;o.data.color=color;o.rotation_euler=(Vector((0,0,.7))-o.location).to_track_quat('-Z','Y').to_euler()
area('Softbox',(0,-3,6),1100,6,(.9,.95,1));area('Rim',(-3,3,4),1300,5,(1,.88,.72));area('Fill',(5,2,3),650,4,(.85,.95,1))
bpy.ops.object.camera_add();cam=bpy.context.object
scene=bpy.context.scene;scene.camera=cam;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=1200;scene.render.resolution_y=760;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG'
angles=[('front',(6.7,-6.5,3.3),58),('rear',(-6.5,-6,3),58),('side',(0,-8,1.4),58)]
cam.location=angles[0][1];cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=58
for screen in bpy.data.screens:
 for a in screen.areas:
  if a.type=='VIEW_3D':
   a.spaces.active.region_3d.view_distance=6;a.spaces.active.region_3d.view_location=Vector((0,0,.7));a.spaces.active.region_3d.view_rotation=cam.rotation_euler.to_quaternion()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'work/cybercab-surface-study.blend'))
if '--quick' in sys.argv:angles=angles[:1]
if '--no-render' in sys.argv:angles=[]
for name,loc,lens in angles:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=lens
 scene.render.filepath=str(ROOT/('work/cybercab-'+name+'-v2.png'));bpy.ops.render.render(write_still=True)
print(json.dumps(report))
