"""Original cabin reconstruction from Tesla Japan's Cybercab reference gallery."""
import bpy, math

def build_interior(mat,mesh,grid,tube,finish,cv):
    ivory=mat('upholstery',(.70,.67,.60),0,.40)
    seam=mat('stitch',(.38,.35,.30),0,.65)
    carpet=mat('carpet',(.024,.022,.021),0,.95)
    dark=bpy.data.materials.get('trim')
    display=mat('display',(.026,.040,.044),0,.35,.2)
    ambient=mat('ambient',(.95,.86,.64),0,.35,1.4)
    buckle=mat('buckle',(.52,.025,.025),.1,.5)
    def rounded(name,pos,size,ma,r=.025,assembly='body',recline=0):
        bpy.ops.mesh.primitive_cube_add(size=1,location=cv(pos))
        o=bpy.context.object;o.name=name+'_new';o.scale=(size[0],size[2],size[1])
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        bevel=o.modifiers.new('Soft molded edges','BEVEL');bevel.width=r;bevel.segments=5
        bpy.ops.object.modifier_apply(modifier=bevel.name)
        if recline:
            for v in o.data.vertices:
                v.co.x-=recline*v.co.z
        normal=o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');normal.keep_sharp=True
        bpy.ops.object.modifier_apply(modifier=normal.name)
        return finish(o,name,ma,assembly,0)
    def ring(name,pos,radius,tube_radius,ma):
        bpy.ops.mesh.primitive_torus_add(major_segments=40,minor_segments=8,location=cv(pos),major_radius=radius,minor_radius=tube_radius)
        return finish(bpy.context.object,name,ma,solid=0)
    rounded('detail_cabin_floor',(-.04,.385,0),(1.78,.05,1.45),carpet,.018)
    rounded('detail_cabin_footwell',(.725,.63,0),(.045,.43,1.37),carpet,.020)
    rounded('detail_cabin_bulkhead',(-.81,.80,0),(.07,.78,1.36),carpet,.035)
    for side in [-1,1]:
        key=str(side);z=side*.345
        rounded('detail_seat_plinth_'+key,(-.20,.44,z),(.60,.10,.55),dark,.03)
        # Two contiguous seat cushions with soft bolsters and a gently raised thigh pad.
        rounded('detail_seat_cushion_'+key,(-.16,.53,z),(.63,.14,.58),ivory,.062)
        rounded('detail_seat_thigh_'+key,(.115,.568,z),(.145,.087,.545),ivory,.037)
        back=rounded('detail_seat_back_'+key,(-.49,.852,z),(.17,.625,.565),ivory,.07,recline=.27)
        # Small lumbar swell on the front surface; keep the shell continuous.
        for vertex in back.data.vertices:
            h=vertex.co.z
            if vertex.co.x>-.27*h:
                vertex.co.x+=.014*math.exp(-((h+.11)/.13)**2)
        rounded('detail_seat_headrest_shell_'+key,(-.575,1.22,z),(.125,.237,.36),dark,.048,recline=.1)
        rounded('detail_seat_headrest_'+key,(-.542,1.223,z),(.113,.223,.342),ivory,.048,recline=.1)
        # Restrained welt seams and the cushion's two horizontal divisions.
        for height in [.758,.946]:
            x=-.399-.27*(height-.852)
            tube('detail_seat_back_seam_'+key+'_'+str(height),[[x,height,z+w] for w in [-.225,-.15,0,.15,.225]],.0014,seam)
        for x in [-.30,.04]:
            tube('detail_seat_cushion_seam_'+key+'_'+str(x),[[x,.601,z+w] for w in [-.225,-.15,0,.15,.225]],.0014,seam)
        # Belt webbing and red release buttons sit beside each seat.
        out=z+side*.292
        mesh('detail_seat_belt_'+key,[[-.655,1.18,out],[-.620,1.18,out],[-.36,.56,out],[-.395,.56,out]],[(0,1,2,3)],dark,solid=.002)
        rounded('detail_seat_buckle_'+key,(-.23,.601,side*.063),(.047,.052,.028),dark,.008)
        rounded('detail_seat_buckle_release_'+key,(-.218,.629,side*.063),(.029,.009,.020),buckle,.003)
        # Door trim follows the door and side glass as a single moving assembly.
        assembly='door_'+key
        def panel(u,v):
            x=-.62+u*1.31
            bottom=.50+.16*u*u;top=1.017-.056*u
            return [x,bottom+(top-bottom)*v,side*(.794-.030*math.sin(v*math.pi))]
        grid('detail_door_lower_'+key,24,8,lambda u,v:[-.52+u*1.21,.32+(.18+.16*u*u)*v,side*.796],carpet,assembly,.007)
        grid('detail_door_inner_'+key,32,12,panel,ivory,assembly,.009)
        rounded('detail_door_top_'+key,(.015,.964,side*.794),(1.28,.067,.063),dark,.025,assembly)
        def armrest(u,v):
            x=-.56+u*1.10;y=.597+.165*u**3
            return [x,y+v*.044,side*(.746+.021*v)]
        grid('detail_door_armrest_'+key,32,6,armrest,ivory,assembly,.018)
        rounded('detail_door_release_'+key,(.39,.778,side*.742),(.095,.023,.016),dark,.006,assembly)
        # Light inner pillar trim, inset so it does not project through the exterior.
        tube('detail_cabin_pillar_'+key,[[.715,1.011,side*.756],[.47,1.21,side*.697],[.193,1.335,side*.620]],.020,ivory,assembly)
    rounded('detail_center_console',(-.015,.553,0),(.33,.035,.15),dark,.017)
    for x in [-.053,.068]:
        ring('detail_cupholder_rim_'+str(x),(x,.576,0),.049,.0035,seam)
        bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=.047,depth=.010,location=cv((x,.565,0)))
        finish(bpy.context.object,'detail_cupholder_well_'+str(x),carpet,solid=0)
    rounded('detail_center_armrest_base',(-.36,.677,0),(.19,.20,.12),dark,.034)
    rounded('detail_center_armrest',(-.23,.777,0),(.39,.072,.143),ivory,.032)
    rounded('detail_dashboard_top',(.545,.931,0),(.30,.065,1.42),dark,.031)
    rounded('detail_dashboard_fascia',(.423,.880,0),(.07,.084,1.38),ivory,.028)
    rounded('detail_dashboard_vent',(.381,.894,0),(.010,.017,1.30),dark,.006)
    rounded('detail_dashboard_ambient',(.379,.876,0),(.009,.007,1.27),ambient,.003)
    rounded('detail_screen_mount',(.453,.902,0),(.11,.082,.105),dark,.018)
    rounded('detail_screen_frame',(.355,.967,0),(.029,.348,.606),dark,.009)
    screen=grid('detail_cabin_display',1,1,lambda u,v:[.337,.805+v*.323,(u-.5)*.577],display,solid=0)
    uv=screen.data.uv_layers.new(name='UVMap')
    for poly in screen.data.polygons:
        for loop_index in poly.loop_indices:
            co=screen.data.vertices[screen.data.loops[loop_index].vertex_index].co
            uv.data[loop_index].uv=(-co.y/.577+.5,(co.z-.805)/.323)
    rounded('detail_cabin_headliner',(-.15,1.344,0),(.76,.027,1.15),carpet,.02)
    rounded('detail_roof_console',(.115,1.306,0),(.16,.039,.245),dark,.018)
    for side in [-1,1]:
        rounded('detail_dome_light_'+str(side),(.10,1.283,side*.077),(.068,.007,.041),ambient,.009)
    rounded('detail_stop_button',(.10,1.281,0),(.032,.009,.040),buckle,.006)
    rounded('detail_rear_plate',(-2.249,.326,0),(.006,.080,.265),dark,.007)
