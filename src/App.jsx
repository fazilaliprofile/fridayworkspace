import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const normalizePrompt = (value) => value.trim().toLowerCase();

function detectSceneType(prompt) {
  const text = normalizePrompt(prompt);
  if (/robot|android|humanoid/.test(text)) return 'robot';
  if (/car|vehicle|sedan|suv|automobile/.test(text)) return 'vehicle';
  if (/drone|quadcopter|uav/.test(text)) return 'drone';
  if (/aircraft|airplane|plane|jet/.test(text)) return 'aircraft';
  if (/building|house|tower|skyscraper/.test(text)) return 'building';
  if (/table|chair|furniture|desk/.test(text)) return 'furniture';
  return 'generic';
}

function material(color, emissive = 0x10284f) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0.55, roughness: 0.25, emissive, emissiveIntensity: 0.3 });
}

function addBox(group, size, position, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...position); group.add(mesh); return mesh;
}

function fallbackScene(type) {
  const group = new THREE.Group();
  group.name = `friday-${type}-fallback`;
  const shell = material(0x6f91c9), dark = material(0x172033, 0x07101e);
  if (type === 'vehicle') {
    addBox(group, [3.6, .65, 1.65], [0, .65, 0], shell);
    addBox(group, [1.9, .7, 1.45], [.15, 1.25, 0], dark);
    [-1.35, 1.35].forEach(x => [-.9, .9].forEach(z => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .28, 32), dark); w.position.set(x, .32, z); w.rotation.z = Math.PI / 2; group.add(w); }));
  } else if (type === 'drone') {
    addBox(group, [1.5, .32, 1], [0, .6, 0], shell);
    [[-1.5, -1], [1.5, -1], [-1.5, 1], [1.5, 1]].forEach(([x,z]) => { addBox(group, [1.8,.14,.14], [x/2,.6,z/2], dark); const p = new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.08,32), dark); p.position.set(x,.6,z); group.add(p); });
  } else if (type === 'aircraft') {
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,3.8,32), shell); fuselage.position.y=.8; fuselage.rotation.z=Math.PI/2; group.add(fuselage); addBox(group,[1.8,.12,3.2],[0,.82,0],shell);
  } else if (type === 'building') {
    addBox(group,[2.4,4.2,2.4],[0,2.1,0],shell);
  } else if (type === 'furniture') {
    addBox(group,[3.2,.22,1.5],[0,1.2,0],shell); [-1.2,1.2].forEach(x => [-.5,.5].forEach(z => addBox(group,[.18,1.2,.18],[x,.6,z],shell)));
  } else {
    addBox(group,[1.7,2.8,1.1],[0,1.4,0],shell);
    addBox(group,[.9,.7,.85],[0,3.15,0],shell);
    addBox(group,[.35,1.4,.45],[-1.1,1.5,0],shell); addBox(group,[.35,1.4,.45],[1.1,1.5,0],shell);
  }
  return group;
}

function disposeObject(root) {
  root.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => m.dispose());
  });
}

function GenericScene({ active, prompt, modelUrl, onLoaded }) {
  const mountRef = useRef(null);
  const modelUrlRef = useRef(modelUrl);

  useEffect(() => {
    modelUrlRef.current = modelUrl;
    const mount = mountRef.current;
    if (!mount) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b13);
    const camera = new THREE.PerspectiveCamera(45, 1, .1, 1000);
    camera.position.set(5.4, 3.6, 6.4);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.target.set(0,1.2,0); controls.minDistance=1; controls.maxDistance=30;
    scene.add(new THREE.HemisphereLight(0xbad0ff, 0x080b12, 2.2));
    const key = new THREE.DirectionalLight(0xd6e4ff, 3.5); key.position.set(4,7,5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x6e9cff, 2.2); rim.position.set(-5,4,-4); scene.add(rim);
    const grid = new THREE.GridHelper(20,40,0x29436e,0x142139); grid.position.y=-.05; scene.add(grid);
    let object = null;
    let cancelled = false;

    const load = async () => {
      if (!active) return;
      if (modelUrlRef.current) {
        try {
          object = await new Promise((resolve, reject) => new GLTFLoader().load(modelUrlRef.current, g => resolve(g.scene), undefined, reject));
          if (cancelled) { disposeObject(object); return; }
          object.name = 'FRIDAY-AI-MODEL';
          const box = new THREE.Box3().setFromObject(object);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          object.position.sub(center);
          const max = Math.max(size.x,size.y,size.z) || 1;
          object.scale.setScalar(3.4 / max);
          scene.add(object);
          controls.target.set(0,0,0); camera.position.set(5.2,3.3,5.8); controls.update();
          onLoaded?.();
        } catch {
          object = fallbackScene(detectSceneType(prompt)); scene.add(object); onLoaded?.();
        }
      } else {
        object = fallbackScene(detectSceneType(prompt)); scene.add(object); onLoaded?.();
      }
    };
    load();

    const resize = () => { const w=mount.clientWidth||600, h=mount.clientHeight||520; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false); };
    resize(); const observer=new ResizeObserver(resize); observer.observe(mount);
    let frame; const animate=()=>{ frame=requestAnimationFrame(animate); if(object && !modelUrlRef.current) object.rotation.y+=.0025; controls.update(); renderer.render(scene,camera); }; animate();
    return () => { cancelled=true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); renderer.dispose(); if(object) disposeObject(object); if(mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement); };
  }, [active, prompt, modelUrl, onLoaded]);

  return <div ref={mountRef} className="three-mount" />;
}

export default function App() {
  const [prompt,setPrompt]=useState('');
  const [concept,setConcept]=useState('');
  const [status,setStatus]=useState('Ready');
  const [generated,setGenerated]=useState(false);
  const [isGenerating,setIsGenerating]=useState(false);
  const [progress,setProgress]=useState(0);
  const [modelUrl,setModelUrl]=useState(null);
  const [error,setError]=useState('');

  async function handleCreate(event) {
    event.preventDefault(); const idea=prompt.trim(); if(!idea||isGenerating)return;
    setIsGenerating(true); setGenerated(false); setModelUrl(null); setError(''); setProgress(0); setStatus(`Sending to Tripo: ${idea}`);
    try {
      const create=await fetch('/api/generate-3d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:idea})});
      const created=await create.json(); if(!create.ok) throw new Error(created.error||'Tripo request failed.');
      setStatus('Tripo is generating the 3D model…');
      for(let i=0;i<90;i++) {
        await new Promise(r=>setTimeout(r,2000));
        const check=await fetch(`/api/check-3d?id=${encodeURIComponent(created.taskId)}`); const data=await check.json();
        if(!check.ok) throw new Error(data.error||'Could not check generation status.');
        setProgress(data.progress||0); setStatus(`Generating 3D model… ${data.progress||0}%`);
        if(data.status==='success'&&data.modelUrl){ setConcept(idea); setModelUrl(data.modelUrl); setGenerated(true); setIsGenerating(false); setStatus('3D model ready'); return; }
        if(['failed','cancelled','banned'].includes(data.status)) throw new Error(data.error||`Tripo task ${data.status}.`);
      }
      throw new Error('Generation timed out. The Tripo task may still finish in the background.');
    } catch(e) { setIsGenerating(false); setStatus('Generation failed'); setError(e instanceof Error?e.message:'Unknown error'); }
  }

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">F</span><span>FRIDAY</span></div><span className="status"><i/> {status}</span></header>
    <section className="workspace">
      <aside className="sidebar"><p className="eyebrow">AI 3D CREATION</p><h1>Create anything.</h1><p className="subtext">Describe an object or system. Friday sends the prompt to Tripo and loads the generated GLB into the interactive 3D workspace.</p>
        <form onSubmit={handleCreate}><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Create a realistic futuristic robot, sports car, drone..." rows={5} disabled={isGenerating}/><button type="submit" disabled={isGenerating||!prompt.trim()}>{isGenerating?`Generating ${progress}%…`:generated?'Create another concept':'Generate real 3D model'} <span>↗</span></button></form>
        {error&&<div className="hint">{error}</div>}<div className="hint">Tripo v3.1 · text → AI 3D → GLB → Three.js</div>
      </aside>
      <section className="canvas-panel" aria-label="Friday 3D canvas"><div className="canvas-toolbar"><span>3D VIEWPORT</span><span>{generated?'TRIPO GLB · Orbit · Zoom · Pan':'AI MODEL · Orbit · Zoom · Pan'}</span></div>
        <div className="scene"><GenericScene active={generated} prompt={concept} modelUrl={modelUrl} onLoaded={()=>setStatus('3D model loaded · workspace ready')}/>{!generated&&!isGenerating&&<div className="empty-scene">Describe anything to generate a real 3D model.</div>}{generated&&<><div className="canvas-message">{concept}</div><div className="canvas-submessage">AI-generated GLB · Interactive Three.js viewport</div></>}{isGenerating&&<div className="empty-scene">Tripo is generating your 3D model… {progress}%</div>}</div>
      </section>
    </section>
  </main>;
}
