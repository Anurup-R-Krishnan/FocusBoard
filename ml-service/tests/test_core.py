import threading
import time
import importlib

import core as core


class DummyModel:
    _instantiated = 0

    def __init__(self, *args, **kwargs):
        # simulate slow init
        time.sleep(0.05)
        DummyModel._instantiated += 1

    def encode(self, text):
        # return fixed-length vector matching EMBEDDING_DIM
        return [0.0] * core.EMBEDDING_DIM


def test_concurrent_model_load(monkeypatch):
    # ensure a clean state
    importlib.reload(core)
    monkeypatch.setattr(core, 'SentenceTransformer', DummyModel)
    core.MODEL = None
    core.MODEL_LOADED = False
    core.MODEL_ATTEMPTED = False

    def target():
        core.load_model()

    threads = [threading.Thread(target=target) for _ in range(6)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert DummyModel._instantiated == 1, "Model should be instantiated only once under concurrent load"


def test_load_fails_without_dependency(monkeypatch):
    importlib.reload(core)
    monkeypatch.setattr(core, 'SentenceTransformer', None)
    core.MODEL = None
    core.MODEL_LOADED = False
    core.MODEL_ATTEMPTED = False

    ok = core.load_model()
    status = core.get_model_status()

    assert ok is False
    assert status['loaded'] is False
    assert status['attempted'] is True
    assert 'sentence_transformers' in (status['error'] or '').lower()
