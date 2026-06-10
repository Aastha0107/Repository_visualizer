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
        <span className="tb-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" />
            <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <span className="tb-title">
          RepoViz
          <span className="tb-subtitle">Repository Analyzer</span>
        </span>
      </div>

      {/* Path form */}
      <form className="tb-form" onSubmit={handleSubmit}>
        <div className="tb-input-wrap">
          <svg className="tb-input-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M1.75 1h5.5c.966 0 1.75.784 1.75 1.75v1h4c.966 0 1.75.784 1.75 1.75v7.75A1.75 1.75 0 0 1 13 15H3a1.75 1.75 0 0 1-1.75-1.75V2.75C1.25 1.784 1.784 1 1.75 1Zm.75 1.5v10.75c0 .138.112.25.25.25H13a.25.25 0 0 0 .25-.25V5.5a.25.25 0 0 0-.25-.25H8.75a.75.75 0 0 1-.75-.75V2.75a.25.25 0 0 0-.25-.25h-5a.25.25 0 0 0-.25.25Z" />
          </svg>
          <input
            className="tb-input"
            type="text"
            placeholder="/home/user/my-project"
            aria-label="Absolute path to repository"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            disabled={loading}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <button
          className="tb-btn"
          type="submit"
          disabled={loading || !path.trim()}
        >
          {loading ? (
            <>
              <span className="tb-spinner" aria-hidden="true" />
              Scanning…
            </>
          ) : (
            <>
              Analyze
              <svg className="tb-btn-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06l2.97-2.97H3.75a.75.75 0 0 1 0-1.5h7.44L8.22 4.03a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Stats */}
      <div className="tb-stats">
        {nodeCount > 0 && (
          <>
            <span className="tb-stat">
              <b>{nodeCount}</b> files
            </span>
            <span className="tb-stat">
              <b>{edgeCount}</b> edges
            </span>
          </>
        )}
      </div>
    </header>
  );
}
