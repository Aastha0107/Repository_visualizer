// src/components/FileNode.jsx
// Custom React Flow node that represents a single file in the graph.
// Shows: filename, extension badge, Lines of Code, complexity bar.

import { Handle, Position } from "reactflow";
import "./FileNode.css";

const EXT_LABEL = {
  ".py":  "PY",  ".js":  "JS",  ".ts":  "TS",
  ".jsx": "JSX", ".tsx": "TSX", ".c":   "C",
  ".cpp": "C++", ".h":   "H",   ".hpp": "H++",
  ".java":"JAVA",".go":  "GO",  ".rs":  "RS",
};

const EXT_COLOR = {
  ".py":  "#3b82f6", ".js":  "#f59e0b", ".ts":  "#6366f1",
  ".jsx": "#f59e0b", ".tsx": "#6366f1", ".c":   "#22c55e",
  ".cpp": "#22c55e", ".h":   "#84cc16", ".hpp": "#84cc16",
  ".java":"#ef4444", ".go":  "#06b6d4", ".rs":  "#f97316",
};

function complexityLabel(score) {
  if (score <= 5)  return { text: "Simple",  cls: "badge-green" };
  if (score <= 15) return { text: "Moderate",cls: "badge-yellow" };
  if (score <= 30) return { text: "Complex", cls: "badge-orange" };
  return               { text: "Very High", cls: "badge-red" };
}

export default function FileNode({ data }) {
  const { raw, selected } = data;
  const ext   = raw.extension ?? "";
  const color = EXT_COLOR[ext] ?? "#6366f1";
  const label = EXT_LABEL[ext]  ?? ext.replace(".", "").toUpperCase();
  const cx    = complexityLabel(raw.complexity ?? 0);

  return (
    <div className={`file-node ${selected ? "file-node--selected" : ""}`}
         style={{ "--accent": color }}>
      {/* Target handle – arrows coming IN  */}
      <Handle type="target" position={Position.Left} />

      <div className="fn-header">
        <span className="fn-ext-badge" style={{ background: color }}>
          {label}
        </span>
        <span className="fn-name" title={raw.path}>{raw.label}</span>
      </div>

      <div className="fn-meta">
        <span className="fn-stat">
          <span className="fn-stat-icon">≡</span>
          {raw.lines_of_code.toLocaleString()} loc
        </span>
        <span className={`fn-complexity ${cx.cls}`}>{cx.text}</span>
      </div>

      {/* Complexity bar */}
      <div className="fn-bar-bg">
        <div
          className="fn-bar-fill"
          style={{ width: `${Math.min(100, (raw.complexity / 50) * 100)}%` }}
        />
      </div>

      {/* Source handle – arrows going OUT */}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
