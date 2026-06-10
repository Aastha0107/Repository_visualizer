// src/App.jsx
// Root component: manages global state, layout (canvas + sidebar)

import { useState, useCallback } from "react";
import GraphCanvas from "./components/GraphCanvas";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import { analyzeRepo } from "./utils/api";
import "./App.css";

export default function App() {
  const [graphData, setGraphData] = useState(null);   // { nodes, edges, root }
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = useCallback(async (repoPath) => {
    if (!repoPath.trim()) return;
    setLoading(true);
    setError("");
    setSelectedNode(null);
    setGraphData(null);

    try {
      const data = await analyzeRepo(repoPath);
      setGraphData(data);
    } catch (err) {
      setError(err.message || "Failed to analyze repository.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="app-layout">
      <Toolbar
        onAnalyze={handleAnalyze}
        loading={loading}
        nodeCount={graphData?.nodes?.length ?? 0}
        edgeCount={graphData?.edges?.length ?? 0}
      />

      <div className="main-area">
        <div className="canvas-area">
          {error && (
            <div className="error-banner" role="alert">
              <svg className="error-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8.22 1.754a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368L8.22 1.754Zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.25-5.25a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5Z" />
              </svg>
              <div>
                <div className="error-title">Analysis failed</div>
                <div className="error-message">{error}</div>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-overlay">
              <div className="spinner" />
              <p className="loading-title">Scanning repository</p>
              <p className="loading-sub">Parsing files and resolving dependencies…</p>
            </div>
          )}

          {!loading && !graphData && !error && (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                  <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7L12 2.5Z" />
                  <path d="M12 2.5v9m0 0L3.5 7m8.5 4.5L20.5 7M12 11.5v10" opacity="0.45" />
                </svg>
              </div>
              <h2>No repository loaded</h2>
              <p>
                Enter an absolute path in the toolbar and press{" "}
                <kbd>Analyze</kbd> to map its dependency graph.
              </p>
            </div>
          )}

          {graphData && (
            <GraphCanvas
              graphData={graphData}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id}
            />
          )}
        </div>

        <Sidebar
          node={selectedNode}
          root={graphData?.root}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
}
