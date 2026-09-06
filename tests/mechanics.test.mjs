import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cylinderPose, valveLift, strokeAt, advanceCycle, assemblyOffset, CRANK_RADIUS, ROD_LENGTH } from '../lib/engine/mechanics.ts';
import { PARTS } from '../lib/engine/catalog.ts';

test('all rods maintain length and piston travel over two revolutions',()=>{
  for(let n=0;n<4;n++)for(let angle=0;angle<=720;angle++){
    const p=cylinderPose(angle,n);
    assert.ok(Math.abs(Math.hypot(p.crankX,p.pinY-p.crankY)-ROD_LENGTH)<1e-10);
    assert.ok(p.pinY>=ROD_LENGTH-CRANK_RADIUS-1e-10);
    assert.ok(p.pinY<=ROD_LENGTH+CRANK_RADIUS+1e-10);
    assert.ok(Math.abs(Math.sin(p.rodAngle)*ROD_LENGTH-p.crankX)<1e-10);
  }
});
test('physical crank pairing and four-stroke phases match 1–3–4–2',()=>{
  for(let angle=0;angle<720;angle+=3){
    assert.ok(Math.abs(cylinderPose(angle,0).pinY-cylinderPose(angle,3).pinY)<1e-10);
    assert.ok(Math.abs(cylinderPose(angle,1).pinY-cylinderPose(angle,2).pinY)<1e-10);
  }
  [0,2,3,1].forEach((cylinder,index)=>assert.equal(cylinderPose(index*180,cylinder).phase,0));
  assert.deepEqual([0,180,360,540].map(x=>strokeAt(x)),['Power','Exhaust','Intake','Compression']);
});
test('cycle seeking is periodic and returns identical poses',()=>{
  for(let n=0;n<4;n++)for(const x of [0,1,113.5,179,359.5,539,719.5])assert.deepEqual(cylinderPose(x,n),cylinderPose(x+720,n));
});
test('valves remain closed outside their declared idealized strokes',()=>{
  for(let angle=0;angle<720;angle++){
    const intake=valveLift(angle,'intake'), exhaust=valveLift(angle,'exhaust');
    assert.ok(intake>=0&&intake<=.22&&exhaust>=0&&exhaust<=.22);
    assert.ok(!(intake>0&&exhaust>0));
    if(angle<=360||angle>=540)assert.equal(intake,0);
    if(angle<=180||angle>=360)assert.equal(exhaust,0);
  }
});
test('idealized inlet/exhaust disks remain above the moving piston crown',()=>{
  for(let angle=0;angle<720;angle++)for(let n=0;n<4;n++){
    const p=cylinderPose(angle,n);
    const crown=p.pinY+.3105;
    for(const type of ['intake','exhaust'])assert.ok(2.51-valveLift(p.phase,type)-.0175>crown);
  }
});
test('clock advance is time-step independent and wraps safely',()=>{
  const direct=advanceCycle(713,1,.32);let stepped=713;
  for(let i=0;i<100;i++)stepped=advanceCycle(stepped,.01,.32);
  assert.ok(Math.abs(direct-stepped)<1e-8);
  assert.equal(advanceCycle(10,-1,.32),10);
});
test('assembly transforms clamp and restore without accumulated error',()=>{
  assert.deepEqual(assemblyOffset([2,3,-4],0),[0,0,-0]);
  assert.deepEqual(assemblyOffset([2,3,-4],1),[2,3,-4]);
  assert.deepEqual(assemblyOffset([2,3,-4],2),[2,3,-4]);
  assert.deepEqual(assemblyOffset([2,3,-4],-1),[0,0,-0]);
});
test('each named part has a unique ID, description and system',()=>{
  assert.equal(new Set(PARTS.map(p=>p.id)).size,PARTS.length);
  for(const p of PARTS){assert.ok(p.name&&p.description&&p.material&&p.system&&p.assembly);}
  assert.equal(PARTS.length,42);
});
