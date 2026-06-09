// src/components/Sidebar.jsx
// Right-hand panel that shows file metadata + AI-generated summary.

import { useEffect, useState } from "react";
import { fetchSummary } from "../utils/api";
import "./Sidebar.css";

export default function Sidebar({ node, root, onClose }) {
  const [summary, setSummary]   = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]   = useState("");

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
  let complexityColor = "#4ade80";
  if (complexity > 30) { complexityLabel = "Very High"; complexityColor = "#f87171"; }
  else if (complexity > 15) { complexityLabel = "Complex"; complexityColor = "#fb923c"; }
  else if (complexity > 5)  { complexityLabel = "Moderate"; complexityColor = "#facc15"; }

  return (
    <aside className="sidebar">
      {/* ---- Header ---- */}
      <div className="sb-header">
        <div>
          <div className="sb-filename">{node.label}</div>
          <div className="sb-path">{node.path}</div>
        </div>
        <button className="sb-close" onClick={onClose} title="Close">✕</button>
      </div>

      {/* ---- Metrics grid ---- */}
      <div className="sb-metrics">
        <Metric label="Lines of Code"  value={node.lines_of_code?.toLocaleString()} />
        <Metric label="Blank Lines"    value={node.blank_lines?.toLocaleString()} />
        <Metric label="File Size"      value={formatBytes(node.size_bytes)} />
        <Metric label="Complexity"     value={complexityLabel}
                color={complexityColor} />
        <Metric label="Dependencies"   value={node.dependencies?.length ?? 0} />
        <Metric label="Extension"      value={node.extension} />
      </div>

      {/* ---- Dependencies list ---- */}
      {node.dependencies?.length > 0 && (
        <div className="sb-section">
          <div className="sb-section-title">Imports</div>
          <ul className="sb-dep-list">
            {node.dependencies.map((dep) => (
              <li key={dep} className="sb-dep-item">
                <span className="sb-dep-dot" />
                {dep}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- AI Summary ---- */}
      <div className="sb-section">
        <div className="sb-section-title">
          <span>AI Summary</span>
          <span className="sb-ai-badge">✦ AI</span>
        </div>

        {aiLoading && (
          <div className="sb-ai-loading">
            <div className="sb-ai-spinner" />
            <span>Analyzing with AI…</span>
          </div>
        )}

        {aiError && !aiLoading && (
          <div className="sb-ai-error">{aiError}</div>
        )}

        {summary && !aiLoading && (
          <p className="sb-ai-summary">{summary}</p>
        )}
      </div>
    </aside>
  );
}

function Metric({ label, value, color }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={color ? { color } : {}}>
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
