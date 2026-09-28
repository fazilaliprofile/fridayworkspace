import { useState } from 'react';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('Ready');

  function handleCreate(event) {
    event.preventDefault();
    if (!prompt.trim()) return;
    setStatus(`Concept request received: ${prompt.trim()}`);
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
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Create a humanoid robot..."
              rows={5}
            />
            <button type="submit">Create 3D concept <span>↗</span></button>
          </form>
          <div className="hint">V1 foundation · prompt → 3D scene → interactive canvas</div>
        </aside>

        <section className="canvas-panel" aria-label="Friday 3D canvas">
          <div className="canvas-toolbar"><span>3D VIEWPORT</span><span>Perspective · V1</span></div>
          <div className="scene">
            <div className="grid-plane" />
            <div className="model-placeholder">
              <div className="orb" />
              <div className="ring ring-a" />
              <div className="ring ring-b" />
            </div>
            <div className="canvas-message">Your 3D workspace starts here</div>
            <div className="canvas-submessage">Generate a concept from the prompt panel.</div>
          </div>
        </section>
      </section>
    </main>
  );
}
