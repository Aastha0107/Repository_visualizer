// src/components/GraphCanvas.jsx
// Renders the interactive dependency graph using React Flow

import { useEffect, useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import FileNode from "./FileNode";
import { buildLayout } from "../utils/layout";

// Register our custom node type
const nodeTypes = { fileNode: FileNode };

export default function GraphCanvas({ graphData, onNodeClick, selectedNodeId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert raw graph data → React Flow nodes/edges whenever data changes
  useEffect(() => {
    if (!graphData) return;

    const { rfNodes, rfEdges } = buildLayout(graphData);

    // Mark the selected node
    const withSelected = rfNodes.map((n) => ({
      ...n,
      data: { ...n.data, selected: n.id === selectedNodeId },
    }));

    setNodes(withSelected);
    setEdges(rfEdges);
  }, [graphData]); // eslint-disable-line react-hooks/exhaustive-deps

  // When selectedNodeId changes externally, update node data
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === selectedNodeId },
      }))
    );
  }, [selectedNodeId, setNodes]);

  const handleNodeClick = useCallback(
    (_, node) => {
      onNodeClick(node.data.raw);
    },
    [onNodeClick]
  );

  const styledEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        style: { stroke: "#6366f1", strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#6366f1" },
        animated: false,
      })),
    [edges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={styledEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#1e1e2e" gap={20} size={1} />
      <Controls position="bottom-right" />
      <MiniMap
        nodeColor={(n) => {
          const ext = n.data?.raw?.extension ?? "";
          return EXT_COLOR[ext] ?? "#6366f1";
        }}
        maskColor="rgba(15,15,25,0.8)"
        style={{ background: "#12121a" }}
      />
    </ReactFlow>
  );
}

// Mini-map node colours per extension
const EXT_COLOR = {
  ".py":   "#3b82f6",
  ".js":   "#f59e0b",
  ".ts":   "#6366f1",
  ".jsx":  "#f59e0b",
  ".tsx":  "#6366f1",
  ".c":    "#22c55e",
  ".cpp":  "#22c55e",
  ".h":    "#84cc16",
  ".hpp":  "#84cc16",
  ".java": "#ef4444",
  ".go":   "#06b6d4",
  ".rs":   "#f97316",
};
