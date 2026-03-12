from typing import List, Optional
import hashlib
import re
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

MODEL = SentenceTransformer('all-MiniLM-L6-v2') if SentenceTransformer else None
EMBEDDING_DIM = 384

NSFW_KEYWORDS = ["nsfw", "porn", "xxx", "adult", "explicit", "nude", "sex"]

APP_HINTS = [
    (["pycharm", "intellij", "vscode", "visual studio", "android studio", "terminal", "code"],
     "development programming coding software"),
    (["slack", "teams", "discord", "gmail", "email"],
     "communication email chat messaging slack teams"),
    (["spotify", "netflix", "youtube", "music", "video", "game"],
     "entertainment games videos music streaming"),
    (["word", "docs", "notion", "sheet", "excel", "drive"],
     "productivity documents spreadsheets notes planning"),
    (["photoshop", "figma", "illustrator", "design"],
     "design graphics figma photoshop creative"),
]


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    if a.size == 0 or b.size == 0:
        return 0.0
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def _expand_activity_text(text: str) -> str:
    text_lower = text.lower()
    hints = []
    for keys, hint in APP_HINTS:
        if any(k in text_lower for k in keys):
            hints.append(hint)
    if hints:
        return f"{text} {' '.join(hints)}"
    return text


def _embed_text(text: str) -> np.ndarray:
    if MODEL:
        return MODEL.encode(text)
    tokens = re.findall(r"\b\w+\b", text.lower())
    vec = np.zeros(EMBEDDING_DIM, dtype=np.float32)
    for token in tokens:
        h = hashlib.md5(token.encode("utf-8")).hexdigest()
        idx = int(h, 16) % EMBEDDING_DIM
        vec[idx] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec
