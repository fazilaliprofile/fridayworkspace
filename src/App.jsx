import { useState } from 'react';

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

    // V1 interaction placeholder: the real AI 3D API will replace this step.
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
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Create a humanoid robot..."
              rows={5}
              disabled={isGenerating}
            />
            <button type="submit" disabled={isGenerating || !prompt.trim()}>
              {isGenerating ? 'Creating concept…' : generated ? 'Create another concept' : 'Create 3D concept'} <span>↗</span>
            </button>
          </form>
          <div className="hint">V1 foundation · prompt → concept → interactive 3D canvas</div>
        </aside>

        <section className="canvas-panel" aria-label="Friday 3D canvas">
          <div className="canvas-toolbar"><span>3D VIEWPORT</span><span>Perspective · V1</span></div>
          <div className={`scene ${generated ? 'scene-generated' : ''}`}>
            <div className="grid-plane" />
            <div className="model-placeholder">
              <div className="orb" />
              <div className="ring ring-a" />
              <div className="ring ring-b" />
            </div>
            <div className="canvas-message">
              {isGenerating ? 'Generating concept…' : generated ? `Concept created: ${prompt.trim()}` : 'Your 3D workspace starts here'}
            </div>
            <div className="canvas-submessage">
              {isGenerating ? 'Preparing the interactive workspace.' : generated ? 'V1 interaction complete · AI 3D generation is the next integration.' : 'Generate a concept from the prompt panel.'}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
