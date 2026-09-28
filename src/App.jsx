import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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

function createMaterial(color, emissive = 0x10284f) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.5,
    roughness: 0.25,
    transparent: true,
    opacity: 0.84,
    emissive,
    emissiveIntensity: 0.38
  });
}

function addBox(group, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function addCylinder(group, radius, height, position, material, radialSegments = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, radialSegments), material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function addSphere(group, radius, position, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20), material);
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function buildRobot(group) {
  const shell = createMaterial(0x7ea7ff);
  const dark = createMaterial(0x172033, 0x08101f);
  const core = createMaterial(0x8fe8ff, 0x2b9cff);
  addBox(group, [1.45, 1.65, 0.8], [0, 1.65, 0], shell);
  addBox(group, [0.92, 0.72, 0.7], [0, 2.9, 0], shell);
  addBox(group, [0.52, 0.5, 0.52], [-0.9, 2.45, 0], dark);
  addBox(group, [0.52, 0.5, 0.52], [0.9, 2.45, 0], dark);
  addBox(group, [0.35, 1.2, 0.45], [-1.18, 1.65, 0], shell);
  addBox(group, [0.35, 1.2, 0.45], [1.18, 1.65, 0], shell);
  addBox(group, [0.42, 0.85, 0.5], [-1.18, 0.55, 0], dark);
  addBox(group, [0.42, 0.85, 0.5], [1.18, 0.55, 0], dark);
  addBox(group, [0.55, 1.35, 0.58], [-0.45, 0.05, 0], shell);
  addBox(group, [0.55, 1.35, 0.58], [0.45, 0.05, 0], shell);
  addBox(group, [0.62, 0.3, 0.85], [-0.45, -0.72, 0], dark);
  addBox(group, [0.62, 0.3, 0.85], [0.45, -0.72, 0], dark);
  const chest = addCylinder(group, 0.27, 0.12, [0, 1.65, -0.43], core);
  chest.rotation.x = Math.PI / 2;
}

function buildVehicle(group) {
  const body = createMaterial(0x6f91c9);
  const glass = createMaterial(0x16263f, 0x07101e);
  addBox(group, [3.6, 0.65, 1.65], [0, 0.65, 0], body);
  addBox(group, [1.9, 0.7, 1.45], [0.15, 1.25, 0], glass);
  [-1.35, 1.35].forEach((x) => {
    [-0.9, 0.9].forEach((z) => addCylinder(group, 0.38, 0.28, [x, 0.32, z], glass, 32).rotation.z = Math.PI / 2);
  });
}

function buildDrone(group) {
  const shell = createMaterial(0x708fc5);
  const dark = createMaterial(0x172033);
  addBox(group, [1.5, 0.32, 1.0], [0, 0.6, 0], shell);
  addSphere(group, 0.42, [0, 0.78, 0], shell);
  [[-1.55, 0.6, -1.1], [1.55, 0.6, -1.1], [-1.55, 0.6, 1.1], [1.55, 0.6, 1.1]].forEach(([x, y, z]) => {
    addBox(group, [1.9, 0.16, 0.16], [x / 2, y, z / 2], dark).rotation.y = Math.atan2(z, x);
    addCylinder(group, 0.34, 0.08, [x, y, z], dark, 32);
  });
}

function buildAircraft(group) {
  const shell = createMaterial(0x7d9dca);
  const glass = createMaterial(0x1b2940);
  addCylinder(group, 0.48, 3.8, [0, 0.8, 0], shell, 32).rotation.z = Math.PI / 2;
  addBox(group, [1.8, 0.12, 3.2], [0, 0.82, 0], shell);
  addBox(group, [0.85, 0.12, 1.25], [1.55, 0.85, 0], shell);
  addSphere(group, 0.32, [1.45, 0.95, 0], glass);
}

function buildBuilding(group) {
  const shell = createMaterial(0x718ab8);
  const glass = createMaterial(0x182942);
  addBox(group, [2.4, 4.2, 2.4], [0, 2.1, 0], shell);
  for (let y = 0.65; y < 4.0; y += 0.7) {
    addBox(group, [2.0, 0.16, 0.08], [0, y, -1.22], glass);
  }
}

function buildFurniture(group) {
  const wood = createMaterial(0x7d91b8);
  addBox(group, [3.2, 0.22, 1.5], [0, 1.2, 0], wood);
  [-1.2, 1.2].forEach((x) => [-0.5, 0.5].forEach((z) => addBox(group, [0.18, 1.2, 0.18], [x, 0.6, z], wood)));
}

function buildGeneric(group) {
  const shell = createMaterial(0x7ea7ff);
  const accent = createMaterial(0x8fe8ff, 0x2b9cff);
  addSphere(group, 1.05, [0, 1.1, 0], shell);
  addCylinder(group, 0.28, 2.3, [0, 2.65, 0], accent, 24);
  addBox(group, [2.8, 0.12, 2.8], [0, 0.08, 0], shell);
}

function buildSceneObject(type) {
  const group = new THREE.Group();
  group.name = `friday-${type}-concept`;
  const builders = { robot: buildRobot, vehicle: buildVehicle, drone: buildDrone, aircraft: buildAircraft, building: buildBuilding, furniture: buildFurniture, generic: buildGeneric };
  builders[type](group);
  return group;
}

function GenericScene({ active, prompt }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const type = detectSceneType(prompt);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b13);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(5.4, 3.6, 6.4);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.2, 0);
    controls.minDistance = 2.5;
    controls.maxDistance = 16;

    scene.add(new THREE.HemisphereLight(0x9dbbff, 0x080b12, 2.2));
    const key = new THREE.DirectionalLight(0xb8d2ff, 3.5);
    key.position.set(4, 7, 5);
    scene.add(key);

    const object = buildSceneObject(type);
    object.visible = active;
    scene.add(object);
    const grid = new THREE.GridHelper(14, 28, 0x29436e, 0x142139);
    grid.position.y = -0.05;
    scene.add(grid);

    const resize = () => {
      const width = mount.clientWidth || 600;
      const height = mount.clientHeight || 520;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (active) object.rotation.y += 0.0025;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      object.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, [active, prompt]);

  return <div ref={mountRef} className="three-mount" />;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [concept, setConcept] = useState('');
  const [status, setStatus] = useState('Ready');
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  function handleCreate(event) {
    event.preventDefault();
    const idea = prompt.trim();
    if (!idea || isGenerating) return;
    setIsGenerating(true);
    setGenerated(false);
    setStatus(`Creating scene: ${idea}`);
    window.setTimeout(() => {
      setConcept(idea);
      setIsGenerating(false);
      setGenerated(true);
      setStatus(`Scene ready: ${idea}`);
    }, 700);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">F</span><span>FRIDAY</span></div>
        <span className="status"><i /> {status}</span>
      </header>
      <section className="workspace">
        <aside className="sidebar">
          <p className="eyebrow">AI 3D CREATION</p>
          <h1>Create anything.</h1>
          <p className="subtext">Describe an object or system. Friday will turn the idea into an interactive 3D workspace.</p>
          <form onSubmit={handleCreate}>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Create a car, drone, building, machine..." rows={5} disabled={isGenerating} />
            <button type="submit" disabled={isGenerating || !prompt.trim()}>
              {isGenerating ? 'Creating scene…' : generated ? 'Create another concept' : 'Create 3D concept'} <span>↗</span>
            </button>
          </form>
          <div className="hint">V2 foundation · prompt → scene type → 3D object → interactive viewport</div>
        </aside>
        <section className="canvas-panel" aria-label="Friday 3D canvas">
          <div className="canvas-toolbar"><span>3D VIEWPORT</span><span>{generated ? `${detectSceneType(concept).toUpperCase()} · Orbit · Zoom · Pan` : 'Orbit · Zoom · Pan · V2'}</span></div>
          <div className="scene">
            <GenericScene active={generated} prompt={concept} />
            {!generated && <div className="empty-scene">Describe anything to enter the 3D workspace.</div>}
            {generated && <div className="canvas-message">3D concept: {concept}</div>}
            {generated && <div className="canvas-submessage">Generic scene engine · interactive Three.js viewport</div>}
          </div>
        </section>
      </section>
    </main>
  );
}
