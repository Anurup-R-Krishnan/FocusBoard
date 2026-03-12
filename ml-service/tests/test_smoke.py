import numpy as np
from core import _embed_text, _expand_activity_text, _cosine_similarity

CATEGORIES = {
    "Development": "Programming coding software development",
    "Communication": "Email chat messaging slack teams",
    "Entertainment": "Games videos music streaming",
    "Productivity": "Documents spreadsheets notes planning",
    "Design": "Graphics design figma photoshop creative",
}

TEST_CASES = [
    ("PyCharm", "Development"),
    ("IntelliJ IDEA", "Development"),
    ("Microsoft Teams", "Communication"),
    ("Discord", "Communication"),
    ("Spotify", "Entertainment"),
    ("Netflix", "Entertainment"),
    ("Microsoft Word", "Productivity"),
    ("Google Docs", "Productivity"),
    ("Adobe Photoshop", "Design"),
    ("Figma", "Design"),
]


def classify(text, cat_embeds):
    emb = _embed_text(_expand_activity_text(text))
    best = None
    best_score = -1
    for name, cemb in cat_embeds.items():
        score = _cosine_similarity(np.array(emb), np.array(cemb))
        if score > best_score:
            best_score = score
            best = name
    return best, best_score


def test_ml_smoke():
    cat_embeds = {k: _embed_text(v) for k, v in CATEGORIES.items()}
    failures = []
    for app, expected in TEST_CASES:
        actual, score = classify(app, cat_embeds)
        if actual != expected:
            failures.append((app, expected, actual, score))
    assert not failures, "ML smoke test failed: " + ", ".join(
        [f"{app} expected {expected} got {actual} ({score:.3f})" for app, expected, actual, score in failures]
    )
