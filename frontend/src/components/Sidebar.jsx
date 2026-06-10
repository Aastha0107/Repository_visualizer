// src/components/Sidebar.jsx
// Right-hand panel that shows file metadata + AI-generated summary.

import { useEffect, useState } from "react";
import { fetchSummary } from "../utils/api";
import "./Sidebar.css";

export default function Sidebar({ node, root, onClose }) {
  const [summary, setSummary]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState("");

  // Reset & fetch whenever a new node is selected
  useEffect(() => {
    if (!node || !root) {
      setSummary("");
      setAiError("");
      return;
    }

    const load = async () => {
      setSummary("");
      setAiError("");
      setAiLoading(true);
      try {
        const result = await fetchSummary(node.id, root, node.content_hash);
        setSummary(result.summary);
      } catch (err) {
        setAiError(err.message || "AI summary failed.");
      } finally {
        setAiLoading(false);
      }
    };

    load();
  }, [node?.id, root]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!node) return <div className="sidebar sidebar--empty" />;

  const complexity = node.complexity ?? 0;
  let complexityLabel = "Simple";
  let complexityClass = "is-green";
  if (complexity > 30)      { complexityLabel = "Very High"; complexityClass = "is-red"; }
  else if (complexity > 15) { complexityLabel = "Complex";   complexityClass = "is-orange"; }
  else if (complexity > 5)  { complexityLabel = "Moderate";  complexityClass = "is-yellow"; }

  return (
    <aside className="sidebar">
      {/* ---- Header ---- */}
      <div className="sb-header">
        <div className="sb-header-text">
          <div className="sb-filename">{node.label}</div>
          <div className="sb-path" title={node.path}>{node.path}</div>
        </div>
        <button className="sb-close" onClick={onClose} title="Close panel" aria-label="Close panel">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
      </div>

      <div className="sb-body">
        {/* ---- Metrics grid ---- */}
        <div className="sb-section">
          <div className="sb-section-title">Metrics</div>
          <div className="sb-metrics">
            <Metric label="Lines of Code" value={node.lines_of_code?.toLocaleString()} mono />
            <Metric label="Blank Lines"   value={node.blank_lines?.toLocaleString()} mono />
            <Metric label="File Size"     value={formatBytes(node.size_bytes)} mono />
            <Metric label="Complexity"    value={complexityLabel} valueClass={complexityClass} />
            <Metric label="Dependencies"  value={node.dependencies?.length ?? 0} mono />
            <Metric label="Extension"     value={node.extension} mono />
          </div>
        </div>

        {/* ---- Dependencies list ---- */}
        {node.dependencies?.length > 0 && (
          <div className="sb-section">
            <div className="sb-section-title">
              Imports
              <span className="sb-count">{node.dependencies.length}</span>
            </div>
            <ul className="sb-dep-list">
              {node.dependencies.map((dep) => (
                <li key={dep} className="sb-dep-item">
                  <span className="sb-dep-dot" aria-hidden="true" />
                  {dep}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---- AI Summary ---- */}
        <div className="sb-section">
          <div className="sb-section-title">
            AI Summary
            <span className="sb-ai-badge">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 1.5c.3 0 .57.18.68.46l1.32 3.3 3.3 1.32a.73.73 0 0 1 0 1.36l-3.3 1.32-1.32 3.3a.73.73 0 0 1-1.36 0l-1.32-3.3-3.3-1.32a.73.73 0 0 1 0-1.36l3.3-1.32 1.32-3.3A.73.73 0 0 1 8 1.5Z" />
              </svg>
              AI
            </span>
          </div>

          {aiLoading && (
            <div className="sb-ai-loading" aria-label="Generating AI summary">
              <div className="sb-skeleton" style={{ width: "100%" }} />
              <div className="sb-skeleton" style={{ width: "92%" }} />
              <div className="sb-skeleton" style={{ width: "78%" }} />
              <div className="sb-ai-loading-hint">
                <div className="sb-ai-spinner" />
                <span>Analyzing with AI…</span>
              </div>
            </div>
          )}

          {aiError && !aiLoading && (
            <div className="sb-ai-error" role="alert">{aiError}</div>
          )}

          {summary && !aiLoading && (
            <p className="sb-ai-summary">{summary}</p>
          )}
        </div>
      </div>
    </aside>
  );
}

function Metric({ label, value, valueClass = "", mono = false }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${valueClass} ${mono ? "is-mono" : ""}`}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
