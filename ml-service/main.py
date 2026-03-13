from fastapi import FastAPI, Response, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
import re
import asyncio
import os
import threading
from dataclasses import dataclass
from core import (
    _cosine_similarity,
    _embed_text,
    _expand_activity_text,
    NSFW_KEYWORDS,
    NSFW_DOMAINS,
    MIN_SIMILARITY_THRESHOLD,
    is_model_loaded,
    get_model_status,
    load_model,
    get_metrics_payload,
    logger,
)

app = FastAPI(title="FocusBoard ML Service")

MAX_QUEUE = max(1, int(os.environ.get("ML_MAX_QUEUE", "200")))
WORKERS = max(1, int(os.environ.get("ML_WORKERS", "2")))
MAX_BATCH_SIZE = max(1, int(os.environ.get("ML_MAX_BATCH_SIZE", "100")))

EMBED_QUEUE = None
WORKER_TASKS = []


@dataclass
class EmbedTask:
    text: str
    future: asyncio.Future


def _model_metadata():
    status = get_model_status()
    return {
        "model_name": status.get("model_name"),
        "model_version": status.get("model_version"),
        "embedding_dim": status.get("embedding_dim"),
    }


@app.on_event("startup")
async def start_background_model_init():
    def _init():
        try:
            load_model()
        except Exception as e:
            logger.exception("Background model init failed: %s", e)
    threading.Thread(target=_init, daemon=True).start()


@app.on_event("startup")
async def start_worker_pool():
    global EMBED_QUEUE
    if EMBED_QUEUE is None:
        EMBED_QUEUE = asyncio.Queue(maxsize=MAX_QUEUE)
        for _ in range(WORKERS):
            WORKER_TASKS.append(asyncio.create_task(_embed_worker()))

class SimilarCategory(BaseModel):
    _id: str
    embedding: List[float]

class SimilarRequest(BaseModel):
    text: str
    categories: List[SimilarCategory]
    threshold: Optional[float] = Field(default=None, description="Minimum similarity threshold (0-1)")

class SimilarResponse(BaseModel):
    categoryId: Optional[str]
    similarity: float
    meetsThreshold: bool
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    embedding_dim: Optional[int] = None

class NsfwRequest(BaseModel):
    url: str = ""
    window_title: str = ""

class NsfwResponse(BaseModel):
    flagged: bool
    reason: str
    confidence: float

class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    embedding_dim: Optional[int] = None

class BatchEmbedRequest(BaseModel):
    texts: List[str]

class BatchEmbedResponse(BaseModel):
    embeddings: List[List[float]]
    model_name: Optional[str] = None
    model_version: Optional[str] = None
    embedding_dim: Optional[int] = None


async def _embed_worker():
    while True:
        task = await EMBED_QUEUE.get()
        try:
            result = await run_in_threadpool(_embed_text, task.text)
            task.future.set_result(result)
        except Exception as exc:
            task.future.set_exception(exc)
        finally:
            EMBED_QUEUE.task_done()


async def _queue_embed(text: str) -> np.ndarray:
    if EMBED_QUEUE is None:
        return await run_in_threadpool(_embed_text, text)

    loop = asyncio.get_running_loop()
    fut = loop.create_future()
    try:
        EMBED_QUEUE.put_nowait(EmbedTask(text=text, future=fut))
    except asyncio.QueueFull as exc:
        raise HTTPException(status_code=429, detail="ML service overloaded. Retry with backoff.") from exc
    return await fut

@app.post("/find-similar", response_model=SimilarResponse)
async def find_similar(req: SimilarRequest):
    if not req.text or not req.categories:
        return SimilarResponse(categoryId=None, similarity=0.0, meetsThreshold=False, **_model_metadata())

    threshold = req.threshold if req.threshold is not None else MIN_SIMILARITY_THRESHOLD
    
    text_embedding = await _queue_embed(_expand_activity_text(req.text))
    best_match = None
    best_similarity = 0.0

    for category in req.categories:
        if not category.embedding:
            continue
        try:
            similarity = _cosine_similarity(text_embedding, np.array(category.embedding))
            if similarity > best_similarity:
                best_similarity = similarity
                best_match = category
        except Exception:
            continue

    if best_match:
        meets_threshold = best_similarity >= threshold
        return SimilarResponse(
            categoryId=best_match._id if meets_threshold else None,
            similarity=best_similarity,
            meetsThreshold=meets_threshold,
            **_model_metadata(),
        )
    return SimilarResponse(categoryId=None, similarity=0.0, meetsThreshold=False, **_model_metadata())

@app.post("/check-nsfw", response_model=NsfwResponse)
async def check_nsfw(req: NsfwRequest):
    url = (req.url or "").lower()
    window_title = (req.window_title or "").lower()
    text = f"{url} {window_title}"
    
    matched_keywords = [kw for kw in NSFW_KEYWORDS if kw in text]
    matched_domains = [d for d in NSFW_DOMAINS if d in url]
    
    if matched_keywords:
        return NsfwResponse(
            flagged=True,
            reason=f"Matched keywords: {', '.join(matched_keywords)}",
            confidence=0.9
        )
    
    if matched_domains:
        return NsfwResponse(
            flagged=True,
            reason=f"Matched blocked domains: {', '.join(matched_domains)}",
            confidence=0.95
        )
    
    suspicious_patterns = [
        r'\.xxx/', r'/adult/', r'/18\+', r'/nsfw/',
        r'gay\.', r'lesbian\.', r'transgender\.',
    ]
    for pattern in suspicious_patterns:
        if re.search(pattern, text):
            return NsfwResponse(
                flagged=True,
                reason=f"Suspicious URL pattern detected",
                confidence=0.7
            )
    
    return NsfwResponse(flagged=False, reason="", confidence=0.1)

@app.post("/embed", response_model=EmbedResponse)
async def embed_text(req: EmbedRequest):
    embedding = (await _queue_embed(req.text)).tolist()
    return EmbedResponse(embedding=embedding, **_model_metadata())

@app.post("/embed/batch", response_model=BatchEmbedResponse)
async def embed_batch(req: BatchEmbedRequest, max_batch_size: int = 100):
    if len(req.texts) > MAX_BATCH_SIZE:
        raise HTTPException(status_code=400, detail=f"Batch size exceeds {MAX_BATCH_SIZE}")
    size = min(max_batch_size, MAX_BATCH_SIZE)
    embeddings = await asyncio.gather(*[_queue_embed(text) for text in req.texts[:size]])
    return BatchEmbedResponse(embeddings=[emb.tolist() for emb in embeddings], **_model_metadata())

@app.get("/model/status")
async def model_status():
    return get_model_status()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": is_model_loaded(),
        "model_info": get_model_status()
    }


@app.get("/health/model")
async def model_health():
    status = get_model_status()
    return {
        "status": "ready" if status.get("loaded") else "not_ready",
        "model": status
    }


@app.get("/metrics")
async def metrics():
    payload = get_metrics_payload()
    if payload is None:
        return Response(content="metrics unavailable", status_code=501)
    return Response(content=payload, media_type="text/plain; version=0.0.4; charset=utf-8")
