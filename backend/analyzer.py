import os
import re
import hashlib
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional

#Configuration

SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".ts", ".jsx", ".tsx",
    ".c", ".cpp", ".h", ".hpp",
    ".java",".go",".rs",".php",
    ".cs",".swift",".kt",".dart"
}

IGNORE_DIRS = {
    "node_modules",
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "dist",
    "build",
    ".next",
    "coverage",
    ".idea",
    ".vscode",
    ".pytest_cache",
    ".mypy_cache",
    ".cache"
}

MAX_FILE_SIZE_BYTES = 512 * 1024  


# Data Classes

@dataclass
class FileNode:
    id: str                          
    label: str                     
    path: str                       
    abs_path: str                   
    extension: str
    lines_of_code: int
    blank_lines: int
    complexity: int                  
    size_bytes: int
    content_hash: str               
    raw_imports: list[str] = field(default_factory=list)   
    dependencies: list[str] = field(default_factory=list) 


@dataclass
class DependencyEdge:
    id: str
    source: str   
    target: str   


@dataclass
class RepoGraph:
    nodes: list[FileNode]
    edges: list[DependencyEdge]
    root: str


# Helpers

def _hash_content(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def _count_complexity(content: str, ext: str) -> int:
    """
    Rough cyclomatic complexity proxy:
    count branching keywords that add a new execution path.
    """
    keywords = ["if ", "elif ", "else:", "for ", "while ",
                "case ", "catch", "except", "&&", "||", "?"]
    count = 1
    for kw in keywords:
        count += content.count(kw)
    return count


def _parse_python_imports(content: str) -> list[str]:
    imports = []
    for line in content.splitlines():
        line = line.strip()
        m = re.match(r"^import\s+([\w.]+)", line)
        if m:
            imports.append(m.group(1).split(".")[0])
            continue
        m = re.match(r"^from\s+([\w.]+)\s+import", line)
        if m:
            imports.append(m.group(1).split(".")[0])
    return imports


def _parse_js_imports(content: str) -> list[str]:
    imports = []
    
    for m in re.finditer(r'import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]', content):
        imports.append(m.group(1))
    
    for m in re.finditer(r'require\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)', content):
        imports.append(m.group(1))
    return imports


def _parse_c_includes(content: str) -> list[str]:
    imports = []
    for m in re.finditer(r'#include\s+[<"]([^>"]+)[>"]', content):
        imports.append(m.group(1))
    return imports


def _extract_raw_imports(content: str, ext: str) -> list[str]:
    if ext == ".py":
        return _parse_python_imports(content)
    if ext in {".js", ".ts", ".jsx", ".tsx"}:
        return _parse_js_imports(content)
    if ext in {".c", ".cpp", ".h", ".hpp"}:
        return _parse_c_includes(content)
    return []


def _resolve_dependencies(node: FileNode, id_map: dict[str, str]) -> list[str]:
    """
    Try to match raw import strings to actual file IDs in the repo.
    For Python: match module name to file stem.
    For JS/TS: match relative path to actual file.
    """
    resolved = []
    ext = node.extension
    node_dir = str(Path(node.path).parent)

    for raw in node.raw_imports:
     
        if raw.startswith(".") and ext in {".js", ".ts", ".jsx", ".tsx"}:
            candidate_base = str(
                (Path(node_dir) / raw).as_posix()
            ).lstrip("/")
            for try_ext in ["", ".js", ".ts", ".jsx", ".tsx",
                            "/index.js", "/index.ts"]:
                candidate = candidate_base + try_ext
                if candidate in id_map:
                    resolved.append(id_map[candidate])
                    break
            continue

      
        if ext == ".py":
            for file_id, file_path in id_map.items():
                stem = Path(file_path).stem
                if stem == raw:
                    resolved.append(file_id)
                    break
            continue

    
        if ext in {".c", ".cpp", ".h", ".hpp"}:
            target_name = Path(raw).name
            for file_id, file_path in id_map.items():
                if Path(file_path).name == target_name:
                    resolved.append(file_id)
                    break

    return list(set(resolved))  


# Main Traverdsal

def analyze_directory(root_path: str) -> RepoGraph:
    root = Path(root_path).resolve()
    if not root.is_dir():
        raise ValueError(f"Not a directory: {root_path}")

    nodes: list[FileNode] = []
   
    id_map: dict[str, str] = {}

    # Pass 1: collect all files
    for dirpath, dirnames, filenames in os.walk(root):
    
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]

        for filename in filenames:
            ext = Path(filename).suffix.lower()
            if ext not in SUPPORTED_EXTENSIONS:
                continue

            abs_path = Path(dirpath) / filename
            if abs_path.stat().st_size > MAX_FILE_SIZE_BYTES:
                continue

            rel_path = str(abs_path.relative_to(root)).replace("\\", "/")
            node_id = rel_path  

            try:
                content = abs_path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue

            lines = content.splitlines()
            loc = len(lines)
            blank = sum(1 for l in lines if l.strip() == "")
            raw_imports = _extract_raw_imports(content, ext)

            node = FileNode(
                id=node_id,
                label=filename,
                path=rel_path,
                abs_path=str(abs_path),
                extension=ext,
                lines_of_code=loc,
                blank_lines=blank,
                complexity=_count_complexity(content, ext),
                size_bytes=abs_path.stat().st_size,
                content_hash=_hash_content(content),
                raw_imports=raw_imports,
            )
            nodes.append(node)
            id_map[rel_path] = node_id

    # Pass 2: resolve dependencies to real node IDs
    for node in nodes:
        node.dependencies = _resolve_dependencies(node, id_map)

    # Build edges (deduplicated)
    seen_edges: set[tuple[str, str]] = set()
    edges: list[DependencyEdge] = []
    for node in nodes:
        for dep_id in node.dependencies:
            pair = (node.id, dep_id)
            if pair not in seen_edges:
                seen_edges.add(pair)
                edge_id = f"{node.id}→{dep_id}"
                edges.append(DependencyEdge(id=edge_id, source=node.id, target=dep_id))

    return RepoGraph(nodes=nodes, edges=edges, root=str(root))


def graph_to_dict(graph: RepoGraph) -> dict:
    """Serialise the graph, stripping abs_path from nodes."""
    nodes_out = []
    for n in graph.nodes:
        d = asdict(n)
        d.pop("abs_path", None)  #
        nodes_out.append(d)
    return {
        "root": graph.root,
        "nodes": nodes_out,
        "edges": [asdict(e) for e in graph.edges],
    }
