import os
import re
from pathlib import Path
from urllib.parse import unquote

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

import ai_cache
from analyzer import analyze_directory, graph_to_dict

# App Setup
app = FastAPI(title="Repo Analyzer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini")


# Request/Response Models
class AnalyzeRequest(BaseModel):
    path: str


@app.on_event("startup")
async def startup_event():
    if GEMINI_API_KEY:
        print(f"✅ Gemini API key loaded (starts with: {GEMINI_API_KEY[:8]}...)")
    else:
        print("❌ WARNING: GEMINI_API_KEY is empty! Check your .env file.")
    print(f"   AI Provider: {AI_PROVIDER}")


# Helper
async def _call_ai(file_content: str, filename: str) -> str:
    prompt = (
        f"You are a senior software engineer. Analyze the following code from "
        f"the file '{filename}' and explain what it does in exactly 3 short, "
        f"plain-English sentences. Be concise and focus on purpose, not syntax.\n\n"
        f"```\n{file_content[:6000]}\n```"
    )

    if AI_PROVIDER == "openai" and OPENAI_API_KEY:
        return await _call_openai(prompt)
    elif GEMINI_API_KEY:
        return await _call_gemini(prompt)
    else:
        return "⚠️ No AI API key configured. Set GEMINI_API_KEY in your .env file."


async def _call_gemini(prompt: str) -> str:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            GEMINI_URL,
            params={"key": GEMINI_API_KEY},
            json=payload,
        )

    if r.status_code != 200:
        error_body = r.text[:500]
        print(f"❌ Gemini API error {r.status_code}: {error_body}")
        raise HTTPException(status_code=502, detail=f"Gemini error {r.status_code}: {error_body}")

    data = r.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except (KeyError, IndexError) as e:
        print(f"❌ Unexpected Gemini response structure: {data}")
        raise HTTPException(status_code=502, detail=f"Unexpected Gemini response: {e}")


async def _call_openai(prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
        )
    if r.status_code != 200:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {r.text}")
    return r.json()["choices"][0]["message"]["content"].strip()


# Endpoints

@app.get("/health")
def health():
    return {
        "status": "ok",
        "ai_provider": AI_PROVIDER,
        "gemini_key_loaded": bool(GEMINI_API_KEY), 
    }


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    path = req.path.strip()
    if not path:
        raise HTTPException(status_code=400, detail="path is required")

    resolved = Path(path).resolve()
    if not resolved.exists():
        raise HTTPException(status_code=404, detail=f"Path not found: {path}")
    if not resolved.is_dir():
        raise HTTPException(status_code=400, detail="Path must be a directory")

    graph = analyze_directory(str(resolved))
    return graph_to_dict(graph)


@app.get("/api/summarize/{node_id:path}")
async def summarize(
    node_id: str,
    root: str = Query(..., description="Absolute path to the repo root"),
    hash: str = Query(..., description="content_hash from the node object"),
):
    node_id = unquote(node_id)
    content_hash = hash

    cached = ai_cache.get(content_hash)
    if cached:
        return {"summary": cached, "cached": True}

    file_path = Path(root) / node_id
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    try:
        content = file_path.read_text(encoding="utf-8", errors="ignore")
    except OSError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        summary = await _call_ai(content, file_path.name)
    except HTTPException:
        raise  
    except Exception as e:
        print(f"❌ AI call failed for {file_path.name}: {e}")
        summary = (
            f"{file_path.name} contains {len(content.splitlines())} lines of code. "
            f"AI summary unavailable: {str(e)[:100]}"
        )

    ai_cache.set(content_hash, summary, model=AI_PROVIDER)

    return {"summary": summary, "cached": False}


@app.get("/api/cache/stats")
def cache_stats():
    return ai_cache.stats()