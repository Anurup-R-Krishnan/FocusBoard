from fastapi.testclient import TestClient

from core import _embed_text
from main import app


client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "healthy"
    assert "model_loaded" in body
    assert "model_info" in body


def test_embed_endpoint_returns_vector():
    resp = client.post("/embed", json={"text": "Visual Studio Code"})
    assert resp.status_code == 200
    body = resp.json()
    assert "embedding" in body
    assert "model_name" in body
    assert "embedding_dim" in body
    assert isinstance(body["embedding"], list)
    assert len(body["embedding"]) > 0


def test_embed_batch_returns_vectors():
    resp = client.post("/embed/batch", json={"texts": ["alpha", "beta"]})
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body["embeddings"], list)
    assert len(body["embeddings"]) == 2
    assert "model_name" in body


def test_check_nsfw_flags_keyword():
    resp = client.post("/check-nsfw", json={"url": "https://example.com", "window_title": "explicit content"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["flagged"] is True
    assert body["confidence"] > 0


def test_find_similar_picks_best_category():
    text = "Visual Studio Code"
    good_embedding = _embed_text(text).tolist()
    resp = client.post(
        "/find-similar",
        json={
            "text": text,
            "categories": [
                {"_id": "cat-good", "embedding": good_embedding},
                {"_id": "cat-bad", "embedding": [0.0 for _ in good_embedding]},
            ],
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["categoryId"] == "cat-good"
    assert body["similarity"] >= 0
    assert "model_name" in body
