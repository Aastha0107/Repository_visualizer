// src/utils/api.js
// Centralised API helpers for communicating with the Python backend.

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/**
 * POST /api/analyze
 * Sends a local directory path to the backend and gets the dependency graph.
 */
export async function analyzeRepo(repoPath) {
  const res = await fetch(`${BASE}/api/analyze`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ path: repoPath }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `Server error ${res.status}`);
  }

  return res.json();   // { nodes, edges, root }
}

/**
 * GET /api/summarize/<node_id>?root=...&hash=...
 * Fetches (or generates) an AI summary for the given file.
 */
export async function fetchSummary(nodeId, root, contentHash) {
  const params = new URLSearchParams({ root, hash: contentHash });
  const url    = `${BASE}/api/summarize/${encodeURIComponent(nodeId)}?${params}`;

  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `AI error ${res.status}`);
  }

  return res.json();   // { summary, cached }
}
