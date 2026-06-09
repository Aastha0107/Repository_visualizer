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
            <div className="error-banner">
              ⚠️ {error}
            </div>
          )}
          {loading && (
            <div className="loading-overlay">
              <div className="spinner" />
              <p>Scanning repository…</p>
            </div>
          )}
          {!loading && !graphData && !error && (
            <div className="empty-state">
              <div className="empty-icon">⬡</div>
              <h2>No repository loaded</h2>
              <p>Enter an absolute path above and click <strong>Analyze</strong></p>
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
