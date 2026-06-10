import json
import time
from pathlib import Path

CACHE_DIR  = Path(__file__).parent / "cache"
CACHE_FILE = CACHE_DIR / "ai_summaries.json"


def _load() -> dict:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def _save(data: dict) -> None:
    CACHE_DIR.mkdir(exist_ok=True)
    CACHE_FILE.write_text(json.dumps(data, indent=2))


def get(content_hash: str) -> str | None:
    """Return cached summary string or None."""
    return _load().get(content_hash, {}).get("summary")


def set(content_hash: str, summary: str, model: str = "unknown") -> None:
    """Store a summary in the cache."""
    data = _load()
    data[content_hash] = {
        "summary":   summary,
        "model":     model,
        "timestamp": time.time(),
    }
    _save(data)


def invalidate(content_hash: str) -> None:
    data = _load()
    data.pop(content_hash, None)
    _save(data)


def stats() -> dict:
    data = _load()

    return {
        "cached_entries": len(data),
        "cache_enabled": True,
        "cache_file": str(CACHE_FILE)
    }
