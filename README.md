# RepoViz - Repository Visualizer

RepoViz is a full-stack repository analysis tool that turns a local codebase into an interactive dependency graph. Enter an absolute path to a project, scan it, explore the file graph, inspect file metrics, and generate short AI summaries for individual source files.

## Features

- Interactive dependency graph built with React Flow
- Local repository scanning through a FastAPI backend
- File-level metrics including lines of code, blank lines, file size, extension, dependency count, and rough complexity
- Import/dependency detection for Python, JavaScript, TypeScript, C, C++, and related source files
- AI-powered file summaries using Gemini by default, with optional OpenAI support
- Summary caching by content hash to avoid repeated AI calls for unchanged files
- Clean sidebar details view for selected graph nodes

## Tech Stack

**Frontend**

- React 19
- Vite
- React Flow
- TanStack Router/Start tooling
- Tailwind/Radix UI component dependencies

**Backend**

- Python
- FastAPI
- Uvicorn
- HTTPX
- python-dotenv
- Gemini API or OpenAI API for summaries

## Project Structure

```text
Repositry_visualizer/
|-- backend/
|   |-- main.py              # FastAPI app and API routes
|   |-- analyzer.py          # Repository traversal, metrics, and dependency graph logic
|   |-- ai_cache.py          # Local JSON cache for AI summaries
|   `-- requirements.txt     # Python dependencies
|-- frontend/
|   |-- src/
|   |   |-- App.jsx          # Main app layout and state
|   |   |-- components/      # Toolbar, graph canvas, sidebar, file nodes, UI pieces
|   |   `-- utils/           # API client and graph layout helpers
|   |-- package.json         # Frontend scripts and dependencies
|   `-- vite.config.ts       # Vite/TanStack config
|-- .gitignore
`-- README.md
```

## How It Works

1. The frontend sends a local repository path to the backend.
2. The backend walks the directory, ignoring folders such as `node_modules`, `.git`, `venv`, `dist`, and build/cache folders.
3. Supported source files are parsed for imports and basic metrics.
4. The backend returns nodes, dependency edges, and summary stats.
5. The frontend renders the graph with React Flow.
6. Clicking a file opens the sidebar and requests an AI summary for that file.
7. Summaries are cached in `backend/cache/ai_summaries.json` using each file's content hash.

## Supported File Types

RepoViz currently scans:

```text
.py, .js, .ts, .jsx, .tsx,
.c, .cpp, .h, .hpp,
.java, .go, .rs, .php,
.cs, .swift, .kt, .dart
```

Files larger than 512 KB are skipped during analysis.

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ or newer
- npm
- A Gemini API key or OpenAI API key if you want AI summaries

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=
```

For OpenAI summaries instead:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=
```

Start the backend:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at:

```text
http://localhost:8000
```

### Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

If your backend is running somewhere other than `http://localhost:8000`, create a frontend environment file and set:

```env
VITE_API_URL=http://localhost:8000
```

## Usage

1. Start the backend server.
2. Start the frontend dev server.
3. Open the frontend URL shown in the terminal.
4. Enter an absolute path to a local repository.
5. Click **Analyze**.
6. Select any file node to view metrics, imports, and an AI-generated summary.

Example paths:

```text
C:\Users\your-name\Projects\my-app
/home/your-name/projects/my-app
```

## API Endpoints

### Health Check

```http
GET /health
```

Returns backend status, active AI provider, and whether a Gemini key is loaded.

### Analyze Repository

```http
POST /api/analyze
Content-Type: application/json

{
  "path": "C:\\Users\\your-name\\Projects\\my-app"
}
```

Returns the repository root, graph nodes, dependency edges, and basic stats.

### Summarize File

```http
GET /api/summarize/{node_id}?root={absolute_repo_root}&hash={content_hash}
```

Returns a short AI-generated summary for the selected file. Cached summaries return with `cached: true`.

### Cache Stats

```http
GET /api/cache/stats
```

Returns cache status and the number of cached summaries.

## Notes

- RepoViz analyzes local paths from the machine running the backend.
- The backend strips absolute file paths from graph nodes before returning data to the frontend.
- AI summaries require a configured API key. The analyzer and graph view still work without one.
- Dependency resolution is intentionally lightweight and based on imports/includes found in source files.

## Authors

Aastha Sharma
Guni Mishra
