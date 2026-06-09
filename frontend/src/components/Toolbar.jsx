// src/components/Toolbar.jsx
// Top bar with repo-path input, Analyze button, and summary stats.

import { useState } from "react";
import "./Toolbar.css";

export default function Toolbar({ onAnalyze, loading, nodeCount, edgeCount }) {
  const [path, setPath] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAnalyze(path);
  };

  return (
    <header className="toolbar">
      {/* Brand */}
      <div className="tb-brand">
        <span className="tb-logo">⬡</span>
        <span className="tb-title">RepoViz</span>
      </div>

      {/* Path form */}
      <form className="tb-form" onSubmit={handleSubmit}>
        <input
          className="tb-input"
          type="text"
          placeholder="Absolute path to repository  e.g. /home/user/my-project"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          disabled={loading}
          spellCheck={false}
        />
        <button
          className="tb-btn"
          type="submit"
          disabled={loading || !path.trim()}
        >
          {loading ? (
            <><span className="tb-spinner" /> Scanning…</>
          ) : (
            "Analyze →"
          )}
        </button>
      </form>

      {/* Stats */}
      <div className="tb-stats">
        {nodeCount > 0 && (
          <>
            <span className="tb-stat"><b>{nodeCount}</b> files</span>
            <span className="tb-divider">·</span>
            <span className="tb-stat"><b>{edgeCount}</b> edges</span>
          </>
        )}
      </div>
    </header>
  );
}
