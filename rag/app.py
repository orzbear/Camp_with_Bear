from fastapi import FastAPI
import os

app = FastAPI()

VERSION = os.getenv("RAG_VERSION", "0.0.1")

@app.get("/health")
async def health():
    return {
        "ok": True,
        "service": "rag",
        "version": VERSION
    }

