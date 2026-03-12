from typing import List, Optional
import hashlib
import re
import os
import numpy as np
import threading

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

EMBEDDING_DIM = 384
MODEL_NAME = os.environ.get('SENTENCE_TRANSFORMER_MODEL', 'all-MiniLM-L6-v2')
MIN_SIMILARITY_THRESHOLD = float(os.environ.get('MIN_SIMILARITY_THRESHOLD', '0.3'))

MODEL = None
MODEL_LOADED = False
MODEL_LOAD_ERROR = None
MODEL_LOCK = threading.Lock()
MODEL_ATTEMPTED = False

def load_model():
    global MODEL, MODEL_LOADED, MODEL_LOAD_ERROR, MODEL_ATTEMPTED
    if MODEL_LOADED:
        return True
    if MODEL is not None:
        MODEL_LOADED = True
        MODEL_ATTEMPTED = True
        return True

    with MODEL_LOCK:
        if MODEL_LOADED:
            return True
        try:
            if SentenceTransformer:
                m = SentenceTransformer(MODEL_NAME)
                MODEL = m
                MODEL_LOADED = True
                MODEL_ATTEMPTED = True
                print(f"ML Model '{MODEL_NAME}' loaded successfully")
                return True
            else:
                MODEL_LOAD_ERROR = "sentence_transformers not installed"
                MODEL_LOADED = False
                MODEL_ATTEMPTED = True
                return False
        except Exception as e:
            MODEL_LOAD_ERROR = str(e)
            MODEL_LOADED = False
            MODEL_ATTEMPTED = True
            print(f"Failed to load ML model: {MODEL_LOAD_ERROR}")
            return False

# lazy model load: initialize on demand or via startup hook

NSFW_KEYWORDS = [
    "nsfw", "porn", "xxx", "adult", "explicit", "nude", "sex",
    "gambling", "casino", "lottery", "betting", "poker"
]

NSFW_DOMAINS = [
    "pornhub", "xvideos", "xhamster", "redtube", "youporn",
    "brazzers", "bangbros", "naughtyamerica", "playboy",
    "casino", "bet365", "pokerstars", "draftkings", "fanduel"
]

APP_HINTS = [
    (["pycharm", "intellij", "vscode", "visual studio", "android studio", "terminal", "code", "sublime", "atom", "webstorm"],
     "development programming coding software engineering"),
    (["slack", "teams", "discord", "gmail", "email", "outlook", "zoom", "meet"],
     "communication messaging chat collaboration"),
    (["spotify", "netflix", "youtube", "music", "video", "game", "twitch", "hulu", "disney"],
     "entertainment games videos streaming leisure"),
    (["word", "docs", "notion", "sheet", "excel", "drive", "pdf", "evernote", "onenote"],
     "productivity documents spreadsheets notes office work"),
    (["photoshop", "figma", "illustrator", "design", "sketch", "indesign", "xd", "canva"],
     "design graphics creative visual"),
    (["chrome", "firefox", "safari", "edge", "browser"],
     "web browsing internet"),
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
        try:
            return MODEL.encode(text)
        except Exception as e:
            print(f"Model encoding error: {e}")
    
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


def is_model_loaded() -> bool:
    return MODEL_LOADED


def get_model_status() -> dict:
    return {
        "loaded": MODEL_LOADED,
        "attempted": MODEL_ATTEMPTED,
        "model_name": MODEL_NAME if MODEL_LOADED else None,
        "error": MODEL_LOAD_ERROR,
        "embedding_dim": EMBEDDING_DIM
    }
