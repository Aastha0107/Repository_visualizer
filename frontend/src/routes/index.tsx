import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

// RepoViz is a client-side app (React Flow needs the DOM), so render after mount.
const App = lazy(() => import("../App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RepoViz – Repository Analyzer" },
      {
        name: "description",
        content:
          "Visualize repository structure as an interactive dependency graph with file metrics and AI summaries.",
      },
      { property: "og:title", content: "RepoViz – Repository Analyzer" },
      {
        property: "og:description",
        content:
          "Visualize repository structure as an interactive dependency graph with file metrics and AI summaries.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "#0a0c10" }} />;
  }

  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a0c10" }} />}>
      <App />
    </Suspense>
  );
}
