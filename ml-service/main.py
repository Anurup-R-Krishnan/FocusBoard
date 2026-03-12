from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from core import (
    _cosine_similarity,
    _embed_text,
    _expand_activity_text,
    NSFW_KEYWORDS,
)

app = FastAPI(title="FocusBoard ML Service")

# -----------------
# Pydantic Models
# -----------------
class SimilarCategory(BaseModel):
    _id: str
    embedding: List[float]

class SimilarRequest(BaseModel):
    text: str
    categories: List[SimilarCategory]

class SimilarResponse(BaseModel):
    categoryId: Optional[str]
    similarity: float

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


# -----------------
# Endpoints
# -----------------
@app.post("/find-similar", response_model=SimilarResponse)
async def find_similar(req: SimilarRequest):
    if not req.text or not req.categories:
        return SimilarResponse(categoryId=None, similarity=0.0)

    text_embedding = _embed_text(_expand_activity_text(req.text))
    best_match = None
    best_similarity = 0.0

    for category in req.categories:
        if not category.embedding:
            continue
        similarity = _cosine_similarity(text_embedding, np.array(category.embedding))
        if similarity > best_similarity:
            best_similarity = similarity
            best_match = category

    if best_match:
        return SimilarResponse(categoryId=best_match._id, similarity=best_similarity)
    return SimilarResponse(categoryId=None, similarity=0.0)

@app.post("/check-nsfw", response_model=NsfwResponse)
async def check_nsfw(req: NsfwRequest):
    text = f"{req.url} {req.window_title}".lower()
    matched = next((kw for kw in NSFW_KEYWORDS if kw in text), None)
    if matched:
        return NsfwResponse(flagged=True, reason=f"Matched keyword: {matched}", confidence=0.8)
    return NsfwResponse(flagged=False, reason="", confidence=0.1)

@app.post("/embed", response_model=EmbedResponse)
async def embed_text(req: EmbedRequest):
    embedding = _embed_text(req.text).tolist()
    return EmbedResponse(embedding=embedding)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
