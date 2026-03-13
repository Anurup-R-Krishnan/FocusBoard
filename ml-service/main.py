from fastapi import FastAPI, Response
from pydantic import BaseModel, Field
from typing import List, Optional
import numpy as np
import re
import threading
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

@app.post("/find-similar", response_model=SimilarResponse)
async def find_similar(req: SimilarRequest):
    if not req.text or not req.categories:
        return SimilarResponse(categoryId=None, similarity=0.0, meetsThreshold=False, **_model_metadata())

    threshold = req.threshold if req.threshold is not None else MIN_SIMILARITY_THRESHOLD
    
    text_embedding = _embed_text(_expand_activity_text(req.text))
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
    embedding = _embed_text(req.text).tolist()
    return EmbedResponse(embedding=embedding, **_model_metadata())

@app.post("/embed/batch", response_model=BatchEmbedResponse)
async def embed_batch(req: BatchEmbedRequest, max_batch_size: int = 100):
    embeddings = []
    for text in req.texts[:max_batch_size]:
        embeddings.append(_embed_text(text).tolist())
    return BatchEmbedResponse(embeddings=embeddings, **_model_metadata())

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
