import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function RobotScene({ active }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b13);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(4.8, 3.2, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.5, 0);
    controls.minDistance = 3;
    controls.maxDistance = 12;

    scene.add(new THREE.HemisphereLight(0x9dbbff, 0x080b12, 2.2));
    const key = new THREE.DirectionalLight(0xb8d2ff, 3.5);
    key.position.set(4, 7, 5);
    scene.add(key);

    const robot = new THREE.Group();
    robot.visible = active;
    scene.add(robot);

    const shell = new THREE.MeshPhysicalMaterial({
      color: 0x7ea7ff,
      metalness: 0.55,
      roughness: 0.24,
      transparent: true,
      opacity: 0.78,
      emissive: 0x122c68,
      emissiveIntensity: 0.45
    });
    const dark = new THREE.MeshStandardMaterial({ color: 0x172033, metalness: 0.7, roughness: 0.3 });
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x8fe8ff, emissive: 0x2b9cff, emissiveIntensity: 2.4, metalness: 0.1, roughness: 0.2 });

    const addBox = (size, position, material = shell) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      mesh.castShadow = true;
      robot.add(mesh);
      return mesh;
    };
    const addCylinder = (radius, height, position, material = dark) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 24), material);
      mesh.position.set(...position);
      robot.add(mesh);
      return mesh;
    };

    addBox([1.45, 1.65, 0.8], [0, 1.65, 0]);
    addBox([0.92, 0.72, 0.7], [0, 2.9, 0]);
    addBox([0.52, 0.5, 0.52], [-0.9, 2.45, 0], dark);
    addBox([0.52, 0.5, 0.52], [0.9, 2.45, 0], dark);
    addBox([0.35, 1.2, 0.45], [-1.18, 1.65, 0], shell);
    addBox([0.35, 1.2, 0.45], [1.18, 1.65, 0], shell);
    addBox([0.42, 0.85, 0.5], [-1.18, 0.55, 0], dark);
    addBox([0.42, 0.85, 0.5], [1.18, 0.55, 0], dark);
    addBox([0.55, 1.35, 0.58], [-0.45, 0.05, 0], shell);
    addBox([0.55, 1.35, 0.58], [0.45, 0.05, 0], shell);
    addBox([0.62, 0.3, 0.85], [-0.45, -0.72, 0], dark);
    addBox([0.62, 0.3, 0.85], [0.45, -0.72, 0], dark);
    addCylinder(0.27, 0.12, [0, 1.65, -0.43], coreMat).rotation.x = Math.PI / 2;

    const grid = new THREE.GridHelper(14, 28, 0x29436e, 0x142139);
    grid.position.y = -0.9;
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
      if (active) robot.rotation.y += 0.0025;
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
    };
  }, [active]);

  return <div ref={mountRef} className="three-mount" />;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('Ready');
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  function handleCreate(event) {
    event.preventDefault();
    const idea = prompt.trim();
    if (!idea || isGenerating) return;
    setIsGenerating(true);
    setGenerated(false);
    setStatus(`Creating concept: ${idea}`);
    window.setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
      setStatus(`Concept ready: ${idea}`);
    }, 900);
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
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Create a humanoid robot..." rows={5} disabled={isGenerating} />
            <button type="submit" disabled={isGenerating || !prompt.trim()}>
              {isGenerating ? 'Creating concept…' : generated ? 'Create another concept' : 'Create 3D concept'} <span>↗</span>
            </button>
          </form>
          <div className="hint">V2 foundation · prompt → 3D scene → interactive viewport</div>
        </aside>
        <section className="canvas-panel" aria-label="Friday 3D canvas">
          <div className="canvas-toolbar"><span>3D VIEWPORT</span><span>Orbit · Zoom · Pan · V2</span></div>
          <div className="scene">
            <RobotScene active={generated} />
            {!generated && <div className="empty-scene">Generate a concept to enter the 3D workspace.</div>}
            {generated && <div className="canvas-message">3D concept: {prompt.trim()}</div>}
            {generated && <div className="canvas-submessage">Interactive Three.js viewport · drag to orbit · scroll to zoom</div>}
          </div>
        </section>
      </section>
    </main>
  );
}
