import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PARTS, findPart, type SystemId } from '@/lib/engine/catalog';
import { CYLINDER_Z, CRANK_RADIUS, ROD_LENGTH, cylinderPose, valveLift, advanceCycle, assemblyOffset } from '@/lib/engine/mechanics';

export type SceneOptions = { playing:boolean; speed:number; cutaway:boolean; explode:number; removed:string[]; selected:string|null; isolated:boolean; labels:boolean; system:SystemId; warm:boolean; quality:'balanced'|'high' };
type V3 = [number,number,number];
type Assembly = { group:THREE.Group; offset:V3; amount:number; anchor:THREE.Vector3; materials:THREE.MeshStandardMaterial[] };
const vec = (v: V3) => new THREE.Vector3(...v);

export function createEngineScene(host:HTMLElement, onSelect:(id:string|null)=>void, onTick:(cycle:number)=>void) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#11181b');
  scene.fog = new THREE.Fog('#11181b',24,60);
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.65));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-label','Interactive 3D four-cylinder engine. Use the part list and camera controls for keyboard navigation.');
  renderer.domElement.setAttribute('role','img');
  host.appendChild(renderer.domElement);
  const camera=new THREE.PerspectiveCamera(34,1,.05,100);
  camera.position.set(10.4,7.4,11.8);
  const orbit=new OrbitControls(camera,renderer.domElement);
  orbit.target.set(0,1.1,0);orbit.enableDamping=true;orbit.dampingFactor=.075;orbit.minDistance=3;orbit.maxDistance=29;orbit.maxPolarAngle=Math.PI*.84;
  const pmrem=new THREE.PMREMGenerator(renderer);
  const environment=new RoomEnvironment();
  const env=pmrem.fromScene(environment,.04);
  scene.environment=env.texture;scene.environmentIntensity=.65;
  environment.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#e4f5ef','#29313e',1.1));
  const key=new THREE.DirectionalLight('#fff1dd',4.6);key.position.set(5,10,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;key.shadow.normalBias=.035;key.shadow.bias=-.0001;scene.add(key);
  const rim=new THREE.DirectionalLight('#c0e8ff',3);rim.position.set(-6,6,-4);scene.add(rim);
  const fill=new THREE.DirectionalLight('#b3c9ce',1.4);fill.position.set(1,3,-8);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:'#192124',roughness:.92,metalness:.05}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.47;floor.receiveShadow=true;scene.add(floor);
  const materials={
    cast:new THREE.MeshStandardMaterial({color:'#838b8b',metalness:.74,roughness:.43}),
    machined:new THREE.MeshStandardMaterial({color:'#c3cecf',metalness:.92,roughness:.23}),
    steel:new THREE.MeshStandardMaterial({color:'#7e8d92',metalness:1,roughness:.24}),
    dark:new THREE.MeshStandardMaterial({color:'#343c3e',metalness:.82,roughness:.31}),
    black:new THREE.MeshStandardMaterial({color:'#141e21',metalness:.25,roughness:.48}),
    cover:new THREE.MeshStandardMaterial({color:'#44675f',metalness:.57,roughness:.33}),
    brass:new THREE.MeshStandardMaterial({color:'#b99761',metalness:.87,roughness:.27}),
    ceramic:new THREE.MeshStandardMaterial({color:'#e8e5d9',metalness:.04,roughness:.2}),
    rubber:new THREE.MeshStandardMaterial({color:'#14181b',metalness:0,roughness:.84}),
  };
  const root=new THREE.Group();scene.add(root);
  const assemblies=new Map<string,Assembly>();
  const meshes:THREE.Mesh[]=[];
  const cutObjects:THREE.Object3D[]=[];
  const linerVariants:{whole:THREE.Mesh;cut:THREE.Mesh}[]=[];
  const pistons:THREE.Group[]=[];const rods:THREE.Group[]=[];
  const valves:{node:THREE.Group;n:number;type:'intake'|'exhaust';y:number}[]=[];
  const cams:THREE.Group[]=[];const camGears:THREE.Group[]=[];
  let options:SceneOptions={playing:false,speed:.32,cutaway:true,explode:0,removed:[],selected:null,isolated:false,labels:true,system:'all',warm:true,quality:'balanced'};
  let cycle=28,flowClock=0,disposed=false,last=performance.now(),reported=0,frameId=0;
  const makeAssembly=(id:string,offset:V3)=>{const group=new THREE.Group();group.name=id;root.add(group);assemblies.set(id,{group,offset,amount:0,anchor:new THREE.Vector3(),materials:[]});return group;};
  function mesh(parent:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.MeshStandardMaterial,p:V3=[0,0,0],rotation?:V3){
    const mat=material.clone();const m=new THREE.Mesh(geometry,mat);m.position.set(...p);if(rotation)m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;parent.add(m);meshes.push(m);
    let part:THREE.Object3D|null=parent;while(part&&!assemblies.has(part.name))part=part.parent;
    if(part){m.userData.partId=part.name;assemblies.get(part.name)!.materials.push(mat);}return m;
  }
  const box=(parent:THREE.Object3D,size:V3,p:V3,material=materials.cast,r=.045)=>mesh(parent,new RoundedBoxGeometry(...size,2,Math.min(r,...size.map(x=>x/3))),material,p);
  const cylinder=(parent:THREE.Object3D,r:number,h:number,p:V3,material=materials.steel,axis:'x'|'y'|'z'='y',segments=40)=>mesh(parent,new THREE.CylinderGeometry(r,r,h,segments),material,p,axis==='z'?[Math.PI/2,0,0]:axis==='x'?[0,0,Math.PI/2]:undefined);
  const ring=(parent:THREE.Object3D,r:number,t:number,p:V3,material=materials.steel,axis:'x'|'y'|'z'='z')=>mesh(parent,new THREE.TorusGeometry(r,t,8,48),material,p,axis==='y'?[Math.PI/2,0,0]:axis==='x'?[0,Math.PI/2,0]:undefined);
  function tube(parent:THREE.Object3D,points:V3[],radius:number,material=materials.steel){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(vec)),44,radius,10,false),material);}
  function bolt(parent:THREE.Object3D,p:V3,axis:'x'|'y'|'z'='y',scale=1){cylinder(parent,.067*scale,.045*scale,p,materials.steel,axis,6);}
  function plate(parent:THREE.Object3D,y:number,width:number,depth:number,h:number,holes=true){
    const shape=new THREE.Shape();shape.moveTo(-width/2,-depth/2);shape.lineTo(width/2,-depth/2);shape.lineTo(width/2,depth/2);shape.lineTo(-width/2,depth/2);shape.closePath();
    if(holes)CYLINDER_Z.forEach(z=>{const hole=new THREE.Path();hole.absarc(0,z,.515,0,Math.PI*2,true);shape.holes.push(hole);});
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.014,bevelThickness:.014,curveSegments:40});geometry.rotateX(-Math.PI/2);return mesh(parent,geometry,materials.cast,[0,y,0]);
  }
  function gear(parent:THREE.Object3D,r:number,p:V3,teeth:number){
    const group=new THREE.Group();group.position.set(...p);parent.add(group);cylinder(group,r,.1,[0,0,0],materials.dark,'z');ring(group,r,.025,[0,0,.065],materials.steel);
    cylinder(group,.13,.15,[0,0,0],materials.machined,'z');bolt(group,[0,0,.10],'z',1.5);
    for(let j=0;j<teeth;j++){const a=j/teeth*Math.PI*2;const b=box(group,[.05,.045,.13],[Math.cos(a)*(r+.01),Math.sin(a)*(r+.01),0],materials.steel,.005);b.rotation.z=a;}
    for(let j=0;j<5;j++){const a=j/5*Math.PI*2;box(group,[r*.58,.07,.08],[Math.cos(a)*r*.54,Math.sin(a)*r*.54,.065],materials.cast,.01).rotation.z=a;}
    return group;
  }
  const block=makeAssembly('block',[-2.7,.4,0]);
  plate(block,.75,1.48,5.72,.15);plate(block,2.4,1.55,5.72,.12);
  [-.69,.69].forEach(x=>{const wall=box(block,[.19,1.62,5.75],[x,1.55,0]);if(x>0)cutObjects.push(wall);for(let i=0;i<9;i++){const rib=box(block,[.25,1.38,.08],[x,1.52,-2.57+i*.64],materials.cast,.014);if(x>0)cutObjects.push(rib);}});
  [-2.77,2.77].forEach(z=>{box(block,[1.47,1.65,.13],[0,1.5,z]);for(const x of [-.56,.56])for(let y=.86;y<2.4;y+=.42)bolt(block,[x,y,z+(z>0?.08:-.08)],'z');});
  for(const z of [-2.6,-1.3,0,1.3,2.6]){box(block,[1.6,.31,.25],[0,.3,z]);cylinder(block,.30,.29,[0,.12,z],materials.cast,'z');for(const x of [-.61,.61])bolt(block,[x,.47,z]);}
  const head=makeAssembly('head',[0,2.1,0]);plate(head,2.54,1.63,5.84,.13);
  for(const x of [-.75,.75]){const side=box(head,[.17,.54,5.79],[x,2.91,0]);if(x>0)cutObjects.push(side);}
  for(const z of [-2.72,-1.3,0,1.3,2.72])for(const x of [-.36,.36]){box(head,[.23,.22,.18],[x,3.38,z]);bolt(head,[x,3.53,z]);}
  [-2.82,2.82].forEach(z=>box(head,[1.55,.55,.12],[0,2.91,z]));
  const cover=makeAssembly('cover',[0,3.65,0]);const coverTop=box(cover,[1.63,.16,5.88],[0,3.85,0],materials.cover,.065);cutObjects.push(coverTop);
  for(const x of [-.76,.76]){const side=box(cover,[.12,.41,5.8],[x,3.66,0],materials.cover);cutObjects.push(side);}
  for(const z of [-2.82,2.82])cutObjects.push(box(cover,[1.6,.35,.11],[0,3.69,z],materials.cover));
  for(const x of [-.57,.57])for(const z of [-2.5,-1.2,0,1.2,2.5]){const b=cylinder(cover,.055,.055,[x,3.96,z],materials.steel,'y',6);cutObjects.push(b);}
  const sump=makeAssembly('sump',[0,-1.6,0]);box(sump,[1.65,.14,5.83],[0,-1.05,0]);
  for(const x of [-.75,.75]){const m=box(sump,[.13,.78,5.7],[x,-.65,0]);if(x>0)cutObjects.push(m);}
  for(const z of [-2.75,2.75])box(sump,[1.55,.76,.14],[0,-.65,z]);
  for(let z=-2.4;z<=2.4;z+=.4)box(sump,[1.56,.045,.06],[0,-1.16,z],materials.cast,.006);
  for(const x of [-.76,.76])for(let z=-2.6;z<=2.6;z+=.52)bolt(sump,[x,-.2,z]);
  const crankAssembly=makeAssembly('crank',[0,-.8,1.2]);const crank=new THREE.Group();crankAssembly.add(crank);
  for(const z of [-2.58,-1.31,0,1.31,2.58]){cylinder(crank,.18,.5,[0,0,z],materials.machined,'z');ring(crank,.2,.045,[0,0,z],materials.brass);}
  CYLINDER_Z.forEach((z,n)=>{
    const phase=n===0||n===3?0:Math.PI;const pin=new THREE.Group();pin.rotation.z=phase;crank.add(pin);
    cylinder(pin,.165,.52,[0,CRANK_RADIUS,z],materials.machined,'z');
    for(const side of [-1,1]){
      const web=box(pin,[.49,.91,.14],[0,.17,z+side*.30],materials.dark,.13);
      cylinder(pin,.40,.18,[0,-.28,z+side*.29],materials.dark,'z');
      web.castShadow=true;
    }
  });cylinder(crank,.16,.6,[0,0,-3],materials.steel,'z');
  const flywheelAssembly=makeAssembly('flywheel',[0,.1,2.8]);const flywheel=gear(flywheelAssembly,.92,[0,0,3.09],64);
  for(let j=0;j<6;j++){const a=j/6*Math.PI*2;bolt(flywheel,[Math.cos(a)*.32,Math.sin(a)*.32,.16],'z');}
  const timing=makeAssembly('timing',[0,.5,-2.4]);const crankGear=gear(timing,.255,[0,0,-3.15],24);
  for(const x of [-.39,.39])camGears.push(gear(timing,.51,[x,3.38,-3.15],48));
  tube(timing,[[-.68,3.68,-3.16],[-.87,3.35,-3.16],[-.36,.30,-3.16],[-.2,-.22,-3.16],[.2,-.22,-3.16],[.86,3.32,-3.16],[.66,3.7,-3.16],[-.1,3.88,-3.16],[-.68,3.68,-3.16]],.043,materials.rubber);
  gear(timing,.16,[.62,1.9,-3.15],16);
  for(const type of ['intake','exhaust'] as const){
    const g=makeAssembly(`cam-${type}`,[type==='intake'?-1:1,2.5,0]);const shaft=new THREE.Group();shaft.position.set(type==='intake'?-.36:.36,3.4,0);g.add(shaft);cams.push(shaft);cylinder(shaft,.085,5.82,[0,0,0],materials.steel,'z');
    CYLINDER_Z.forEach((z,n)=>{for(const dz of [-.18,.18]){const lobe=cylinder(shaft,.14,.12,[0,.052,z+dz],materials.machined,'z');lobe.scale.y=1.4;lobe.rotation.z=-(n===0?0:n===1?270:n===2?90:180)*Math.PI/180;}});
  }
  CYLINDER_Z.forEach((z,n)=>{
    const liners=makeAssembly(`liner-${n+1}`,[n%2?1.9:-1.9,.7,(n-1.5)*.7]);
    const full=mesh(liners,new THREE.CylinderGeometry(.516,.516,1.81,56,1,true),materials.machined,[0,1.55,z]);
    const cut=mesh(liners,new THREE.CylinderGeometry(.516,.516,1.81,56,1,true,Math.PI,Math.PI),materials.machined,[0,1.55,z]);(cut.material as THREE.Material).side=THREE.DoubleSide;linerVariants.push({whole:full,cut});
    const pg=makeAssembly(`piston-${n+1}`,[(n%2?1:-1)*1.6,1.15,(n-1.5)*1.15]);const p=new THREE.Group();pg.add(p);pistons.push(p);p.position.z=z;
    cylinder(p,.476,.42,[0,.035,0],materials.machined);cylinder(p,.487,.065,[0,.278,0],materials.machined);
    for(const y of [.155,.218,.252])ring(p,.479,.016,[0,y,0],materials.dark,'y');
    cylinder(p,.105,.97,[0,-.06,0],materials.steel,'x');for(const side of [-1,1])ring(p,.10,.016,[side*.485,-.06,0],materials.dark,'x');
    const rg=makeAssembly(`rod-${n+1}`,[(n%2?1:-1)*2.5,0,(n-1.5)*1.15]);const rod=new THREE.Group();rg.add(rod);rods.push(rod);
    box(rod,[.15,ROD_LENGTH-.30,.14],[0,0,0],materials.steel,.025);box(rod,[.24,ROD_LENGTH-.45,.045],[0,0,.095],materials.machined,.025);
    for(const [y,r] of [[-ROD_LENGTH/2,.195],[ROD_LENGTH/2,.115]]){ring(rod,r,.046,[0,y,0],materials.machined);ring(rod,r-.039,.018,[0,y,.01],materials.brass);}
    box(rod,[.47,.105,.20],[0,-ROD_LENGTH/2-.135,0],materials.dark);for(const x of [-.18,.18])bolt(rod,[x,-ROD_LENGTH/2-.20,0]);
    const plug=makeAssembly(`plug-${n+1}`,[.2,2.9,(n-1.5)*.85]);cylinder(plug,.071,.32,[0,3.13,z],materials.ceramic);for(let j=0;j<5;j++)ring(plug,.071,.009,[0,3.09+j*.04,z],materials.ceramic,'y');cylinder(plug,.09,.18,[0,2.85,z],materials.steel,'y',6);cylinder(plug,.052,.20,[0,2.68,z],materials.steel);cylinder(plug,.055,.09,[0,3.34,z],materials.black);
    for(const type of ['intake','exhaust'] as const){
      const vg=makeAssembly(`${type==='intake'?'inlet':'outlet'}-${n+1}`,[type==='intake'?-2.3:2.3,2.0,(n-1.5)*.88]);
      for(const dz of [-.17,.17]){const v=new THREE.Group();v.position.set(type==='intake'?-.25:.25,2.51,z+dz);vg.add(v);valves.push({node:v,n,type,y:2.51});cylinder(v,.151,.035,[0,0,0],materials.machined);cylinder(v,.027,.65,[0,.32,0],materials.steel);cylinder(v,.10,.035,[0,.60,0],materials.steel);
        const points:V3[]=[];for(let k=0;k<=100;k++){const a=k/100*Math.PI*2*5;points.push([Math.cos(a)*.071,.25+k/100*.27,Math.sin(a)*.071]);}tube(v,points,.009,materials.steel);
      }
    }
  });
  const intake=makeAssembly('intake',[-2.8,.4,0]);const exhaust=makeAssembly('exhaust',[2.8,.4,0]);const rail=makeAssembly('rail',[-2.2,1.6,0]);
  cylinder(intake,.28,4.7,[-1.57,2.15,0],materials.black,'z');
  CYLINDER_Z.forEach(z=>{
    tube(intake,[[-.72,2.72,z],[-1.16,2.76,z],[-1.67,2.45,z],[-1.57,2.12,z]],.155,materials.black);box(intake,[.10,.38,.42],[-.80,2.71,z],materials.machined);
    tube(exhaust,[[.73,2.72,z],[1.32,2.66,z],[1.58,2.03,z*.65],[1.75,1.50,z*.45]],.125,materials.steel);box(exhaust,[.10,.34,.43],[.81,2.71,z],materials.cast);
    cylinder(rail,.047,.29,[-1.03,2.91,z],materials.brass);box(rail,[.13,.13,.17],[-1.03,3.11,z],materials.black);
  });cylinder(rail,.055,4.75,[-1.03,3.11,0],materials.machined,'z');cylinder(exhaust,.22,2.4,[1.76,1.51,0],materials.steel,'z');
  cylinder(intake,.28,.75,[-1.57,2.15,-2.8],materials.machined,'z');ring(intake,.29,.034,[-1.57,2.15,-3.1]);
  const oilpump=makeAssembly('oil-pump',[1.5,-.7,-1.7]);box(oilpump,[.61,.57,.23],[.25,-.22,-2.5],materials.cast);gear(oilpump,.16,[.25,-.22,-2.67],8);tube(oilpump,[[.22,-.34,-2.38],[.20,-.76,-1.7],[.08,-.85,-.8]],.063,materials.steel);cylinder(oilpump,.20,.085,[.08,-.88,-.8],materials.dark);
  const filter=makeAssembly('oil-filter',[2.9,-.3,-.6]);cylinder(filter,.235,.67,[1.08,.74,-1.6],materials.black);ring(filter,.22,.035,[1.08,1.07,-1.6],materials.machined,'y');for(let j=0;j<10;j++){const a=j/10*Math.PI*2;box(filter,[.032,.22,.055],[1.08+Math.cos(a)*.234,.48,-1.6+Math.sin(a)*.234],materials.black,.006);}
  const pump=makeAssembly('water-pump',[-1.7,.1,-2]);cylinder(pump,.29,.28,[-.58,1.20,-2.98],materials.cast,'z');const impeller=gear(pump,.19,[-.58,1.20,-3.16],9);
  const thermostat=makeAssembly('thermostat',[-2,1.4,-.4]);cylinder(thermostat,.23,.31,[-.88,2.75,2.6],materials.cast,'x');ring(thermostat,.13,.025,[-1.05,2.75,2.6],materials.brass,'x');
  const radiator=makeAssembly('radiator',[-2.0,0,-1.2]);box(radiator,[.23,2.75,3.10],[-3.25,1.12,0],materials.dark);
  for(let y=-.10;y<2.5;y+=.095)box(radiator,[.255,.028,2.83],[-3.25,y,0],materials.machined,.003);
  for(const z of [-1.48,1.48])box(radiator,[.33,2.81,.12],[-3.25,1.12,z],materials.black);
  const fan=new THREE.Group();fan.position.set(-3.02,1.1,0);radiator.add(fan);cylinder(fan,.20,.19,[0,0,0],materials.black,'x');for(let j=0;j<7;j++){const a=j/7*Math.PI*2;const blade=box(fan,[.075,.60,.22],[0,Math.cos(a)*.45,Math.sin(a)*.45],materials.black,.06);blade.rotation.x=a;}
  const starter=makeAssembly('starter',[1.5,-.4,2.2]);cylinder(starter,.21,.70,[.83,-.12,2.54],materials.black,'z');cylinder(starter,.24,.21,[.83,-.12,2.94],materials.cast,'z');cylinder(starter,.11,.45,[1.03,.1,2.52],materials.dark,'z');

  const processRoot=new THREE.Group();root.add(processRoot);
  type Flow={system:'oil'|'cooling';curve:THREE.CatmullRomCurve3;root:THREE.Group;dots:THREE.Mesh[];variant:'all'|'warm'|'cold'};
  const flows:Flow[]=[];
  function flow(system:'oil'|'cooling',points:V3[],color:string,variant:'all'|'warm'|'cold'='all'){
    const curve=new THREE.CatmullRomCurve3(points.map(vec));const group=new THREE.Group();processRoot.add(group);
    const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.32,depthWrite:false});const line=new THREE.Mesh(new THREE.TubeGeometry(curve,64,.032,7,false),material);group.add(line);
    const dots:THREE.Mesh[]=[];const dotGeo=new THREE.SphereGeometry(.037,7,7);const dotMat=new THREE.MeshBasicMaterial({color});for(let j=0;j<13;j++){const dot=new THREE.Mesh(dotGeo,dotMat);group.add(dot);dots.push(dot);}flows.push({system,curve,root:group,dots,variant});
  }
  flow('oil',[[.08,-.82,-.8],[.2,-.76,-1.7],[.25,-.22,-2.5],[.7,.28,-2],[1.08,1.05,-1.6],[.52,.82,-1.6],[.52,.72,2.5]],'#f3bb60');
  for(const z of CYLINDER_Z){flow('oil',[[.52,.72,z],[.43,.40,z],[0,0,z]],'#f3bb60');flow('oil',[[.52,.72,z],[.56,1.65,z],[.56,3.12,z],[-.36,3.36,z]],'#f3bb60');flow('oil',[[-.65,3.1,z],[-.66,2.1,z],[-.60,.5,z],[-.40,-.9,z]],'#ad7835');}
  flow('cooling',[[-.58,1.2,-2.95],[-.70,1.5,-2.4],[-.67,1.6,-1.2],[-.67,1.6,0],[-.67,1.6,1.3],[-.64,1.6,2.35],[-.64,2.7,2.55]],'#69dbe7');
  for(const z of CYLINDER_Z)flow('cooling',[[-.66,1.6,z],[-.4,2.2,z-.45],[.4,2.2,z-.45],[.64,1.6,z],[.4,1.0,z+.45],[-.4,1.0,z+.45],[-.66,1.6,z]],'#69dbe7');
  flow('cooling',[[-.64,2.7,2.55],[-1.4,2.75,2.55],[-2.75,2.48,1.4],[-3.1,2.3,1.3],[-3.08,.05,1.3],[-3.06,-.1,-1.3],[-1.55,.30,-2.9],[-.58,1.2,-2.95]],'#58c4e0','warm');
  flow('cooling',[[-.64,2.7,2.55],[-1.05,2.0,1.5],[-1.05,1.35,-1.5],[-.58,1.2,-2.95]],'#c2a4fd','cold');
  const combustion=CYLINDER_Z.map(z=>{
    const gas=new THREE.Mesh(new THREE.CylinderGeometry(.465,.465,1,32),new THREE.MeshBasicMaterial({color:'#f7bb67',transparent:true,opacity:.16,depthWrite:false}));gas.position.z=z;processRoot.add(gas);
    const spark=new THREE.Mesh(new THREE.SphereGeometry(.075,10,10),new THREE.MeshBasicMaterial({color:'#fff4c8'}));spark.position.set(0,2.52,z);processRoot.add(spark);return {gas,spark};
  });
  const labelRoot=document.createElement('div');labelRoot.className='model-labels';host.appendChild(labelRoot);
  const labelNodes=new Map<string,HTMLButtonElement>();
  const activeLabels=()=>options.selected?[options.selected]:options.system==='oil'?['oil-pump','oil-filter']:options.system==='cooling'?['water-pump','radiator']:options.system==='timing'?['cam-intake','timing']:['piston-1','crank'];
  function rebuildLabels(){labelRoot.replaceChildren();labelNodes.clear();if(!options.labels)return;for(const id of activeLabels()){const part=findPart(id);if(!part)continue;const b=document.createElement('button');b.type='button';b.className='model-label';b.textContent=part.name;b.addEventListener('click',()=>onSelect(id));labelRoot.appendChild(b);labelNodes.set(id,b);}}
  const point=new THREE.Vector3();const bounds=new THREE.Box3();
  function restyle(){
    for(const [id,a] of assemblies){const part=findPart(id)!;const match=options.system==='all'||part.system===options.system;const selected=options.selected===id;
      a.group.visible=options.isolated&&options.selected?selected:(id==='radiator'?options.system==='cooling':true);
      for(const mat of a.materials){mat.emissive.set(selected?'#407d64':match&&options.system!=='all'?'#132c28':'#000000');mat.emissiveIntensity=selected?.65:.24;}
    }
    cutObjects.forEach(m=>m.visible=!options.cutaway||options.explode>.04||options.removed.includes((m as THREE.Mesh).userData.partId));
    linerVariants.forEach(({whole,cut})=>{whole.visible=!options.cutaway;cut.visible=options.cutaway;});
    rebuildLabels();
  }
  function updatePose(){
    crank.rotation.z=-cycle*Math.PI/180;flywheel.rotation.z=-cycle*Math.PI/180;crankGear.rotation.z=crank.rotation.z;
    cams.forEach(c=>c.rotation.z=-cycle*Math.PI/360);camGears.forEach(c=>c.rotation.z=-cycle*Math.PI/360);impeller.rotation.z=crank.rotation.z;fan.rotation.x=cycle*Math.PI/72;
    CYLINDER_Z.forEach((z,n)=>{const pose=cylinderPose(cycle,n);pistons[n].position.y=pose.pinY;rods[n].position.set(pose.crankX/2,(pose.crankY+pose.pinY)/2,z);rods[n].rotation.z=pose.rodAngle;
      const {gas,spark}=combustion[n];const height=Math.max(.035,2.51-(pose.pinY+.315));gas.position.y=2.51-height/2;gas.scale.y=height;
      const material=gas.material as THREE.MeshBasicMaterial;material.color.set(pose.phase<180?'#f0a557':pose.phase<360?'#9fa9b2':pose.phase<540?'#70cde6':'#dab878');material.opacity=pose.phase<180?.18:.10;
      gas.visible=options.cutaway&&options.explode<.01&&options.removed.length===0&&!options.isolated&&(options.system==='all'||options.system==='combustion');spark.visible=gas.visible&&pose.phase<18;
    });
    valves.forEach(v=>v.node.position.y=v.y-valveLift(cylinderPose(cycle,v.n).phase,v.type));
  }
  function resize(){const {width,height}=host.getBoundingClientRect();if(width<=0||height<=0)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);resize();restyle();updatePose();
  const pointerStart={x:0,y:0};const raycaster=new THREE.Raycaster();
  const down=(event:PointerEvent)=>{pointerStart.x=event.clientX;pointerStart.y=event.clientY;};
  const up=(event:PointerEvent)=>{if(Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>5)return;const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
    const hit=raycaster.intersectObjects(meshes,false).find(h=>{let p:THREE.Object3D|null=h.object;while(p){if(!p.visible)return false;p=p.parent;}return true;});onSelect(hit?.object.userData.partId??null);
  };
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  function animate(now:number){if(disposed)return;frameId=requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.06);last=now;if(document.hidden)return;
    const returned=[...assemblies.values()].every(a=>a.amount<.001);
    if(options.playing&&options.explode===0&&options.removed.length===0&&returned){cycle=advanceCycle(cycle,dt,options.speed);flowClock+=dt;}
    updatePose();
    for(const [id,a] of assemblies){const target=options.removed.includes(id)?1:options.explode;a.amount=reduced.matches?target:THREE.MathUtils.damp(a.amount,target,8,dt);a.group.position.set(...assemblyOffset(a.offset,a.amount) as V3);}
    for(const f of flows){f.root.visible=options.system===f.system&&options.explode<.01&&options.removed.length===0&&!options.isolated&&(f.variant==='all'||f.variant===(options.warm?'warm':'cold'));if(f.root.visible)f.dots.forEach((d,i)=>{d.position.copy(f.curve.getPoint((i/f.dots.length+flowClock*.22)%1));});}
    orbit.update();root.updateMatrixWorld(true);
    const rect=host.getBoundingClientRect();
    for(const [id,b] of labelNodes){const a=assemblies.get(id)!;if(!a.group.visible){b.hidden=true;continue;}bounds.setFromObject(a.group);bounds.getCenter(point);point.project(camera);const x=(point.x*.5+.5)*rect.width;const y=(-point.y*.5+.5)*rect.height;b.hidden=point.z>1||x<15||x>rect.width-15||y<35||y>rect.height-30;b.style.left=`${Math.max(10,Math.min(rect.width-210,x+20))}px`;b.style.top=`${Math.max(15,y-35)}px`;}
    renderer.render(scene,camera);if(now-reported>100){onTick(cycle);reported=now;}
  }
  frameId=requestAnimationFrame(animate);
  return {
    setOptions(next:SceneOptions){options={...next};restyle();renderer.setPixelRatio(Math.min(window.devicePixelRatio,next.quality==='high'?2:1.5));},
    seek(value:number){cycle=value;updatePose();onTick(cycle);},
    camera(preset:'home'|'front'|'top'|'focus'|'zoom-in'|'zoom-out'){
      if(preset==='zoom-in'||preset==='zoom-out'){camera.position.sub(orbit.target).multiplyScalar(preset==='zoom-in'?.82:1.22).add(orbit.target);return;}
      if(preset==='focus'&&options.selected){const a=assemblies.get(options.selected)!;bounds.setFromObject(a.group);const center=bounds.getCenter(new THREE.Vector3());const size=bounds.getSize(new THREE.Vector3()).length();orbit.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(1,.7,1).normalize().multiplyScalar(Math.max(2,size*1.6)));}
      else {orbit.target.set(0,1.1,0);camera.position.set(...(preset==='front'?[12,4,0]:preset==='top'?[.01,15,.01]:[10.4,7.4,11.8]) as V3);if(options.explode>0)camera.position.multiplyScalar(1.25);}
      orbit.update();
    },
    dispose(){disposed=true;cancelAnimationFrame(frameId);resizeObserver.disconnect();orbit.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);const geometries=new Set<THREE.BufferGeometry>();const mats=new Set<THREE.Material>();scene.traverse(obj=>{if(obj instanceof THREE.Mesh){geometries.add(obj.geometry);(Array.isArray(obj.material)?obj.material:[obj.material]).forEach(m=>mats.add(m));}});geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());Object.values(materials).forEach(m=>m.dispose());env.dispose();renderer.dispose();renderer.domElement.remove();labelRoot.remove();},
  };
}
