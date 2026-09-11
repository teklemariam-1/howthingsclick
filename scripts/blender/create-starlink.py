"""Original, reference-informed Starlink educational meshes. Blender 5.x; no external add-ons."""
import bpy, math, os, sys
from mathutils import Vector
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
OUT = os.path.join(ROOT,'public/models')
WORK = os.path.join(ROOT,'work/starlink')
os.makedirs(OUT,exist_ok=True); os.makedirs(WORK,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name, color, metallic=0, rough=.45):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Metallic'].default_value=metallic; bs.inputs['Roughness'].default_value=rough
    return m
silver=mat('Anodized aluminium',(.42,.47,.52),.85,.29)
white=mat('RF-transparent ceramic panels',(.79,.82,.8),.07,.37)
black=mat('Carbon composite',(.028,.034,.042),.45,.36)
foil=mat('Thermal blanket',(.14,.15,.18),.8,.26)
gold=mat('Gold interconnects',(.49,.28,.07),.82,.3)
copper=mat('Copper antenna patches',(.57,.30,.09),.72,.26)
pcb=mat('Illustrative avionics board',(.025,.095,.083),.25,.42)
lens=mat('Coated optical aperture',(.045,.12,.23),.88,.09)
rubber=mat('Elastomer seal',(.024,.027,.031),.04,.83)
plastic=mat('Terminal white enclosure',(.88,.9,.88),.04,.34)
cell=mat('Photovoltaic blue-black',(.012,.035,.086),.72,.21)
# Fine physical surface detail preserved in the editable Blender scene.
for m,scale,strength in [(foil,33,.14),(plastic,240,.045),(silver,190,.04)]:
    n=m.node_tree.nodes; l=m.node_tree.links; tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=scale;tex.inputs['Detail'].default_value=2
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=strength;bump.inputs['Distance'].default_value=.008
    l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],n.get('Principled BSDF').inputs['Normal'])
parts={}
geometry_cache={}
def add(o,material,part):
    if not o.data.materials:o.data.materials.append(material)
    parts.setdefault(part,[]).append(o);return o
def box(name,pos,size,m,part,bevel=.02):
    key=('box',tuple(size),m.name,bevel)
    if key in geometry_cache:
        o=bpy.data.objects.new(name,geometry_cache[key]);bpy.context.collection.objects.link(o)
    else:
        x,y,z=[v/2 for v in size]
        verts=[(-x,-y,-z),(x,-y,-z),(x,y,-z),(-x,y,-z),(-x,-y,z),(x,-y,z),(x,y,z),(-x,y,z)]
        faces=[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
        o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o
        if bevel:
            mod=o.modifiers.new('Machined edges','BEVEL');mod.width=min(bevel,min(size)*.4);mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
            for p in o.data.polygons:p.use_smooth=True
            wn=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');bpy.ops.object.modifier_apply(modifier=wn.name)
        geometry_cache[key]=o.data
    o.location=pos;return add(o,m,part)
def cyl(name,pos,r,depth,m,part,axis='Z',vertices=32):
    key=('cylinder',r,round(depth,6),m.name,vertices)
    if key not in geometry_cache:
        vs=[(math.cos(i*2*math.pi/vertices)*r,math.sin(i*2*math.pi/vertices)*r,z) for z in [-depth/2,depth/2] for i in range(vertices)]
        fs=[(i,(i+1)%vertices,(i+1)%vertices+vertices,i+vertices) for i in range(vertices)]
        fs += [tuple(range(vertices-1,-1,-1)),tuple(range(vertices,vertices*2))]
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],fs);mesh.update()
        for p in mesh.polygons:p.use_smooth=p.index<vertices
        geometry_cache[key]=mesh
    o=bpy.data.objects.new(name,geometry_cache[key]);bpy.context.collection.objects.link(o);o.location=pos
    if axis=='X':o.rotation_euler.y=math.pi/2
    if axis=='Y':o.rotation_euler.x=math.pi/2
    return add(o,m,part)
def rod(name,a,b,r,m,part):
    delta=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))*.5,r,delta.length,m,part);o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();return o
def cable(name,points,r,m,part):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=3
    sp=cu.splines.new('BEZIER');sp.bezier_points.add(len(points)-1)
    for p,co in zip(sp.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob)
    bpy.ops.object.select_all(action='DESELECT');bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH')
    return add(bpy.context.object,m,part)
print('Building cached mesh assemblies',flush=True)
# Satellite: five white RF panels, thin central bus, three gimballed optical terminals,
# two opposing solar wings. Internal packaging is an original teaching reconstruction.
box('Thin structural chassis',(0,0,0),(4.1,3.35,.22),silver,'satellite_bus',.045)
box('Thermal rear skin',(0,0,-.14),(3.99,3.25,.10),foil,'satellite_thermal',.015)
for x in [-1,1]:
    for y in [-1.075,0,1.075]:
        if x==1 and y==-1.075: continue
        box('Ku-band panel',(x,y,.205),(1.94,1.035,.12),white,'satellite_antennas',.025)
        for dx in [-.87,.87]:
            for dy in [-.42,.42]:cyl('Recessed panel screw',(x+dx,y+dy,.271),.023,.008,silver,'satellite_antennas',vertices=12)
box('Payload heat spreader',(1,-1.075,.205),(1.94,1.035,.12),black,'satellite_bus',.025)
for y in [-1.48+i*.06 for i in range(15)]:
    box('Radiator fin',(1,y,.29),(1.65,.018,.055),silver,'satellite_bus',.005)
# Hidden board and electronics, exposed by the interactive cutaway.
box('Avionics deck',(0,0,.12),(3.9,3.16,.06),pcb,'satellite_avionics',.01)
for x in [-1.35,-.45,.45,1.35]:
    for y in [-.95,0,.95]:
        box('Processor package',(x,y,.18),(.47,.48,.08),black,'satellite_avionics',.015)
        for dy in [-.28,.28]:
            for i in range(9):box('Signal pin',(x-.19+i*.046,y+dy,.18),(.018,.10,.015),gold,'satellite_avionics',0)
        for off in range(4):cyl('Capacitor',(x+.31,y-.17+off*.12,.205),.033,.10,silver,'satellite_avionics',vertices=12)
for s in [-1,1]:
    for y in [-1.60,1.60]:
        box('Chassis perimeter rail',(0,y,-.02),(4.15,.07,.27),black,'satellite_bus',.013)
    cable('Harness',[(s*1.85,-1.4,.16),(s*1.85,-.3,.22),(s*1.60,.9,.22),(s*.6,1.40,.16)],.025,gold,'satellite_avionics')
# Gimballed optical terminals at the bus edge.
for i,(x,y) in enumerate([(-1.30,1.93),(0,1.98),(1.30,1.93)]):
    cyl('Gimbal yaw bearing',(x,y,.035),.24,.13,silver,'satellite_lasers')
    box('Optical terminal yoke',(x,y,.23),(.49,.37,.39),black,'satellite_lasers',.055)
    cyl('Optical barrel',(x,y+.18,.27),.135,.30,black,'satellite_lasers','Y')
    cyl('Coated lens',(x,y+.34,.27),.115,.014,lens,'satellite_lasers','Y',48)
    for a in range(8):
        theta=a*math.pi/4
        cyl('Aperture bolt',(x+math.cos(theta)*.147,y+.335,.27+math.sin(theta)*.147),.015,.014,silver,'satellite_lasers','Y',10)
# Dish-like gateway antenna apertures and deployable brackets.
for x,y in [(-2.63,-1.1),(-2.63,1.1),(2.63,1.1)]:
    rod('Payload bracket',(math.copysign(1.9,x),y,0),(x,y,.03),.045,silver,'satellite_bus')
    cyl('Gateway antenna backing',(x,y,.03),.34,.10,black,'satellite_antennas')
    cyl('Gateway antenna face',(x,y,.087),.31,.018,silver,'satellite_antennas',vertices=64)
    cyl('Antenna feed',(x,y,.13),.07,.10,black,'satellite_antennas')
# Long articulated wings. White back, dark cells on sun-facing outer face.
for s in [-1,1]:
    part='satellite_wing_left' if s<0 else 'satellite_wing_right'
    for y in [-1.28,1.28]:
        rod('Deployable boom',(s*2.02,y,-.07),(s*3.45,y,-.14),.037,black,part)
    cyl('Solar wing hinge',(s*3.3,0,-.15),.10,2.7,silver,part,'Y')
    for panel in range(5):
        px=s*(4.05+panel*1.52)
        box('White solar backsheet',(px,0,-.15),(1.49,3.50,.045),white,part,.006)
        box('Cell substrate',(px,0,-.12),(1.44,3.44,.025),black,part,.003)
        for col in range(6):
            for row in range(14):
                cx=px-.61+col*.245;cy=-1.58+row*.243
                box('Photovoltaic cell',(cx,cy,-.099),(.228,.224,.013),cell,part,.01)
                box('Silver busbar',(cx,cy,-.090),(.003,.214,.002),silver,part,0)
        for py in [-1.74,1.74]:rod('Array frame',(px-.745,py,-.15),(px+.745,py,-.15),.018,silver,part)
    for y in [-1.28,1.28]:
        for i in range(5):
            xa=s*(3.3+i*1.52);xb=s*(3.3+(i+1)*1.52)
            rod('Rear truss',(xa,y,-.18),(xb,y,-.18),.017,black,part)
            rod('Rear diagonal',(xa,y,-.18),(xb,y,-.50),.014,black,part)
            rod('Rear truss lower',(xa,y,-.5),(xb,y,-.5),.017,black,part)
# Argon Hall thruster reference detail, not a chemical flame.
cyl('Thruster body',(1.48,-1.85,-.03),.21,.32,black,'satellite_propulsion','Y')
cyl('Thruster exit',(1.48,-2.02,-.03),.19,.03,silver,'satellite_propulsion','Y')
cyl('Thruster channel',(1.48,-2.04,-.03),.14,.032,black,'satellite_propulsion','Y')
# Standard 4X terminal in metres, displayed at enlarged teaching scale by Three.
box('Terminal back',(0,0,0),(.383,.594,.029),plastic,'terminal_back',.018)
box('Perimeter seal',(0,0,.015),(.379,.589,.006),rubber,'terminal_back',.012)
box('RF radome',(0,0,.024),(.383,.594,.0197),plastic,'terminal_radome',.013)
box('RF circuit layer',(0,0,.017),(.354,.563,.0025),pcb,'terminal_board',.006)
# A sparse representative array; exact proprietary element layout/count is not claimed.
for x in range(12):
    for y in range(18):
        px=-.162+x*.0294;py=-.257+y*.0302
        box('Antenna patch',(px,py,.022),(.021,.021,.0016),copper,'terminal_array',.001)
for x in [-.12,0,.12]:
    for y in [-.20,0,.20]:box('Beamformer',(x,y,.012),(.031,.032,.009),black,'terminal_board',.001)
box('Cable recess',(0,-.16,-.017),(.09,.074,.01),rubber,'terminal_back',.005)
box('Cable connector',(0,-.16,-.025),(.019,.032,.019),black,'terminal_back',.002)
for s in [-1,1]:
    rod('Kickstand side',(s*.071,.105,-.018),(s*.071,-.05,-.155),.012,plastic,'terminal_stand')
    rod('Kickstand foot',(s*.071,-.05,-.155),(s*.071,-.08,-.018),.012,plastic,'terminal_stand')
rod('Kickstand crossbar',(-.071,-.05,-.155),(.071,-.05,-.155),.012,plastic,'terminal_stand')
box('Router 3',(0,0,0),(.299,.0434,.121),plastic,'router',.012)
box('Router fascia',(0,-.023,0),(.282,.006,.105),white,'router',.007)
# Consolidate by assembly into GLB nodes, preserving materials and proper normals.
print('Consolidating named parts',flush=True)
for name,objects in list(parts.items()):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    objects[0].data=objects[0].data.copy()
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    obj=bpy.context.object
    bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
    obj.name=name
    bpy.context.scene.cursor.location=(0,0,0);bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
    obj['part']=name
    obj['reconstruction']='Original educational geometry; hidden electronics illustrative'
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
    if o.type=='MESH':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'starlink-hardware.glb'),export_format='GLB',use_selection=True,export_extras=True,export_yup=True)
# Editable studio scene; terminal nodes parked away from the satellite.
for o in bpy.context.scene.objects:
    if o.name.startswith('terminal_') or o.name=='router':o.hide_render=True
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48
scene.world.color=(.025,.025,.025)
def area(name,loc,energy,size):
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
area('Large softbox',(3,-4,15),2400,10);area('Blue rim',(-5,7,6),1800,8)
bpy.ops.object.camera_add(location=(13,-18,16));cam=bpy.context.object;cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=38;scene.camera=cam
scene.render.resolution_x=1920;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(WORK,'starlink-hardware.blend'))
print('STARLINK_ASSET_READY',os.path.join(OUT,'starlink-hardware.glb'))

