// src/utils/layout.js
// Converts raw graph data (nodes + edges from Python backend) into
// React Flow–compatible node/edge objects with auto-positions.
//
// Layout strategy:
//   - Group files by their parent directory
//   - Arrange directories in columns, files in rows inside each column
//   - Falls back to a simple grid if there are very few directories

const NODE_WIDTH  = 220;
const NODE_HEIGHT = 90;
const H_GAP       = 60;   // gap between columns
const V_GAP       = 30;   // gap between rows in a column

export function buildLayout(graphData) {
  const { nodes: rawNodes, edges: rawEdges } = graphData;

  // ---- Group by directory ----
  const dirMap = {};  // dir -> [rawNode]
  for (const node of rawNodes) {
    const parts = node.path.split("/");
    const dir   = parts.length > 1 ? parts.slice(0, -1).join("/") : "(root)";
    if (!dirMap[dir]) dirMap[dir] = [];
    dirMap[dir].push(node);
  }

  const dirs     = Object.keys(dirMap).sort();
  const rfNodes  = [];
  let   colX     = 40;

  for (const dir of dirs) {
    const filesInDir = dirMap[dir];
    let rowY = 60;

    for (const raw of filesInDir) {
      rfNodes.push({
        id:       raw.id,
        type:     "fileNode",
        position: { x: colX, y: rowY },
        data:     { raw, selected: false },
        style:    { width: NODE_WIDTH },
      });
      rowY += NODE_HEIGHT + V_GAP;
    }

    colX += NODE_WIDTH + H_GAP;
  }

  // ---- Edges ----
  const rfEdges = rawEdges.map((e) => ({
    id:     e.id,
    source: e.source,
    target: e.target,
    type:   "smoothstep",
  }));

  return { rfNodes, rfEdges };
}
