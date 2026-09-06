'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowLeft, Box, ChevronDown, ChevronRight, CircleHelp, Crosshair, Droplets, Expand, Layers3, Maximize, Minus, Pause, Play, Plus, RotateCcw, Search, Settings2, Sparkles, Tag, Thermometer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PARTS, SYSTEMS, findPart, type SystemId } from '@/lib/engine/catalog';
import { strokeAt } from '@/lib/engine/mechanics';
import type { SceneOptions } from './scene';

type EngineApi = ReturnType<typeof import('./scene')['createEngineScene']>;
const initial:SceneOptions={playing:true,speed:.32,cutaway:true,explode:0,removed:[],selected:null,isolated:false,labels:true,system:'all',warm:true,quality:'balanced'};
const systemIcons=[Box,Settings2,RotateCcw,Sparkles,Droplets,Thermometer];
const lessons=[
  {title:'Meet the engine',system:'all',part:null,text:'Four cylinders share a crankshaft. Rotate the engine to see the whole assembly, then use the next step to look inside.'},
  {title:'Follow one piston',system:'mechanics',part:'piston-1',text:'Pause and turn the cycle control. Follow the piston, its connecting rod, and the offset crankpin through a complete movement.'},
  {title:'Watch the valves',system:'timing',part:'cam-intake',text:'The camshafts turn once for every two crankshaft turns. Inlet and exhaust valves open at different stages of the cycle.'},
  {title:'Complete the four strokes',system:'combustion',part:'plug-1',text:'Intake brings in the mixture. Compression squeezes it. Ignition begins the power stroke. Exhaust clears the cylinder.'},
  {title:'Follow the lubrication',system:'oil',part:'oil-pump',text:'Follow the supply from the sump to the pump and filter, then the branches to moving surfaces. The darker paths show oil returning.'},
  {title:'Move the heat away',system:'cooling',part:'water-pump',text:'Coolant circulates around the cylinders. Switch between cold and warm states to see the bypass and radiator routes.'},
] as const;

export default function EngineExhibit(){
  const host=useRef<HTMLDivElement>(null);const exhibit=useRef<HTMLElement>(null);const api=useRef<EngineApi|null>(null);
  const [controls,setControls]=useState<SceneOptions>(initial);const [cycle,setCycle]=useState(28);const [ready,setReady]=useState(false);const [error,setError]=useState('');const [retry,setRetry]=useState(0);
  const [query,setQuery]=useState('');const [showParts,setShowParts]=useState(false);const [showHelp,setShowHelp]=useState(false);const [tour,setTour]=useState<number|null>(null);const [notice,setNotice]=useState('');
  const controlRef=useRef(controls);controlRef.current=controls;
  const currentSystem=SYSTEMS.find(x=>x.id===controls.system)!;const selected=findPart(controls.selected);
  const update=(patch:Partial<SceneOptions>)=>setControls(previous=>({...previous,...patch}));
  useEffect(()=>{
    let active=true;let local:EngineApi|null=null;
    setReady(false);setError('');
    import('./scene').then(({createEngineScene})=>{
      if(!active||!host.current)return;
      try{local=createEngineScene(host.current,id=>setControls(c=>({...c,selected:id,isolated:false})),setCycle);api.current=local;
        const next={...controlRef.current};if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){next.playing=false;setControls(next);}local.setOptions(next);setReady(true);
      }catch(e){setError(e instanceof Error?e.message:'The 3D view could not start.');}
    }).catch(()=>setError('The 3D view could not load. Please try again.'));
    return()=>{active=false;local?.dispose();api.current=null;};
  },[retry]);
  useEffect(()=>{api.current?.setOptions(controls);},[controls]);
  function reset(){setControls({...initial,playing:false});setTour(null);setNotice('Engine reassembled and view reset.');api.current?.seek(28);api.current?.camera('home');}
  function selectSystem(id:SystemId){setControls(c=>({...c,system:id,isolated:false,selected:null,cutaway:true}));setTour(null);setNotice('');}
  function choosePart(id:string){setControls(c=>({...c,selected:id,isolated:false}));setShowParts(false);}
  function removeSelected(){if(!selected)return;const removed=controls.removed.includes(selected.id)?controls.removed.filter(id=>id!==selected.id):[...controls.removed,selected.id];update({removed,playing:false,isolated:false});setNotice(removed.includes(selected.id)?`${selected.name} moved out for inspection. Motion paused.`:`${selected.name} returned to the assembly.`);}
  function play(){if(controls.removed.length||controls.explode>0){setNotice('Reassemble the engine before running it.');return;}update({playing:!controls.playing});}
  function startLesson(index:number){setTour(index);const lesson=lessons[index];update({system:lesson.system,selected:lesson.part,isolated:false,cutaway:true,explode:0,removed:[]});setNotice('');}
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if(exhibit.current?.requestFullscreen)await exhibit.current.requestFullscreen();else setNotice('This browser does not support native full screen. The engine is already on its own page.');}catch{setNotice('Full screen is unavailable. You can continue in the current view.');}}
  const filtered=PARTS.filter(p=>(controls.system==='all'||p.system===controls.system)&&(p.name+' '+p.assembly).toLowerCase().includes(query.toLowerCase()));
  const blocked=controls.removed.length>0||controls.explode>0;
  return <main className="engine-app" ref={exhibit}>
    <header className="site-topbar">
      <a className="wordmark" href="/" aria-label="How Things Click home">how things <span>click<span className="wordmark-dot">.</span></span></a>
      <div className="topbar-middle"><span className="section-index">01 / MACHINES</span><span className="topbar-divider"/><span>Inside the engine</span></div>
      <span className="preview-status"><span/>Engineering preview</span>
    </header>
    <div className="exhibit-layout">
      <aside className="system-rail">
        <div className="rail-heading"><span>EXPLORE</span><span className="rail-count">06</span></div>
        <Tabs orientation="vertical" value={controls.system} onValueChange={value=>selectSystem(value as SystemId)} className="system-tabs">
          <TabsList className="systems-list" aria-label="Engine systems">
            {SYSTEMS.map((s,i)=>{const Icon=systemIcons[i];return <TabsTrigger key={s.id} value={s.id} className="system-trigger"><Icon size={17}/><span>{s.name}</span><ChevronRight className="system-chevron" size={14}/></TabsTrigger>;})}
          </TabsList>
        </Tabs>
        <div className="rail-rule"/>
        <div className="rail-heading"><span>PART LIBRARY</span><span className="rail-count">{PARTS.length}</span></div>
        <div className="part-search"><Search size={15}/><Input aria-label="Search engine parts" placeholder="Find a part…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
        <div className="parts-list">{filtered.map(part=><button key={part.id} className={`part-row ${controls.selected===part.id?'selected':''}`} onClick={()=>choosePart(part.id)}><span>{part.name}</span>{controls.removed.includes(part.id)?<ArrowUpRight size={13}/>:<ChevronRight size={12}/>}</button>)}{!filtered.length&&<p className="no-parts">No matching parts in this system.</p>}</div>
        <Button variant="ghost" className="tour-entry" onClick={()=>startLesson(0)}><Play size={15}/>Take the guided tour <ArrowUpRight size={14}/></Button>
      </aside>
      <section className="workspace">
        <div className="exhibit-heading"><div><p className="eyebrow">ANATOMY OF AN INLINE-FOUR</p><h1>Inside the engine<span>.</span></h1></div><div className="heading-actions"><Button variant="outline" className="mobile-parts" onClick={()=>setShowParts(!showParts)}><Search size={16}/>Parts</Button><Button variant="ghost" size="icon" aria-label="Help and model information" onClick={()=>setShowHelp(!showHelp)}><CircleHelp size={19}/></Button><Button variant="ghost" size="icon" aria-label="Open full screen" onClick={fullscreen}><Maximize size={19}/></Button></div></div>
        <div className="mobile-systems">{SYSTEMS.map(s=><button key={s.id} aria-pressed={controls.system===s.id} onClick={()=>selectSystem(s.id)}>{s.name}</button>)}</div>
        <div className="stage-shell">
          <div className="model-host" ref={host}/>
          {!ready&&!error&&<div className="model-loading" role="status"><span className="loading-ring"/>Preparing the engine</div>}
          {error&&<div className="model-error" role="alert"><h2>The 3D view could not start.</h2><p>{error}</p><Button onClick={()=>setRetry(x=>x+1)}>Try again</Button></div>}
          <div className="stage-context"><span className="stage-dot"/>{blocked?'ASSEMBLY VIEW':controls.playing?'RUNNING · SLOW MOTION':'PAUSED'}<span className="stage-context-rule"/>{controls.system==='all'?'INLINE-FOUR':currentSystem.name.toUpperCase()}</div>
          <div className="camera-tools" aria-label="Camera controls"><Button variant="ghost" size="icon" aria-label="Reset camera" onClick={()=>api.current?.camera('home')}><RotateCcw size={17}/></Button><Button variant="ghost" size="icon" aria-label="Zoom in" onClick={()=>api.current?.camera('zoom-in')}><Plus size={18}/></Button><Button variant="ghost" size="icon" aria-label="Zoom out" onClick={()=>api.current?.camera('zoom-out')}><Minus size={18}/></Button><span/><Button variant="ghost" className="camera-text" onClick={()=>api.current?.camera('front')}>Side</Button><Button variant="ghost" className="camera-text" onClick={()=>api.current?.camera('top')}>Top</Button></div>
          <div className="stage-footnote"><span>Drag to rotate <span>·</span> Scroll or pinch to zoom</span><span>Original 3D teaching model</span></div>
          {selected&&<div className="part-inspector"><div className="inspector-heading"><span>{selected.assembly.toUpperCase()}</span><Button variant="ghost" size="icon" aria-label="Close part details" onClick={()=>update({selected:null,isolated:false})}><X size={15}/></Button></div><h2>{selected.name}</h2><p>{selected.description}</p><div className="part-material">{selected.material}</div><div className="inspector-actions"><Button variant="outline" onClick={()=>api.current?.camera('focus')}><Crosshair size={14}/>Focus</Button><Button variant="outline" onClick={()=>update({isolated:!controls.isolated})}>{controls.isolated?'Show all':'Isolate'}</Button><Button variant="outline" onClick={removeSelected}><Box size={14}/>{controls.removed.includes(selected.id)?'Return':'Remove'}</Button></div></div>}
          {showHelp&&<div className="help-panel"><div className="inspector-heading"><span>ABOUT THIS MODEL</span><Button variant="ghost" size="icon" aria-label="Close help" onClick={()=>setShowHelp(false)}><X size={15}/></Button></div><h2>A working view of the mechanisms.</h2><p>This first engineering version uses original generated geometry, synchronized mechanical motion and illustrative fluid routes. Valve timing is idealized; pressure, temperature and horsepower are not simulated.</p><p>Parts are selectable assemblies. Removing one pauses operation; use cutaway mode to look inside while it runs.</p><a href="https://www.energy.gov/cmei/vehicles/articles/internal-combustion-engine-basics" target="_blank" rel="noreferrer">Engine principles · US Department of Energy <ArrowUpRight size={13}/></a></div>}
          {showParts&&<div className="mobile-parts-panel"><div className="inspector-heading"><span>FIND A PART</span><Button variant="ghost" size="icon" aria-label="Close parts" onClick={()=>setShowParts(false)}><X size={15}/></Button></div><Input placeholder="Search parts…" aria-label="Search mobile parts" value={query} onChange={e=>setQuery(e.target.value)}/><div className="parts-list">{filtered.map(part=><button className="part-row" key={part.id} onClick={()=>choosePart(part.id)}>{part.name}<ChevronRight size={13}/></button>)}</div></div>}
        </div>
        <div className="playback-panel">
          <div className="playback-main"><Button className="play-control" size="icon" aria-label={controls.playing?'Pause engine':'Run engine'} onClick={play} disabled={!ready}>{controls.playing?<Pause size={18}/>:<Play size={18}/>}</Button><div className="cycle-control"><div className="control-caption"><label id="cycle-label">ENGINE CYCLE</label><span><strong>{Math.round(cycle)}°</strong> / 720°</span></div><Slider aria-labelledby="cycle-label" value={[cycle]} min={0} max={719.9} step={.1} onValueChange={v=>{update({playing:false});api.current?.seek(Array.isArray(v)?v[0]:v);}}/><div className="cycle-ticks"><span>Firing</span><span>Exhaust</span><span>Intake</span><span>Compression</span></div></div><div className="speed-control"><label id="speed-label">PLAYBACK</label><Select value={String(controls.speed)} onValueChange={value=>update({speed:Number(value)})}><SelectTrigger aria-labelledby="speed-label"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="0.12">Very slow</SelectItem><SelectItem value="0.32">Slow motion</SelectItem><SelectItem value="0.7">Faster</SelectItem></SelectContent></Select></div><Button variant="ghost" className="reset-control" onClick={reset}><RotateCcw size={15}/><span>Reset</span></Button></div>
          <div className="view-controls"><label className="toggle-control"><Switch checked={controls.cutaway} onCheckedChange={value=>update({cutaway:value})}/><Layers3 size={15}/>Cutaway</label><label className="toggle-control"><Switch checked={controls.labels} onCheckedChange={value=>update({labels:value})}/><Tag size={15}/>Labels</label><div className="explode-control"><label id="explode-label"><Expand size={15}/>Separate assemblies</label><Slider aria-labelledby="explode-label" min={0} max={1} step={.01} value={[controls.explode]} onValueChange={v=>update({explode:Array.isArray(v)?v[0]:v,playing:false,isolated:false})}/></div>{blocked&&<Button variant="outline" className="reassemble" onClick={()=>{update({explode:0,removed:[],isolated:false});setNotice('Assemblies returning to their original positions.');}}>Reassemble{controls.removed.length?` (${controls.removed.length})`:''}</Button>}{controls.system==='cooling'&&<label className="toggle-control"><Switch checked={controls.warm} onCheckedChange={warm=>update({warm})}/>{controls.warm?'Warm circuit':'Cold bypass'}</label>}</div>
          <p className="notice" aria-live="polite">{notice||'Select any part to see its name, function and inspection controls.'}</p>
        </div>
        <div className="explanation-strip"><div className="explanation-copy"><p className="eyebrow">{tour===null?currentSystem.eyebrow:`GUIDED TOUR · ${tour+1} OF ${lessons.length}`}</p><h2>{tour===null?currentSystem.title:lessons[tour].title}</h2><p>{tour===null?currentSystem.description:lessons[tour].text}</p>{tour!==null&&<div className="tour-controls"><Button variant="outline" disabled={tour===0} onClick={()=>startLesson(tour-1)}><ArrowLeft size={14}/>Previous</Button><Button variant="outline" onClick={()=>tour===lessons.length-1?setTour(null):startLesson(tour+1)}>{tour===lessons.length-1?'Finish tour':'Next step'}<ChevronRight size={14}/></Button></div>}</div><div className="cylinder-monitor"><div className="control-caption"><span>CYLINDER ACTIVITY</span><span>1–3–4–2</span></div><div className="cylinder-cells">{[0,1,2,3].map(n=><button key={n} className={`cylinder-cell ${strokeAt(cycle,n).toLowerCase()}`} onClick={()=>choosePart(`piston-${n+1}`)}><span>0{n+1}</span><strong>{strokeAt(cycle,n)}</strong><i/></button>)}</div></div></div>
        <footer className="exhibit-footer"><span>HOW THINGS CLICK <span> / </span> ENGINE EXPLORER</span><span>Idealized valve events · illustrative flow paths</span></footer>
      </section>
    </div>
  </main>;
}
